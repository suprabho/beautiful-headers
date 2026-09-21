// Worker side of the aurora renderer: owns the OffscreenCanvas transferred
// from <AuroraLayer>, runs the frame loop on the worker's own animation
// frames and applies whatever the main thread pushes (size, config, colours,
// cursor, pause/visibility). See auroraRenderer.js for the protocol.

import { createAuroraScene } from './auroraScene'

let scene = null
let raf = null
let visible = true
let stopped = false

const loop = () => {
  raf = null
  if (stopped || !visible) return
  scene.frame()
  raf = requestAnimationFrame(loop)
}

const start = () => {
  if (raf === null && !stopped && visible) raf = requestAnimationFrame(loop)
}

self.onmessage = (e) => {
  const m = e.data
  switch (m.type) {
    case 'init': {
      if (typeof OffscreenCanvas !== 'function' || typeof requestAnimationFrame !== 'function') {
        self.postMessage({ type: 'unsupported', reason: 'no OffscreenCanvas or requestAnimationFrame in worker' })
        return
      }
      let ctx
      try {
        ctx = m.canvas.getContext('2d')
        // The blur is the whole look: without canvas filters in this worker the
        // main thread (which was checked to have them) must render instead.
        if (!ctx || !('filter' in ctx)) throw new Error('no canvas filter support in worker')
        ctx.filter = 'blur(1px)'
        if (ctx.filter !== 'blur(1px)') throw new Error('no canvas filter support in worker')
        ctx.filter = 'none'
      } catch (err) {
        self.postMessage({ type: 'unsupported', reason: String(err && err.message ? err.message : err) })
        return
      }
      scene = createAuroraScene({
        canvas: m.canvas,
        createCanvas: (w, h) => new OffscreenCanvas(w, h),
        dpr: m.dpr,
      })
      scene.setConfig(m.config)
      scene.setDerivedColors(m.derived)
      scene.setMouseIntensity(m.mouseIntensity)
      scene.setMouseTarget(m.mouse)
      scene.setPaused(m.paused)
      visible = m.visible !== false
      if (m.width && m.height) scene.resize(m.width, m.height)
      self.postMessage({ type: 'ready' })
      start()
      break
    }
    case 'resize':
      scene?.resize(m.width, m.height)
      break
    case 'config':
      scene?.setConfig(m.config)
      break
    case 'colors':
      scene?.setDerivedColors(m.derived)
      break
    case 'mouse':
      scene?.setMouseTarget(m.pos)
      break
    case 'intensity':
      scene?.setMouseIntensity(m.value)
      break
    case 'paused':
      scene?.setPaused(m.value)
      break
    case 'audio':
      scene?.setAudioWidthBoost(m.boost)
      break
    case 'visible':
      visible = !!m.value
      if (visible) start()
      break
    case 'destroy':
      stopped = true
      if (raf !== null) cancelAnimationFrame(raf)
      raf = null
      scene?.destroy()
      scene = null
      self.close()
      break
    default:
      break
  }
}
