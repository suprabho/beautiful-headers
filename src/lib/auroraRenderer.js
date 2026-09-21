// Drivers for the aurora scene (auroraScene.js): one runs the frame loop on
// the main thread, the other hands the canvas to a worker (OffscreenCanvas)
// so the drawing never competes with the page's own main-thread work — which,
// inside a same-process host page, is the host's scrolling and input handling.
// Both expose the same small interface, so <AuroraLayer> does not care which
// one it got.
//
// Worker mode is opt-in (the embed asks for it) and falls back to the main
// thread when the browser cannot do it: no OffscreenCanvas at all is known
// before the canvas is handed over; a worker without canvas filters or
// animation frames reports back and `onUnsupported` lets the caller start
// over on a fresh canvas (a transferred canvas cannot be drawn on again).

import { createAuroraScene, AUDIO_WIDTH_MAPPING } from './auroraScene'
import { audioData } from '../audio/audioData'
import AuroraWorker from './aurora.worker?worker'

export function supportsOffscreenRendering() {
  return (
    typeof window !== 'undefined' &&
    typeof Worker === 'function' &&
    typeof OffscreenCanvas === 'function' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.transferControlToOffscreen === 'function' &&
    // No canvas filters here means none in a worker either: stay put, the
    // main thread already renders the scene without its blur in that case.
    typeof CanvasRenderingContext2D !== 'undefined' &&
    'filter' in CanvasRenderingContext2D.prototype
  )
}

const documentVisible = () => typeof document === 'undefined' || !document.hidden

/**
 * @param {object} o
 * @param {HTMLCanvasElement} o.canvas  visible canvas, already in the DOM
 * @param {number} o.dpr
 * @param {object} o.state  initial { config, derived, mouse, mouseIntensity, paused }
 * @param {number|'auto'} [o.blurScale]  see createAuroraScene
 */
export function createMainThreadRenderer({ canvas, dpr, state, blurScale = 1 }) {
  const scene = createAuroraScene({
    canvas,
    createCanvas: (w, h) => {
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      return c
    },
    dpr,
    blurScale,
  })
  scene.setConfig(state.config)
  scene.setDerivedColors(state.derived)
  scene.setMouseIntensity(state.mouseIntensity)
  scene.setMouseTarget(state.mouse)
  scene.setPaused(state.paused)

  let raf = null
  let destroyed = false

  const animate = () => {
    raf = null
    if (destroyed || !documentVisible()) return
    // Mic input widens the lines; the analyser writes to the shared audioData.
    scene.setAudioWidthBoost(
      audioData.isActive && AUDIO_WIDTH_MAPPING ? (audioData[AUDIO_WIDTH_MAPPING.band] ?? 0) * AUDIO_WIDTH_MAPPING.weight : 0,
    )
    scene.frame()
    raf = requestAnimationFrame(animate)
  }

  const onVisibility = () => {
    if (documentVisible() && raf === null) raf = requestAnimationFrame(animate)
  }
  document.addEventListener('visibilitychange', onVisibility)

  return {
    mode: 'main',
    resize: (w, h) => scene.resize(w, h),
    setConfig: (c) => scene.setConfig(c),
    setDerivedColors: (d) => scene.setDerivedColors(d),
    setMouseTarget: (p) => scene.setMouseTarget(p),
    setMouseIntensity: (v) => scene.setMouseIntensity(v),
    setPaused: (v) => scene.setPaused(v),
    /** Draw the first frame right away, then keep going on animation frames. */
    start: () => {
      if (raf === null) animate()
    },
    destroy: () => {
      destroyed = true
      document.removeEventListener('visibilitychange', onVisibility)
      if (raf !== null) cancelAnimationFrame(raf)
      raf = null
      scene.destroy()
    },
  }
}

/**
 * Same interface, drawing in a worker. `onUnsupported(reason)` fires (once,
 * asynchronously) if the worker cannot render; the canvas is unusable by then.
 */
export function createWorkerRenderer({ canvas, dpr, state, blurScale = 1, onUnsupported }) {
  const worker = new AuroraWorker()
  let destroyed = false
  let failed = false
  let size = null

  const fail = (reason) => {
    if (failed || destroyed) return
    failed = true
    worker.terminate()
    if (onUnsupported) onUnsupported(reason)
  }
  worker.onmessage = (e) => {
    if (e.data?.type === 'unsupported') fail(e.data.reason)
  }
  worker.onerror = (e) => {
    fail(e?.message || 'worker error')
    if (e && typeof e.preventDefault === 'function') e.preventDefault()
  }

  const post = (m) => {
    if (!destroyed && !failed) worker.postMessage(m)
  }

  const onVisibility = () => post({ type: 'visible', value: documentVisible() })
  document.addEventListener('visibilitychange', onVisibility)

  const offscreen = canvas.transferControlToOffscreen()
  worker.postMessage(
    {
      type: 'init',
      canvas: offscreen,
      dpr,
      blurScale,
      config: state.config,
      derived: state.derived,
      mouse: state.mouse ? { x: state.mouse.x, y: state.mouse.y } : null,
      mouseIntensity: state.mouseIntensity,
      paused: state.paused,
      visible: documentVisible(),
      width: 0,
      height: 0,
    },
    [offscreen],
  )

  return {
    mode: 'worker',
    resize: (w, h) => {
      if (size && size.w === w && size.h === h) return
      size = { w, h }
      post({ type: 'resize', width: w, height: h })
    },
    setConfig: (c) => post({ type: 'config', config: c }),
    setDerivedColors: (d) => post({ type: 'colors', derived: d }),
    setMouseTarget: (p) => post({ type: 'mouse', pos: p ? { x: p.x, y: p.y } : null }),
    setMouseIntensity: (v) => post({ type: 'intensity', value: v }),
    setPaused: (v) => post({ type: 'paused', value: !!v }),
    start: () => {},
    destroy: () => {
      if (destroyed) return
      destroyed = true
      document.removeEventListener('visibilitychange', onVisibility)
      if (!failed) {
        worker.postMessage({ type: 'destroy' })
        worker.terminate()
      }
    },
  }
}
