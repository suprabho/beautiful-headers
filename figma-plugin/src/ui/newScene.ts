// Builds a brand-new scene from a background type + palette and saves it to
// the public `scenes` table, the same way the web editor's "Save scene" does
// (src/lib/scenesApi.js createScene). The embed renders a type's config
// without merging defaults, so every config here is complete — the values
// mirror the defaults in src/store/useStore.js and src/lib/studioPresets.js.

import { AURA_ORIGIN, SUPABASE_KEY, SUPABASE_URL, titleToSlug, type Scene } from './api'

export interface NewSceneType {
  value: string
  label: string
  /** Palette offered when the type is picked. */
  palette: string[]
  /** Background colour for types that paint one behind the palette. */
  background?: string
}

export const NEW_SCENE_TYPES: NewSceneType[] = [
  { value: 'aurora', label: 'Aurora', palette: ['#22d3ee', '#a855f7', '#34d399'], background: '#000000' },
  { value: 'fluid', label: 'Mesh', palette: ['#71ECFF', '#39F58A', '#71ECFF', '#F0CBA8'], background: '#1C89FF' },
  { value: 'liquid', label: 'Fog', palette: ['#b80038', '#fdf7f2', '#004d9c', '#00999a'] },
  { value: 'waves', label: 'Waves', palette: ['#06b6d4', '#a855f7', '#ec4899', '#3b82f6'] },
  { value: 'ribbon', label: 'Ribbon', palette: ['#6366f1', '#ec4899', '#f59e0b'], background: '#ffffff' },
  { value: 'simple', label: 'Simple', palette: ['#0f172a', '#6d28d9', '#f472b6'] },
  { value: 'dandelion', label: 'Dandelion', palette: ['#0ea5e9', '#f59e0b', '#ec4899'], background: '#e8f4fc' },
  { value: 'particleRing', label: 'Particle Ring', palette: ['#f43f5e', '#8b5cf6', '#f59e0b'], background: '#fef6f9' },
  { value: 'sky', label: 'Sky', palette: ['#E6F2FF', '#B3D9FF', '#80B3FF', '#1C6FE3'] },
  { value: 'watercolor', label: 'Watercolors', palette: ['#109BDA', '#19BBE3', '#52D9E8', '#8BE9EA'] },
  { value: 'glow', label: 'Glow', palette: ['#0B0B1A', '#3B1F8F', '#C04BF2', '#FFB3F0'] },
  { value: 'forms', label: 'Forms', palette: ['#F2E8DC', '#E3B58F', '#C7684A', '#4A2C2A'] },
  { value: 'prism', label: 'Prism', palette: ['#0F1030', '#2E5BFF', '#00E0C6', '#FFE45C'] },
]

/** Curated palettes for the shuffle button. */
export const SHUFFLE_PALETTES = [
  ['#0f0c29', '#302b63', '#24243e', '#8e2de2'],
  ['#ff9a8b', '#ff6a88', '#ff99ac', '#fcb69f'],
  ['#00c9ff', '#92fe9d', '#00b4db', '#0083b0'],
  ['#f7971e', '#ffd200', '#f953c6', '#b91d73'],
  ['#1a2a6c', '#b21f1f', '#fdbb2d'],
  ['#134e5e', '#71b280', '#d4fc79', '#96e6a1'],
  ['#e0c3fc', '#8ec5fc', '#a18cd1', '#fbc2eb'],
  ['#232526', '#414345', '#bdc3c7', '#2c3e50'],
  ['#ff5f6d', '#ffc371', '#ee0979', '#ff6a00'],
  ['#43cea2', '#185a9d', '#56ccf2', '#2f80ed'],
  ['#FFE3D2', '#F2B8A0', '#C17A9A', '#6B4E8F'],
  ['#F55F93', '#FF94B4', '#FFC9A8', '#FFE3A3'],
]

export const MIN_COLORS = 2
export const MAX_COLORS = 6

const STUDIO_TYPES = ['sky', 'watercolor', 'glow', 'forms', 'prism']

const STUDIO_DEFAULTS = {
  motion: true,
  speed: 0.24,
  scale: 1,
  amount: 0.5,
  softness: 0.5,
  grain: 0.12,
  seed: 0,
  glowShape: 'edge',
  formShape: 'arch',
}

const RADIAL = { radialGradientStops: [0, 100], gradientEndX: 100, gradientEndY: 100 }

/** Complete per-type configs, keyed by the scene_data field they live in. */
function typeConfig(type: string, background: string): Record<string, unknown> {
  switch (type) {
    case 'aurora':
      return {
        auroraConfig: {
          width: 20, minHeight: 200, maxHeight: 600, ttl: 200, blurAmount: 13,
          hueStart: 120, hueEnd: 180, backgroundColor: background, lineCount: 0,
          decaySpeed: 0.95, useGradientColors: true,
        },
      }
    case 'fluid':
      return {
        fluidConfig: { useGradientColors: true, backgroundColor: background, speed: 1, intensity: 1, blurAmount: 20 },
      }
    case 'waves':
      return {
        wavesConfig: {
          useGradientColors: true, waveHeight: 0.05, waveFrequency: 2, rotation: 0,
          speed: 0.5, blur: 40, layers: 5, phaseOffset: 0,
        },
      }
    case 'ribbon':
      return {
        ribbonConfig: {
          useGradientColors: true, backgroundColor: background, ribbonCount: 5, speed: 0.5,
          amplitude: 1.0, spread: 0.5, rotation: -30, thickness: 1, taper: -0.3, noise: 0.5, opacity: 0.85,
        },
      }
    case 'dandelion':
      return {
        dandelionConfig: {
          useGradientColors: true, backgroundColor: background, radialGradientColors: [background, background],
          ...RADIAL, lineCount: 120, radiusMin: 0.1, radiusMax: 0.8, speed: 0.3, thickness: 1.5,
          dotSize: 3, spread: 0.3, centerY: 0.85, lineOpacity: 0.8,
        },
      }
    case 'particleRing':
      return {
        particleRingConfig: {
          useGradientColors: true, backgroundColor: background, radialGradientColors: [background, background],
          ...RADIAL, particleCount: 800, ringRadius: 0.35, ringWidth: 0.15, speed: 0.5, particleSize: 3,
          dispersion: 0.3, rotationSpeed: 0.2, tiltX: 0, tiltZ: 0,
        },
      }
    default:
      return STUDIO_TYPES.includes(type) ? { studioConfig: { ...STUDIO_DEFAULTS } } : {}
  }
}

function evenStops(n: number) {
  return Array.from({ length: n }, (_, i) => Math.round((i / (n - 1)) * 100))
}

export function buildSceneData({
  type,
  colors,
  background,
  title,
}: {
  type: string
  colors: string[]
  background: string
  title: string
}) {
  return {
    backgroundType: type,
    gradientConfig: {
      colors,
      numColors: colors.length,
      type: 'radial',
      startPos: { x: 0, y: 0 },
      endPos: { x: 100, y: 100 },
      colorStops: evenStops(colors.length),
      waveIntensity: 0.3,
      mouseInfluence: 0.5,
      decaySpeed: 0.95,
      wave1Speed: 0.2,
      wave1Direction: 1,
      wave2Speed: 0.15,
      wave2Direction: -1,
    },
    ...typeConfig(type, background),
    tessellationConfig: {
      enabled: false, icon: 'Star', rowGap: 60, colGap: 60, size: 24, opacity: 0.15,
      rotation: 0, color: '#ffffff', mouseRotationInfluence: 0.5,
    },
    effectsConfig: {
      blur: 0, texture: 'none', textureSize: 20, textureOpacity: 0.5, textureBlendMode: 'overlay',
      colorMap: 'none', vignetteIntensity: 0.3, saturation: 100, contrast: 100, brightness: 100,
      flutedGlass: {
        enabled: false, segments: 80, rotation: 0, motionValue: 0.5, motionSpeed: 0.5,
        overlayOpacity: 0, distortionStrength: 0.02, waveFrequency: 1,
      },
    },
    textSections: [{ id: 1, text: title, size: 96, weight: 800, spacing: -0.05, font: 'sans-serif' }],
    textGap: 20,
    textConfig: { enabled: true, color: '#ffffff', opacity: 1 },
    mouseConfig: { enabled: true, intensity: 0.5 },
    inputEnabled: true,
    // Same review flag the bulk-create API sets: shows up in the gallery right
    // away, and accepting it in the web app captures a proper thumbnail.
    pendingReview: true,
    createdWith: 'figma-plugin',
  }
}

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

/** Mirrors generateUniqueSlug in src/lib/scenesApi.js. */
async function uniqueSlug(title: string) {
  const base = titleToSlug(title) || 'scene'
  const params = new URLSearchParams({ select: 'slug', slug: `like.${base}*` })
  const res = await fetch(`${SUPABASE_URL}/rest/v1/scenes?${params}`, { headers: HEADERS })
  if (!res.ok) return base
  const taken = new Set(((await res.json()) as { slug: string | null }[]).map((r) => r.slug))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

/** Thumbnails straight from the capture endpoint until the scene is reviewed. */
function captureThumb(slug: string, w: number, h: number) {
  return `${AURA_ORIGIN}/scenes/${encodeURIComponent(slug)}/capture.png?w=${w}&h=${h}&dpr=1&hideText=true`
}

export async function createScene({
  title,
  type,
  colors,
  background,
}: {
  title: string
  type: string
  colors: string[]
  background: string
}): Promise<Scene> {
  const cleanTitle = title.trim() || 'Untitled scene'
  const slug = await uniqueSlug(cleanTitle)
  const now = new Date().toISOString()
  const thumbnail = {
    small: captureThumb(slug, 400, 225),
    medium: captureThumb(slug, 800, 450),
    large: captureThumb(slug, 1200, 675),
  }
  const shortDescription = `${NEW_SCENE_TYPES.find((t) => t.value === type)?.label || 'Custom'} background made in Figma`

  const res = await fetch(`${SUPABASE_URL}/rest/v1/scenes?select=id,title,slug`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'return=representation' },
    body: JSON.stringify({
      title: cleanTitle,
      slug,
      scene_data: buildSceneData({ type, colors, background, title: cleanTitle }),
      thumbnail,
      short_description: shortDescription,
      created_at: now,
      updated_at: now,
    }),
  })
  if (!res.ok) {
    let detail = ''
    try {
      detail = ((await res.json()) as { message?: string }).message || ''
    } catch {
      /* not JSON */
    }
    throw new Error(detail || `Couldn't save scene (${res.status})`)
  }
  const [row] = (await res.json()) as { id: number; title: string; slug: string }[]
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    shortDescription,
    backgroundType: type,
    // The small thumbnail renders on demand; skip the instant preview so the
    // first paint isn't blocked on a second capture.
    thumb: { small: thumbnail.small, large: null },
  }
}
