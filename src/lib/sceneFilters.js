// Background effect options (value -> display label)
export const BACKGROUND_EFFECTS = [
  { value: 'simple', label: 'Simple' },
  { value: 'liquid', label: 'Fog' },
  { value: 'aurora', label: 'Aurora' },
  { value: 'fluid', label: 'Mesh' },
  { value: 'waves', label: 'Waves' },
  { value: 'ribbon', label: 'Ribbon' },
  { value: 'dandelion', label: 'Dandelion' },
  { value: 'particleRing', label: 'Particle Ring' },
  { value: 'guilloche', label: 'Guilloché' },
]

// Color family definitions with hue ranges and representative colors
export const COLOR_FAMILIES = [
  { name: 'Red', hueMin: 345, hueMax: 15, color: '#ef4444', wraps: true },
  { name: 'Orange', hueMin: 15, hueMax: 45, color: '#f97316', wraps: false },
  { name: 'Yellow', hueMin: 45, hueMax: 70, color: '#eab308', wraps: false },
  { name: 'Green', hueMin: 70, hueMax: 170, color: '#22c55e', wraps: false },
  { name: 'Blue', hueMin: 170, hueMax: 260, color: '#3b82f6', wraps: false },
  { name: 'Purple', hueMin: 260, hueMax: 300, color: '#a855f7', wraps: false },
  { name: 'Pink', hueMin: 300, hueMax: 345, color: '#ec4899', wraps: false },
  { name: 'Neutral', hueMin: 0, hueMax: 360, color: '#737373', wraps: false, isNeutral: true },
]

export function hexToHsl(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null
  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

export function matchesColorFamily(hex, family) {
  const hsl = hexToHsl(hex)
  if (!hsl) return false
  if (family.isNeutral) return hsl.s < 10
  if (family.wraps) return hsl.s >= 10 && (hsl.h >= family.hueMin || hsl.h < family.hueMax)
  return hsl.s >= 10 && hsl.h >= family.hueMin && hsl.h < family.hueMax
}

export function sceneMatchesColorFamily(scene, familyName) {
  const family = COLOR_FAMILIES.find((f) => f.name === familyName)
  if (!family) return false
  const colors = scene.scene_data?.gradientConfig?.colors || []
  return colors.some((hex) => matchesColorFamily(hex, family))
}
