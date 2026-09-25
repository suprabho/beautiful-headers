// Palettes, shape presets and colour naming for the studio background types.
// Convention for glow / forms / prism: colour 0 is the backdrop (or darkest
// band); sky uses colour 0 to tint its clouds; watercolor treats all equally.

export const STUDIO_DEFAULTS = {
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

export const STUDIO_PALETTES = {
  sky: [
    { name: 'Blue sky', colors: ['#E6F2FF', '#B3D9FF', '#80B3FF', '#1C6FE3'] },
    { name: 'Madder dusk', colors: ['#FFE3D2', '#F2B8A0', '#C17A9A', '#6B4E8F'] },
    { name: 'Golden hour', colors: ['#FFF4D6', '#FFD08A', '#FFA45C', '#E4683A'] },
    { name: 'Night sky', colors: ['#C5CCF2', '#6D7BC2', '#3C4A8C', '#1E2450'] },
    { name: 'Storm light', colors: ['#E4E6EA', '#A8ADB6', '#6B7280', '#3A3F4B'] },
    { name: 'Blossom sky', colors: ['#FFEEF4', '#F5C4DC', '#C9A6E6', '#8B8FE0'] },
    { name: 'Mint sky', colors: ['#E8FBF4', '#A6E6D2', '#5CB7B0', '#2F7A99'] },
    { name: 'Coral haze', colors: ['#FFE6E1', '#FFB8A8', '#F08295', '#C45A7A'] },
    { name: 'Grape dusk', colors: ['#EAD9FF', '#B795F0', '#7F5AD0', '#3F2A80'] },
    { name: 'Deep sea', colors: ['#D4F4F2', '#6CC6C8', '#2D7FA6', '#123E6B'] },
    { name: 'Ink sky', colors: ['#EEEEEE', '#B8B8BC', '#5C5C66', '#1E1E24'] },
    { name: 'Crimson sky', colors: ['#FFE0DA', '#F4978E', '#C9425B', '#6E1B3A'] },
  ],
  watercolor: [
    { name: 'Poolside', colors: ['#109BDA', '#19BBE3', '#52D9E8', '#8BE9EA'] },
    { name: 'Pink lemonade', colors: ['#F55F93', '#FF94B4', '#FFC9A8', '#FFE3A3'] },
    { name: 'Mint splash', colors: ['#1FB89A', '#48D1A6', '#9BE8C4', '#D4F7E4'] },
    { name: 'Sea orchid', colors: ['#7C3AED', '#A78BFA', '#2DD4BF', '#99F6E4'] },
    { name: 'Cherry pop', colors: ['#E11D48', '#F43F5E', '#FDA4AF', '#FFE4E6'] },
    { name: 'Mango', colors: ['#F97316', '#FB923C', '#FCD34D', '#FEF3C7'] },
    { name: 'Citrus pop', colors: ['#EAB308', '#FACC15', '#FDE68A', '#FFF7D6'] },
    { name: 'Lilac candy', colors: ['#8B5CF6', '#C084FC', '#F0ABFC', '#FCE7F3'] },
  ],
  glow: [
    { name: 'Volt', colors: ['#0A2A33', '#DFFF4F', '#39E6B4', '#1BB6C9'] },
    { name: 'Hot coral', colors: ['#2A0F1F', '#FF5A7A', '#FF9A5C', '#FFD3A8'] },
    { name: 'Blue hour', colors: ['#0B1030', '#3D7BFF', '#5AD1FF', '#9B7BFF'] },
    { name: 'Orchid', colors: ['#1A0B33', '#C35CFF', '#FF6BD6', '#7B6BFF'] },
    { name: 'Ember', colors: ['#1C0A06', '#FF7A1A', '#FFC44D', '#FF3D3D'] },
    { name: 'Aqua', colors: ['#021C24', '#00E0FF', '#00FFB2', '#7AF0FF'] },
    { name: 'Rosé', colors: ['#2B0D17', '#FF8FB3', '#FFC2D6', '#D66BFF'] },
    { name: 'Lime ink', colors: ['#101410', '#B8FF3D', '#62FF8A', '#E8FF9E'] },
  ],
  forms: [
    { name: 'Solar', colors: ['#FFFDF8', '#FFD66B', '#FF8A4C', '#FF4D6D', '#9B3DE8'] },
    { name: 'Lagoon', colors: ['#FFFEFB', '#E9FF95', '#59E39C', '#1EC9D8', '#2874F0'] },
    { name: 'Coral', colors: ['#FFFBF8', '#FFC99A', '#FF8A6B', '#F2507B', '#8E4FD6'] },
    { name: 'Aerial', colors: ['#FBFDFF', '#BDE6FF', '#5CB4F2', '#6B6BE0', '#D17ADB'] },
    { name: 'Botanic', colors: ['#FBFFF6', '#D6F06B', '#59D68F', '#2AA6B5', '#23528C'] },
    { name: 'Violet', colors: ['#FCFAFF', '#E2C6FF', '#B57BF0', '#6B5ED6', '#2A2F7A'] },
    { name: 'Night', colors: ['#0C0E1A', '#FFE08A', '#FF7AA2', '#8A6BFF', '#3A5BFF'] },
    { name: 'Sorbet', colors: ['#FFF8F6', '#FFE4A8', '#FFB3C7', '#C8A8FF', '#8FD6FF'] },
  ],
  prism: [
    { name: 'Ultraviolet', colors: ['#1E1B6B', '#5B4BE8', '#B46BFF', '#F3A6FF', '#FFF0FB'] },
    { name: 'Rosewater', colors: ['#4A1628', '#A34A5C', '#E3A0A8', '#F7DADB', '#FFF6F4'] },
    { name: 'Garnet silk', colors: ['#3A0F24', '#7A2447', '#C45C7F', '#EBB0C0', '#FFF1F4'] },
    { name: 'Petrol', colors: ['#0D3B3F', '#1F6E6F', '#4FAFA2', '#A9E3D0', '#EFFBF5'] },
    { name: 'Cobalt pearl', colors: ['#16225C', '#2E4AA8', '#7B96E0', '#C9D6F5', '#F5F8FF'] },
    { name: 'Ember', colors: ['#3B1414', '#8A2E22', '#E0643C', '#F7B77A', '#FFF1DC'] },
    { name: 'Citron', colors: ['#264A3E', '#4E7A48', '#A8C15A', '#E3E7A8', '#FBF6E0'] },
    { name: 'Lilac dusk', colors: ['#2E2440', '#5E4A7A', '#A08BC0', '#DCD0EA', '#F9F6FC'] },
    { name: 'Silver mist', colors: ['#2A2F36', '#5A626E', '#9AA3AD', '#D6DADF', '#F7F8FA'] },
    { name: 'Glacier', colors: ['#0F3550', '#1E6E94', '#4FB3CF', '#AEE3EE', '#F2FCFE'] },
    { name: 'Yuzu', colors: ['#5A3A0E', '#A36A12', '#E6B23A', '#F7E08A', '#FFFBE6'] },
    { name: 'Blue hour', colors: ['#141A4A', '#3A3FA8', '#6E7BEA', '#B8C2FA', '#F0F2FF'] },
  ],
}

export const GLOW_SHAPE_LABELS = {
  edge: 'Edge', circles: 'Circles', moons: 'Moons', pebbles: 'Pebbles',
  ellipses: 'Ellipses', halo: 'Halo', dunes: 'Dunes', petals: 'Petals',
}

export const FORM_SHAPE_LABELS = {
  arch: 'Arch', circle: 'Circle', flower: 'Flower', star: 'Star', ring: 'Ring', blob: 'Blob',
  heart: 'Heart', square: 'Square', sparkle: 'Sparkle', clover: 'Clover', drop: 'Drop', burst: 'Burst',
}

// ---------------------------------------------------------------------------
// Colour maths
// ---------------------------------------------------------------------------

export function hexToRgb01(hex) {
  let h = String(hex || '').trim().replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h.slice(0, 6), 16)
  if (Number.isNaN(n)) return [0, 0, 0]
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

export function hexToOklab(hex) {
  const [r, g, b] = hexToRgb01(hex).map(srgbToLinear)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

// Traditional Japanese colours used to name palette tags
const NAMED_COLORS = [
  ['Sakura', '#FEDFE1'], ['Nadeshiko', '#DC9FB4'], ['Kohbai', '#E16B8C'], ['Karakurenai', '#D0104C'],
  ['Toki', '#EEA9A9'], ['Sango', '#F17C67'], ['Akane', '#CB1B45'], ['Benihi', '#F75C2F'],
  ['Kaki', '#ED784A'], ['Araisyu', '#FB966E'], ['Yamabuki', '#FFB11B'], ['Kuchinashi', '#F6C555'],
  ['Kihada', '#FBE251'], ['Nanohana', '#F7D94C'], ['Hiwa', '#BEC23F'], ['Moegi', '#7BA23F'],
  ['Wakanae', '#86C166'], ['Wakatake', '#5DAC81'], ['Byakuroku', '#A8D8B9'], ['Tokiwa', '#1B813E'],
  ['Midori', '#227D51'], ['Aoni', '#516E41'], ['Seiheki', '#268785'], ['Mizuasagi', '#66BAB7'],
  ['Kamenozoki', '#A5DEE4'], ['Hanada', '#006284'], ['Sora', '#58B2DC'], ['Wasurenagusa', '#7DB9DE'],
  ['Gunjyo', '#51A8DD'], ['Ruri', '#005CAF'], ['Konjyo', '#113285'], ['Ai', '#0D5661'],
  ['Kon', '#0F2540'], ['Kikyo', '#6A4C9C'], ['Fuji', '#8B81C3'], ['Fujimurasaki', '#8A6BBE'],
  ['Sumire', '#66327C'], ['Murasaki', '#77428D'], ['Botan', '#C1328E'], ['Tsutsuji', '#E03C8A'],
  ['Shironeri', '#FCFAF2'], ['Gofun', '#FFFFFB'], ['Shironezumi', '#BDC0BA'], ['Ginnezumi', '#91989F'],
  ['Nibi', '#656765'], ['Sumi', '#1C1C1C'], ['Kuro', '#080808'], ['Mizu', '#E6F2FF'],
]
const NAMED_LAB = NAMED_COLORS.map(([name, hex]) => [name, hexToOklab(hex)])

export function nameForColor(hex) {
  const [L, A, B] = hexToOklab(hex)
  let best = NAMED_LAB[0][0]
  let bestD = Infinity
  for (const [name, [l, a, b]] of NAMED_LAB) {
    const d = (L - l) ** 2 + (A - a) ** 2 + (B - b) ** 2
    if (d < bestD) { bestD = d; best = name }
  }
  return best
}

export const evenStops = (n) => Array.from({ length: n }, (_, i) => Math.round((i / Math.max(1, n - 1)) * 100))
