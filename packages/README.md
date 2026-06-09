# Aura Headers — React packages

Animated header backgrounds extracted from the Aura app into standalone,
publishable React libraries. Pick the variant that matches the bundle weight you
want — they all expose the same `<AuraHeader config={sceneData} />` API.

| Package | What it adds | three.js | gzip (js)¹ |
| --- | --- | --- | --- |
| [`@aura/headers-lite`](./headers-lite) | Canvas2D/DOM backgrounds (`simple`, `aurora`, `fluid`, `waves`) + icons/effects/text. WebGL scenes → SVG fallback | ❌ none | ~27 KB |
| [`@aura/headers-liquid`](./headers-liquid) | Lite + `liquid` (mesh-gradient shader) | ✅ peer | ~32 KB |
| [`@aura/headers-ribbon`](./headers-ribbon) | Lite + `ribbon` (3D ribbon) | ✅ peer | ~32 KB |
| [`@aura/headers-dandelion`](./headers-dandelion) | Lite + `dandelion` (3D particles) | ✅ peer | ~32 KB |
| [`@aura/headers-particle-ring`](./headers-particle-ring) | Lite + `particleRing` | ✅ peer | ~31 KB |
| [`@aura/headers-pro`](./headers-pro) | Everything: all 4 WebGL backgrounds + fluted-glass overlay | ✅ peer | ~39 KB |

¹ The component code only. `react`/`three` are **peer dependencies**, never
bundled — so they're shared with the host app, not duplicated. (three.js itself
is ~600 KB; the WebGL packages assume the host already ships it.)

## Documentation

Full docs live in [`docs/`](./docs):
[getting started](./docs/getting-started.md) ·
[API reference](./docs/api.md) ·
[scene config reference](./docs/scene-config.md) ·
[theming](./docs/theming.md) ·
[interactions](./docs/interactions.md) ·
[custom backgrounds](./docs/custom-backgrounds.md)

## Architecture

```
core/ (private, source-shared, bundled into each package)
 ├─ AuraHeader.jsx        the renderer — resolves the scene, drives mouse/mic,
 │                        looks up the background in the registry
 ├─ registry.js           registerBackground() / getGlassOverlay() — the seam
 │                        that lets each package ship only the layers it needs
 ├─ components/           the 11 layers + ColorPlaceholder + FlutedGlassCanvas
 ├─ backgrounds/
 │   ├─ canvas2d.jsx      registers simple/aurora/fluid/waves (three-free; core
 │   │                    imports this by default → every package has them)
 │   ├─ liquid|ribbon|dandelion|particleRing.jsx   one WebGL background each
 │   └─ glass.js          registers the FlutedGlassCanvas overlay
 ├─ audio/ mouse/ lib/    interaction + theme helpers
 └─ aura.css              structural styles (shipped as each pkg's styles.css)
```

The whole "lite vs pro" split rests on one idea: backgrounds **register
themselves** instead of `AuraHeader` hardcoding them. A package imports only the
`backgrounds/*` modules it wants, so the bundler only includes that layer code
(and three.js) — any unregistered `backgroundType` falls back to the SVG
`ColorPlaceholder`. The four Canvas2D layers were also decoupled from
`FlutedGlassCanvas` (they look it up via the registry) so lite is provably
three-free.

## Develop

```bash
cd packages
pnpm install
pnpm build          # builds all six packages (tsup → ESM + CJS + styles.css)
```

Each package bundles `core` at build time, so the published artifacts are
standalone — installing `@aura/headers-ribbon` pulls in no `@aura/*` deps, only
the peer `react` / `three`.

## Known limitations (v0)

- The Canvas2D layers size their backing buffer to the **window**, not the
  container. They display correctly scaled in any box (full-bleed hero headers
  are pixel-perfect); per-container sizing via `ResizeObserver` is the main
  follow-up.
- The mic analyser writes to a shared `audioData` singleton — fine for one
  audio-reactive header per page; multiple `input="mic"` instances would share
  state.
- No automated tests yet; verified by build output (lite contains zero three.js)
  and faithful extraction from the app's embed renderer.
