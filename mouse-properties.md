# Mouse Properties by Layer

## Mouse Input System

- **Source:** `mousemove` event on window
- **Coordinates:** Normalized to `[0, 1]` where `(0.5, 0.5)` is center
- **Throttling:** RAF-throttled (max 60fps)
- **Config:** `mouseConfig.enabled` (toggle), `mouseConfig.intensity` (0–1 multiplier)
- **Exclusivity:** Disabled when audio is active (mutually exclusive)
- **Centralized mapping:** `src/mouse/mouseMappings.js` (data) + `src/mouse/applyMouseEffect.js` (helpers)

---

## Layer Mouse Mappings

### GradientLayer (Liquid) — Shader UV distortion

- `u_mouse`
  - Input: Smoothed mouse position (lerp factor: `1 - decaySpeed`)
  - Effect: Exponential distance falloff UV distortion (`exp(-dist * 1.5)`)
  - Strength: `mouseInfluence × mouseIntensity`
  - Disabled when audio active

### AuroraLayer — Line spawn targeting

- `width`
  - Input: Smoothed mouse position (lerp factor: `1 - decaySpeed`)
  - Effect: Prepared but not visually applied to line positions

### TessellationLayer — Icon rotation toward cursor

- `rotation`
  - Input: Smoothed mouse position (lerp factor: `0.1`)
  - Effect: `atan2(dy, dx)` angle from icon to cursor with linear distance falloff (300px radius)
  - Strength: `mouseRotationInfluence × mouseIntensity`

### DandelionLayer — Line repulsion from cursor

- `direction`
  - Input: Window-level NDC mouse position (lerp factor: `0.05`)
  - Effect: Quadratic distance falloff repulsion (`strength² × 1.2`) within 0.35 NDC radius
  - Strength: `mouseIntensity`

### FluidGradientLayer — Circle position pull toward cursor

- `circleCenterX`, `circleCenterY`
  - Input: Smoothed mouse position (lerp factor: `0.08`)
  - Effect: Offsets all circle centers by `(mouse - 0.5) × intensity × 0.15 × canvasSize`
  - Strength: `mouseIntensity × 0.15`

### WavesLayer — Wave phase shift from cursor X

- `layerPhase`
  - Input: Smoothed mouse X position (lerp factor: `0.08`)
  - Effect: Adds `(mouseX - 0.5) × mouseIntensity × π` to each wave layer's phase
  - Strength: `mouseIntensity × π`

### RibbonLayer — Amplitude modulation from cursor Y

- `speed`
  - Input: Smoothed mouse Y position (lerp factor: `0.08`)
  - Effect: Multiplies amplitude by `1 + (mouseY - 0.5) × mouseIntensity × 0.5`
  - Strength: `mouseIntensity × 0.5`
  - Only active when audio is inactive

### ParticleRingLayer — Ring tilt toward cursor

- `tiltX`, `tiltZ`
  - Input: Smoothed mouse position (lerp factor: `0.08`)
  - Effect: Adds `(mouse - 0.5) × mouseIntensity × 0.4` radians to config tilt values
  - Strength: `mouseIntensity × 0.4`

### ShapeTrailLayer — Trail center offset toward cursor

- `centerX`, `centerY`
  - Input: Smoothed mouse position (lerp factor: `0.08`)
  - Effect: Offsets trail pivot center by `(mouse - 0.5) × mouseIntensity × 0.15 × canvasSize`
  - Strength: `mouseIntensity × 0.15`

### Non-mouse-reactive Layers

- **SimpleGradientLayer** — No mouse reactivity
- **EffectsLayer** — No mouse reactivity
- **TextLayer** — No mouse reactivity
