// Shared SEO helpers for SSR meta injection across route handlers.
// Vercel ignores `_`-prefixed files under /api, so this is not deployed as a route.

const BASE_URL = 'https://aura.promad.design';
const FALLBACK_OG_IMAGE = `${BASE_URL}/og-image.png`;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const THUMBNAIL_CDN_URL = process.env.VITE_THUMBNAIL_CDN_URL || '';
const SUPABASE_STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/thumbnails/`;

let cachedHtml = null;

export async function getHtmlTemplate() {
  if (cachedHtml) return cachedHtml;
  const response = await fetch(`${BASE_URL}/index.html`);
  cachedHtml = await response.text();
  return cachedHtml;
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function rewriteThumbnailUrl(url) {
  if (!THUMBNAIL_CDN_URL || !url || !SUPABASE_URL) return url;
  return url.replace(SUPABASE_STORAGE_BASE, `${THUMBNAIL_CDN_URL}/`);
}

export function getOgImageUrl(thumbnail) {
  if (!thumbnail) return FALLBACK_OG_IMAGE;
  const url = thumbnail.large || thumbnail.medium || thumbnail.small || thumbnail.full;
  return url ? rewriteThumbnailUrl(url) : FALLBACK_OG_IMAGE;
}

// Replace head/body meta to point at a given route.
// `meta` fields are pre-escaped strings (or already-safe URLs).
export function injectMetaTags(html, meta) {
  const {
    title,
    description,
    canonicalUrl,
    ogType = 'website',
    ogImage = FALLBACK_OG_IMAGE,
    jsonLd,
    noscript,
    extraHead,
  } = meta;

  let modified = html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(
      /(<meta\s+name="description"[\s\S]*?content=")[^"]*(")/,
      `$1${description}$2`
    )
    .replace(
      /(<meta\s+property="og:type"\s+content=")[^"]*(")/,
      `$1${ogType}$2`
    )
    .replace(
      /(<meta\s+property="(?:og|twitter):title"\s+content=")[^"]*(")/g,
      `$1${title}$2`
    )
    .replace(
      /(<meta\s+property="(?:og|twitter):description"[\s\S]*?content=")[^"]*(")/g,
      `$1${description}$2`
    )
    .replace(
      /(<meta\s+property="(?:og|twitter):image"\s+content=")[^"]*(")/g,
      `$1${ogImage}$2`
    )
    .replace(
      /(<meta\s+property="(?:og|twitter):url"\s+content=")[^"]*(")/g,
      `$1${canonicalUrl}$2`
    )
    .replace(
      /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
      `$1${canonicalUrl}$2`
    );

  const headExtras = [];
  if (extraHead) headExtras.push(extraHead);
  if (jsonLd) {
    headExtras.push(`<script type="application/ld+json">${jsonLd}</script>`);
  }
  if (headExtras.length > 0) {
    modified = modified.replace('</head>', `  ${headExtras.join('\n  ')}\n</head>`);
  }

  if (noscript) {
    modified = modified.replace(
      '<div id="root"></div>',
      `<div id="root"></div>\n  ${noscript}`
    );
  }

  return modified;
}

export { BASE_URL, FALLBACK_OG_IMAGE };
