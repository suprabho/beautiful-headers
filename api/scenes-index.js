import { createClient } from '@supabase/supabase-js';
import {
  BASE_URL,
  FALLBACK_OG_IMAGE,
  getHtmlTemplate,
  escapeHtml,
  injectMetaTags,
} from './_lib/seo.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const SCENES_URL = `${BASE_URL}/scenes`;
const PAGE_TITLE = 'Scene Gallery – Aura';
const PAGE_DESCRIPTION = 'Browse a gallery of free animated backgrounds for web design — gradients, auroras, ribbons, waves, and more. Customize and embed any scene.';

function titleToSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function buildNoscript(scenes) {
  const items = scenes.map(s => {
    const slug = s.slug || titleToSlug(s.title);
    return `      <li><a href="${BASE_URL}/scenes/${escapeHtml(slug)}" style="color:#8af">${escapeHtml(s.title)}</a></li>`;
  }).join('\n');

  return `<noscript>
  <main style="max-width:760px;margin:0 auto;padding:32px 24px;font-family:system-ui,sans-serif;color:#fff;background:#000;min-height:100vh">
    <h1 style="font-size:28px;margin:0 0 12px">Scene Gallery</h1>
    <p style="opacity:0.75;margin:0 0 24px">${escapeHtml(PAGE_DESCRIPTION)}</p>
    <ul style="list-style:none;padding:0;margin:0;display:grid;gap:8px">
${items}
    </ul>
    <p style="margin-top:32px"><a href="${BASE_URL}/" style="color:#8af">Open the editor</a> · <a href="${BASE_URL}/about" style="color:#8af">About Aura</a></p>
  </main>
</noscript>`;
}

export default async function handler(req, res) {
  const htmlTemplate = await getHtmlTemplate();

  // Even without Supabase credentials, return a 200 with the correct canonical/title.
  const baseMeta = {
    title: escapeHtml(PAGE_TITLE),
    description: escapeHtml(PAGE_DESCRIPTION),
    canonicalUrl: SCENES_URL,
    ogType: 'website',
    ogImage: FALLBACK_OG_IMAGE,
  };

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const modifiedHtml = injectMetaTags(htmlTemplate, baseMeta);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).send(modifiedHtml);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    const { data: scenes, error } = await supabase
      .from('scenes')
      .select('title, slug, updated_at')
      .order('updated_at', { ascending: false })
      .limit(60);

    if (error) throw error;

    const modifiedHtml = injectMetaTags(htmlTemplate, {
      ...baseMeta,
      noscript: buildNoscript(scenes || []),
    });

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(modifiedHtml);
  } catch (err) {
    console.error('[scenes-index] Error:', err);
    const modifiedHtml = injectMetaTags(htmlTemplate, baseMeta);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).send(modifiedHtml);
  }
}
