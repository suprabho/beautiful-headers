// aura-render-service — warm-browser image/video renderer for aura scenes.
//
// Why this exists: every app embedding aura (aura's own capture endpoint, the
// GreenMentor community engine, the vismay engine) was running its own headless
// Chromium — serverless cold-start extraction, software-WebGL renders blowing
// past function time limits, per-app Playwright version drift. This service
// keeps ONE Chromium warm and owns all of it; consumers just POST/GET renders.
//
// Routes (all render routes require `x-render-secret`):
//   GET  /health                      → 200 ok
//   GET  /scene/:slug/capture.png     → still via the embed capture bridge
//   GET  /scene/:slug/capture.webp        (same params as the Vercel endpoint:
//                                          w, h, dpr, hideText, hideIcons, theme)
//   GET  /scene/:slug/video.mp4       → frame-stepped video of the animated scene
//   GET  /scene/:slug/video.webm          (w, h, dpr, fps, seconds, hideText,
//                                          hideIcons, theme)
//   POST /shot                        → screenshot of caller-supplied HTML/URL —
//                                       wire-compatible with the greenmentor
//                                       header-render-service contract
//   POST /video                       → frame-stepped video of caller HTML/URL

import http from "node:http";
import { getBrowser, closeBrowser } from "./lib/browser.mjs";
import { renderShot, renderSceneCapture, encodeImage } from "./lib/shot.mjs";
import { renderVideo } from "./lib/video.mjs";
import {
  cacheEnabled,
  cacheGet,
  cachePut,
  captureObjectPath,
  videoObjectPath,
} from "./lib/cache.mjs";

const PORT = Number(process.env.PORT || 8080);
// RENDER_SECRET is canonical; HEADER_RENDER_SECRET accepted so a consumer
// migrating off the greenmentor service can reuse its existing env pair.
const SECRET = process.env.RENDER_SECRET || process.env.HEADER_RENDER_SECRET || "";
const AURA_ORIGIN = (process.env.AURA_ORIGIN || "https://aura.promad.design").replace(/\/+$/, "");
const IMAGE_CONCURRENCY = Math.max(1, Number(process.env.RENDER_CONCURRENCY || 3));
// Video renders hold a page + ffmpeg for minutes; serialize by default.
const VIDEO_CONCURRENCY = Math.max(1, Number(process.env.VIDEO_CONCURRENCY || 1));
const MAX_BODY_BYTES = 8 * 1024 * 1024; // caller HTML embeds data-URI logos; be generous.

if (!SECRET) {
  // Fail closed: without a shared secret every render route rejects, so an
  // accidentally-public URL can't be used to drive an arbitrary browser.
  console.warn("[render] RENDER_SECRET is unset — render routes will reject all requests.");
}

// Render cost is the abuse vector, so clamp hard.
const IMG = { wMin: 16, wMax: 3840, hMin: 16, hMax: 3840, dprMin: 1, dprMax: 3 };
const VID = {
  wMin: 16, wMax: 1920, hMin: 16, hMax: 1920, dprMin: 1, dprMax: 2,
  fpsMin: 10, fpsMax: 60, secondsMin: 1, secondsMax: 30, maxFrames: 1800,
};
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const num = (v, def) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : def;
};

// ---- concurrency limiters ---------------------------------------------------

function makeLimiter(max) {
  let active = 0;
  const waiters = [];
  return {
    async acquire() {
      if (active < max) {
        active++;
        return;
      }
      await new Promise((resolve) => waiters.push(resolve));
      active++;
    },
    release() {
      active--;
      waiters.shift()?.();
    },
  };
}
const imageSlots = makeLimiter(IMAGE_CONCURRENCY);
const videoSlots = makeLimiter(VIDEO_CONCURRENCY);

// ---- http helpers -----------------------------------------------------------

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const text = (res, status, body) => {
  res.writeHead(status, { "content-type": "text/plain" });
  res.end(body);
};

const MIME = {
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
};

function sendMedia(res, buf, ext, cacheState) {
  res.writeHead(200, {
    "content-type": MIME[ext],
    "content-length": buf.length,
    // The service sits behind authenticated callers, not a CDN — they decide
    // client caching. X-Render-Cache reports the Supabase origin-cache path.
    "cache-control": "no-store",
    ...(cacheState ? { "x-render-cache": cacheState } : {}),
  });
  res.end(buf);
}

// ---- route handlers ---------------------------------------------------------

/** GET /scene/:slug/capture.(png|webp) */
async function handleSceneCapture(req, res, slug, ext, query) {
  const width = clamp(Math.round(num(query.get("w"), 1200)), IMG.wMin, IMG.wMax);
  const height = clamp(Math.round(num(query.get("h"), 630)), IMG.hMin, IMG.hMax);
  const dpr = clamp(Math.round(num(query.get("dpr"), 2)), IMG.dprMin, IMG.dprMax);
  const hideText = query.get("hideText") === "true";
  const hideIcons = query.get("hideIcons") === "true";
  const theme = query.get("theme");
  const quality = clamp(Math.round(num(query.get("quality"), 90)), 1, 100);
  const nocache = query.get("nocache") === "1";

  // Only the png flavour shares the Vercel endpoint's cache key; webp renders
  // are cheap enough to skip origin-caching rather than fork the key scheme.
  const objectPath = ext === "png"
    ? captureObjectPath({ slug, width, height, dpr, hideText, hideIcons, theme })
    : null;

  if (objectPath && !nocache) {
    const cached = await cacheGet(objectPath);
    if (cached) return sendMedia(res, cached, ext, "hit");
  }

  await imageSlots.acquire();
  try {
    const png = await renderSceneCapture({
      origin: AURA_ORIGIN, slug, width, height, dpr, hideText, hideIcons, theme,
    });
    if (objectPath) cachePut(objectPath, png, MIME.png);
    const out = await encodeImage(png, ext === "webp" ? "webp" : "png", quality);
    sendMedia(res, out, ext, cacheEnabled && objectPath ? "miss" : undefined);
  } finally {
    imageSlots.release();
  }
}

/** GET /scene/:slug/video.(mp4|webm) */
async function handleSceneVideo(req, res, slug, ext, query) {
  const width = clamp(Math.round(num(query.get("w"), 1280)), VID.wMin, VID.wMax);
  const height = clamp(Math.round(num(query.get("h"), 720)), VID.hMin, VID.hMax);
  const dpr = clamp(Math.round(num(query.get("dpr"), 1)), VID.dprMin, VID.dprMax);
  const fps = clamp(Math.round(num(query.get("fps"), 30)), VID.fpsMin, VID.fpsMax);
  const seconds = clamp(num(query.get("seconds"), 6), VID.secondsMin, VID.secondsMax);
  const hideText = query.get("hideText") === "true";
  const hideIcons = query.get("hideIcons") === "true";
  const theme = query.get("theme");
  const nocache = query.get("nocache") === "1";

  let durationMs = Math.round(seconds * 1000);
  durationMs = Math.min(durationMs, Math.round((VID.maxFrames / fps) * 1000));

  const objectPath = videoObjectPath({
    slug, width, height, dpr, fps, durationMs, hideText, hideIcons, theme, format: ext,
  });
  if (!nocache) {
    const cached = await cacheGet(objectPath);
    if (cached) return sendMedia(res, cached, ext, "hit");
  }

  const params = new URLSearchParams({ capture: "1" });
  if (hideText) params.set("hideText", "true");
  if (hideIcons) params.set("hideIcons", "true");
  if (theme) params.set("theme", theme);
  const url = `${AURA_ORIGIN}/embed/${encodeURIComponent(slug)}?${params}`;

  await videoSlots.acquire();
  try {
    const buf = await renderVideo({
      url, width, height, dpr, fps, durationMs, format: ext, waitForCaptureReady: true,
    });
    cachePut(objectPath, buf, MIME[ext]);
    sendMedia(res, buf, ext, cacheEnabled ? "miss" : undefined);
  } finally {
    videoSlots.release();
  }
}

/** POST /shot — greenmentor header-render-service compatible. */
async function handleShot(res, body) {
  if ((!body?.html && !body?.url) || !body?.width || !body?.height) {
    return text(res, 400, "html (or url), width and height are required");
  }
  const format = body.format === "webp" ? "webp" : "png";
  await imageSlots.acquire();
  try {
    const png = await renderShot(body);
    const buf = await encodeImage(png, format, body.quality ?? 90);
    sendMedia(res, buf, format);
  } finally {
    imageSlots.release();
  }
}

/** POST /video — frame-stepped video of caller HTML/URL. */
async function handleVideoPost(res, body) {
  if ((!body?.html && !body?.url) || !body?.width || !body?.height) {
    return text(res, 400, "html (or url), width and height are required");
  }
  const format = body.format === "webm" ? "webm" : "mp4";
  const fps = clamp(Math.round(num(body.fps, 30)), VID.fpsMin, VID.fpsMax);
  let durationMs = clamp(
    Math.round(num(body.durationMs, 6000)),
    VID.secondsMin * 1000,
    VID.secondsMax * 1000
  );
  durationMs = Math.min(durationMs, Math.round((VID.maxFrames / fps) * 1000));

  await videoSlots.acquire();
  try {
    const buf = await renderVideo({
      url: body.url,
      html: body.html,
      width: clamp(Math.round(body.width), VID.wMin, VID.wMax),
      height: clamp(Math.round(body.height), VID.hMin, VID.hMax),
      dpr: clamp(Math.round(num(body.dpr, 1)), VID.dprMin, VID.dprMax),
      fps,
      durationMs,
      warmupMs: clamp(Math.round(num(body.warmupMs, 2000)), 0, 10_000),
      format,
      waitForCaptureReady: Boolean(body.waitForCaptureReady),
    });
    sendMedia(res, buf, format);
  } finally {
    videoSlots.release();
  }
}

// ---- server -----------------------------------------------------------------

const SCENE_ROUTE = /^\/scene\/([^/]+)\/(capture|video)\.(png|webp|mp4|webm)$/;

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url || "/", "http://localhost");

  if (req.method === "GET" && u.pathname === "/health") {
    return text(res, 200, "ok");
  }

  // Constant-work auth on everything else.
  if (!SECRET || req.headers["x-render-secret"] !== SECRET) {
    return text(res, 401, "unauthorized");
  }

  try {
    const m = req.method === "GET" ? u.pathname.match(SCENE_ROUTE) : null;
    if (m) {
      const [, rawSlug, kind, ext] = m;
      const slug = decodeURIComponent(rawSlug);
      if (kind === "capture" && (ext === "png" || ext === "webp")) {
        return await handleSceneCapture(req, res, slug, ext, u.searchParams);
      }
      if (kind === "video" && (ext === "mp4" || ext === "webm")) {
        return await handleSceneVideo(req, res, slug, ext, u.searchParams);
      }
      return text(res, 404, "not found");
    }

    if (req.method === "POST" && (u.pathname === "/shot" || u.pathname === "/video")) {
      let body;
      try {
        body = JSON.parse((await readBody(req)).toString("utf8"));
      } catch (e) {
        return text(res, 400, `bad request: ${e.message}`);
      }
      return u.pathname === "/shot"
        ? await handleShot(res, body)
        : await handleVideoPost(res, body);
    }

    return text(res, 404, "not found");
  } catch (e) {
    console.error(`[render] ${req.method} ${u.pathname} failed:`, e?.message);
    if (!res.headersSent) text(res, 500, `render failed: ${e?.message ?? "unknown"}`);
  }
});

server.listen(PORT, () => {
  console.log(
    `[render] listening on :${PORT} (images=${IMAGE_CONCURRENCY}, videos=${VIDEO_CONCURRENCY}, ` +
      `origin=${AURA_ORIGIN}, cache=${cacheEnabled ? "supabase" : "off"})`
  );
  // Warm the browser at boot so the first real request doesn't pay launch cost.
  getBrowser().then(
    () => console.log("[render] browser warm"),
    (e) => console.error("[render] warm-up failed:", e?.message)
  );
});

// Graceful shutdown so Fly rollouts don't drop in-flight renders.
for (const sig of ["SIGTERM", "SIGINT"]) {
  process.on(sig, () => {
    console.log(`[render] ${sig} — shutting down`);
    server.close(async () => {
      await closeBrowser();
      process.exit(0);
    });
  });
}
