import { createClient } from '@supabase/supabase-js';

// --- Configuration ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const THUMBNAIL_CDN_URL = process.env.VITE_THUMBNAIL_CDN_URL || '';
const BASE_URL = 'https://aura.promad.design';
const FALLBACK_OG_IMAGE = `${BASE_URL}/og-image.png`;
const SUPABASE_STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/thumbnails/`;

// Fetch and cache the HTML template from the deployment's own static files
let cachedHtml = null;

async function getHtmlTemplate() {
  if (cachedHtml) return cachedHtml;
  const response = await fetch(`${BASE_URL}/index.html`);
  cachedHtml = await response.text();
  return cachedHtml;
}

// --- Helpers ---

function titleToSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function rewriteThumbnailUrl(url) {
  if (!THUMBNAIL_CDN_URL || !url) return url;
  return url.replace(SUPABASE_STORAGE_BASE, `${THUMBNAIL_CDN_URL}/`);
}

function getOgImageUrl(thumbnail) {
  if (!thumbnail) return FALLBACK_OG_IMAGE;
  const url = thumbnail.large || thumbnail.medium || thumbnail.small || thumbnail.full;
  return url ? rewriteThumbnailUrl(url) : FALLBACK_OG_IMAGE;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function injectMetaTags(html, scene, slug) {
  const sceneUrl = `${BASE_URL}/scenes/${slug}`;
  const title = escapeHtml(
    scene.title ? `${scene.title} - Aura` : 'Aura - Interactive Web Design Backgrounds'
  );
  const description = escapeHtml(
    scene.short_description || scene.long_description ||
    'Create stunning, interactive web backgrounds with Aura.'
  );
  const imageUrl = getOgImageUrl(scene.thumbnail);

  return html
    // <title>
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    // meta name="description" (multi-line: attribute and content on separate lines)
    .replace(
      /(<meta\s+name="description"[\s\S]*?content=")[^"]*(")/,
      `$1${description}$2`
    )
    // og:type -> article for individual scenes
    .replace(
      /(<meta\s+property="og:type"\s+content=")[^"]*(")/,
      `$1article$2`
    )
    // og:title and twitter:title
    .replace(
      /(<meta\s+property="(?:og|twitter):title"\s+content=")[^"]*(")/g,
      `$1${title}$2`
    )
    // og:description and twitter:description (multi-line attributes)
    .replace(
      /(<meta\s+property="(?:og|twitter):description"[\s\S]*?content=")[^"]*(")/g,
      `$1${description}$2`
    )
    // og:image and twitter:image
    .replace(
      /(<meta\s+property="(?:og|twitter):image"\s+content=")[^"]*(")/g,
      `$1${imageUrl}$2`
    )
    // og:url and twitter:url
    .replace(
      /(<meta\s+property="(?:og|twitter):url"\s+content=")[^"]*(")/g,
      `$1${sceneUrl}$2`
    );
}

// --- Scene lookup (mirrors src/lib/scenesApi.js getSceneBySlug) ---

async function fetchSceneBySlug(supabase, slug) {
  // Primary: exact slug match
  const { data: slugMatch, error: slugError } = await supabase
    .from('scenes')
    .select('id, title, slug, short_description, long_description, thumbnail')
    .eq('slug', slug)
    .maybeSingle();

  if (slugError) return null;
  if (slugMatch) return slugMatch;

  // Fallback: word-based title search for older scenes without slug column
  const words = slug.split('-').filter(w => w.length >= 3);
  if (words.length === 0) return null;

  const searchWords = [...words].sort((a, b) => b.length - a.length).slice(0, 3);
  let query = supabase
    .from('scenes')
    .select('id, title, slug, short_description, long_description, thumbnail');

  for (const word of searchWords) {
    query = query.ilike('title', `%${word}%`);
  }

  const { data, error } = await query;
  if (error || !data) return null;

  const scene = data.find(s => titleToSlug(s.title) === slug);
  if (!scene) return null;

  // Backfill slug column (fire-and-forget)
  if (!scene.slug) {
    supabase
      .from('scenes')
      .update({ slug: titleToSlug(scene.title) })
      .eq('id', scene.id)
      .then(() => {})
      .catch(() => {});
  }

  return scene;
}

// --- Handler ---

export default async function handler(req, res) {
  const { slug } = req.query;
  const htmlTemplate = await getHtmlTemplate();

  if (!slug || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(htmlTemplate);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    const scene = await fetchSceneBySlug(supabase, slug);

    if (!scene) {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      return res.status(200).send(htmlTemplate);
    }

    const modifiedHtml = injectMetaTags(htmlTemplate, scene, slug);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(modifiedHtml);
  } catch (err) {
    console.error('[scenes/slug] Error:', err);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).send(htmlTemplate);
  }
}
