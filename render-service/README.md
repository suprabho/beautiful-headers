# aura-render-service

Warm-browser **image + video** render microservice for aura scenes, deployed on Fly.io.

## Why

Every app embedding aura was running its own headless Chromium to export images:

- aura's own `/scenes/:slug/capture.png` Vercel function pays `@sparticuz/chromium`
  cold-start extraction and renders software WebGL under a 60 s `maxDuration`;
- the GreenMentor community engine had to grow its own Fly render service
  (`green-mentor-pro/header-render-service`) for the same reason;
- vismay ships video renders out to GitHub Actions because serverless can't
  host Chromium + ffmpeg.

This service centralizes all of it: **one warm Chromium** (full Playwright build —
no `@sparticuz/chromium` bin-tracing or version-mismatch pitfalls), SwiftShader
software WebGL, ffmpeg on the box, and as long as a render actually needs. Other
apps stop bundling browsers and just call HTTP.

## API

Auth: every render route requires `x-render-secret: <RENDER_SECRET>`.
`GET /health` → `200 ok` (open).

### Scene stills — `GET /scene/:slug/capture.png` (or `.webp`)

Renders through the embed's own capture bridge (`/embed/:slug?capture=1` →
`window.__auraCapture()`), so output is pixel-identical to the in-app capture
button and the existing Vercel endpoint.

| Param       | Default | Range             | Notes                            |
| ----------- | ------- | ----------------- | -------------------------------- |
| `w` / `h`   | 1200/630| 16–3840           | CSS size; pixels = size × dpr.   |
| `dpr`       | 2       | 1–3               | Supersampling.                   |
| `hideText`  | false   | `true`/`false`    | Omit the text layer.             |
| `hideIcons` | false   | `true`/`false`    | Omit the tessellation layer.     |
| `theme`     | —       | `dark`/`light`…   | Forwarded to the embed.          |
| `quality`   | 90      | 1–100             | WebP only.                       |
| `nocache`   | —       | `1`               | Skip the Supabase origin cache.  |

PNG renders share the **same Supabase cache bucket and key scheme** as the
Vercel `capture.png` endpoint, so either side's render is a hit for the other.
`X-Render-Cache: hit|miss` reports which path served it.

### Scene videos — `GET /scene/:slug/video.mp4` (or `.webm`)

Frame-stepped capture: the service virtualizes `requestAnimationFrame` /
`performance.now`, advances exactly `1000/fps` ms per captured frame, and pipes
frames into ffmpeg. Output timing is perfect even though software WebGL renders
slower than real time. Live input (mouse/mic) is off, so clips are deterministic
— identical params return the cached file.

| Param       | Default  | Range          | Notes                                  |
| ----------- | -------- | -------------- | -------------------------------------- |
| `w` / `h`   | 1280/720 | 16–1920        | CSS size.                              |
| `dpr`       | 1        | 1–2            | Video is heavy; 1 is usually fine.     |
| `fps`       | 30       | 10–60          |                                        |
| `seconds`   | 6        | 1–30           | Capped so frames ≤ 1800.               |
| `hideText` / `hideIcons` / `theme` / `nocache` | | | as above. |

Expect roughly 0.3–1 s of wall time per frame at 720p on a 2-CPU Fly machine —
a 6 s / 30 fps clip takes a couple of minutes on a cache miss. Callers should
use a generous timeout (or pre-warm via a background job) and rely on the cache.

### `POST /shot` — caller-supplied HTML/URL → image

Wire-compatible with `green-mentor-pro/header-render-service`, so
community-engine can point `HEADER_RENDER_URL` at this service unchanged.

```jsonc
{
  "html": "<!doctype html>…", // or "url": "https://…" — one of the two
  "width": 1200,              // required — CSS width
  "height": 627,              // required — CSS height
  "dpr": 2,                   // optional (default 2)
  "selector": "#header",      // optional (default "#header"; falls back to viewport)
  "settleMs": 2600,           // optional animation warm-up (default 2600)
  "format": "png",            // optional "png" | "webp" (default "png")
  "quality": 90               // optional WebP quality (default 90)
}
```

### `POST /video` — caller-supplied HTML/URL → video

```jsonc
{
  "url": "https://…",         // or "html": "<!doctype html>…"
  "width": 1280, "height": 720,
  "dpr": 1, "fps": 30,
  "durationMs": 6000,
  "warmupMs": 2000,           // virtual time advanced before frame 1
  "format": "mp4",            // "mp4" | "webm"
  "waitForCaptureReady": false // true for aura embeds loaded with ?capture=1
}
```

## Env

| var                         | default                     | notes                                        |
| --------------------------- | --------------------------- | -------------------------------------------- |
| `PORT`                      | `8080`                      | Fly `internal_port` matches.                 |
| `RENDER_SECRET`             | —                           | Required (or `HEADER_RENDER_SECRET`); render routes reject all if unset. |
| `AURA_ORIGIN`               | `https://aura.promad.design`| Where `/embed/:slug` is served.              |
| `RENDER_CONCURRENCY`        | `3`                         | Max concurrent image renders per machine.    |
| `VIDEO_CONCURRENCY`         | `1`                         | Max concurrent video renders per machine.    |
| `SUPABASE_URL`              | —                           | Optional origin cache (also reads `VITE_SUPABASE_URL`). |
| `SUPABASE_SERVICE_ROLE_KEY` | —                           | Needed to read/write the cache bucket.       |
| `CAPTURES_BUCKET`           | `aura-cache`                | Same bucket the Vercel endpoint uses.        |
| `FFMPEG_PATH`               | `ffmpeg`                    | System ffmpeg from the Docker image.         |

## Deploy

From this directory:

```bash
fly launch --no-deploy          # first time only; note the (possibly suffixed) app name
fly secrets set RENDER_SECRET=<generate a strong value>
fly secrets set SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=…   # cache (see below)
fly deploy
```

Without the Supabase secrets the cache is off — and because `capture.js` skips
its own upload whenever the service is configured, that means *nothing* writes
to the bucket and every request pays a full render. Set them. The bucket
(`aura-cache` by default) must already exist; Storage returns `NoSuchBucket` as
a `400`, and the put is fire-and-forget, so a wrong name fails silently.

The Docker base image tag (`mcr.microsoft.com/playwright:vX.Y.Z-jammy`) **must**
match the `playwright` version in `package.json`. Bump both together.

## Wiring up consumers

- **aura (this repo)** — set on the Vercel project:
  `AURA_RENDER_URL=https://<app>.fly.dev` and `AURA_RENDER_SECRET=<secret>`.
  `/scenes/:slug/capture.png` then proxies here instead of launching
  `@sparticuz/chromium` in the Lambda (falls back to the local path when unset).
- **greenmentor community-engine** — point the existing envs at this service:
  `HEADER_RENDER_URL=https://<app>.fly.dev`, `HEADER_RENDER_SECRET=<secret>`.
  Its `/api/header/export` route already speaks the `/shot` contract verbatim.
  `green-mentor-pro/header-render-service` can then be retired.
- **vismay** — share cards / newsletter stills can `POST /shot` with a URL or
  HTML instead of launching Playwright in the route; story aura clips come from
  `GET /scene/:slug/video.mp4`.

## Local run

```bash
npm install && npx playwright install chromium   # plus ffmpeg on PATH
RENDER_SECRET=dev npm start

curl -sS -H 'x-render-secret: dev' \
  'localhost:8080/scene/midnight-aurora/capture.png?w=1200&h=630&dpr=2' -o out.png

curl -sS -H 'x-render-secret: dev' \
  'localhost:8080/scene/midnight-aurora/video.mp4?w=1280&h=720&seconds=4' -o out.mp4
```
