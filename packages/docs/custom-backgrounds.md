# Custom backgrounds & the registry

`AuraHeader` doesn't hardcode its backgrounds. Each background module calls
`registerBackground(type, render)` as an import side effect, and the component
looks the renderer up by the scene's `backgroundType`. This is the entire
mechanism behind the lite/pro split — and it's public API, so you can use it
to add your own backgrounds or replace built-in ones.

## The fallback path

When a scene's `backgroundType` has no registered renderer (e.g. a `ribbon`
scene rendered by `@aura/headers-lite`), `AuraHeader` renders the `fallback`
component — by default `ColorPlaceholder`, a static SVG of blurred blobs in
the scene's palette colors. The header still shows its text, icons, and
effects layers, so a degraded scene remains presentable.

Override it per instance:

```jsx
<AuraHeader
  config={scene}
  fallback={({ colors, style }) => (
    <div style={{ ...style, background: `linear-gradient(135deg, ${colors.join(', ')})` }} />
  )}
/>
```

You can detect degradation up front:

```js
import { hasBackground } from '@aura/headers-lite'

if (!hasBackground(scene.backgroundType)) {
  // warn, lazy-load @aura/headers-pro, pick a different scene, …
}
```

## Writing a background

A renderer receives the resolved scene context and returns a React node:

```jsx
import { registerBackground } from '@aura/headers-lite'

registerBackground('starfield', (ctx) => (
  <StarfieldLayer
    config={ctx.scene.starfieldConfig || {}}
    paletteColors={ctx.paletteColors}
    mousePos={ctx.mousePos}
    mouseIntensity={ctx.mouseIntensity}
    mouseEnabled={ctx.mouseEnabled}
    isPaused={ctx.isPaused}
  />
))
```

Now any scene with `"backgroundType": "starfield"` renders your layer, and you
can give it its own config slice (`starfieldConfig`) in the scene JSON.

### The context object

| Field | Type | Description |
| --- | --- | --- |
| `scene` | `object` | The full scene config, **already theme-resolved** (dark/light overrides applied). Read your own config slice from it. |
| `effectsConfig` | `object` | The scene's effects slice. CSS filters are applied by the wrapper for you; only read this for effects you implement in-canvas. |
| `paletteColors` | `string[] \| undefined` | `gradientConfig.colors` — respect it so palettes work across backgrounds. |
| `mousePos` | `{ x, y }` | Cursor over the header, normalized 0–1. `{ 0.5, 0.5 }` until first move. |
| `mouseIntensity` | `number` | `mouseConfig.intensity`, already zeroed when input is `off`/`mic` — multiply your mouse effect by it. |
| `mouseEnabled` | `boolean` | Whether mouse interaction is active. |
| `isPaused` | `boolean` | Honor this by halting your animation loop. |

### Conventions worth following

- **Color from the palette.** Use `paletteColors` when present so the same
  scene re-colors consistently across background types; keep any internal
  colors only as fallbacks.
- **Smooth the mouse.** The built-in layers lerp toward `mousePos`
  (factor ~0.05–0.1 per frame) rather than jumping to it.
- **Audio reactivity is opt-in.** Read the shared `audioData` singleton per
  frame and modulate *additively* — `base + band * weight` — so the config
  value remains the resting state:

  ```js
  import { audioData } from '@aura/headers-lite'

  const speed = (config.speed ?? 1) + (audioData.isActive ? audioData.treble * 1.5 : 0)
  ```

- **Fill the wrapper.** Your root element should be
  `position: absolute; inset: 0` (the background wrapper is positioned for
  you).
- **Clean up.** Cancel animation frames and dispose WebGL resources on
  unmount.

## Replacing a built-in background

Last registration wins, so registering an existing type swaps the
implementation — import order just has to put yours after the package's:

```js
import { registerBackground } from '@aura/headers-lite' // built-ins register here
registerBackground('waves', myWavesRenderer)            // now 'waves' is yours
```

## Introspection

```js
import { registeredBackgrounds } from '@aura/headers-pro'

registeredBackgrounds()
// lite:  ['simple', 'aurora', 'fluid', 'waves']
// pro:   [...lite, 'liquid', 'ribbon', 'dandelion', 'particleRing']
```

## The glass overlay slot

The fluted-glass effect is a separate registry slot
(`registerGlassOverlay(Component)` / `getGlassOverlay()`), used by the
Canvas2D layers to render the overlay above themselves when
`effectsConfig.flutedGlass.enabled` is set. `@aura/headers-pro` registers it;
in other packages the slot is empty and the setting is ignored. You'd only
touch this to ship a custom glass-style overlay of your own.
