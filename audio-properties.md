# Audio Properties by Layer

## Frequency Bands

- **Bass** — 0–250 Hz (50% weight in amplitude)
- **Mid** — 250–4,000 Hz (35% weight in amplitude)
- **Treble** — 4,000–16,000 Hz (15% weight in amplitude)
- **Amplitude** — Combined: bass×0.5 + mid×0.35 + treble×0.15

All values normalized to `0–1` with exponential smoothing.

---

## Layer Audio Mappings

### GradientLayer (Liquid) — Direct access

- `waveIntensity`
  - Band: Bass
  - Modifier: +bass × 0.5
- `wave1Speed`
  - Band: Mid
  - Modifier: +mid × 0.3
- `wave2Speed`
  - Band: Treble
  - Modifier: +treble × 0.2
- `mouseInfluence`
  - Forced to 0 when audio active

### AuroraLayer — Modulated config

- `width`
  - Band: Amplitude
  - Modifier: +amplitude × 10

### FluidGradientLayer — Modulated config

- `speed`
  - Band: Amplitude
  - Modifier: +amplitude × 2
- `intensity`
  - Band: Treble
  - Modifier: +treble × 3

### WavesLayer — Modulated config

- `waveHeight`
  - Band: Bass
  - Modifier: +bass × 0.08
- `waveFrequency`
  - Band: Amplitude
  - Modifier: +amplitude × 4
- `speed`
  - Band: Treble
  - Modifier: +treble × 1.5

### RibbonLayer — Direct access

- `amplitude`
  - Band: Amplitude
  - Modifier: ×(1 + amplitude × 1.5)
- `noise`
  - Band: Mid
  - Modifier: ×(1 + mid × 1.0)
- `taper`
  - Band: Treble
  - Modifier: ×(1 + treble × 1.0)

### DandelionLayer — Direct access

- `speed`
  - Band: Treble
  - Modifier: +treble × 1.5
- `spread`
  - Band: Amplitude
  - Modifier: +amplitude × 20

### ParticleRingLayer — Direct access

- `speed`
  - Band: Treble
  - Modifier: +treble × 1.5
- `ringRadius`
  - Band: Amplitude
  - Modifier: +amplitude × 0.25
- `ringWidth`
  - Band: Bass
  - Modifier: +bass × 0.1

### ShapeTrailLayer — Modulated config

- `speed`
  - Band: Amplitude
  - Modifier: +amplitude × 1.0
- `opacity`
  - Band: Bass
  - Modifier: +bass × 0.3

### TessellationLayer — Direct access

- `rotation`
  - Band: Amplitude
  - Modifier: +amplitude × π radians (up to 180° at full amplitude)

### Non-reactive Layers

- **SimpleGradientLayer** — No audio reactivity
- **EffectsLayer** — No audio reactivity
- **TextLayer** — No audio reactivity
