// Generate the 8 DECONFLICT Aura-background scenes from the aura-background spec.
// Key fact learned from the renderers (App.jsx / SceneViewPage / SceneEmbedPage):
// every layer is mounted with paletteColors={gradientConfig.colors}, so
// gradientConfig.colors is the MASTER color array for ALL types.
//   - waves:        colors[0] = background, colors[1..] = line layers
//   - ribbon:       ribbon sheet colors come from the palette array
//   - aurora:       hues derived from palette (we also pin hueStart/hueEnd 200-280)
//   - particleRing: particles from palette; bg disc from radialGradientColors/backgroundColor
//   - liquid:       blob colors from blobConfig.colors (set both, belt-and-suspenders)
// We clone a real working scene per type so every required sub-field is present.

import fs from 'node:fs'

const PROJECT_ID = 'd898af6c-131c-47e8-9394-45bde843518c'
const all = JSON.parse(fs.readFileSync('scenes_export_light.json', 'utf8'))
const template = (type) =>
  JSON.parse(JSON.stringify(all.find((x) => x.scene_data && x.scene_data.backgroundType === type).scene_data))

// ---- Deconflict palette (locked, no orange) ----
const C = {
  frost: '#F4F6FA', frost2: '#E9EEF6', frost3: '#DCE2EC', paper: '#FFFFFF',
  navy: '#13294B', ink: '#0B1B33',
  cobalt: '#2E54E8', cobalt2: '#5B7BF0', violet: '#6D5BE8', silver: '#C9D2E8',
}
const PAL = {
  cobalt: { cobalt: { '50': '#eef2ff', '100': '#dbe3ff', '200': '#bccaff', '300': '#92a8ff',
    '400': '#5B7BF0', '500': '#2E54E8', '600': '#1f3fc4', '700': '#1b34a0', '800': '#192d80',
    '900': '#13294B', '950': '#0B1B33' }, white: '#fff', black: '#0B1B33' },
  frost: { frost: { '50': '#ffffff', '100': '#F4F6FA', '200': '#E9EEF6', '300': '#DCE2EC',
    '400': '#B9C4D6', '500': '#8A98B0', '600': '#5A6B85', '700': '#33455f', '800': '#1d3050',
    '900': '#13294B', '950': '#0B1B33' }, white: '#fff', black: '#0B1B33' },
  violet: { violet: { '50': '#f1efff', '100': '#e3e0ff', '200': '#ccc6ff', '300': '#ada3ff',
    '400': '#8a7cf0', '500': '#6D5BE8', '600': '#5a45cf', '700': '#4a37a8', '800': '#352778',
    '900': '#13294B', '950': '#0B1B33' }, white: '#F4F6FA', black: '#000' },
}

const stops = (n) => Array.from({ length: n }, (_, i) => Math.round((i / (n - 1)) * 100))

function effects({ blur, texture = 'none', textureSize = 30, textureOpacity = 0, blend = 'overlay',
  contrast = 100, brightness = 100, saturation = 100, vignette = 0, fluted }) {
  return { blur, texture, textureSize, textureOpacity, textureBlendMode: blend, colorMap: 'none',
    contrast, brightness, saturation, vignetteIntensity: vignette,
    flutedGlass: fluted ?? { enabled: false, rotation: 87, segments: 84, motionSpeed: 1,
      motionValue: 0, waveFrequency: 1, overlayOpacity: 11, distortionStrength: 0 } }
}

// Build one scene: clone template, set MASTER gradientConfig.colors, recolor every block.
function build(spec) {
  const sd = template(spec.type)
  const colors = spec.colors
  // MASTER driver — what the renderers actually read as paletteColors
  sd.gradientConfig = { ...(sd.gradientConfig || {}), colors: [...colors],
    numColors: colors.length, colorStops: stops(colors.length), useGradientColors: true }
  // recolor every config block so no off-palette/orange survives anywhere
  for (const k of ['blobConfig', 'fluidConfig', 'wavesConfig', 'auroraConfig', 'ribbonConfig',
    'dandelionConfig', 'shapeTrailConfig', 'particleRingConfig']) {
    if (!sd[k]) continue
    if (Array.isArray(sd[k].colors)) sd[k].colors = [...colors]
    if ('backgroundColor' in sd[k]) sd[k].backgroundColor = spec.bg
    if (sd[k].radialGradientColors) sd[k].radialGradientColors = [spec.bg, C.ink]
  }
  if (sd.tessellationConfig) sd.tessellationConfig.color = C.cobalt
  // type-specific knob overrides from the spec
  Object.assign(sd[{ waves: 'wavesConfig', simple: 'gradientConfig', particleRing: 'particleRingConfig',
    ribbon: 'ribbonConfig', liquid: 'blobConfig', aurora: 'auroraConfig' }[spec.type]], spec.cfg || {})
  if (spec.radial && sd.particleRingConfig) {
    sd.particleRingConfig.radialGradientColors = spec.radial
    sd.particleRingConfig.radialGradientStops = [0, 100]
  }
  sd.effectsConfig = effects(spec.fx)
  sd.textConfig = { color: spec.text, enabled: true, opacity: spec.bg === C.frost ? 1 : 0.95 }
  sd.colorPalette = PAL[spec.palette]
  delete sd.themeOverrides
  delete sd.audioConfig
  sd.inputEnabled = false
  sd.textSections = []
  sd.textGap = sd.textGap ?? 16
  sd.selectedProjectIds = []
  sd.tags = spec.tags
  return { title: spec.title, short_description: spec.short, long_description: spec.long, scene_data: sd }
}

const specs = [
  // ===== 1. INTAGLIO REVIVAL =====
  { type: 'waves', title: 'Waves Engraved Navy Banknote Lines',
    short: 'Fine parallel navy line-field on frost, evoking banknote engraving.',
    long: 'Many thin navy/cobalt wave layers on a frost field — the parallel-line engraving substrate (spec 1.1). Carries the vector intaglio print on top via multiply.',
    colors: [C.frost, C.navy, C.cobalt, C.cobalt2], bg: C.frost, palette: 'cobalt',
    cfg: { blur: 14, speed: 0.25, layers: 7, rotation: 24, waveHeight: 0.03, phaseOffset: 0, waveFrequency: 3, useGradientColors: true },
    fx: { blur: 3, texture: 'grain', textureSize: 28, textureOpacity: 46, contrast: 106, brightness: 100, saturation: 92, vignette: 24 },
    text: C.navy, tags: ['waves', 'navy', 'intaglio', 'engraving', 'banknote', 'header'] },

  { type: 'simple', title: 'Simple Frost Engraved Paper Substrate',
    short: 'Subtle currency-paper grain for engraved security-print overlays.',
    long: 'Flat frost gradient + grain + light vignette — the safest text-friendly base to overlay crisp SVG intaglio/guilloché (spec 1.2). No fluted glass.',
    colors: [C.frost, C.frost2, C.frost], bg: C.frost, palette: 'frost',
    cfg: { useGradientColors: true },
    fx: { blur: 3, texture: 'grain', textureSize: 30, textureOpacity: 52, contrast: 102, brightness: 100, saturation: 96, vignette: 22 },
    text: C.navy, tags: ['simple', 'frost', 'intaglio', 'paper', 'accessible', 'substrate'] },

  // ===== 2. GUILLOCHÉ / SECURITY DOCUMENT =====
  { type: 'particleRing', title: 'ParticleRing Guilloche Frost Security Medallion',
    short: 'Faint concentric medallion motion behind crisp vector guilloché.',
    long: 'Concentric radial particle motion echoes a rosette without trying to be one; fluted glass adds behind-security-glass depth (spec 2.1). Keep it quiet under the vector lacework.',
    colors: [C.cobalt, C.cobalt2, C.violet, C.navy], bg: C.frost, palette: 'cobalt',
    cfg: { speed: 0.3, useGradientColors: true }, radial: [C.frost, C.frost3],
    fx: { blur: 6, texture: 'none', contrast: 104, brightness: 102, saturation: 100, vignette: 28,
      fluted: { enabled: true, rotation: 60, segments: 80, motionSpeed: 0.8, motionValue: 1, waveFrequency: 1, overlayOpacity: 12, distortionStrength: 0.04 } },
    text: C.ink, tags: ['particleRing', 'cobalt', 'guilloche', 'medallion', 'security', 'backdrop'] },

  { type: 'waves', title: 'Waves Lathe Frost Security Tint',
    short: 'Whisper-quiet animated lathe-work tint for document backgrounds.',
    long: 'Low-amplitude waves at low contrast = the faint lathe-work tint printed across a certificate (spec 2.2). Sits full-bleed behind document content with vector guilloché frames on top.',
    colors: [C.frost, C.navy, C.cobalt, C.navy], bg: C.frost, palette: 'cobalt',
    cfg: { blur: 18, speed: 0.18, layers: 6, rotation: 12, waveHeight: 0.02, phaseOffset: 1.1, waveFrequency: 4, useGradientColors: true },
    fx: { blur: 4, texture: 'none', contrast: 98, brightness: 102, saturation: 88, vignette: 18 },
    text: C.navy, tags: ['waves', 'navy', 'guilloche', 'lathe', 'tint', 'subtle'] },

  { type: 'particleRing', title: 'ParticleRing Guilloche Navy Sealed Medallion',
    short: 'Dark premium medallion backdrop for a sealed-document hero.',
    long: 'The medallion idea, dark and richer, for a premium fold (spec 2.3). Print the vector seal in frost/silver on top via screen. Drop fluted segments to 48 on mobile.',
    colors: [C.cobalt, C.cobalt2, C.violet, C.silver], bg: C.ink, palette: 'cobalt',
    cfg: { speed: 0.32, useGradientColors: true }, radial: [C.navy, C.ink],
    fx: { blur: 8, texture: 'grain', textureSize: 32, textureOpacity: 38, contrast: 110, brightness: 98, saturation: 104, vignette: 34,
      fluted: { enabled: true, rotation: 66, segments: 88, motionSpeed: 0.9, motionValue: 1.4, waveFrequency: 1.2, overlayOpacity: 14, distortionStrength: 0.06 } },
    text: C.frost, tags: ['particleRing', 'navy', 'guilloche', 'seal', 'cinematic', 'hero'] },

  // ===== 3. TACTILE SECURITY MATERIALS =====
  { type: 'ribbon', title: 'Ribbon Foil Cobalt Holographic Security',
    short: 'Cursor-reactive cobalt–violet foil shimmer for premium headers.',
    long: 'Flowing cobalt→violet→silver ribbon sheets under fluted glass on a frost substrate — the foil/holographic material (spec 3.1). Text over foil needs a frost scrim.',
    colors: [C.cobalt, C.cobalt2, C.violet, C.silver], bg: C.frost, palette: 'cobalt',
    cfg: { rotation: 50, ribbonCount: 3, opacity: 0.5, useGradientColors: true },
    fx: { blur: 6, texture: 'none', contrast: 108, brightness: 102, saturation: 110, vignette: 22,
      fluted: { enabled: true, rotation: 62, segments: 84, motionSpeed: 0.9, motionValue: 1.5, waveFrequency: 1.2, overlayOpacity: 14, distortionStrength: 0.06 } },
    text: C.ink, tags: ['ribbon', 'cobalt', 'foil', 'premium', 'security', 'header'] },

  { type: 'liquid', title: 'Liquid Metallic Navy Molten Foil Cinematic',
    short: 'Dark molten-metal hero for the landing fold.',
    long: 'Navy→cobalt→silver metaballs + fluted glass + grain on deep ink (spec 3.2). Desktop-first; below 768px drop fluted segments to 48 or disable.',
    colors: [C.navy, C.cobalt, C.cobalt2, C.silver, C.violet], bg: C.ink, palette: 'cobalt',
    cfg: { speed: 0.4, blobCount: 5, maxRadius: 130, minRadius: 45, threshold: 180, blurAmount: 12,
      decaySpeed: 0.95, orbitRadius: 160, mouseInfluence: 0.35, useGradientColors: true },
    fx: { blur: 10, texture: 'grain', textureSize: 32, textureOpacity: 40, contrast: 112, brightness: 98, saturation: 105, vignette: 36,
      fluted: { enabled: true, rotation: 70, segments: 90, motionSpeed: 1.1, motionValue: 1.8, waveFrequency: 1.4, overlayOpacity: 16, distortionStrength: 0.08 } },
    text: C.frost, tags: ['liquid', 'navy', 'molten-foil', 'cinematic', 'hero', 'premium'] },

  { type: 'aurora', title: 'Aurora Holographic Navy Iridescent Shimmer',
    short: 'Cool iridescent light shimmer for a holographic foil hero.',
    long: 'Cool light-ribbons (hue 218–262°, never toward orange) for a holographic foil glow (spec 3.3). Fluted glass + grain. Desktop-first.',
    colors: [C.cobalt, C.violet, C.cobalt2, C.silver], bg: C.ink, palette: 'violet',
    cfg: { hueStart: 218, hueEnd: 262, maxTTL: 50, minTTL: 190, maxWidth: 10, minWidth: 95,
      lineCount: 0, maxHeight: 50, minHeight: 900, blurAmount: 14, decaySpeed: 0.95, useGradientColors: true },
    fx: { blur: 14, texture: 'grain', textureSize: 30, textureOpacity: 38, contrast: 110, brightness: 100, saturation: 112, vignette: 36,
      fluted: { enabled: true, rotation: 64, segments: 80, motionSpeed: 1, motionValue: 1.6, waveFrequency: 1.3, overlayOpacity: 15, distortionStrength: 0.07 } },
    text: C.frost, tags: ['aurora', 'violet', 'holographic', 'iridescent', 'shimmer', 'hero'] },
]

const scenes = specs.map(build)
fs.writeFileSync('deconflict-aura-scenes-payload.json',
  JSON.stringify({ projectId: PROJECT_ID,
    _note: 'DECONFLICT Aura-background scenes (aura-background spec, 8 scenes across Intaglio/Guilloche/Tactile). Master color = gradientConfig.colors. Password injected at POST time.',
    scenes }, null, 2))
console.log(`Wrote ${scenes.length} scenes -> deconflict-aura-scenes-payload.json`)
