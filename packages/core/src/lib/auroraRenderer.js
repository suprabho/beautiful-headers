// Main-thread driver for the aurora scene (auroraScene.js): owns the frame
// loop and the visibility handling, and feeds the mic analyser's band into the
// line width. Mirrors src/lib/auroraRenderer.js in the app, minus the worker
// driver (the packages are bundled with tsup, which has no worker entry).

import { createAuroraScene, AUDIO_WIDTH_MAPPING } from './auroraScene'
import { audioData } from '../audio/audioData'

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
