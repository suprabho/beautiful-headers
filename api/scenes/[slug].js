import { createClient } from '@supabase/supabase-js';
import {
  BASE_URL,
  getHtmlTemplate,
  escapeHtml,
  getOgImageUrl,
  injectMetaTags,
} from '../_lib/seo.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

function titleToSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function buildJsonLd(scene, slug) {
  const sceneUrl = `${BASE_URL}/scenes/${slug}`;
  const imageUrl = getOgImageUrl(scene.thumbnail);
  const description = scene.short_description || scene.long_description ||
    'Create stunning, interactive web backgrounds with Aura.';

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    'name': scene.title || 'Aura Scene',
    'description': description,
    'url': sceneUrl,
    'image': imageUrl,
    'creator': {
      '@type': 'Organization',
      'name': 'Visual Layers Studio',
      'url': BASE_URL,
    },
    'isPartOf': {
      '@type': 'WebSite',
      'name': 'Visual Layers Studio',
      'url': BASE_URL,
    },
  });
}

function buildNoscript(scene, slug) {
  const sceneUrl = `${BASE_URL}/scenes/${slug}`;
  const title = escapeHtml(scene.title || 'Aura Scene');
  const description = escapeHtml(
    scene.short_description || scene.long_description ||
    'Create stunning, interactive web backgrounds with Aura.'
  );
  const imageUrl = getOgImageUrl(scene.thumbnail);

  return `<noscript>
  <div style="max-width:800px;margin:0 auto;padding:40px 20px;font-family:system-ui,sans-serif;color:#fff;background:#000">
    <h1>${title}</h1>
    <p>${description}</p>
    <img src="${imageUrl}" alt="${title}" style="max-width:100%;height:auto" />
    <p><a href="${BASE_URL}/scenes" style="color:#8af">Browse all scenes</a></p>
  </div>
</noscript>`;
}

async function fetchSceneBySlug(supabase, slug) {
  const { data: slugMatch, error: slugError } = await supabase
    .from('scenes')
    .select('id, title, slug, short_description, long_description, thumbnail')
    .eq('slug', slug)
    .maybeSingle();

  if (slugError) return null;
  if (slugMatch) return slugMatch;

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

    const sceneUrl = `${BASE_URL}/scenes/${slug}`;
    const title = escapeHtml(
      scene.title ? `${scene.title} - Aura` : 'Aura - Interactive Web Design Backgrounds'
    );
    const description = escapeHtml(
      scene.short_description || scene.long_description ||
      'Create stunning, interactive web backgrounds with Aura.'
    );

    const modifiedHtml = injectMetaTags(htmlTemplate, {
      title,
      description,
      canonicalUrl: sceneUrl,
      ogType: 'article',
      ogImage: getOgImageUrl(scene.thumbnail),
      jsonLd: buildJsonLd(scene, slug),
      noscript: buildNoscript(scene, slug),
    });

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
