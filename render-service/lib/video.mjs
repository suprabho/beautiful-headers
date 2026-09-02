// Frame-stepped video renders.
//
// SwiftShader (software WebGL) can't render aura scenes at 30fps in real time,
// so instead of screen-recording we drive a virtual clock (lib/vclock.mjs):
// advance exactly 1000/fps ms, screenshot, feed the PNG to ffmpeg, repeat.
// Output timing is perfect regardless of how slow each frame renders.
//
// ffmpeg reads PNGs on stdin (image2pipe) and writes the encoded file to a
// temp path — mp4 (h264/yuv420p, +faststart) needs a seekable output, so we
// don't stream the container.

import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getBrowser } from "./browser.mjs";
import { VCLOCK_INIT_SCRIPT } from "./vclock.mjs";

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";

function ffmpegArgs({ fps, format, outPath }) {
  const input = ["-y", "-f", "image2pipe", "-framerate", String(fps), "-i", "pipe:0"];
  if (format === "webm") {
    return [...input, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "34", "-row-mt", "1",
      "-pix_fmt", "yuv420p", outPath];
  }
  // h264 requires even dimensions; width*dpr can be odd, so round down a pixel.
  return [...input, "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", outPath];
}

/**
 * Render a video of an animated page.
 * @param {object} o
 * @param {string} [o.url]      Page URL (e.g. an aura embed). Mutually exclusive with html.
 * @param {string} [o.html]     Full document HTML.
 * @param {number} o.width      CSS width.
 * @param {number} o.height     CSS height.
 * @param {number} [o.dpr]      Device pixel ratio (default 1 — video is heavy).
 * @param {number} [o.fps]      Output frame rate (default 30).
 * @param {number} [o.durationMs] Clip length (default 6000).
 * @param {number} [o.warmupMs] Virtual time advanced before the first captured
 *                              frame, so the scene settles (default 2000).
 * @param {"mp4"|"webm"} [o.format]
 * @param {boolean} [o.waitForCaptureReady] Wait for window.__auraCaptureReady
 *                              (aura embeds in ?capture=1 mode) before recording.
 * @returns {Promise<Buffer>} Encoded video bytes.
 */
export async function renderVideo(o) {
  const {
    url,
    html,
    width,
    height,
    dpr = 1,
    fps = 30,
    durationMs = 6000,
    warmupMs = 2000,
    format = "mp4",
    waitForCaptureReady = false,
  } = o;

  const dtMs = 1000 / fps;
  const totalFrames = Math.max(1, Math.round(durationMs / dtMs));

  const t0 = Date.now();
  const mark = (phase) => console.log(`[video] ${phase} +${Date.now() - t0}ms`);

  const browser = await getBrowser();
  // Fresh context: the vclock init script must not leak into image renders.
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dpr,
  });
  const dir = await mkdtemp(path.join(tmpdir(), "aura-video-"));
  const outPath = path.join(dir, `out.${format}`);

  try {
    await context.addInitScript(VCLOCK_INIT_SCRIPT);
    const page = await context.newPage();

    if (url) {
      await page.goto(url, { waitUntil: "load", timeout: 45_000 });
    } else {
      await page.setContent(html, { waitUntil: "load", timeout: 45_000 });
    }
    mark("content-loaded");

    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      page.waitForTimeout(5_000),
    ]).catch(() => {});

    if (waitForCaptureReady) {
      // Real timers still run under the vclock, so the embed's readiness gate
      // (scene fetch + fonts + settle timeout) fires normally.
      await page.waitForFunction(() => window.__auraCaptureReady === true, null, {
        timeout: 45_000,
      });
    }
    mark("ready");

    // Warm up in virtual time so the first captured frame is a settled scene.
    const warmupFrames = Math.round(warmupMs / dtMs);
    if (warmupFrames > 0) {
      await page.evaluate(
        ([frames, dt]) => window.__vclockPump(frames, dt),
        [warmupFrames, dtMs]
      );
    }
    mark("warmed-up");

    const ff = spawn(FFMPEG, ffmpegArgs({ fps, format, outPath }), {
      stdio: ["pipe", "ignore", "pipe"],
    });
    let ffErr = "";
    ff.stderr.on("data", (c) => {
      ffErr += c;
      if (ffErr.length > 16_384) ffErr = ffErr.slice(-16_384);
    });
    const ffDone = new Promise((resolve, reject) => {
      ff.on("error", reject); // e.g. ffmpeg binary missing
      ff.on("close", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`ffmpeg exited ${code}: ${ffErr.slice(-1000)}`))
      );
    });
    // Surface encoder failures from the capture loop's stdin writes instead of
    // crashing the process with an unhandled EPIPE.
    ff.stdin.on("error", () => {});

    for (let i = 0; i < totalFrames; i++) {
      await page.evaluate((dt) => window.__vclockTick(dt), dtMs);
      const frame = await page.screenshot({ type: "png" });
      if (!ff.stdin.write(frame)) await once(ff.stdin, "drain");
      if (i % fps === 0) mark(`frame ${i}/${totalFrames}`);
    }
    ff.stdin.end();
    await ffDone;
    mark("encoded");

    return await readFile(outPath);
  } finally {
    await context.close().catch(() => {});
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
