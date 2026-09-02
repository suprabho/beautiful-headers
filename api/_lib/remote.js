// Proxy to the warm-browser aura render service (render-service/, on Fly).
// Vercel ignores `_`-prefixed files under /api, so this is not deployed as a route.
//
// When AURA_RENDER_URL + AURA_RENDER_SECRET are set, the capture endpoint calls
// the service instead of launching @sparticuz/chromium in the Lambda — no
// cold-start extraction, no software-WebGL render racing maxDuration. Unset
// (e.g. local dev), the endpoint falls back to the in-process render.

/** True when the capture endpoint should proxy to the render service. */
export function renderServiceConfigured() {
  return Boolean(process.env.AURA_RENDER_URL && process.env.AURA_RENDER_SECRET);
}

/**
 * Render a scene still via the service. Throws on non-200 so the route's catch
 * can surface the reason. The abort timeout stays under the route's 60 s
 * maxDuration so a stuck service fails fast instead of burning the budget.
 * @returns {Promise<Buffer>} PNG bytes.
 */
export async function captureViaService({
  slug, width, height, dpr, hideText, hideIcons, theme, timeoutMs = 50000,
}) {
  const base = process.env.AURA_RENDER_URL.replace(/\/+$/, '');
  const params = new URLSearchParams({ w: String(width), h: String(height), dpr: String(dpr) });
  if (hideText) params.set('hideText', 'true');
  if (hideIcons) params.set('hideIcons', 'true');
  if (theme) params.set('theme', theme);

  const res = await fetch(`${base}/scene/${encodeURIComponent(slug)}/capture.png?${params}`, {
    headers: { 'x-render-secret': process.env.AURA_RENDER_SECRET },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`render service ${res.status}: ${detail.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}
