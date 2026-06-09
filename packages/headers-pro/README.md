# @aura/headers-pro

Animated header backgrounds for React — **Pro: everything**.

Renders any scene the Aura editor can produce: all Canvas2D backgrounds
(`simple`, `aurora`, `fluid`, `waves`), all four WebGL backgrounds (`liquid`,
`ribbon`, `dandelion`, `particleRing`), the fluted-glass overlay, and the
effects / text / icon layers. Requires three.js as a peer dependency.

```bash
npm i @aura/headers-pro react react-dom three @react-three/fiber @react-three/postprocessing
```

```jsx
import { AuraHeader } from '@aura/headers-pro'
import '@aura/headers-pro/styles.css'

<div style={{ height: 320 }}>
  <AuraHeader config={anyScene} input="mouse" />
</div>
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
| `fallback` | `ComponentType` | `ColorPlaceholder` | Used for unknown backgrounds |
| `className` / `style` | — | — | Applied to the root; set height via `style` |

Want a lighter bundle? Pick `@aura/headers-lite` (no WebGL) or a single-layer
package (`@aura/headers-ribbon`, …).
