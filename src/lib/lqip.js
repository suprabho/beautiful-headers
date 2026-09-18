/**
 * lqip.js — the "preload gradient": an instant, zero-network SVG placeholder
 * built from a scene's config so it resembles the live scene it crossfades
 * into (LQIP = low-quality image placeholder).
 *
 * The same source runs in three places, so it has NO imports and nothing that
 * only works inside an ES module:
 *   - src/components/ColorPlaceholder.jsx (the React overlay in the embed)
 *   - the inline bootstrap of embed.html, which paints before React has even
 *     downloaded — vite.embed.plugin.js inlines this file into the HTML with
 *     its `export` keywords stripped
 *   - packages/core (a verbatim copy for the publishable header packages)
 *
 * What each background type gets:
 *   simple · liquid ("Fog") · fluid ("Mesh") · waves
 *       the classic blurred palette blobs, unchanged
 *   aurora
 *       the scene's background colour; palette hues glow up from the bottom
 *       edge, reaching as high as min/max height and as strongly as line width
 *       × line count make the live lines cover the canvas
 *   ribbon
 *       the scene's background colour; sparse ribbon bands sized by thickness
 *       (with taper/spread/rotation for placement) and faded by opacity
 *   dandelion
 *       the scene's radial-gradient background; palette rays burst from the
 *       centre-Y point, their density set by spread angle and min/max radius
 *   particleRing
 *       the scene's radial-gradient background; palette particles sit on the
 *       projected ring, placed by ring radius, ring width and dispersion
 *   guilloche
 *       the scene's radial-gradient background; soft concentric palette rings
 *       sized by scale and faded by line opacity (rosette and intaglio)
 *
 * Everything that reaches the markup is validated first (hex colours, finite
 * numbers), so a scene row can never inject markup.
 */

const FALLBACK_COLORS = ['#1f1f1f', '#2b2b2b']

// Deterministic blob positions (viewBox 0..100) of the classic placeholder.
const BLOB_POSITIONS = [
  [22, 28], [78, 22], [72, 74], [28, 72], [50, 48], [86, 54], [14, 52], [50, 90],
]

// Renderer fallbacks, mirrored so the placeholder matches a scene with no
// palette exactly the way the live layer does.
const RIBBON_COLORS = ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0']
const DANDELION_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899']
const PARTICLE_RING_COLORS = ['#ec4899', '#a855f7', '#8b5cf6', '#6366f1']
const GUILLOCHE_COLORS = ['#2E54E8', '#6D5BE8', '#71ECFF', '#F4F6FA']

// The three.js scenes share one camera: perspective, fov 50°, 8 units back.
const CAMERA_Z = 8
const TAN_HALF_FOV = Math.tan((50 / 2) * (Math.PI / 180))
const VISIBLE_HEIGHT = 2 * CAMERA_Z * TAN_HALF_FOV // world units visible at z = 0
const DEG2RAD = Math.PI / 180
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

// How many representative shapes a placeholder may draw per type. The live
// scenes draw hundreds of lines/particles; these few, blurred, give the same
// impression at a fraction of the paint cost.
const AURORA_MAX_STREAKS = 24
const DANDELION_MAX_RAYS = 40
const PARTICLE_MAX_DOTS = 72

/* ───────────────────────────── helpers ───────────────────────────── */

const HEX6 = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i
const HEX3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/i

/** Normalise a CSS hex colour to '#rrggbb' (alpha dropped), or null. */
function hex(value) {
  if (typeof value !== 'string') return null
  const v = value.trim()
  let m = HEX6.exec(v)
  if (m) return '#' + m[1].toLowerCase()
  m = HEX3.exec(v)
  if (m) return ('#' + m[1] + m[1] + m[2] + m[2] + m[3] + m[3]).toLowerCase()
  return null
}

function hexList(list) {
  return Array.isArray(list) ? list.map(hex).filter(Boolean) : []
}

/** A finite number, or `fallback`. Accepts numeric strings. */
function num(value, fallback) {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN
  return Number.isFinite(n) ? n : fallback
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v
}

function rgbOf(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
}

function toHex(r, g, b) {
  const c = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
  return '#' + c(r) + c(g) + c(b)
}

function mix(a, b, t) {
  const A = rgbOf(a)
  const B = rgbOf(b)
  return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t)
}

/** Darken like AuroraLayer.darkenHex. */
function darken(h, amount) {
  const c = rgbOf(h)
  return toHex(c[0] * (1 - amount), c[1] * (1 - amount), c[2] * (1 - amount))
}

/** hsl(h, s%, l%) → '#rrggbb' */
function hslToHex(h, s, l) {
  const S = s / 100
  const L = l / 100
  const k = (n) => (n + h / 30) % 12
  const a = S * Math.min(L, 1 - L)
  const f = (n) => L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return toHex(f(0) * 255, f(8) * 255, f(4) * 255)
}

// What a hex from the config actually looks like on screen in the WebGL scenes
// (verified against the live renderer's pixels). Their <Canvas> renders with
// three.js colour management and React Three Fiber's default ACES filmic tone
// mapping, so:
//  - a colour given to a built-in material (ribbon backdrop, particles,
//    guilloché lines, dandelion tip dots) is decoded to linear, tone-mapped and
//    encoded back: `materialHex` — pure white lands at #e2e2e2.
//  - the radial-gradient backdrop is a CanvasTexture with no colour-space tag,
//    so its raw values go through the same tone mapping and encoding without
//    the decode: `textureHex` — dark colours lift, whites go light grey.
//  - the dandelion line shader writes its (decoded, linear) instance colours
//    straight out, with neither tone mapping nor encoding: `rawShaderHex` —
//    lines show darker than their hex.
function linearToSrgb(c) {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}
function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}
// three.js ACESFilmicToneMapping (exposure 1): sRGB→AP1, RRT+ODT fit, AP1→sRGB.
const ACES_IN = [[0.59719, 0.35458, 0.04823], [0.076, 0.90834, 0.01566], [0.0284, 0.13383, 0.83777]]
const ACES_OUT = [[1.60475, -0.53108, -0.07367], [-0.10208, 1.10813, -0.00605], [-0.00327, -0.07276, 1.07602]]
function acesFilmic(rgb) {
  const v = [rgb[0] / 0.6, rgb[1] / 0.6, rgb[2] / 0.6]
  const m = ACES_IN.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2])
  const fit = m.map((x) => (x * (x + 0.0245786) - 0.000090537) / (x * (0.983729 * x + 0.432951) + 0.238081))
  return ACES_OUT.map((row) => clamp(row[0] * fit[0] + row[1] * fit[1] + row[2] * fit[2], 0, 1))
}
function unitRgb(h) {
  const c = rgbOf(h)
  return [c[0] / 255, c[1] / 255, c[2] / 255]
}
function materialHex(h) {
  const out = acesFilmic(unitRgb(h).map(srgbToLinear)).map(linearToSrgb)
  return toHex(out[0] * 255, out[1] * 255, out[2] * 255)
}
function textureHex(h) {
  const out = acesFilmic(unitRgb(h)).map(linearToSrgb)
  return toHex(out[0] * 255, out[1] * 255, out[2] * 255)
}
function rawShaderHex(h) {
  const out = unitRgb(h).map(srgbToLinear)
  return toHex(out[0] * 255, out[1] * 255, out[2] * 255)
}

/** Hue in degrees, rounded like AuroraLayer.hexToHsl. */
function hueOf(h) {
  const c = rgbOf(h)
  const r = c[0] / 255
  const g = c[1] / 255
  const b = c[2] / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max === min) return 0
  const d = max - min
  let hue
  if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) hue = ((b - r) / d + 2) / 6
  else hue = ((r - g) / d + 4) / 6
  return Math.round(hue * 360)
}

function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Deterministic PRNG (mulberry32) so every render of a scene is identical. */
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Format numbers for attributes: px to 1 decimal, unit values to 3. */
function px(n) {
  return String(Math.round(n * 10) / 10)
}
function un(n) {
  return String(Math.round(n * 1000) / 1000)
}

/**
 * A short id prefix derived from the placeholder's inputs, so two placeholders
 * on one page with different colours never share gradient/filter ids (the
 * first `url(#id)` in a document wins), while identical inputs stay identical.
 */
function idPrefix(key) {
  let h = 5381
  for (let i = 0; i < key.length; i++) h = ((h * 33) ^ key.charCodeAt(i)) >>> 0
  return 'lq' + h.toString(36)
}

function configKey(type, cfg, colors, W, H) {
  let body = ''
  try {
    body = JSON.stringify(cfg)
  } catch {
    body = ''
  }
  return type + '|' + colors.join(',') + '|' + W + 'x' + H + '|' + body
}

/** Project a world point seen by the shared perspective camera to px. */
function project(x, y, z, W, H) {
  const depth = Math.max(CAMERA_Z - z, 0.5)
  const scale = H / 2 / (depth * TAN_HALF_FOV) // px per world unit at that depth
  return { x: W / 2 + x * scale, y: H / 2 - y * scale, scale }
}

/**
 * The CSS filter the embed applies to the live background, so the placeholder
 * is graded the same way (colour maps, saturation, …). Identity parts are
 * omitted to avoid a pointless compositing pass.
 */
function effectsFilter(effects, type) {
  const e = effects || {}
  const blur = Math.max(0, num(e.blur, 0))
  const parts = blur > 0 ? ['blur(' + px(blur) + 'px)'] : []
  if (type !== 'liquid') {
    const sat = num(e.saturation, 100) || 100
    const con = num(e.contrast, 100) || 100
    const bri = num(e.brightness, 100) || 100
    if (sat !== 100) parts.push('saturate(' + px(sat) + '%)')
    if (con !== 100) parts.push('contrast(' + px(con) + '%)')
    if (bri !== 100) parts.push('brightness(' + px(bri) + '%)')
    switch (e.colorMap) {
      case 'sepia': parts.push('sepia(0.8)'); break
      case 'cyberpunk': parts.push('hue-rotate(280deg) saturate(1.5)'); break
      case 'sunset': parts.push('hue-rotate(30deg) saturate(1.3)'); break
      case 'matrix': parts.push('hue-rotate(90deg) saturate(2) brightness(0.9)'); break
      case 'noir': parts.push('grayscale(1) contrast(1.2)'); break
      case 'vintage': parts.push('sepia(0.3) saturate(1.5) hue-rotate(-10deg)'); break
      default: break
    }
  }
  return parts.join(' ')
}

/** Root <svg> in px coordinates (viewBox = the box it fills). */
function svgRoot(W, H, filter, inner) {
  const style = 'display:block;width:100%;height:100%' + (filter ? ';filter:' + filter : '')
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + px(W) + ' ' + px(H) + '" ' +
    'preserveAspectRatio="none" aria-hidden="true" style="' + style + '">' + inner + '</svg>'
  )
}

/** Gaussian blur covering the viewport plus a margin, in px. */
function blurFilter(id, sigma) {
  return (
    '<filter id="' + id + '" filterUnits="userSpaceOnUse" x="-15%" y="-15%" width="130%" height="130%">' +
    '<feGaussianBlur stdDeviation="' + px(sigma) + '"/></filter>'
  )
}

/**
 * The scene's vignette (EffectsLayer): transparent to 30%, then darkening to
 * `vignetteIntensity` black at the farthest corner. The overlay hides the live
 * vignette until it fades, so the placeholder carries its own.
 */
function vignette(effects, ids, W, H) {
  const intensity = clamp(num(effects && effects.vignetteIntensity, 0), 0, 1)
  if (intensity <= 0) return { defs: '', rect: '' }
  const id = ids + 'v'
  return {
    defs:
      '<radialGradient id="' + id + '" cx="0.5" cy="0.5" r="0.7071">' +
      '<stop offset="0.3" stop-color="#000" stop-opacity="0"/>' +
      '<stop offset="1" stop-color="#000" stop-opacity="' + un(intensity) + '"/></radialGradient>',
    rect: '<rect width="' + px(W) + '" height="' + px(H) + '" fill="url(#' + id + ')"/>',
  }
}

/**
 * The radial-gradient backdrop the three.js scenes paint (dandelion,
 * particleRing, guilloche): centre colour to outer colour over a radius set by
 * gradientEndX/Y, stretched to the box exactly like the scene's background
 * texture. Mirrors each layer's SceneSetup, including its fallbacks, and the
 * colour-management lift that texture gets on screen.
 */
function radialBackground(cfg, palette, centreDefault, outerDefault, legacyKeys, ids, W, H) {
  let stops = hexList(cfg.radialGradientColors)
  let offsets = Array.isArray(cfg.radialGradientStops) ? cfg.radialGradientStops : null
  if (!stops.length) {
    const centre = (legacyKeys && hex(cfg.radialGradientCenter)) || hex(cfg.backgroundColor) || centreDefault
    const outer = (legacyKeys && hex(cfg.radialGradientOuter)) || palette[palette.length - 1] || outerDefault
    stops = [centre, outer]
    offsets = null
  }
  const pairs = stops
    .map((color, i) => ({ color, stop: clamp(num(offsets ? offsets[i] : i === 0 ? 0 : 100, 0) / 100, 0, 1) }))
    .sort((a, b) => a.stop - b.stop)
  const endX = num(cfg.gradientEndX, 100) / 100
  const endY = num(cfg.gradientEndY, 100) / 100
  const radius = Math.max(0.01, Math.sqrt(endX * endX + endY * endY))
  const id = ids + 'bg'
  const defs =
    '<radialGradient id="' + id + '" cx="0.5" cy="0.5" r="' + un(radius) + '">' +
    pairs.map((p) => '<stop offset="' + un(p.stop) + '" stop-color="' + textureHex(p.color) + '"/>').join('') +
    '</radialGradient>'
  return {
    defs,
    rect: '<rect width="' + px(W) + '" height="' + px(H) + '" fill="url(#' + id + ')"/>',
    fogColor: pairs[0].color, // the config value; callers apply the transfer their shader shows
  }
}

/* ─────────────────────────── the classic blobs ─────────────────────────── */

/** simple / liquid / fluid / waves (and unknown types): unchanged blobs. */
function blobSvg(colors) {
  const list = colors.length ? colors : FALLBACK_COLORS
  const circles = list
    .map((color, i) => {
      const p = BLOB_POSITIONS[i % BLOB_POSITIONS.length]
      return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="42" fill="' + color + '" opacity="0.85"/>'
    })
    .join('')
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" ' +
    'aria-hidden="true" style="display:block;width:100%;height:100%">' +
    '<defs><filter id="aura-lqip-blur" x="-30%" y="-30%" width="160%" height="160%">' +
    '<feGaussianBlur stdDeviation="14"/></filter></defs>' +
    '<rect width="100" height="100" fill="' + list[0] + '"/>' +
    '<g filter="url(#aura-lqip-blur)">' + circles + '</g></svg>'
  )
}

/* ──────────────────────────────── aurora ──────────────────────────────── */

function auroraSvg(scene, colors, W, H, filter) {
  const cfg = scene.auroraConfig || {}
  // AuroraLayer: config colour, else the first palette colour darkened 85%.
  const bg = hex(cfg.backgroundColor) || (colors.length ? darken(colors[0], 0.85) : '#000000')
  const lineWidth = Math.max(0, num(cfg.width, 20))
  const hA = Math.max(0, num(cfg.minHeight, 200))
  const hB = Math.max(0, num(cfg.maxHeight, 600))
  const minH = Math.min(hA, hB)
  const maxH = Math.max(hA, hB)
  const lineCount = Math.max(0, num(cfg.lineCount, 0))
  const count = lineCount > 0 ? lineCount : lineWidth > 0 ? Math.floor((W / lineWidth) * 5) : 0
  const blur = clamp(num(cfg.blurAmount, 13), 0, 80)
  const hues = colors.length ? colors.map(hueOf) : null
  const hueStart = num(cfg.hueStart, 120)
  const hueEnd = num(cfg.hueEnd, 180)
  const ids = idPrefix(configKey('aurora', cfg, colors, W, H))

  const n = Math.min(Math.round(count), AURORA_MAX_STREAKS)
  const vig = vignette(scene.effectsConfig, ids, W, H)
  const bgRect = '<rect width="' + px(W) + '" height="' + px(H) + '" fill="' + bg + '"/>'
  if (n <= 0) return svgRoot(W, H, filter, '<defs>' + vig.defs + '</defs>' + bgRect + vig.rect)

  // The live layer draws `count` lines `lineWidth` wide. A few streaks stand
  // in for them: each a little wider than a line, and the brighter the more of
  // the canvas the real lines cover (width × count), so a dense config glows
  // wall to wall and a sparse one shows isolated tongues of colour.
  const density = clamp((count * lineWidth) / W / 2, 0, 1) // 2 layers of lines ≈ solid
  const streakW = clamp((count * lineWidth) / n, lineWidth, Math.max(lineWidth * 3, W / 20))
  const peakAlpha = 0.35 + 0.55 * density
  const sigma = clamp(Math.max(blur, streakW * 0.3, 6), 1, 60)
  const rand = rng(11)

  // Each line is a vertical gradient: transparent at its top and at the bottom
  // edge, brightest halfway (AuroraLayer.Line.draw), in hsl(hue, 100%, 65%).
  // Overlapping lines are composited additively on the layer's scratch canvas,
  // so a dense wall of them pales toward white.
  const gradientIds = new Map()
  let defs = vig.defs + blurFilter(ids + 'f', sigma)
  const gradientFor = (hue) => {
    if (!gradientIds.has(hue)) {
      const id = ids + 'g' + gradientIds.size
      const color = mix(hslToHex(hue, 100, 65), '#ffffff', 0.3 * density)
      defs +=
        '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="' + color + '" stop-opacity="0"/>' +
        '<stop offset="0.5" stop-color="' + color + '" stop-opacity="' + un(peakAlpha) + '"/>' +
        '<stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient>'
      gradientIds.set(hue, id)
    }
    return gradientIds.get(hue)
  }

  let streaks = ''
  for (let i = 0; i < n; i++) {
    const x = rand() * W - streakW / 2
    const h = minH + rand() * (maxH - minH)
    const hue = hues ? hues[Math.floor(rand() * hues.length)] : Math.round(hueStart + rand() * (hueEnd - hueStart))
    if (h <= 0) continue
    streaks +=
      '<rect x="' + px(x) + '" y="' + px(H - h) + '" width="' + px(streakW) + '" height="' + px(h) +
      '" fill="url(#' + gradientFor(hue) + ')"/>'
  }

  // The layer composites its lines over the background normally (source-over),
  // so colours stay vivid on light backgrounds too.
  return svgRoot(W, H, filter, '<defs>' + defs + '</defs>' + bgRect + '<g filter="url(#' + ids + 'f)">' + streaks + '</g>' + vig.rect)
}

/* ──────────────────────────────── ribbon ──────────────────────────────── */

function ribbonSvg(scene, colors, W, H, filter) {
  const cfg = scene.ribbonConfig || {}
  // The backdrop is a plane with a built-in material (tone-mapped); the ribbons
  // are a custom shader that shows the palette as given.
  const bg = materialHex(hex(cfg.backgroundColor) || '#ffffff')
  const palette = colors.length >= 2 ? colors : RIBBON_COLORS
  const n = clamp(Math.round(num(cfg.ribbonCount, 5) || 5), 2, 10)
  const thickness = clamp(num(cfg.thickness, 1), 0.02, 5)
  const opacity = clamp(num(cfg.opacity, 0.85), 0, 1)
  const spread = num(cfg.spread, 0.5)
  const rotation = num(cfg.rotation, -30)
  const taper = clamp(num(cfg.taper, 0), -1, 1)
  const amp = num(cfg.amplitude, 1) * 0.3
  const ids = idPrefix(configKey('ribbon', cfg, colors, W, H))

  // RibbonLayer's orthographic camera maps world x,y ∈ [-1, 1] onto the full
  // box, whatever its aspect — so ribbons are laid out in that world space and
  // stretched to the box by the outer transform, exactly like the scene.
  const halfHeight = (thickness * 0.8) / 2
  const sigma = clamp(halfHeight * 2 * 0.1 * (H / 2), 2, 40) // 10% of the on-screen ribbon height
  const SAMPLES = 8
  const vig = vignette(scene.effectsConfig, ids, W, H)

  let defs = vig.defs + blurFilter(ids + 'f', sigma)
  let ribbons = ''
  for (let i = 0; i < n; i++) {
    const yOffset = (i / Math.max(n - 1, 1) - 0.5) * spread * 1.5
    const phase = (i / n) * Math.PI * 2 + i * 0.7
    // The shader adds a faint silk sheen; a small lift toward white keeps the
    // placeholder from reading darker than the live ribbon.
    const c1 = mix(palette[i % palette.length], '#ffffff', 0.06)
    const c2 = mix(palette[(i + 1) % palette.length], '#ffffff', 0.06)
    const gid = ids + 'r' + i
    defs +=
      '<linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="' + c1 + '"/>' +
      '<stop offset="0.5" stop-color="' + mix(c1, c2, 0.5) + '"/>' +
      '<stop offset="1" stop-color="' + c2 + '"/></linearGradient>'

    const top = []
    const bottom = []
    for (let j = 0; j <= SAMPLES; j++) {
      const u = j / SAMPLES
      const x = -1.75 + u * 3.5
      // Vertex shader at t = 0: the three sine waves and the parabolic taper.
      const disp =
        Math.sin(u * Math.PI * 2 + phase) * amp * 0.4 +
        Math.sin(u * Math.PI * 4 + phase * 0.7) * amp * 0.15 +
        Math.cos(u * Math.PI * 1.5 + phase * 1.3) * amp * 0.25
      const hh = halfHeight * (1 + taper * (1 - 4 * (u - 0.5) * (u - 0.5)))
      top.push(un(x) + ' ' + un(disp + hh))
      bottom.push(un(x) + ' ' + un(disp - hh))
    }
    const d = 'M' + top.join('L') + 'L' + bottom.reverse().join('L') + 'Z'
    ribbons +=
      '<path transform="translate(0 ' + un(yOffset) + ') rotate(' + un(rotation) + ')" d="' + d +
      '" fill="url(#' + gid + ')" fill-opacity="' + un(opacity) + '"/>'
  }

  return svgRoot(
    W, H, filter,
    '<defs>' + defs + '</defs>' +
    '<rect width="' + px(W) + '" height="' + px(H) + '" fill="' + bg + '"/>' +
    '<g filter="url(#' + ids + 'f)">' +
    '<g transform="translate(' + px(W / 2) + ' ' + px(H / 2) + ') scale(' + px(W / 2) + ' ' + px(-H / 2) + ')">' +
    ribbons + '</g></g>' + vig.rect,
  )
}

/* ─────────────────────────────── dandelion ─────────────────────────────── */

function dandelionSvg(scene, colors, W, H, filter) {
  const cfg = scene.dandelionConfig || {}
  const palette = colors.length >= 2 ? colors : DANDELION_COLORS
  const centerY = num(cfg.centerY, 0.85)
  const spread = clamp(num(cfg.spread, 0.3), 0, 1)
  const rA = clamp(num(cfg.radiusMin, 0.1), 0, 2)
  const rB = clamp(num(cfg.radiusMax, 0.8), 0, 2)
  const radiusMin = Math.min(rA, rB)
  const radiusMax = Math.max(rA, rB)
  const lineCount = clamp(num(cfg.lineCount, 120), 0, 5000)
  const thickness = Math.max(0, num(cfg.thickness, 1.5))
  const dotSize = Math.max(0, num(cfg.dotSize, 3))
  const lineOpacity = clamp(num(cfg.lineOpacity, 0.8), 0, 1)
  const ids = idPrefix(configKey('dandelion', cfg, colors, W, H))

  const bg = radialBackground(cfg, palette, '#e8f4fc', '#fef3c7', true, ids, W, H)
  const vig = vignette(scene.effectsConfig, ids, W, H)
  const rays = lineCount > 0 ? clamp(Math.round(lineCount / 5), 8, DANDELION_MAX_RAYS) : 0
  const unit = H / VISIBLE_HEIGHT // px per world unit at z = 0
  const groupY = VISIBLE_HEIGHT / 2 - centerY * VISIBLE_HEIGHT // DandelionMesh group position
  const maxPolar = Math.PI * spread
  const rand = rng(23)
  // The line shader shows its colours (and the fog colour) unencoded, so the
  // lines are darker than their hex; the tip dots use a built-in material and
  // show the true hex.
  const fogLine = rawShaderHex(bg.fogColor)

  // Lines are far thinner than a pixel-blurred placeholder can show; widen
  // them and let the blur turn a handful of rays into a soft burst.
  const strokeWidth = clamp(thickness * 0.016 * unit * 2.5, 3, 12)
  const sigma = clamp(strokeWidth * 1.5, 6, 30)

  let shapes = ''
  for (let j = 0; j < rays; j++) {
    // generateLineData: polar angle spread over [0, π·spread] from straight up,
    // azimuth on the golden-angle spiral, random length in [radiusMin, radiusMax].
    const polar = (rays === 1 ? 0 : j / (rays - 1)) * maxPolar
    const azimuth = GOLDEN_ANGLE * j
    const dx = Math.sin(polar) * Math.cos(azimuth)
    const dy = Math.cos(polar)
    const dz = Math.sin(polar) * Math.sin(azimuth)
    const length = (radiusMin + rand() * (radiusMax - radiusMin)) * 6 // LINE_SCALE
    const color = palette[Math.floor(rand() * 4) % palette.length]

    const base = project(dx * 0.15, groupY + dy * 0.15, dz * 0.15, W, H)
    const tip = project(dx * length, groupY + dy * length, dz * length, W, H)
    // Scene fog (near 4, far 13) dims rays that point away from the camera.
    const fog = smoothstep(4, 13, CAMERA_Z - dz * length)
    const alpha = lineOpacity * (1 - fog)
    if (alpha <= 0.01) continue
    const stroke = mix(rawShaderHex(color), fogLine, fog)
    const dot = materialHex(mix(color, bg.fogColor, fog))
    const w = clamp(strokeWidth * (tip.scale / unit), 2, 24)
    shapes +=
      '<line x1="' + px(base.x) + '" y1="' + px(base.y) + '" x2="' + px(tip.x) + '" y2="' + px(tip.y) +
      '" stroke="' + stroke + '" stroke-width="' + px(w) + '" stroke-opacity="' + un(alpha) + '" stroke-linecap="round"/>' +
      '<circle cx="' + px(tip.x) + '" cy="' + px(tip.y) + '" r="' + px(Math.max(dotSize * 0.015 * tip.scale, w * 0.7)) +
      '" fill="' + dot + '" fill-opacity="' + un(alpha) + '"/>'
  }

  // Rays fade in from the centre toward their tips (the shader's vFade); a
  // radial mask reproduces that for all rays at once.
  const centre = project(0, groupY, 0, W, H)
  const maskR = Math.max(1, ((radiusMin + radiusMax) / 2) * 6 * unit)
  const defs =
    bg.defs + vig.defs +
    blurFilter(ids + 'f', sigma) +
    '<radialGradient id="' + ids + 'm" gradientUnits="userSpaceOnUse" cx="' + px(centre.x) + '" cy="' + px(centre.y) +
    '" r="' + px(maskR) + '"><stop offset="0" stop-color="#fff" stop-opacity="0.15"/>' +
    '<stop offset="1" stop-color="#fff" stop-opacity="1"/></radialGradient>' +
    '<mask id="' + ids + 'k" maskUnits="userSpaceOnUse" x="0" y="0" width="' + px(W) + '" height="' + px(H) + '">' +
    '<rect width="' + px(W) + '" height="' + px(H) + '" fill="url(#' + ids + 'm)"/></mask>'

  return svgRoot(
    W, H, filter,
    '<defs>' + defs + '</defs>' + bg.rect +
    (shapes ? '<g filter="url(#' + ids + 'f)"><g mask="url(#' + ids + 'k)">' + shapes + '</g></g>' : '') +
    vig.rect,
  )
}

/* ────────────────────────────── particleRing ────────────────────────────── */

function particleRingSvg(scene, colors, W, H, filter) {
  const cfg = scene.particleRingConfig || {}
  const palette = colors.length >= 2 ? colors : PARTICLE_RING_COLORS
  const ringRadius = clamp(num(cfg.ringRadius, 0.35), 0, 2)
  const ringWidth = clamp(num(cfg.ringWidth, 0.15), 0, 2)
  const dispersion = clamp(num(cfg.dispersion, 0.3), 0, 2)
  const particleSize = clamp(num(cfg.particleSize, 3), 0, 20)
  const particleCount = clamp(num(cfg.particleCount, 800), 0, 10000)
  const tiltX = num(cfg.tiltX, 0) * DEG2RAD
  const tiltZ = num(cfg.tiltZ, 0) * DEG2RAD
  const ids = idPrefix(configKey('particleRing', cfg, colors, W, H))

  const bg = radialBackground(cfg, palette, '#fef6f9', '#fef3c7', true, ids, W, H)
  const vig = vignette(scene.effectsConfig, ids, W, H)
  const dots = particleCount > 0 ? clamp(Math.round(particleCount / 20), 12, PARTICLE_MAX_DOTS) : 0
  const maxRadius = VISIBLE_HEIGHT / 2 // ParticleRingMesh: ring units → world
  const rand = rng(37)
  const cosX = Math.cos(tiltX)
  const sinX = Math.sin(tiltX)
  const cosZ = Math.cos(tiltZ)
  const sinZ = Math.sin(tiltZ)

  let shapes = ''
  let radiusSum = 0
  for (let i = 0; i < dots; i++) {
    // generateParticles, with angles stratified so few dots still ring evenly.
    const angle = ((i + rand() * 0.8) / dots) * Math.PI * 2
    const baseRadius = ringRadius + (rand() - 0.5) * ringWidth
    const dX = (rand() - 0.5) * dispersion
    const dY = (rand() - 0.5) * dispersion
    const dZ = (rand() - 0.5) * dispersion * 0.3
    const size = 0.5 + rand() * 0.5

    // Ring in the XZ plane, dispersion on all axes (useFrame at t = 0).
    const lx = (Math.cos(angle) * baseRadius + dX) * maxRadius
    const lz = (Math.sin(angle) * baseRadius + dZ) * maxRadius
    const ly = dY * maxRadius * 0.3
    const dist = Math.sqrt(lx * lx + ly * ly + lz * lz)
    const distFactor = 1 - Math.min(dist / maxRadius, 1)
    const scale = particleSize * size * 0.04 * (0.4 + distFactor * 1.2)

    // Group rotation (Euler XYZ, y = 0): rotate about z, then about x.
    const rx = lx * cosZ - ly * sinZ
    const ry = lx * sinZ + ly * cosZ
    const wx = rx
    const wy = ry * cosX - lz * sinX
    const wz = ry * sinX + lz * cosX
    const p = project(wx, wy, wz, W, H)
    const r = Math.max(4, scale * p.scale * 2.2)
    radiusSum += r

    // Colour runs around the ring, interpolating between neighbouring colours.
    const progress = angle / (Math.PI * 2)
    const idx = Math.floor(progress * palette.length) % palette.length
    const t = (progress * palette.length) % 1
    const color = materialHex(mix(palette[idx], palette[(idx + 1) % palette.length], t))
    shapes += '<circle cx="' + px(p.x) + '" cy="' + px(p.y) + '" r="' + px(r) + '" fill="' + color + '" fill-opacity="0.85"/>'
  }

  const sigma = dots ? clamp((radiusSum / dots) * 0.9, 4, 40) : 4
  return svgRoot(
    W, H, filter,
    '<defs>' + bg.defs + vig.defs + blurFilter(ids + 'f', sigma) + '</defs>' + bg.rect +
    (shapes ? '<g filter="url(#' + ids + 'f)">' + shapes + '</g>' : '') + vig.rect,
  )
}

/* ─────────────────────────────── guilloche ─────────────────────────────── */

function guillocheSvg(scene, colors, W, H, filter) {
  const cfg = scene.guillocheConfig || {}
  const palette = (colors.length >= 2 ? colors : GUILLOCHE_COLORS).map(materialHex) // LineBasicMaterial lines
  const scale = clamp(num(cfg.scale, 0.85), 0.05, 4)
  const lineOpacity = clamp(num(cfg.lineOpacity, 0.55), 0, 1)
  const intaglio = cfg.motif === 'intaglio'
  const tiltX = num(cfg.tiltX, 0) * DEG2RAD
  const ids = idPrefix(configKey('guilloche', cfg, colors, W, H))

  const bg = radialBackground(cfg, palette, '#101c3f', '#05070f', false, ids, W, H)
  const vig = vignette(scene.effectsConfig, ids, W, H)
  // Both motifs size their figure to 92% of the visible half-height × scale.
  const refR = (H / 2) * 0.92 * scale
  const sigma = clamp(refR * 0.08, 6, 40)
  const squash = Math.max(0.08, Math.abs(Math.cos(tiltX))) // the figure seen tilted about x
  const RINGS = 5

  let shapes = ''
  if (intaglio) {
    // Wave rows across the whole box…
    const rows = 6
    for (let r = 0; r < rows; r++) {
      const y = H / 2 + (r / (rows - 1) - 0.5) * H * 1.12
      shapes +=
        '<line x1="0" y1="' + px(y) + '" x2="' + px(W) + '" y2="' + px(y) + '" stroke="' + palette[r % palette.length] +
        '" stroke-width="' + px(Math.max(2, H * 0.02)) + '" stroke-opacity="' + un(lineOpacity * 0.3) + '"/>'
    }
    // …and the morphing ripple rings receding from start scale to end scale.
    const start = clamp(num(cfg.rippleStartScale, 0.3), 0, 4)
    const end = clamp(num(cfg.rippleEndScale, 1.25), 0, 4)
    for (let i = 0; i < RINGS; i++) {
      const t = i / (RINGS - 1)
      const r = (start + (end - start) * t) * refR
      if (r <= 0) continue
      shapes +=
        '<circle r="' + px(r) + '" fill="none" stroke="' + palette[i % palette.length] + '" stroke-width="' + px(Math.max(2, r * 0.12)) +
        '" stroke-opacity="' + un(lineOpacity * 0.6 * Math.max(0.18, 1 - t * 0.7)) + '"/>'
    }
  } else {
    // Rosette: the lacework fills a disc, densest toward its rim; the passes
    // cycle through the palette and the deeper ones dim.
    shapes += '<circle r="' + px(refR * 0.55) + '" fill="' + palette[0] + '" fill-opacity="' + un(lineOpacity * 0.15) + '"/>'
    for (let i = 0; i < RINGS; i++) {
      const t = i / (RINGS - 1)
      const r = refR * (0.5 + 0.5 * t)
      shapes +=
        '<circle r="' + px(r) + '" fill="none" stroke="' + palette[i % palette.length] + '" stroke-width="' + px(Math.max(2, refR * 0.14)) +
        '" stroke-opacity="' + un(lineOpacity * 0.6 * (1 - 0.5 * t)) + '"/>'
    }
  }

  return svgRoot(
    W, H, filter,
    '<defs>' + bg.defs + vig.defs + blurFilter(ids + 'f', sigma) + '</defs>' + bg.rect +
    '<g filter="url(#' + ids + 'f)"><g transform="translate(' + px(W / 2) + ' ' + px(H / 2) + ') scale(1 ' + un(squash) + ')">' +
    shapes + '</g></g>' + vig.rect,
  )
}

/* ─────────────────────────────── entry point ─────────────────────────────── */

/**
 * Build the placeholder markup for a (theme-resolved) `scene_data` object.
 *
 * @param {object|null} scene  scene_data; null/undefined gives neutral blobs
 * @param {number} width       the box the placeholder fills, in CSS px
 * @param {number} height
 * @returns {string} an <svg> element that fills its container
 */
export function buildPlaceholderSvg(scene, width, height) {
  const data = scene && typeof scene === 'object' ? scene : {}
  const type = typeof data.backgroundType === 'string' ? data.backgroundType : 'liquid'
  const colors = hexList(data.gradientConfig && data.gradientConfig.colors)
  const W = Math.max(1, Math.round(num(width, 1600)))
  const H = Math.max(1, Math.round(num(height, 900)))
  const filter = effectsFilter(data.effectsConfig, type)

  switch (type) {
    case 'aurora': return auroraSvg(data, colors, W, H, filter)
    case 'ribbon': return ribbonSvg(data, colors, W, H, filter)
    case 'dandelion': return dandelionSvg(data, colors, W, H, filter)
    case 'particleRing': return particleRingSvg(data, colors, W, H, filter)
    case 'guilloche': return guillocheSvg(data, colors, W, H, filter)
    default: return blobSvg(colors) // simple, liquid, fluid, waves — unchanged
  }
}
