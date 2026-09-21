// The aurora background's drawing, independent of React and of the thread it
// runs on: <AuroraLayer> drives it on the main thread with an HTMLCanvasElement
// (src/lib/auroraRenderer.js), aurora.worker.js drives it in a worker with an
// OffscreenCanvas. Everything the frame loop needs is set up front or pushed in
// through setters, so the per-frame work is the drawing itself.
//
// The picture is the one the original renderer painted (same scene, colours,
// blur, resolution and motion); what changed is how much work a frame does:
//  - a line's gradient is built once, when the line (re)spawns, and its fade is
//    applied with globalAlpha instead of rebuilding three colour stops per line
//    per frame. Identical maths: the stops share one colour, so interpolating
//    them only scales alpha, which globalAlpha scales the same way;
//  - the mapping lookups happen once, at module load, not per frame; the
//    per-line save/restore and closePath went (every property a line sets is
//    set again by the next one);
//  - the line layer is only as large as the part of it that reaches the
//    screen, and lines outside it are not drawn (see "Compositing" below);
//  - the canvases are resized and the lines rebuilt only when the size or the
//    line count really changed (the mount used to rebuild twice, and any
//    ResizeObserver notification rebuilt everything even at the same size);
//  - while paused (out of view / reduced motion) nothing is redrawn unless a
//    pending mouse or config change would alter the frame;
//  - as an opt-in (`blurScale`), the lines are rasterised and blurred at a
//    lower resolution than the visible canvas. Off by default: it is not
//    pixel-faithful (measured against the previous renderer it stays within
//    about 10/255, with a mean under one level, where the default path stays
//    within 2/255), but it halves or quarters the blur's cost.
//
// Compositing. The visible canvas B has its context scaled by the device pixel
// ratio and the line layer A is drawn onto it with drawImage(A, 0, 0), i.e. at
// A's pixel size in *logical* units. So on a DPR-2 display B shows the top-left
// quarter of A, magnified 2x. The blur, `blur(<amount>px)` on B's context, is
// applied in B's device pixels whatever the transform (Chromium ignores the
// CTM for canvas filters), so its sigma is <amount> device pixels: relative to
// the magnified lines it is half as wide on DPR 2 as on DPR 1. That is what
// every aurora scene has always looked like (the studio and the thumbnails
// were made on DPR-2 screens), so it is reproduced exactly: the "visible
// region" below is (logicalWidth / dpr) x (logicalHeight / dpr) of the logical
// scene, plus the blur's reach, and nothing outside it can affect a pixel of B.

import { AUDIO_MAPPINGS } from '../audio/audioMappings'
import { MOUSE_MAPPINGS } from '../mouse/mouseMappings'

// The two per-frame lookups the old loop did with Array.prototype.find.
const AUDIO_WIDTH = AUDIO_MAPPINGS.aurora?.find((m) => m.param === 'width') || null
const MOUSE_WIDTH = MOUSE_MAPPINGS.aurora?.effects?.find((e) => e.param === 'width') || null
const MOUSE_LERP = MOUSE_MAPPINGS.aurora?.lerpFactor ?? 0.08

/** The audio band + weight that widens lines; read by the main-thread driver. */
export const AUDIO_WIDTH_MAPPING = AUDIO_WIDTH

const DEFAULT_BLUR = 13
// The studio's slider stops at 50; sizing the line layer for that keeps blur
// changes from resizing it (only bigger values, from hand-edited JSON, do).
const MARGIN_BLUR = 50
// Reduced-resolution blur ('auto'): halve the resolution while at least this
// many intermediate pixels of blur sigma remain, so the resampling stays far
// below the blur's own footprint; power-of-two scales resample more evenly
// than fractional ones. Never below this fraction of the visible canvas.
const MIN_SIGMA_PX = 6
const MIN_SCALE = 0.25

const getRandomInt = (random, min, max) => Math.round(random() * (max - min)) + min

const fadeInOut = (t, m) => {
  const hm = 0.5 * m
  return Math.abs((t + hm) % m - hm) / hm
}

/** Line count for a config at a logical width (0 = derived from the width). */
export function auroraLineCount(cfg, logicalWidth) {
  const lineCount = cfg.lineCount ?? 0
  if (lineCount > 0) return lineCount
  const count = Math.floor((logicalWidth / (cfg.width ?? 20)) * 5)
  return Number.isFinite(count) ? count : 0
}

/**
 * Resolution of the blur stage relative to the visible canvas, for a blur
 * amount at a device pixel ratio. At scale 1 the blur's sigma is amount / dpr
 * pixels of the line layer (see "Compositing"); the stage shrinks only as far
 * as keeps MIN_SIGMA_PX of it.
 */
export function auroraBlurScale(blurAmount, dpr = 1) {
  if (!(blurAmount > 0)) return 1
  let scale = 1
  while (scale / 2 >= MIN_SCALE && (blurAmount * (scale / 2)) / dpr >= MIN_SIGMA_PX) scale /= 2
  return scale
}

/**
 * @param {object} o
 * @param {HTMLCanvasElement|OffscreenCanvas} o.canvas  the visible canvas
 * @param {(w: number, h: number) => HTMLCanvasElement|OffscreenCanvas} o.createCanvas
 *   scratch canvas factory for this thread
 * @param {number} [o.dpr]  device pixel ratio (already capped by the caller)
 * @param {() => number} [o.random]  RNG (injectable so frames can be reproduced)
 * @param {number|'auto'} [o.blurScale]  resolution of the line/blur stage
 *   relative to the visible canvas: 1 (default) renders exactly as before,
 *   'auto' picks a lower one from the blur amount (see auroraBlurScale)
 */
export function createAuroraScene({ canvas, createCanvas, dpr = 1, random = Math.random, blurScale = 1 }) {
  const canvasB = canvas
  const ctxB = canvasB.getContext('2d')
  // A: the lines, transparent, additive. C: bg + blurred A, only used when the
  // blur stage runs below the visible canvas's resolution.
  const canvasA = createCanvas(1, 1)
  const ctxA = canvasA.getContext('2d')
  let canvasC = null
  let ctxC = null

  let config = {}
  let derived = null // { hues, backgroundColor } from the palette, or null
  let mouseIntensity = 1
  let paused = false
  let audioWidthBoost = 0
  let logicalWidth = 0
  let logicalHeight = 0
  let lines = []
  let frames = 0
  // Something changed that the next frame must reflect even while paused.
  let dirty = true

  // Layout of the line layer (see "Compositing" above), in logical units.
  let scale = 1 // resolution of A (and C) relative to the visible canvas
  let visW = 0 // logical size of the visible region
  let visH = 0
  let extW = 0 // logical size of A: the visible region plus the blur's reach
  let extH = 0
  let marginFor = -1 // blur amount the current margin was sized for

  // Mouse, as before: `current` eases toward `target` every frame; both are
  // null while mouse interaction is disabled.
  let currentMouse = { x: 0.5, y: 0.5 }
  let targetMouse = { x: 0.5, y: 0.5 }

  const blurAmount = () => config.blurAmount ?? DEFAULT_BLUR

  const getHue = () => {
    if (derived?.hues && derived.hues.length > 0) {
      return derived.hues[Math.floor(random() * derived.hues.length)]
    }
    const hueStart = config.hueStart ?? 120
    const hueEnd = config.hueEnd ?? 180
    return getRandomInt(random, hueStart, hueEnd)
  }

  // Same draws of the RNG, in the same order, as the old Line.reset()/update().
  const spawn = (line) => {
    const width = config.width ?? 20
    const minHeight = config.minHeight ?? 200
    const maxHeight = config.maxHeight ?? 600
    const ttl = config.ttl ?? 200

    line.x = getRandomInt(random, 0, logicalWidth)
    line.width = width
    line.height = getRandomInt(random, minHeight, maxHeight)
    line.hue = getHue()
    line.ttl = getRandomInt(random, Math.round(ttl * 0.8), Math.round(ttl * 1.2))
    line.top = logicalHeight - line.height

    // Built once per lifetime. The fade that used to sit in the middle stop is
    // applied per frame through globalAlpha instead.
    const gradient = ctxA.createLinearGradient(line.x, line.top, line.x, logicalHeight)
    const color = `hsla(${line.hue}, 100%, 65%, `
    gradient.addColorStop(0, color + '0)')
    gradient.addColorStop(0.5, color + '1)')
    gradient.addColorStop(1, color + '0)')
    line.gradient = gradient
  }

  const initLines = () => {
    const count = auroraLineCount(config, logicalWidth)
    const next = new Array(count)
    for (let i = 0; i < count; i++) {
      const line = { x: 0, top: 0, width: 0, height: 0, hue: 0, ttl: 0, life: 0, gradient: null }
      spawn(line)
      next[i] = line
    }
    lines = next
    dirty = true
  }

  const rebuildIfCountChanged = () => {
    if (logicalWidth > 0 && lines.length !== auroraLineCount(config, logicalWidth)) initLines()
  }

  // Size A (and C) for the current logical size, blur and scale. Returns true
  // when a canvas was (re)allocated, which resets its context state.
  const layout = () => {
    const blur = blurAmount()
    const wanted = Math.max(MARGIN_BLUR, blur)
    scale = blurScale === 'auto' ? auroraBlurScale(blur, dpr) : blurScale
    visW = logicalWidth / dpr
    visH = logicalHeight / dpr
    // The blur reaches about 3 sigma; sigma is the blur amount in B's device
    // pixels, i.e. amount / dpr^2 logical px (see "Compositing"). 4 sigma plus
    // a few pixels covers both the CPU and the GPU kernels with room to spare.
    const margin = (4 * wanted + 4) / (dpr * dpr)
    extW = Math.min(logicalWidth, visW + margin)
    extH = Math.min(logicalHeight, visH + margin)
    marginFor = wanted

    const sA = dpr * scale
    const pw = Math.ceil(extW * sA)
    const ph = Math.ceil(extH * sA)
    let changed = false
    if (canvasA.width !== pw || canvasA.height !== ph) {
      canvasA.width = pw
      canvasA.height = ph
      changed = true
    }
    ctxA.setTransform(sA, 0, 0, sA, 0, 0)
    if (scale < 1) {
      if (!canvasC) {
        canvasC = createCanvas(pw, ph)
        ctxC = canvasC.getContext('2d')
      } else if (canvasC.width !== pw || canvasC.height !== ph) {
        canvasC.width = pw
        canvasC.height = ph
      }
      ctxC.setTransform(sA, 0, 0, sA, 0, 0)
    }
    return changed
  }

  const scene = {
    /** Logical (CSS px) size. A no-op when unchanged. */
    resize(width, height) {
      if (width === logicalWidth && height === logicalHeight) return
      logicalWidth = width
      logicalHeight = height
      canvasB.width = width * dpr
      canvasB.height = height * dpr
      ctxB.setTransform(dpr, 0, 0, dpr, 0, 0)
      layout()
      initLines()
      // Paint right away so the resized canvas is never shown blank, and
      // leave the composite operation as a fresh context has it: as before,
      // the first animated frame after a resize draws source-over, the ones
      // after it add up (see the end of paint()).
      scene.paint(false)
      ctxA.globalCompositeOperation = 'source-over'
    },

    setConfig(next) {
      config = next || {}
      dirty = true
      if (logicalWidth > 0) {
        const wanted = Math.max(MARGIN_BLUR, blurAmount())
        if (wanted !== marginFor || (blurScale === 'auto' && auroraBlurScale(blurAmount(), dpr) !== scale)) layout()
      }
      rebuildIfCountChanged()
    },

    /** { hues, backgroundColor } derived from the palette, or null. */
    setDerivedColors(next) {
      derived = next || null
      dirty = true
    },

    /** Normalised cursor position, or null to disable mouse interaction. */
    setMouseTarget(pos) {
      if (!pos) {
        targetMouse = null
        currentMouse = null
      } else {
        if (!currentMouse) currentMouse = { x: 0.5, y: 0.5 }
        targetMouse = pos
      }
      dirty = true
    },

    setMouseIntensity(v) {
      mouseIntensity = v
      dirty = true
    },

    setPaused(v) {
      paused = !!v
    },

    /** Extra line width from the audio analyser (0 when the mic is off). */
    setAudioWidthBoost(v) {
      if (v === audioWidthBoost) return
      audioWidthBoost = v
      dirty = true
    },

    /**
     * Advance and draw one frame. Returns false when the frame was skipped
     * because the scene is paused and nothing on screen would change.
     */
    frame() {
      if (!logicalWidth || !logicalHeight) return false

      const mouseActive = !!(currentMouse && targetMouse)
      if (paused && !dirty) {
        // Paused: only a cursor still easing toward its target changes the
        // picture. Below a quarter of a pixel that is invisible, so settle
        // there and stop redrawing.
        if (!mouseActive) return false
        const dx = targetMouse.x - currentMouse.x
        const dy = targetMouse.y - currentMouse.y
        if (Math.abs(dx) * logicalWidth < 0.25 && Math.abs(dy) * logicalHeight < 0.25) {
          if (dx === 0 && dy === 0) return false
          currentMouse.x = targetMouse.x
          currentMouse.y = targetMouse.y
        }
      }
      scene.paint(!paused)
      return true
    },

    /** Draw the current state; `advance` also moves the animation one step. */
    paint(advance) {
      if (!logicalWidth || !logicalHeight) return
      dirty = false

      const mouseActive = !!(currentMouse && targetMouse)
      if (mouseActive) {
        currentMouse.x += (targetMouse.x - currentMouse.x) * MOUSE_LERP
        currentMouse.y += (targetMouse.y - currentMouse.y) * MOUSE_LERP
      }

      const cursorX = mouseActive ? currentMouse.x * logicalWidth : -9999
      const mouseRadius = logicalWidth * 0.2
      const mouseStrength = mouseActive && MOUSE_WIDTH ? MOUSE_WIDTH.strength * mouseIntensity : 0
      const proximity = cursorX >= 0 && mouseStrength > 0

      // Clear (and below, fill) past the logical extent: the pixel size is
      // rounded up, and a fractional edge would only be partly cleared.
      ctxA.clearRect(0, 0, extW + 2, extH + 2)

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (advance) {
          line.life++
          if (line.life > line.ttl) {
            line.life = 0
            spawn(line)
          }
        }

        let lineWidth = line.width + audioWidthBoost
        if (proximity) {
          const influence = 1 - Math.abs(line.x - cursorX) / mouseRadius
          if (influence > 0) lineWidth += influence * mouseStrength
        }
        // A non-positive width is ignored by the canvas and leaves the default 1.
        if (!(lineWidth > 0)) lineWidth = 1

        // Outside the part of the layer that reaches the screen: nothing to draw.
        if (line.top >= extH || line.x - lineWidth * 0.5 >= extW) continue

        ctxA.globalAlpha = fadeInOut(line.life, line.ttl)
        ctxA.strokeStyle = line.gradient
        ctxA.lineWidth = lineWidth
        ctxA.beginPath()
        ctxA.moveTo(line.x, line.top)
        ctxA.lineTo(line.x, logicalHeight)
        ctxA.stroke()
      }
      ctxA.globalAlpha = 1
      // As before: lines add up from the second frame on (and again after a
      // resize, which resets the context).
      ctxA.globalCompositeOperation = 'lighter'

      const background = config.backgroundColor ?? derived?.backgroundColor ?? '#000000'
      const blur = blurAmount()
      if (scale === 1) {
        ctxB.filter = 'none'
        ctxB.fillStyle = background
        ctxB.fillRect(0, 0, logicalWidth, logicalHeight)
        ctxB.filter = `blur(${blur}px)`
        ctxB.drawImage(canvasA, 0, 0)
      } else {
        // Blur at A's resolution with the same sigma in logical units: amount
        // device px of B is amount / dpr^2 logical px, i.e. amount * scale / dpr
        // pixels of C (filters are in device px, see "Compositing"). Then scale
        // the visible region up onto B.
        const sA = dpr * scale
        ctxC.filter = 'none'
        ctxC.fillStyle = background
        ctxC.fillRect(0, 0, extW + 2, extH + 2)
        ctxC.filter = `blur(${(blur * scale) / dpr}px)`
        // A's pixel size in logical units, so the copy is exactly 1:1.
        ctxC.drawImage(canvasA, 0, 0, canvasA.width / sA, canvasA.height / sA)
        ctxB.filter = 'none'
        ctxB.drawImage(canvasC, 0, 0, visW * sA, visH * sA, 0, 0, logicalWidth, logicalHeight)
      }

      frames++
    },

    get frames() {
      return frames
    },

    destroy() {
      lines = []
      canvasA.width = 1
      canvasA.height = 1
      if (canvasC) {
        canvasC.width = 1
        canvasC.height = 1
      }
    },
  }

  return scene
}
