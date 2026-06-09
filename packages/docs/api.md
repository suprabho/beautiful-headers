# API reference

Every package (`@aura/headers-lite`, `-liquid`, `-ribbon`, `-dandelion`,
`-particle-ring`, `-pro`) re-exports the same API; they differ only in which
backgrounds register themselves on import.

## `<AuraHeader />`

Renders an animated header background from a `scene_data` config object.

```jsx
import { AuraHeader } from '@aura/headers-pro'
import '@aura/headers-pro/styles.css'

<AuraHeader config={scene} input="mouse" colorMode="auto" style={{ height: 320 }} />
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `config` | `object` | — | The `scene_data` object from the Aura editor. `null`/`undefined` renders a default scene. See the [scene config reference](./scene-config.md). |
| `input` | `'off' \| 'mouse' \| 'mic'` | `'mouse'` | Interaction source. `'off'` disables all input; `'mic'` requests microphone access and drives audio-reactive parameters. See [Interactions](./interactions.md). |
| `colorMode` | `'auto' \| 'dark' \| 'light' \| 'default'` | `'auto'` | How dark/light theme overrides resolve. See [Theming](./theming.md). |
| `hideText` | `boolean` | `false` | Suppress the scene's text layer even if the config enables it. |
| `hideIcons` | `boolean` | `false` | Suppress the icon/tessellation layer even if the config enables it. |
| `paused` | `boolean` | `false` | Freeze all animation (backgrounds receive `isPaused`). |
| `fallback` | `ComponentType<AuraFallbackProps>` | `ColorPlaceholder` | Component rendered when the scene's `backgroundType` has no registered renderer in this package. Receives `{ colors, className, style }`. |
| `className` | `string` | — | Appended to the root element's `aura-header` class. |
| `style` | `CSSProperties` | — | Merged into the root element. The root is `position: relative; width: 100%; height: 100%; overflow: hidden` — **set the header height here** or on a sized wrapper. |

### Behavior notes

- The scene's own `inputEnabled` field (default `true`) gates interaction too:
  `input="mouse"` on a scene saved with `inputEnabled: false` stays inert.
- Mouse position is tracked on the component's own bounding box (normalized
  0–1) and throttled to one update per animation frame.
- The background is wrapped in a CSS `filter` built from
  `effectsConfig` (blur/saturation/contrast/brightness/colorMap). The `liquid`
  background only honours `blur` — its shader handles color grading itself.

## `ColorPlaceholder`

The default fallback: a static SVG of blurred palette-colored blobs. Useful as
a loading placeholder or as an explicit `fallback` prop.

```jsx
import { ColorPlaceholder } from '@aura/headers-lite'

<ColorPlaceholder colors={['#ff006e', '#8338ec', '#3a86ff']} />
```

| Prop | Type | Description |
| --- | --- | --- |
| `colors` | `string[]` | Palette hex colors. |
| `className` / `style` | — | Forwarded to the SVG container. |

## Registry

The seam that makes the lite/pro split work — backgrounds register themselves,
and `AuraHeader` looks them up by `backgroundType`. You only need these when
[writing a custom background](./custom-backgrounds.md).

| Export | Signature | Description |
| --- | --- | --- |
| `registerBackground` | `(type: string, render: BackgroundRenderer) => void` | Register a renderer for a `backgroundType`. Last registration wins. |
| `getBackground` | `(type: string) => BackgroundRenderer \| null` | Look up a renderer. |
| `hasBackground` | `(type: string) => boolean` | Check whether a type is registered. |
| `registeredBackgrounds` | `() => string[]` | List registered types — handy for deciding lite vs. pro at runtime. |
| `registerGlassOverlay` | `(component: ComponentType) => void` | Register the fluted-glass overlay component (done by `@aura/headers-pro`). |
| `getGlassOverlay` | `() => ComponentType \| null` | Read the registered glass overlay. |

A `BackgroundRenderer` receives the resolved scene context and returns a React
node:

```ts
type BackgroundRenderer = (ctx: {
  scene: Record<string, any>        // theme-resolved scene_data
  effectsConfig: Record<string, any>
  paletteColors?: string[]          // gradientConfig.colors
  mousePos: { x: number; y: number } // normalized 0–1
  mouseIntensity: number             // 0 when input is off/mic
  mouseEnabled: boolean
  isPaused: boolean
}) => ReactNode
```

## Theming helpers

| Export | Signature | Description |
| --- | --- | --- |
| `useColorModeValue` | `(colorMode?) => 'dark' \| 'light' \| null` | The hook `AuraHeader` uses to resolve the active mode (parent-frame messages + `prefers-color-scheme` in `'auto'`). |
| `resolveThemedConfigs` | `(sceneData, mode) => sceneData` | Deep-merges `themeOverrides.light` into the base config when `mode === 'light'`. |
| `deepMerge` | `(base, overrides) => merged` | Plain objects recurse, arrays replace, `undefined` is skipped. |
| `computeOverrideDiff` | `(base, edited) => diff \| null` | Minimal diff between two configs — what the editor uses to build `themeOverrides`. |

See [Theming](./theming.md) for the full model.

## `audioData`

A shared singleton populated by the mic analyser when `input="mic"`. Read-only
for consumers; custom backgrounds can read it per frame for audio reactivity.

```ts
const audioData: {
  bass: number        // 0–1
  mid: number         // 0–1
  treble: number      // 0–1
  amplitude: number   // 0–1, weighted: bass*0.5 + mid*0.35 + treble*0.15
  frequencyData: Uint8Array | null  // raw FFT bins (fftSize 2048)
  isActive: boolean
}
```

## Stylesheet

Each package ships its structural CSS at the `/styles.css` export:

```js
import '@aura/headers-pro/styles.css'
```

Import it once per app. It scopes everything under `.aura-header`.

## TypeScript

All packages ship type declarations (`index.d.ts`). The notable exported types
are `AuraHeaderProps`, `AuraInput`, `AuraColorMode`, `AuraFallbackProps`, and
`BackgroundRenderer`. The `config` prop is typed as
`Record<string, unknown> | null | undefined` — the scene format is documented
in the [scene config reference](./scene-config.md) rather than enforced
structurally.
