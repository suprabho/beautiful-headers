// One warm Chromium shared by every render, relaunched if it dies. Launch cost
// (and SwiftShader's software-WebGL warm-up) is paid once per machine, not per
// request — the whole reason this service exists instead of a serverless fn.

import { chromium } from "playwright";

let browserPromise = null;

/** A single Chromium reused across requests; relaunched if it dies. */
export async function getBrowser() {
  if (browserPromise) {
    const b = await browserPromise.catch(() => null);
    if (b && b.isConnected()) return b;
    browserPromise = null;
  }
  browserPromise = chromium.launch({
    headless: true,
    // In Docker the Playwright base image bakes the matching browser in; set
    // this only to point local dev at a system/preinstalled Chromium.
    executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
    // SwiftShader software WebGL: Fly machines are GPU-less, and aura scenes are
    // WebGL. Playwright's bundled Chromium renders black without an
    // ANGLE/SwiftShader path.
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
      "--no-sandbox",
      "--hide-scrollbars",
    ],
  });
  const b = await browserPromise;
  b.on("disconnected", () => {
    browserPromise = null;
  });
  return b;
}

export async function closeBrowser() {
  const b = await browserPromise?.catch(() => null);
  await b?.close().catch(() => {});
  browserPromise = null;
}
