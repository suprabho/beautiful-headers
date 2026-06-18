# Scene Configuration Schema — Full Reference

## Top-Level Scene Object

```json
{
  "id": "UUID string",
  "title": "string — human-readable scene name",
  "slug": "string — URL-safe identifier",
  "short_description": "string — 1 sentence",
  "long_description": "string — 1-3 sentences, can include markdown",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp",
  "thumbnail": "string — URL or base64",
  "scene_data": { /* see below */ }
}
```

## scene_data Object

```json
{
  "backgroundType": "liquid | fluid | ribbon | aurora | waves | dandelion | simple | particleRing",

  "blobConfig": { /* liquid type */ },
  "fluidConfig": { /* fluid type */ },
  "wavesConfig": { /* waves type */ },
  "auroraConfig": { /* aurora type */ },
  "ribbonConfig": { /* ribbon type */ },
  "dandelionConfig": { /* dandelion type */ },
  "particleRingConfig": { /* particleRing type */ },
  "shapeTrailConfig": { /* alternate particleRing config */ },
  "tessellationConfig": { /* simple type tessellation variant */ },
  "gradientConfig": { /* simple type gradient variant */ },

  "effectsConfig": { /* global effects layer */ },
  "textConfig": { /* text overlay settings */ },
  "colorPalette": { /* named color palette with shades */ },
  "textSections": [ /* positioned text blocks */ ],
  "textGap": "number — spacing between text sections",
  "selectedProjectIds": [ "UUID strings" ]
}
```

Note: ALL type-specific configs are present in every scene (they hold defaults). Only the config matching `backgroundType` is actively rendered.

## Type-Specific Configs

### blobConfig (liquid)
| Field | Type | Range | Typical | Description |
|-------|------|-------|---------|-------------|
| speed | number | 0.1-1.0 | 0.5 | Animation speed |
| colors | hex[] | 3-5 colors | 3 | Blob gradient colors |
| blobCount | number | 2-10 | 5 | Number of blobs |
| maxRadius | number | 50-200 | 120 | Maximum blob radius (px) |
| minRadius | number | 20-100 | 40 | Minimum blob radius (px) |
| threshold | number | 100-255 | 180 | Metaball threshold |
| blurAmount | number | 5-30 | 12 | Internal blur |
| decaySpeed | number | 0.8-0.99 | 0.95 | Animation decay rate |
| orbitRadius | number | 50-300 | 150 | Orbital motion radius |
| mouseInfluence | number | 0-1 | 0.3 | Mouse interaction strength |
| backgroundColor | hex | — | #152a8e | Background color |
| useGradientColors | boolean | — | true | Use gradient vs flat colors |

### fluidConfig (fluid)
| Field | Type | Range | Typical | Description |
|-------|------|-------|---------|-------------|
| speed | number | 0.3-1.0 | 0.8 | Flow animation speed |
| colors | hex[] | 3-5 colors | 4 | Fluid gradient colors |
| intensity | number | 1.0-3.0 | 2.2 | Flow intensity |
| blurAmount | number | 20-50 | 39 | Fluid blur (high is normal) |
| backgroundColor | hex | — | #1C89FF | Background color |
| useGradientColors | boolean | — | true | Gradient mode |

### wavesConfig (waves)
| Field | Type | Range | Typical | Description |
|-------|------|-------|---------|-------------|
| blur | number | 10-60 | 40 | Wave blur |
| speed | number | 0.2-1.0 | 0.5 | Wave animation speed |
| colors | hex[] | 3-5 colors | 4 | Wave gradient colors |
| layers | number | 2-8 | 5 | Number of wave layers |
| rotation | number | 0-360 | 0 | Wave rotation degrees |
| waveHeight | number | 0.02-0.15 | 0.05 | Wave amplitude |
| phaseOffset | number | 0-6.28 | 0 | Phase offset (radians) |
| waveFrequency | number | 1-5 | 2 | Wave frequency |
| useGradientColors | boolean | — | true | Gradient mode |

### auroraConfig (aurora)
| Field | Type | Range | Typical | Description |
|-------|------|-------|---------|-------------|
| hueStart | number | 0-360 | 120 | Starting hue (degrees) |
| hueEnd | number | 0-360 | 180 | Ending hue (degrees) |
| maxTTL | number | 10-100 | 50 | Max time-to-live |
| minTTL | number | 50-300 | 190 | Min time-to-live |
| maxWidth | number | 5-50 | 10 | Max line width |
| minWidth | number | 20-150 | 95 | Min line width |
| lineCount | number | 0-10 | 0 | Active line count |
| maxHeight | number | 20-200 | 50 | Max height |
| minHeight | number | 200-1000 | 900 | Min height |
| blurAmount | number | 5-30 | 13 | Aurora blur |
| decaySpeed | number | 0.8-0.99 | 0.95 | Decay rate |
| backgroundColor | hex | — | #000000 | Background (usually black) |
| useGradientColors | boolean | — | true | Gradient mode |

### ribbonConfig (ribbon)
| Field | Type | Range | Typical | Description |
|-------|------|-------|---------|-------------|
| noise | number | 0-1 | 0 | Noise distortion |
| speed | number | 0.1-1.0 | 0.4 | Animation speed |
| taper | number | -1 to 1 | -0.1 | Ribbon taper amount |
| spread | number | 0.1-1.0 | 0.5 | Ribbon spread |
| opacity | number | 0.1-1.0 | 0.65 | Ribbon opacity |
| rotation | number | 0-360 | 40 | Rotation angle |
| ribbonCount | number | 1-8 | 3 | Number of ribbons |
| colorCycleSpeed | number | 0-2 | 1.5 | Color cycling speed |
| enableHoverEffect | boolean | — | true | Mouse hover interaction |
| backgroundColor | hex | — | #ffffff | Background (usually white) |
| useGradientColors | boolean | — | true | Gradient mode |

### dandelionConfig (dandelion)
| Field | Type | Range | Typical | Description |
|-------|------|-------|---------|-------------|
| backgroundColor | hex | — | #e8f4fc | Warm/light background |
| (other params vary by scene) | | | | |

### particleRingConfig (particleRing)
| Field | Type | Range | Typical | Description |
|-------|------|-------|---------|-------------|
| backgroundColor | hex | — | #fef6f9 | Light pink background |
| (other params vary by scene) | | | | |

## effectsConfig (Global Effects Layer)

| Field | Type | Range | Default | Description |
|-------|------|-------|---------|-------------|
| blur | number | 0-30 | ~5 | Global blur |
| texture | enum | grain/scanlines/diagonal/dots/grid/none | none | Texture overlay |
| colorMap | enum | none/vintage/sunset/cyberpunk/matrix/sepia/noir | none | Color remapping |
| contrast | number | 0-200 | 100 | Contrast (100 = neutral) |
| brightness | number | 0-200 | 100 | Brightness (100 = neutral) |
| saturation | number | 0-200 | 100 | Saturation (100 = neutral) |
| textureSize | number | 5-100 | 30 | Texture pattern size |
| textureOpacity | number | 0-100 | 0 | Texture overlay opacity |
| textureBlendMode | enum | overlay/multiply/screen/etc | overlay | Blend mode |
| vignetteIntensity | number | 0-100 | 0 | Edge darkening (0=off) |
| flutedGlass.enabled | boolean | — | false | Glass refraction toggle |
| flutedGlass.rotation | number | 0-360 | 87 | Glass angle |
| flutedGlass.segments | number | 10-200 | 140 | Glass segments |
| flutedGlass.motionSpeed | number | 0-5 | 1 | Glass motion |
| flutedGlass.motionValue | number | 0-10 | 0 | Motion amount |
| flutedGlass.waveFrequency | number | 0-10 | 1 | Wave freq |
| flutedGlass.overlayOpacity | number | 0-100 | 11 | Overlay opacity |
| flutedGlass.distortionStrength | number | 0-1 | 0 | Distortion amount |

## textConfig

| Field | Type | Range | Default | Description |
|-------|------|-------|---------|-------------|
| color | hex | — | #faff00 | Text color |
| enabled | boolean | — | true | Show text overlay |
| opacity | number | 0-1 | ~0.82 | Text opacity |

## colorPalette

Named color palette object with a base color name (e.g. "lime", "sky", "amber") containing shades:

```json
{
  "lime": {
    "50": "#f9fec7",
    "100": "#faff00",
    "200": "#f6e900",
    "300": "#ffc000",
    "400": "#fd9b00",
    "500": "#c1b500",
    "600": "#67d500",
    "700": "#22c100",
    "800": "#149a00",
    "900": "#2f7100",
    "950": "#254000"
  },
  "black": "#000",
  "white": "#fff"
}
```

Most common palette names across catalog: amber (202), indigo (202), orange (207), blue (199), red (198), pink (198), sky (193), purple (194), green (192), teal (192), cyan (190), yellow (190), gray (190).
