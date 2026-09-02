// Still-image renders.
//
// Two flavours:
//  - renderShot: load arbitrary HTML (or a URL), settle, screenshot an element.
//    Wire-compatible with the greenmentor header-render-service /shot contract,
//    so existing consumers can point HEADER_RENDER_URL here unchanged.
//  - renderSceneCapture: load /embed/:slug?capture=1 and call the embed's own
//    capture bridge (window.__auraCapture) — the same compositing pipeline as
//    the in-app capture button, pixel-identical to the Vercel capture endpoint.

import sharp from "sharp";
import { getBrowser } from "./browser.mjs";

/** Encode a PNG buffer to the requested format. */
export async function encodeImage(png, format, quality = 90) {
  if (format === "webp") return sharp(png).webp({ quality }).toBuffer();
  return png;
}

/**
 * Screenshot arbitrary HTML or a URL.
 * @param {object} o
 * @param {string} [o.html]      Full document HTML (mutually exclusive with url).
 * @param {string} [o.url]       Page URL to load instead of html.
 * @param {number} o.width       CSS width.
 * @param {number} o.height      CSS height.
 * @param {number} [o.dpr]       Device pixel ratio (default 2).
 * @param {string} [o.selector]  Element to clip to (default "#header"; falls back
 *                               to the full viewport when absent).
 * @param {number} [o.settleMs]  Animation warm-up before the shot (default 2600).
 * @returns {Promise<Buffer>} PNG bytes (encode separately).
 */
export async function renderShot(o) {
  const { html, url, width, height, dpr = 2, selector = "#header", settleMs = 2600 } = o;

  const t0 = Date.now();
  const mark = (phase) => console.log(`[shot] ${phase} +${Date.now() - t0}ms`);

  const browser = await getBrowser();
  // deviceScaleFactor is a top-level newPage option — nesting it inside
  // `viewport` silently drops it (DSF falls back to 1, halving resolution).
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: dpr,
  });
  try {
    // "load" (not "networkidle"): aura iframes animate forever, so we rely on
    // the explicit settle rather than waiting for the network to go quiet.
    if (url) {
      await page.goto(url, { waitUntil: "load", timeout: 30_000 });
    } else {
      await page.setContent(html, { waitUntil: "load", timeout: 30_000 });
    }
    mark("content-loaded");

    // Cap the webfont wait: fonts.ready can stay pending forever if a font stalls.
    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      page.waitForTimeout(5_000),
    ]).catch(() => {});
    mark("fonts-ready");

    await page.waitForTimeout(settleMs);
    mark("settled");

    const el = selector ? await page.$(selector) : null;
    const png = el
      ? await el.screenshot({ type: "png" })
      : await page.screenshot({ type: "png" });
    mark("screenshot");
    return png;
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * Capture a scene through the embed's own bridge.
 * @param {object} o
 * @param {string} o.origin   Aura origin, e.g. https://aura.promad.design
 * @param {string} o.slug
 * @param {number} o.width
 * @param {number} o.height
 * @param {number} [o.dpr]
 * @param {boolean} [o.hideText]
 * @param {boolean} [o.hideIcons]
 * @param {string|null} [o.theme]
 * @param {number} [o.timeoutMs]
 * @returns {Promise<Buffer>} PNG bytes.
 */
export async function renderSceneCapture(o) {
  const {
    origin,
    slug,
    width,
    height,
    dpr = 2,
    hideText = false,
    hideIcons = false,
    theme = null,
    timeoutMs = 45_000,
  } = o;

  const params = new URLSearchParams({ capture: "1" });
  if (hideText) params.set("hideText", "true");
  if (hideIcons) params.set("hideIcons", "true");
  if (theme) params.set("theme", theme);
  const url = `${origin}/embed/${encodeURIComponent(slug)}?${params}`;

  const t0 = Date.now();
  const mark = (phase) => console.log(`[capture:${slug}] ${phase} +${Date.now() - t0}ms`);

  const browser = await getBrowser();
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: dpr,
  });
  try {
    await page.goto(url, { waitUntil: "load", timeout: timeoutMs });
    mark("loaded");
    // The bridge flips this after scene fetch + fonts + WebGL warm-up. It never
    // flips for an unknown slug — that surfaces as a timeout here.
    await page.waitForFunction(() => window.__auraCaptureReady === true, null, {
      timeout: timeoutMs,
    });
    mark("ready");

    const dataUrl = await page.evaluate((scale) => window.__auraCapture({ scale }), dpr);
    mark("captured");
    return Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ""), "base64");
  } finally {
    await page.close().catch(() => {});
  }
}
