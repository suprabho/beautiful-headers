# Scene config reference

The `config` prop is the `scene_data` object produced by the Aura editor —
plain JSON, fully hand-writable. Every field is optional; sensible defaults
apply throughout.

```
{
  backgroundType,        // which background renders
  gradientConfig,        // palette + gradient (shared by all backgrounds)
  <background>Config,    // one slice per background type (only the active one is read)
  effectsConfig,         // post-processing: filters, textures, vignette, fluted glass
  tessellationConfig,    // icon overlay
  textConfig, textSections, textGap,   // text layer
  mouseConfig, inputEnabled,           // interaction
  themeOverrides,        // dark/light per-property overrides
}
```

## Top level

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `backgroundType` | `string` | `'liquid'` | One of `simple`, `aurora`, `fluid`, `waves` (Canvas2D/DOM — in every package) or `liquid`, `ribbon`, `dandelion`, `particleRing` (WebGL — package-dependent). An unregistered type renders the SVG fallback. |
| `gradientConfig` | `object` | `{}` | Palette and gradient geometry; the palette feeds every background. |
| `auroraConfig`, `fluidConfig`, `wavesConfig`, `ribbonConfig`, `dandelionConfig`, `particleRingConfig` | `object` | `{}` | Per-background settings; only the slice matching `backgroundType` is read. (`liquid` and `simple` read `gradientConfig` directly.) |
| `effectsConfig` | `object` | `{}` | Post-processing applied to every background. |
| `tessellationConfig` | `object` | `{}` | Icon overlay grid. |
| `textConfig` | `object` | `{}` | Text layer toggle + color/opacity. |
| `textSections` | `array` | `[]` | The text lines themselves. |
| `textGap` | `number` | `0` | Vertical gap between text sections (px). |
| `mouseConfig` | `object` | `{ enabled: true, intensity: 0.5 }` | Mouse interaction strength. |
| `inputEnabled` | `boolean` | `true` | Scene-level interaction kill-switch; combined with the `input` prop. |
| `themeOverrides` | `object` | — | `{ light: { ...partial config } }` — see [Theming](./theming.md). |

## `gradientConfig` — palette + gradient

The palette (`colors`) is shared: every background derives its coloring from
it, and the fallback placeholder uses it too. The geometry fields apply to the
`simple` and `liquid` gradients.

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `colors` | `string[]` | `['#ff006e', '#8338ec', '#3a86ff', '#06d6a0']` | Hex palette colors. |
| `colorStops` | `number[]` | evenly spaced | Stop position per color, 0–100. |
| `type` | `'linear' \| 'radial' \| 'conic'` | `'linear'` | Gradient type (`simple`/`liquid`). |
| `startPos` | `{ x, y }` | `{ x: 0, y: 0 }` | Gradient start, in % of the viewport; values outside 0–100 position off-screen. |
| `endPos` | `{ x, y }` | `{ x: 100, y: 100 }` | Gradient end. |
| `waveIntensity` | `number` | `0.3` | Liquid: wave distortion strength (0–1). |
| `wave1Speed` / `wave2Speed` | `number` | `0.2` / `0.15` | Liquid: wave speeds. |
| `wave1Direction` / `wave2Direction` | `1 \| -1` | `1` / `-1` | Liquid: wave directions. |
| `mouseInfluence` | `number` | `0.5` | Liquid: mouse distortion strength (0–1). |
| `decaySpeed` | `number` | — | Liquid: mouse smoothing (higher = snappier). |

## Background slices

Only the slice matching `backgroundType` is read.

### `auroraConfig` (`aurora` — Canvas2D)

Vertical glowing lines that fade in and out.

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `width` | `number` | `20` | Line width (px). Audio-reactive. |
| `minHeight` / `maxHeight` | `number` | `200` / `600` | Line height range (px). |
| `ttl` | `number` | `200` | Frames each line lives (fade in/out window). |
| `lineCount` | `number` | `0` | Explicit count; `0` derives it from canvas width. |
| `hueStart` / `hueEnd` | `number` | `120` / `180` | Hue range (degrees) when no palette is set. |
| `blurAmount` | `number` | `13` | Composite blur (px). |
| `backgroundColor` | `string` | palette-derived | Canvas fill behind the lines. |

### `fluidConfig` (`fluid` — Canvas2D)

Drifting blurred radial-gradient blobs.

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `speed` | `number` | `1` | Animation speed. Audio-reactive. |
| `intensity` | `number` | `1` | Blob radius multiplier. Audio-reactive. |
| `blurAmount` | `number` | `20` | Blur (px); capped at 15 on mobile. |
| `backgroundColor` | `string` | `'#1C89FF'` | Canvas fill. |
| `colors` | `string[]` | built-in set | Blob colors; the shared palette wins when present. |

### `wavesConfig` (`waves` — Canvas2D)

Layered sine waves, optionally rotated.

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `layers` | `number` | `3` | Number of overlapping wave layers. |
| `waveHeight` | `number` | `0.05` | Amplitude as a fraction of height. Audio-reactive. |
| `waveFrequency` | `number` | `2` | Frequency multiplier. Audio-reactive. |
| `rotation` | `number` | `0` | Canvas rotation (degrees). |
| `speed` | `number` | `0.5` | Animation speed. Audio-reactive. |
| `blur` | `number` | `40` | Blur (px); above 20 the renderer coarsens steps for performance. |
| `phaseOffset` | `number` | `0` | Per-layer phase shift. Mouse-reactive. |
| `colors` | `string[]` | built-in set | Layer colors; the shared palette wins when present. |

### `ribbonConfig` (`ribbon` — WebGL)

Flowing 3D ribbons.

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `ribbonCount` | `number` | `5` | Parallel ribbons, clamped to 2–10. |
| `amplitude` | `number` | — | Wave amplitude. Audio-reactive. |
| `noise` | `number` | — | Noise distortion strength. Audio-reactive. |
| `speed` | `number` | — | Flow speed. Mouse-reactive. |
| `spread` | `number` | — | Vertical spacing between ribbons. |
| `rotation` | `number` | — | Diagonal sweep angle (degrees). |
| `taper` | `number` | `0` | −1 to 1: > 0 bulges the center, < 0 pinches it. Audio-reactive. |
| `thickness` | `number` | — | Ribbon thickness. |
| `opacity` | `number` | — | Ribbon transparency (0–1). |
| `backgroundColor` | `string` | `'#ffffff'` | Scene background. |

### `dandelionConfig` (`dandelion` — WebGL)

Lines radiating from a center point, like a dandelion seed head.

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `lineCount` | `number` | — | Radiating lines (up to ~3000). |
| `radiusMin` / `radiusMax` | `number` | — | Line length range. |
| `speed` | `number` | `0.3` | Rotation speed. Audio-reactive. |
| `spread` | `number` | `0.3` | Polar angle range (0–1). |
| `thickness` | `number` | `1.5` | Line thickness. |
| `dotSize` | `number` | `3` | Tip sphere size. |
| `lineOpacity` | `number` | `0.8` | Line transparency. |
| `centerY` | `number` | `0.85` | Center's vertical position (fraction of height). |
| `radialGradientColors` / `radialGradientStops` | `string[]` / `number[]` | palette / `[0, 100]` | Background radial gradient. |
| `radialGradientCenter` / `radialGradientOuter` | `string` | palette ends | Gradient center/outer colors. |
| `gradientEndX` / `gradientEndY` | `number` | `100` | Gradient extent (%). |

Mouse repels lines within a radius around the cursor.

### `particleRingConfig` (`particleRing` — WebGL)

A tilted ring of orbiting, pulsing particles.

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `particleCount` | `number` | — | Particles on the ring (up to ~2000). |
| `ringRadius` | `number` | — | Ring radius (normalized to viewport height). Audio-reactive. |
| `ringWidth` | `number` | — | Radial spread of particles. Audio-reactive. |
| `dispersion` | `number` | — | Random per-particle offset. |
| `rotationSpeed` | `number` | — | Orbit speed. Audio-reactive. |
| `particleSize` | `number` | — | Base particle scale. |
| `tiltX` / `tiltZ` | `number` | `0` | Ring tilt (degrees). Mouse-reactive. |
| `radialGradientColors` / `radialGradientStops` | `string[]` / `number[]` | palette / `[0, 100]` | Background radial gradient. |
| `radialGradientCenter` / `radialGradientOuter` | `string` | palette ends | Gradient center/outer colors. |
| `gradientEndX` / `gradientEndY` | `number` | `100` | Gradient extent (%). |

## `effectsConfig` — post-processing

Applied to every background. The filter stack (blur/saturation/contrast/
brightness/colorMap) becomes a CSS `filter` on the background wrapper —
except for `liquid`, which only honours `blur` (its shader grades color
itself).

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `blur` | `number` | `0` | Blur (px). |
| `saturation` | `number` | `100` | Percent; 100 = unchanged. |
| `contrast` | `number` | `100` | Percent. |
| `brightness` | `number` | `100` | Percent. |
| `colorMap` | `string` | `'none'` | Preset grade: `'sepia'`, `'cyberpunk'`, `'sunset'`, `'matrix'`, `'noir'`, `'vintage'`. |
| `texture` | `string` | `'none'` | Overlay pattern: `'grain'`, `'scanlines'`, `'dots'`, `'grid'`, `'diagonal'`. |
| `textureSize` | `number` | `20` | Pattern size (px). |
| `textureOpacity` | `number` | `0.5` | Pattern opacity (0–1). |
| `textureBlendMode` | `string` | `'overlay'` | Any CSS `mix-blend-mode`. |
| `vignetteIntensity` | `number` | `0` | Edge darkening (0–1). |
| `flutedGlass` | `object` | `{}` | See below — pro only. |

### `effectsConfig.flutedGlass` (pro only)

A WebGL "fluted glass" refraction overlay. Only renders when a glass overlay
is registered — i.e. with `@aura/headers-pro`; other packages silently ignore
it.

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `false` | Toggle the overlay. |
| `segments` | `number` | `80` | Vertical glass flutes. |
| `rotation` | `number` | `0` | Flute angle (degrees). |
| `motionValue` | `number` | `0.5` | Base position of the animated wave (0–1). |
| `motionSpeed` | `number` | `0.5` | Wave animation speed. |
| `distortionStrength` | `number` | `0.02` | Refraction amplitude. |
| `waveFrequency` | `number` | `1` | Wave frequency. |
| `overlayOpacity` | `number` | `0` | Highlight overlay opacity (0–100). |

## `tessellationConfig` — icon overlay

A repeating grid of icons above the background (hidden by the `hideIcons`
prop).

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `false` | Toggle the layer. |
| `icon` | `string` | `'Star'` | Icon name from the built-in set (e.g. `'Heart'`, `'Diamond'`, `'Circle'`). |
| `rowGap` / `colGap` | `number` | — | Grid spacing (px). |
| `size` | `number` | — | Icon size (px). |
| `opacity` | `number` | — | Icon opacity (0–1). |
| `rotation` | `number` | `0` | Base rotation (degrees). |
| `color` | `string` | `'#ffffff'` | Icon fill. |
| `mouseRotationInfluence` | `number` | `0` | 0–1: icons near the cursor rotate toward it (300 px falloff). |

## Text layer

Hidden by the `hideText` prop. `textConfig` controls the layer; `textSections`
holds the lines; `textGap` spaces them.

```json
{
  "textConfig": { "enabled": true, "color": "#ffffff", "opacity": 1 },
  "textGap": 20,
  "textSections": [
    { "id": "t1", "text": "Beautiful Headers", "size": 64, "weight": 700, "font": "sans-serif" },
    { "id": "t2", "text": "Animated with Aura", "size": 28, "italic": true, "font": "serif" }
  ]
}
```

Each section:

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` | — | Unique key. |
| `text` | `string` | — | Content. |
| `size` | `number` | — | Font size (px); scaled down responsively on small screens. |
| `weight` | `number` | `400` | 100–900. |
| `italic` | `boolean` | `false` | |
| `spacing` | `number` | `0` | Letter spacing (em). |
| `font` | `string` | `'sans-serif'` | `'sans-serif'`, `'serif'`, `'mono'`, or `'scribble'`. |

## Interaction fields

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `mouseConfig.enabled` | `boolean` | `true` | Scene-level mouse toggle. |
| `mouseConfig.intensity` | `number` | `0.5` | Mouse effect strength (0–1). |
| `inputEnabled` | `boolean` | `true` | Master switch; `false` makes the scene inert regardless of the `input` prop. |

What mouse and microphone input actually modulate per background is documented
in [Interactions](./interactions.md).

## Complete example

```json
{
  "backgroundType": "waves",
  "inputEnabled": true,
  "gradientConfig": {
    "colors": ["#06b6d4", "#a855f7", "#ec4899", "#3b82f6"],
    "colorStops": [0, 33, 66, 100]
  },
  "wavesConfig": {
    "layers": 4,
    "waveHeight": 0.07,
    "waveFrequency": 2,
    "speed": 0.4,
    "blur": 30,
    "rotation": 8
  },
  "effectsConfig": {
    "saturation": 110,
    "brightness": 102,
    "texture": "grain",
    "textureOpacity": 0.35,
    "vignetteIntensity": 0.15
  },
  "textConfig": { "enabled": true, "color": "#ffffff", "opacity": 0.95 },
  "textGap": 16,
  "textSections": [
    { "id": "title", "text": "Make it move", "size": 56, "weight": 700, "font": "sans-serif" }
  ],
  "mouseConfig": { "enabled": true, "intensity": 0.6 },
  "themeOverrides": {
    "light": {
      "gradientConfig": { "colors": ["#ecfeff", "#ede9fe", "#fce7f3", "#dbeafe"] },
      "effectsConfig": { "vignetteIntensity": 0.05 },
      "textConfig": { "color": "#111111" }
    }
  }
}
```
