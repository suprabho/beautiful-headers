import {
  BASE_URL,
  FALLBACK_OG_IMAGE,
  getHtmlTemplate,
  escapeHtml,
  injectMetaTags,
} from './_lib/seo.js';
import { ABOUT_HERO, ABOUT_SECTIONS } from './_lib/about-content.js';

const ABOUT_URL = `${BASE_URL}/about`;

function buildNoscript() {
  const hero = `
      <header style="text-align:center;padding:48px 0 24px">
        <img src="/apple-touch-icon.png" alt="Aura" width="64" height="64" style="border-radius:14px" />
        <h1 style="font-size:32px;margin:16px 0 8px">${escapeHtml(ABOUT_HERO.title)}</h1>
        <p style="opacity:0.75;max-width:560px;margin:0 auto">${escapeHtml(ABOUT_HERO.tagline)}</p>
      </header>`;

  const sections = ABOUT_SECTIONS.map(s => `
      <section style="padding:20px 0;border-top:1px solid rgba(255,255,255,0.08)">
        <h2 style="font-size:20px;margin:0 0 6px">${escapeHtml(s.title)}</h2>
        <p style="margin:0;opacity:0.75">${escapeHtml(s.description)}</p>
      </section>`).join('');

  const nav = `
      <nav style="padding:32px 0;text-align:center">
        <a href="${BASE_URL}/scenes" style="color:#8af;margin:0 12px">Browse the gallery</a>
        <a href="${BASE_URL}/" style="color:#8af;margin:0 12px">Open the editor</a>
      </nav>`;

  return `<noscript>
  <main style="max-width:760px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif;color:#fff;background:#000;min-height:100vh">
    ${hero}
    ${sections}
    ${nav}
  </main>
</noscript>`;
}

export default async function handler(req, res) {
  try {
    const htmlTemplate = await getHtmlTemplate();

    const title = escapeHtml(`About Aura - ${ABOUT_HERO.title}`);
    const description = escapeHtml(ABOUT_HERO.tagline);

    const modifiedHtml = injectMetaTags(htmlTemplate, {
      title,
      description,
      canonicalUrl: ABOUT_URL,
      ogType: 'website',
      ogImage: FALLBACK_OG_IMAGE,
      noscript: buildNoscript(),
    });

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(modifiedHtml);
  } catch (err) {
    console.error('[about] Error:', err);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    const fallback = await getHtmlTemplate().catch(() => '<!doctype html><title>About Aura</title>');
    return res.status(200).send(fallback);
  }
}
