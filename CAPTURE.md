# Scene capture endpoint

> **Render service:** with `AURA_RENDER_URL` + `AURA_RENDER_SECRET` set on the
> Vercel project, this endpoint proxies to the warm-browser
> [`render-service/`](render-service/README.md) (Fly.io) instead of launching
> `@sparticuz/chromium` in the Lambda. The service also renders **videos**
> (`/scene/:slug/video.mp4`) and serves other apps (greenmentor, vismay)
> directly — see its README.

Render any scene to a PNG at requested frame dimensions, by slug.

```
GET /scenes/:slug/capture.png
```

A headless browser loads `/embed/:slug?capture=1` at the requested size, waits
for the scene to settle, and composites the live WebGL + text/icon layers into a
PNG using the same pipeline as the in-app capture button.

## Query params

| Param       | Default | Range / values        | Notes                                              |
|-------------|---------|-----------------------|----------------------------------------------------|
| `w`         | `1200`  | `16`–`3840`           | CSS width. Final pixels = `w × dpr`.               |
| `h`         | `630`   | `16`–`3840`           | CSS height. Final pixels = `h × dpr`.              |
| `dpr`       | `2`     | `1`–`3`               | Supersampling — higher = crisper, slower.          |
| `hideText`  | `false` | `true` / `false`      | Omit the text layer.                               |
| `hideIcons` | `false` | `true` / `false`      | Omit the tessellation/icon layer.                  |
| `theme`     | —       | `dark` / `light` etc. | Forwarded to the embed's color-mode resolver.      |

Example (OG-card size): `/scenes/midnight-aurora/capture.png?w=1200&h=630&dpr=2`

## Caching

1. **Edge** — responses set `Cache-Control: public, max-age=2592000, s-maxage=2592000, immutable`,
   so identical URLs serve from Vercel's CDN without invoking the function.
2. **Origin** — rendered PNGs are persisted to the Supabase `captures` bucket
   (`<slug>/<hash>.png`). A cold function returns the stored image instead of
   re-rendering. `X-Capture-Cache: hit|miss` reports which path served it.

## Setup

1. Create a **public** Supabase storage bucket named `captures`.
2. Set `SUPABASE_SERVICE_ROLE_KEY` in the Vercel project env (lets the function
   write to the bucket). Without it, images still render but aren't cached.
3. Deploy. The function is configured (`vercel.json`) with 3008 MB memory and a
   60 s max duration to fit the chromium binary + render time.

## Local verification (no deploy)

```bash
npm install                 # pulls in puppeteer + puppeteer-core + @sparticuz/chromium
npm run dev                 # serves http://localhost:5173
node scripts/capture-spike.mjs <slug> --w=1200 --h=630 --dpr=2
# writes capture-<slug>.png
```

The spike exercises the exact embed bridge the production endpoint uses, so a
correct local render means the endpoint will render correctly too.

## Notes / limits

- Software WebGL (SwiftShader) on the server is multi-second per render — caching
  is essential, which is why it's built in.
- The frame is captured ~1.2 s after load to let animated scenes settle; output
  is a single still, with live input (mouse/mic) disabled for determinism.
- For a public, third-party-facing API, add an API-key check + rate limiting in
  front of this route (e.g. at the Cloudflare layer) before exposing it widely.
