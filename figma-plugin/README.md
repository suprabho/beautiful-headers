# Aura Backgrounds — Figma plugin

Browse the Aura scene gallery inside Figma and drop any scene into a frame as a
pixel-exact background.

- **Gallery** — search by title and filter by background type (Aurora, Mesh,
  Fog, Waves, Ribbon, …), straight from the public `scenes` table.
- **Apply to selection** — each selected frame / rectangle / shape is rendered
  at its own size via `GET /scenes/:slug/capture.png` (see `../CAPTURE.md`) and
  set as its image fill. The scene thumbnail shows instantly while the full
  render arrives. Layers of the same size share one render.
- **Insert frame** — with nothing selected, creates a new frame from a preset
  (web header, OG image, desktop, mobile, square, story) and fills it.
- **New scene** — build a scene from scratch in the *New scene* tab: name,
  background type, 2–6 palette colours (or *Shuffle*) and a backdrop colour
  where the type has one. *Create* saves it to the `scenes` table (flagged
  `pendingReview`, like the bulk-create API) and immediately applies it to the
  selection or a new frame. Configs are built in `src/ui/newScene.ts` from the
  web editor's defaults — keep them in sync with `src/store/useStore.js`.
- **Options** — scene text on/off, icons on/off, dark/light theme, 1×–3×
  resolution (lowered automatically so images stay within Figma's 4096 px limit;
  layers wider than 3840 px render at a scaled-down size and the fill scales up).
- **Re-render after resizing** — the scene and options are stored on the layer
  (plugin data), so after resizing you can hit *Re-render* in the plugin or the
  **Re-render Aura background** button in the layer's properties panel, which
  runs headlessly without opening the UI.

## Develop

```bash
cd figma-plugin
npm install
npm run build        # dist/code.js + dist/index.html (single inlined file)
npm run dev          # rebuild both on change
npm run typecheck
```

Then in the Figma desktop app: **Plugins → Development → Import plugin from
manifest…** and pick `figma-plugin/manifest.json`.

## Layout

| File                | Runs in                        | Does                                                         |
| ------------------- | ------------------------------ | ------------------------------------------------------------ |
| `src/code.ts`       | Figma main thread (sandbox)    | Selection reporting, frame creation, writing image fills.    |
| `src/ui/*`          | Plugin iframe (React/Tailwind) | Gallery, options, all network requests.                      |
| `src/shared.ts`     | both                           | Message and data types.                                      |
| `manifest.json`     | —                              | Network allowlist, relaunch buttons.                         |

## Notes

- The UI talks to `aura.promad.design`, the Supabase project and
  `thumbnails.promad.design`; any new host must be added to
  `networkAccess.allowedDomains` in `manifest.json`.
- A render on a cache miss takes a few seconds (software WebGL in a headless
  browser); repeat renders at the same size are served from the CDN.
- Before publishing to the Community, replace `id` in `manifest.json` with the
  ID Figma assigns when you create the plugin.
