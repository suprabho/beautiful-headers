# @aura/headers-lite

Animated header backgrounds for React — **Lite build, no WebGL**.

Ships the Canvas2D/DOM backgrounds (`simple`, `aurora`, `fluid`, `waves`) plus
the icon, effects and text layers. Scenes whose `backgroundType` is one of the
WebGL-only types (`liquid`, `ribbon`, `dandelion`, `particleRing`) gracefully
degrade to an SVG color placeholder. **three.js is never bundled** — this is the
lightest variant.

```bash
npm i @aura/headers-lite react react-dom
```

```jsx
import { AuraHeader } from '@aura/headers-lite'
import '@aura/headers-lite/styles.css'

export default function Hero({ scene }) {
  return (
    <div style={{ height: 320 }}>
      <AuraHeader config={scene} input="mouse" />
    </div>
  )
}
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `config` | `object` | — | The `scene_data` object from the Aura editor |
| `input` | `'off' \| 'mouse' \| 'mic'` | `'mouse'` | Interaction source |
| `colorMode` | `'auto' \| 'dark' \| 'light' \| 'default'` | `'auto'` | Theme resolution |
| `hideText` | `boolean` | `false` | Hide the text layer |
| `hideIcons` | `boolean` | `false` | Hide the tessellation/icon layer |
| `paused` | `boolean` | `false` | Freeze animation |
| `fallback` | `ComponentType` | `ColorPlaceholder` | Used for unregistered (WebGL) backgrounds |
| `className` / `style` | — | — | Applied to the root; set height via `style` |

Need the WebGL backgrounds? Use a layer package (`@aura/headers-ribbon`, …) or
`@aura/headers-pro` for everything.

> Note: the Canvas2D layers currently size their backing buffer to the window;
> they display correctly scaled inside any container, full-bleed hero headers
> are pixel-perfect. Per-container sizing is on the roadmap.
