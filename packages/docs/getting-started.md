# Getting started

The Aura header packages render animated header backgrounds in React from a
single JSON object — the `scene_data` produced by the
[Aura editor](https://aura.promad.design). Every package exposes the same
component:

```jsx
<AuraHeader config={sceneData} />
```

## 1. Pick a package

All six packages share the same API; they differ only in which backgrounds are
compiled in (and therefore bundle weight). Any `backgroundType` a package
doesn't include degrades gracefully to an SVG color placeholder built from the
scene's palette.

| Package | Backgrounds included | three.js | gzip |
| --- | --- | --- | --- |
| `@aura/headers-lite` | `simple`, `aurora`, `fluid`, `waves` | none | ~27 KB |
| `@aura/headers-liquid` | lite + `liquid` | peer dep | ~32 KB |
| `@aura/headers-ribbon` | lite + `ribbon` | peer dep | ~32 KB |
| `@aura/headers-dandelion` | lite + `dandelion` | peer dep | ~32 KB |
| `@aura/headers-particle-ring` | lite + `particleRing` | peer dep | ~31 KB |
| `@aura/headers-pro` | everything + fluted-glass overlay | peer dep | ~39 KB |

Rules of thumb:

- You know your scene uses a Canvas2D background → **lite**.
- Your scene uses exactly one WebGL background → the **single-background
  package** for it.
- You render arbitrary scenes (a CMS, a gallery, user-generated content) →
  **pro**.

## 2. Install

```bash
npm i @aura/headers-lite react react-dom
# WebGL variants additionally need three:
npm i @aura/headers-pro three
```

`react`, `react-dom`, and (for WebGL variants) `three` are **peer
dependencies** — they are never bundled, so they're shared with your app rather
than duplicated.

## 3. Render a header

```jsx
import { AuraHeader } from '@aura/headers-lite'
import '@aura/headers-lite/styles.css'
import scene from './my-scene.json'

export default function Hero() {
  return (
    <div style={{ height: 320 }}>
      <AuraHeader config={scene} />
    </div>
  )
}
```

Two things to remember:

- **Import the stylesheet once** (`styles.css`). It contains the structural
  styles for the layers; without it text and effects won't position correctly.
- **The component fills its container** (`width: 100%; height: 100%`). Give the
  wrapper — or the component itself via `style` — an explicit height.

## 4. Get a scene config

A scene config is the `scene_data` JSON saved by the Aura editor. Today you
copy the JSON itself:

- **From the editor** — design a scene at [aura.promad.design](https://aura.promad.design),
  save it, and export/copy its `scene_data` JSON.
- **Hand-written** — the format is plain JSON; see the
  [scene config reference](./scene-config.md) for every field. A minimal scene
  is just a background type and some colors:

```json
{
  "backgroundType": "waves",
  "gradientConfig": {
    "colors": ["#06b6d4", "#a855f7", "#ec4899"],
    "colorStops": [0, 50, 100]
  },
  "wavesConfig": { "layers": 3, "speed": 0.5, "blur": 40 }
}
```

There is no public fetch-by-slug JSON API yet — bundle the JSON with your app
(it's small and tree-shakes to nothing extra).

## 5. Common props

```jsx
<AuraHeader
  config={scene}
  input="mouse"        // 'off' | 'mouse' | 'mic'
  colorMode="auto"     // 'auto' | 'dark' | 'light' | 'default'
  hideText             // suppress the scene's text layer
  hideIcons            // suppress the icon/tessellation layer
  paused               // freeze all animation
  style={{ height: 320 }}
/>
```

The full prop table is in the [API reference](./api.md). Theming behavior
(`colorMode`) is covered in [Theming](./theming.md); `input` is covered in
[Interactions](./interactions.md).

## SSR / Next.js

The component is client-side: backgrounds draw to canvas/WebGL and the
interaction hooks touch `window`. In Next.js App Router, render it inside a
`'use client'` component. `useColorModeValue` guards `window` access, so
importing the package on the server is safe — but the animated background only
appears after hydration.

```jsx
'use client'
import { AuraHeader } from '@aura/headers-pro'
import '@aura/headers-pro/styles.css'

export function HeroHeader({ scene }) {
  return <AuraHeader config={scene} style={{ height: 360 }} />
}
```

## Known limitations (v0)

- The Canvas2D layers size their backing buffer to the **window**, not the
  container. They display correctly scaled in any box — full-bleed hero
  headers are pixel-perfect — but per-container sizing (`ResizeObserver`) is a
  planned follow-up.
- The mic analyser writes to a shared singleton: one `input="mic"` header per
  page is supported; multiple would share audio state.

## Next

- [Scene config reference](./scene-config.md) — every `scene_data` field
- [API reference](./api.md) — props and exports
- [Theming](./theming.md) — dark/light modes and overrides
- [Interactions](./interactions.md) — mouse and microphone input
- [Custom backgrounds](./custom-backgrounds.md) — the registry and fallbacks
