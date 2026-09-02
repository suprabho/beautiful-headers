// GET /scenes/:slug/capture.png?w=&h=&dpr=&hideText=&hideIcons=&theme=
//
// Returns a PNG snapshot of a scene at the requested frame dimensions, rendered
// by a headless browser via the embed capture bridge (see api/_lib/render.js).
//
// Caching is two-tiered:
//   1. Edge — Cache-Control/s-maxage so identical URLs serve from Vercel's CDN
//      without invoking this function at all.
//   2. Origin — rendered PNGs are persisted to the Supabase `captures` bucket,
//      so a cold function (edge miss) returns the stored image instead of
//      re-launching the browser.

import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { renderSceneToPng } from '../../_lib/render.js';
import { renderServiceConfigured, captureViaService } from '../../_lib/remote.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
// Service role is needed to write to storage; falls back to anon (works only if
// a permissive storage policy is set). Reads/renders still work without it.
const SUPABASE_WRITE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

const CAPTURES_BUCKET = process.env.CAPTURES_BUCKET || 'aura-cache';
const CACHE_TTL = 60 * 60 * 24 * 30; // 30 days

// Render cost is the abuse vector, so clamp hard.
const LIMITS = { wMin: 16, wMax: 3840, hMin: 16, hMax: 3840, dprMin: 1, dprMax: 3 };
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// Mirrors titleToSlug in api/scenes/[slug].js and src/lib/scenesApi.js.
function titleToSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Resolve a scene by slug the same way the page route and the client do:
 * exact `slug` column first, then a title-derived match for rows predating
 * the slug column. Without the fallback this route 404s on scenes that
 * /scenes/:slug and /embed/:slug both resolve fine.
 * @returns {Promise<boolean>} whether the slug names a real scene.
 */
async function sceneExists(supabase, slug) {
  const { data: slugMatch, error: slugError } = await supabase
    .from('scenes')
    .select('slug')
    .eq('slug', slug)
    .maybeSingle();

  // maybeSingle() errors rather than returning a row when a slug is duplicated,
  // so an ignored error here would read as "not found".
  if (slugError) return false;
  if (slugMatch) return true;

  const words = slug.split('-').filter((w) => w.length >= 3);
  if (words.length === 0) return false;

  const searchWords = [...words].sort((a, b) => b.length - a.length).slice(0, 3);
  let query = supabase.from('scenes').select('title');
  for (const word of searchWords) query = query.ilike('title', `%${word}%`);

  const { data, error } = await query;
  if (error || !data) return false;
  return data.some((s) => s.title && titleToSlug(s.title) === slug);
}
const intParam = (v, def) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
};

// Run on Node (not edge — needs the chromium binary) with room to render.
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  // Browser consumers (vismay share cards rasterize via html-to-image) read
  // these bytes cross-origin, so every response — errors included, so the
  // caller can see why — carries an open CORS header. The route is a public
  // GET with no credentials, so `*` grants nothing a direct fetch wouldn't.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Timing-Allow-Origin', '*');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Missing slug' });
  }

  // Parse + clamp params.
  const width = clamp(intParam(req.query.w, 1200), LIMITS.wMin, LIMITS.wMax);
  const height = clamp(intParam(req.query.h, 630), LIMITS.hMin, LIMITS.hMax);
  const dpr = clamp(intParam(req.query.dpr, 2), LIMITS.dprMin, LIMITS.dprMax);
  const hideText = req.query.hideText === 'true';
  const hideIcons = req.query.hideIcons === 'true';
  const theme = typeof req.query.theme === 'string' ? req.query.theme : null;

  // Deterministic cache key for this exact render.
  const keyParts = [slug, width, height, dpr, hideText, hideIcons, theme || ''].join('|');
  const hash = crypto.createHash('sha1').update(keyParts).digest('hex').slice(0, 16);
  const objectPath = `${slug}/${hash}.png`;

  const supabase = createClient(SUPABASE_URL, SUPABASE_WRITE_KEY);

  const sendPng = (buffer, source) => {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}, immutable`);
    res.setHeader('X-Capture-Cache', source);
    return res.status(200).send(buffer);
  };

  try {
    // 1. Origin cache: serve a previously stored render if present.
    const cached = await supabase.storage.from(CAPTURES_BUCKET).download(objectPath);
    if (cached?.data) {
      const buf = Buffer.from(await cached.data.arrayBuffer());
      return sendPng(buf, 'hit');
    }

    // 2. Fail fast on unknown slugs before launching a browser.
    if (!(await sceneExists(supabase, slug))) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    // 3. Render — via the warm render service when configured (see
    //    api/_lib/remote.js), else in-process with @sparticuz/chromium.
    let png;
    if (renderServiceConfigured()) {
      png = await captureViaService({ slug, width, height, dpr, hideText, hideIcons, theme });
      // The service persists to the same bucket/key itself — no upload here.
    } else {
      const proto = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const baseUrl = host ? `${proto}://${host}` : 'https://aura.promad.design';

      png = await renderSceneToPng({
        baseUrl, slug, width, height, dpr, hideText, hideIcons, theme,
      });

      // 4. Persist for future requests (best-effort — a failure just means we
      //    re-render on the next miss).
      supabase.storage
        .from(CAPTURES_BUCKET)
        .upload(objectPath, png, { contentType: 'image/png', upsert: true, cacheControl: String(CACHE_TTL) })
        .catch((e) => console.warn('capture cache upload failed:', e?.message || e));
    }

    return sendPng(png, 'miss');
  } catch (err) {
    console.error('capture failed:', err);
    return res.status(500).json({ error: 'Render failed', detail: err?.message });
  }
}
