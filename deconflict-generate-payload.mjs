// Generate the 15 DECONFLICT "Tactile Security Materials" scenes by cloning real
// working scenes per type and recoloring with the Deconflict palette.
// Why clone real scenes: the renderer reads colors from specific fields
// (ribbon -> gradientConfig.colors, simple -> full gradientConfig, liquid -> blobConfig.colors)
// and every scene carries ALL config blocks. Building from a known-good template
// guarantees the required structure is present and nothing renders colorless.

import fs from 'node:fs'

const PROJECT_ID = 'd898af6c-131c-47e8-9394-45bde843518c'
const all = JSON.parse(fs.readFileSync('scenes_export_light.json', 'utf8'))

const template = (type) => {
  const s = all.find((x) => x.scene_data && x.scene_data.backgroundType === type)
  return JSON.parse(JSON.stringify(s.scene_data)) // deep clone
}

// ---- Deconflict palette (locked, no orange) ----
const C = {
  frost: '#F4F6FA', frost2: '#E9EEF6', frost3: '#DCE2EC',
  navy: '#13294B', navyDeep: '#0B1B33',
  cobalt: '#2E54E8', cobalt2: '#5B7BF0', violet: '#6D5BE8', silver: '#C9D2E8',
}
const cobaltPalette = {
  cobalt: { '50': '#eef2ff', '100': '#dbe3ff', '200': '#bccaff', '300': '#92a8ff',
    '400': '#5B7BF0', '500': '#2E54E8', '600': '#1f3fc4', '700': '#1b34a0',
    '800': '#192d80', '900': '#13294B', '950': '#0B1B33' },
  white: '#fff', black: '#0B1B33',
}
const frostPalette = {
  frost: { '50': '#ffffff', '100': '#F4F6FA', '200': '#E9EEF6', '300': '#DCE2EC',
    '400': '#B9C4D6', '500': '#8A98B0', '600': '#5A6B85', '700': '#33455f',
    '800': '#1d3050', '900': '#13294B', '950': '#0B1B33' },
  white: '#fff', black: '#0B1B33',
}

// Overwrite EVERY color-bearing field in a scene_data so no off-palette/orange
// color survives in any (active or inactive) config block.
function sanitizeColors(sd, { bg, neutralColors, palette, textColor }) {
  const setBg = (k) => { if (sd[k] && 'backgroundColor' in sd[k]) sd[k].backgroundColor = bg }
  const setColors = (k) => { if (sd[k] && Array.isArray(sd[k].colors)) sd[k].colors = [...neutralColors] }
  for (const k of ['blobConfig', 'fluidConfig', 'wavesConfig', 'auroraConfig', 'ribbonConfig',
    'gradientConfig', 'dandelionConfig', 'shapeTrailConfig', 'particleRingConfig']) {
    setBg(k); setColors(k)
  }
  if (sd.dandelionConfig?.radialGradientColors) sd.dandelionConfig.radialGradientColors = [C.silver, C.cobalt2]
  if (sd.particleRingConfig?.radialGradientColors) sd.particleRingConfig.radialGradientColors = [C.silver, C.cobalt2]
  if (sd.tessellationConfig) sd.tessellationConfig.color = C.cobalt
  sd.textConfig = { ...(sd.textConfig || {}), color: textColor, enabled: true, opacity: bg === C.frost ? 1 : 0.95 }
  sd.colorPalette = palette
  // strip light-mode overrides + extras so base config renders exactly as set
  delete sd.themeOverrides
  delete sd.audioConfig
  sd.inputEnabled = false
  sd.textSections = []
  sd.textGap = sd.textGap ?? 16
  sd.selectedProjectIds = []
}

function effects({ blur, texture = 'none', textureSize = 30, textureOpacity = 0, blend = 'overlay',
  contrast = 100, brightness = 100, saturation = 100, vignette = 0, fluted }) {
  return {
    blur, texture, textureSize, textureOpacity, textureBlendMode: blend, colorMap: 'none',
    contrast, brightness, saturation, vignetteIntensity: vignette,
    flutedGlass: fluted ?? { enabled: false, rotation: 87, segments: 84, motionSpeed: 1,
      motionValue: 0, waveFrequency: 1, overlayOpacity: 11, distortionStrength: 0 },
  }
}

const scenes = []

// ============ RIBBON (foil/holographic) — driver: gradientConfig.colors ============
const ribbonVariants = [
  { title: 'Ribbon Foil Cobalt Holographic Security', short: 'Cursor-reactive cobalt–violet foil shimmer for premium Deconflict headers.',
    colors: [C.cobalt, C.cobalt2, C.violet, C.silver], rotation: 50, count: 3, opacity: 0.5,
    fg: { rotation: 62, segments: 84, distortion: 0.06, overlayOpacity: 14 }, sat: 110, vignette: 22,
    tags: ['ribbon', 'cobalt', 'foil', 'premium', 'security'] },
  { title: 'Ribbon Foil Violet Holographic Flip', short: 'Violet-forward foil with a strong holographic flip for hero CTAs.',
    colors: [C.violet, C.cobalt2, C.violet, C.silver], rotation: 78, count: 3, opacity: 0.55,
    fg: { rotation: 80, segments: 92, distortion: 0.1, overlayOpacity: 16 }, sat: 114, vignette: 24,
    tags: ['ribbon', 'violet', 'foil', 'holographic', 'security'] },
  { title: 'Ribbon Foil Silver Brushed Calm', short: 'Calm brushed-silver foil — softer cycle, text-friendly contrast.',
    colors: [C.silver, C.cobalt2, C.silver, C.cobalt], rotation: 45, count: 3, opacity: 0.45,
    fg: { rotation: 48, segments: 72, distortion: 0.04, overlayOpacity: 10 }, sat: 102, vignette: 18,
    tags: ['ribbon', 'silver', 'foil', 'brushed', 'subtle'] },
  { title: 'Ribbon Foil Security Thread Shimmer', short: 'Single high-opacity ribbon mimicking a banknote security thread.',
    colors: [C.cobalt, C.cobalt2, C.silver, C.violet], rotation: 60, count: 1, opacity: 0.7, spread: 1.2,
    fg: { rotation: 64, segments: 100, distortion: 0.07, overlayOpacity: 16 }, sat: 112, vignette: 20,
    tags: ['ribbon', 'thread', 'foil', 'security', 'single'] },
  { title: 'Ribbon Foil Cobalt Dense Intricate', short: 'Five-ribbon dense cobalt foil lacework for showcase headers.',
    colors: [C.cobalt, C.cobalt2, C.violet, C.silver], rotation: 88, count: 5, opacity: 0.55,
    fg: { rotation: 88, segments: 100, distortion: 0.09, overlayOpacity: 18 }, sat: 115, vignette: 26,
    tags: ['ribbon', 'cobalt', 'foil', 'intricate', 'dynamic'] },
]
for (const v of ribbonVariants) {
  const sd = template('ribbon')
  sanitizeColors(sd, { bg: C.frost, neutralColors: v.colors, palette: cobaltPalette, textColor: C.navyDeep })
  // ribbon driver = gradientConfig.colors
  sd.gradientConfig.colors = [...v.colors]
  sd.gradientConfig.numColors = v.colors.length
  sd.gradientConfig.colorStops = v.colors.map((_, i) => Math.round((i / (v.colors.length - 1)) * 100))
  // ribbon motion knobs (keep template-proven shape, vary a few)
  Object.assign(sd.ribbonConfig, {
    useGradientColors: true, rotation: v.rotation, ribbonCount: v.count, opacity: v.opacity,
    backgroundColor: C.frost,
  })
  if (v.spread != null) sd.ribbonConfig.spread = v.spread
  sd.effectsConfig = effects({ blur: 6, contrast: 108, brightness: 102, saturation: v.sat, vignette: v.vignette,
    fluted: { enabled: true, rotation: v.fg.rotation, segments: v.fg.segments, motionSpeed: 0.9,
      motionValue: 1.6, waveFrequency: 1.3, overlayOpacity: v.fg.overlayOpacity, distortionStrength: v.fg.distortion } })
  scenes.push({ title: v.title, short_description: v.short,
    long_description: `${v.short} Cobalt-family foil on a frost substrate (Deconflict Part 3).`,
    scene_data: { ...sd, tags: [...v.tags, 'header'] } })
}

// ============ SIMPLE (intaglio currency-paper substrate) — driver: gradientConfig ============
const simpleVariants = [
  { title: 'Simple Frost Intaglio Engraved Substrate', short: 'Subtle currency-paper grain for engraved security-print overlays.',
    colors: [C.frost, C.frost2, C.frost], grain: 28, op: 52, blend: 'overlay', vignette: 24, blur: 3, sat: 96,
    tags: ['simple', 'frost', 'intaglio', 'paper', 'accessible'] },
  { title: 'Simple Frost Heavy Grain Currency Paper', short: 'Heavier multiply grain for a tactile banknote-paper substrate.',
    colors: [C.frost, C.frost2, C.frost], grain: 32, op: 60, blend: 'multiply', vignette: 28, blur: 3, sat: 95,
    tags: ['simple', 'frost', 'intaglio', 'paper', 'grain'] },
  { title: 'Simple Frost Deep Relief Engraved Substrate', short: 'Deeper vignette relief for a pressed-plate intaglio feel.',
    colors: [C.frost, C.frost3, C.frost], grain: 26, op: 50, blend: 'overlay', vignette: 34, blur: 3, sat: 96,
    tags: ['simple', 'frost', 'intaglio', 'relief', 'vignette'] },
  { title: 'Simple Frost Calm Accessible Substrate', short: 'Lightest, calmest frost substrate for text-heavy security pages.',
    colors: [C.frost, C.frost2, C.frost], grain: 24, op: 45, blend: 'overlay', vignette: 18, blur: 2, sat: 98,
    tags: ['simple', 'frost', 'intaglio', 'accessible', 'subtle'] },
  { title: 'Simple Frost Fine Engraving Microline Substrate', short: 'Fine-grain cool-tinted substrate tuned for microline overlays.',
    colors: [C.frost, C.frost2, C.frost3], grain: 20, op: 48, blend: 'overlay', vignette: 26, blur: 3, sat: 96,
    tags: ['simple', 'frost', 'intaglio', 'microline', 'fine'] },
]
for (const v of simpleVariants) {
  const sd = template('simple')
  sanitizeColors(sd, { bg: C.frost, neutralColors: v.colors, palette: frostPalette, textColor: C.navy })
  // simple driver = full gradientConfig (keep template type/positions/wave params, set colors)
  sd.gradientConfig.colors = [...v.colors]
  sd.gradientConfig.numColors = v.colors.length
  sd.gradientConfig.colorStops = v.colors.map((_, i) => Math.round((i / (v.colors.length - 1)) * 100))
  sd.effectsConfig = effects({ blur: v.blur, texture: 'grain', textureSize: v.grain, textureOpacity: v.op,
    blend: v.blend, contrast: 102, brightness: 100, saturation: v.sat, vignette: v.vignette })
  scenes.push({ title: v.title, short_description: v.short,
    long_description: `${v.short} Text-safe frost substrate, no fluted glass (Deconflict Part 3).`,
    scene_data: { ...sd, tags: [...v.tags, 'substrate'] } })
}

// ============ LIQUID (molten foil hero, dark) — driver: blobConfig.colors ============
const liquidVariants = [
  { title: 'Liquid Metallic Navy Molten Foil Cinematic', short: 'Dark molten-metal hero for the Deconflict landing fold.',
    colors: [C.navy, C.cobalt, C.cobalt2, C.silver], blobCount: 5, speed: 0.4, threshold: 180, maxR: 130, orbit: 160,
    blur: 10, fg: { segments: 90, rotation: 70, distortion: 0.08, overlayOpacity: 16 }, vignette: 36, sat: 105,
    tags: ['liquid', 'navy', 'molten-foil', 'cinematic', 'hero'] },
  { title: 'Liquid Metallic Cobalt Molten Foil Dynamic', short: 'Brighter cobalt-led molten foil with faster, busier flow.',
    colors: [C.cobalt, C.cobalt2, C.navy, C.silver], blobCount: 6, speed: 0.5, threshold: 175, maxR: 140, orbit: 160,
    blur: 10, fg: { segments: 84, rotation: 72, distortion: 0.09, overlayOpacity: 16 }, vignette: 32, sat: 108,
    tags: ['liquid', 'cobalt', 'molten-foil', 'dynamic', 'hero'] },
  { title: 'Liquid Metallic Silver Quicksilver Molten Foil', short: 'Mercury-like silver molten foil with heavy merging blobs.',
    colors: [C.silver, C.cobalt2, C.navy, C.cobalt], blobCount: 5, speed: 0.4, threshold: 160, maxR: 150, orbit: 160,
    blur: 11, fg: { segments: 88, rotation: 68, distortion: 0.07, overlayOpacity: 14 }, vignette: 30, sat: 102,
    tags: ['liquid', 'silver', 'molten-foil', 'quicksilver', 'hero'] },
  { title: 'Liquid Metallic Violet Molten Foil Aurora', short: 'Violet-forward molten foil with a wide orbit and deep vignette.',
    colors: [C.violet, C.cobalt, C.navy, C.silver], blobCount: 5, speed: 0.4, threshold: 178, maxR: 130, orbit: 180,
    blur: 10, fg: { segments: 92, rotation: 76, distortion: 0.1, overlayOpacity: 17 }, vignette: 38, sat: 110,
    tags: ['liquid', 'violet', 'molten-foil', 'aurora', 'hero'] },
  { title: 'Liquid Metallic Navy Molten Foil Mobile Safe', short: 'Lighter molten foil tuned to degrade gracefully on mobile.',
    colors: [C.navy, C.cobalt, C.cobalt2, C.silver], blobCount: 4, speed: 0.4, threshold: 180, maxR: 125, orbit: 150,
    blur: 8, fg: { segments: 48, rotation: 70, distortion: 0.06, overlayOpacity: 14 }, vignette: 34, sat: 104,
    tags: ['liquid', 'navy', 'molten-foil', 'mobile-safe', 'performance'] },
]
for (const v of liquidVariants) {
  const sd = template('liquid')
  sanitizeColors(sd, { bg: C.navyDeep, neutralColors: v.colors, palette: cobaltPalette, textColor: C.frost })
  // liquid driver = blobConfig.colors
  Object.assign(sd.blobConfig, {
    useGradientColors: true, colors: [...v.colors], backgroundColor: C.navyDeep,
    blobCount: v.blobCount, speed: v.speed, threshold: v.threshold, maxRadius: v.maxR,
    minRadius: 45, orbitRadius: v.orbit, blurAmount: 12, decaySpeed: 0.95, mouseInfluence: 0.35,
  })
  sd.effectsConfig = effects({ blur: v.blur, texture: 'grain', textureSize: 32, textureOpacity: 40,
    blend: 'overlay', contrast: 112, brightness: 98, saturation: v.sat, vignette: v.vignette,
    fluted: { enabled: true, rotation: v.fg.rotation, segments: v.fg.segments, motionSpeed: 1.1,
      motionValue: 1.8, waveFrequency: 1.4, overlayOpacity: v.fg.overlayOpacity, distortionStrength: v.fg.distortion } })
  scenes.push({ title: v.title, short_description: v.short,
    long_description: `${v.short} Deep-navy molten-foil hero with fluted glass + grain (Deconflict Part 3).`,
    scene_data: { ...sd, tags: [...v.tags, 'premium'] } })
}

fs.writeFileSync('deconflict-scenes-payload.json',
  JSON.stringify({ projectId: PROJECT_ID,
    _note: 'DECONFLICT Tactile Security Materials (spec Part 3). Built from real working templates + Deconflict recolor. Password injected at POST time.',
    scenes }, null, 2))
console.log(`Wrote ${scenes.length} scenes -> deconflict-scenes-payload.json`)
