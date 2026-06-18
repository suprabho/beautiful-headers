// Headless-browser render helper for the capture endpoint.
// Vercel ignores `_`-prefixed files under /api, so this is not deployed as a route.
//
// Loads /embed/:slug?capture=1 in headless Chromium at the requested frame
// size, waits for the embed's capture bridge (window.__auraCaptureReady), then
// calls window.__auraCapture() — the same compositing pipeline the in-app
// "capture" button uses — and returns a PNG buffer.

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

// SwiftShader gives software WebGL on the GPU-less Lambda host. Without these
// flags the r3f canvases render black.
const WEBGL_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl'];

let browserPromise = null;

// Reuse a single browser across warm invocations to skip cold-launch cost.
async function getBrowser() {
  if (browserPromise) {
    const b = await browserPromise;
    if (b.connected) return b;
    browserPromise = null;
  }
  browserPromise = puppeteer.launch({
    args: [...chromium.args, ...WEBGL_ARGS, '--hide-scrollbars'],
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  return browserPromise;
}

/**
 * Render a scene to a PNG buffer.
 * @returns {Promise<Buffer>}
 */
export async function renderSceneToPng({
  baseUrl,
  slug,
  width,
  height,
  dpr = 2,
  hideText = false,
  hideIcons = false,
  theme = null,
  timeoutMs = 30000,
}) {
  const params = new URLSearchParams({ capture: '1' });
  if (hideText) params.set('hideText', 'true');
  if (hideIcons) params.set('hideIcons', 'true');
  if (theme) params.set('theme', theme);
  const url = `${baseUrl}/embed/${encodeURIComponent(slug)}?${params.toString()}`;

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width, height, deviceScaleFactor: dpr });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: timeoutMs });
    await page.waitForFunction('window.__auraCaptureReady === true', { timeout: timeoutMs });

    const dataUrl = await page.evaluate((scale) => window.__auraCapture({ scale }), dpr);
    const b64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    return Buffer.from(b64, 'base64');
  } finally {
    await page.close();
  }
}
