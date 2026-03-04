// Base configs for all mini scene previews

export const DEFAULT_GRADIENT_CONFIG = {
  numColors: 4,
  type: 'radial',
  startPos: { x: 0, y: 0 },
  endPos: { x: 100, y: 100 },
  colorStops: [0, 33, 66, 100],
  waveIntensity: 0.3,
  mouseInfluence: 0.5,
  decaySpeed: 0.95,
  wave1Speed: 0.2,
  wave1Direction: 1,
  wave2Speed: 0.15,
  wave2Direction: -1,
}

export const DEFAULT_EFFECTS_CONFIG = {
  blur: 0,
  texture: 'none',
  textureSize: 0.01,
  textureOpacity: 0.5,
  textureBlendMode: 'overlay',
  colorMap: 'none',
  vignetteIntensity: 0.3,
  saturation: 100,
  contrast: 100,
  brightness: 100,
  flutedGlass: {
    enabled: false,
    segments: 80,
    rotation: 0,
    motionValue: 0.5,
    motionSpeed: 0.5,
    overlayOpacity: 0,
    distortionStrength: 0.02,
    waveFrequency: 1,
  },
}

export const DEFAULT_TESSELLATION_CONFIG = {
  enabled: true,
  icon: 'Star',
  rowGap: 200,
  colGap: 200,
  size: 10,
  opacity: 0.20,
  rotation: 0,
  color: '#ffffff',
  mouseRotationInfluence: 0.5,
}

export const DEFAULT_TEXT_CONFIG = {
  enabled: true,
  color: '#ffffff',
  opacity: 1,
}

export const DEFAULT_TEXT_SECTIONS = [
  { id: 1, text: 'Aura', size: 120, weight: 900, spacing: -0.1, font: 'mono' },
  { id: 2, text: 'BY PROMAD', size: 20, weight: 300, spacing: 0.2, font: 'sans-serif' },
]

export const DEFAULT_AURORA_CONFIG = {
  width: 20,
  minHeight: 200,
  maxHeight: 600,
  ttl: 200,
  blurAmount: 13,
  hueStart: 120,
  hueEnd: 180,
  backgroundColor: '#000000',
  lineCount: 0,
  decaySpeed: 0.95,
  useGradientColors: true,
}

export const DEFAULT_FLUID_CONFIG = {
  useGradientColors: true,
  backgroundColor: '#1C89FF',
  colors: ['#71ECFF', '#39F58A', '#71ECFF', '#F0CBA8'],
  speed: 1,
  intensity: 1,
  blurAmount: 20,
}

export const DEFAULT_WAVES_CONFIG = {
  useGradientColors: true,
  colors: ['#06b6d4', '#a855f7', '#ec4899', '#3b82f6'],
  waveHeight: 0.05,
  waveFrequency: 2,
  rotation: 0,
  speed: 0.5,
  blur: 40,
  layers: 5,
  phaseOffset: 0,
}

export const DEFAULT_RIBBON_CONFIG = {
  useGradientColors: true,
  backgroundColor: '#ffffff',
  ribbonCount: 5,
  speed: 0.5,
  amplitude: 1.0,
  spread: 0.5,
  rotation: -30,
  thickness: 1,
  taper: -0.3,
  noise: 0.5,
  opacity: 0.85,
}

export const DEFAULT_DANDELION_CONFIG = {
  useGradientColors: true,
  backgroundColor: '#e8f4fc',
  radialGradientColors: ['#e8f4fc', '#fef3c7'],
  radialGradientStops: [0, 100],
  gradientEndX: 100,
  gradientEndY: 100,
  lineCount: 120,
  radiusMin: 0.1,
  radiusMax: 0.8,
  speed: 0.3,
  thickness: 1.5,
  dotSize: 3,
  spread: 0.3,
  centerY: 0.85,
  lineOpacity: 0.8,
}

export const DEFAULT_PARTICLE_RING_CONFIG = {
  useGradientColors: true,
  backgroundColor: '#fef6f9',
  radialGradientColors: ['#fef6f9', '#fef3c7'],
  radialGradientStops: [0, 100],
  gradientEndX: 100,
  gradientEndY: 100,
  particleCount: 800,
  ringRadius: 0.35,
  ringWidth: 0.15,
  speed: 0.5,
  particleSize: 3,
  dispersion: 0.3,
  rotationSpeed: 0.2,
  tiltX: 0,
  tiltZ: 0,
}

// Helper to create a gradient config with specific colors
export const makeGradientConfig = (colors) => ({
  ...DEFAULT_GRADIENT_CONFIG,
  colors,
  numColors: colors.length,
})

// Per-section scene definitions — each section gets a unique visual
export const SECTION_SCENES = [
  {
    id: 'hero',
    title: 'Hero Banner',
    description: 'The main hero section at the top of the about page.',
    backgroundType: 'liquid',
    colors: ['#b80038', '#fdf7f2', '#004d9c', '#00999a'],
  },
  {
    id: 'background',
    title: '8 Background Types',
    description: 'Choose from liquid mesh gradients, aurora borealis, fluid simulations, wave patterns, ribbon trails, dandelion particles, particle rings, and simple gradients.',
    backgroundType: 'waves',
    colors: ['#06b6d4', '#a855f7', '#ec4899', '#3b82f6'],
  },
  {
    id: 'icons',
    title: 'Icon Tessellation',
    description: 'Overlay a repeating grid of 65+ icons over any background. Adjust size, spacing, rotation, and opacity.',
    backgroundType: 'aurora',
    colors: ['#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'],
  },
  {
    id: 'effects',
    title: 'Overlay Effects',
    description: 'Add texture overlays like grain, scanlines, dots, and grid patterns. Control vignette, blur, saturation, contrast, and color maps.',
    backgroundType: 'fluid',
    colors: ['#f97316', '#ef4444', '#ec4899', '#f59e0b'],
  },
  {
    id: 'flutedGlass',
    title: 'Fluted Glass Effect',
    description: 'Apply a refractive glass distortion that warps the background with animated wave patterns. Adjust segment count, rotation, and distortion strength.',
    backgroundType: 'ribbon',
    colors: ['#8b5cf6', '#ec4899', '#06b6d4', '#3b82f6'],
  },
  {
    id: 'text',
    title: 'Text & Fonts',
    description: 'Add centered text with 4 font families: Manrope, Playfair Display, Space Grotesk, and Pacifico. Configure size, weight, spacing, and glow effects.',
    backgroundType: 'liquid',
    colors: ['#b80038', '#fdf7f2', '#004d9c', '#00999a'],
  },
  {
    id: 'input',
    title: 'Interactive Input',
    description: 'Control how the background reacts. Mouse mode follows the cursor, microphone mode reacts to audio with bass, mid, and treble bands.',
    backgroundType: 'dandelion',
    colors: ['#d97706', '#ea580c', '#dc2626', '#c2410c'],
  },
  {
    id: 'theme',
    title: 'Dark & Light Mode',
    description: 'Every scene supports dark and light theme overrides. Store a single scene with different color palettes, brightness, and contrast for each mode.',
    backgroundType: 'liquid',
    colors: ['#b80038', '#fdf7f2', '#004d9c', '#00999a'],
  },
  {
    id: 'palettes',
    title: 'Color Palettes',
    description: 'Load custom color palettes or choose from presets. Colors propagate through gradients, tessellation, and effects. Supports Tailwind OKLCH palettes.',
    backgroundType: 'liquid',
    colors: ['#b80038', '#fdf7f2', '#004d9c', '#00999a'],
  },
  {
    id: 'embed',
    title: 'Embed Anywhere',
    description: 'Drop a lightweight iframe snippet into your site. Your animated scene renders in real-time, with mouse reactivity and theme support.',
    backgroundType: 'particleRing',
    colors: ['#e879f9', '#c084fc', '#67e8f9', '#34d399'],
  },
]

export const getScene = (id) => SECTION_SCENES.find(s => s.id === id)
