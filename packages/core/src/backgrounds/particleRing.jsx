/** Particle-ring background (WebGL / three.js). Side-effect registration. */
import { registerBackground } from '../registry'
import ParticleRingLayer from '../components/ParticleRingLayer'

registerBackground('particleRing', (ctx) => {
  const p = ctx.scene.particleRingConfig || {}
  const g = ctx.scene.gradientConfig || {}
  return (
    <ParticleRingLayer
      config={p}
      paletteColors={g.colors}
      effectsConfig={ctx.effectsConfig}
      mousePos={ctx.mousePos}
      mouseIntensity={ctx.mouseIntensity}
      isPaused={ctx.isPaused}
    />
  )
})
