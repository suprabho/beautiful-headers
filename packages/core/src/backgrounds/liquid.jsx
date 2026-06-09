/** Liquid background (WebGL / three.js shader). Side-effect registration. */
import { registerBackground } from '../registry'
import GradientLayer from '../components/GradientLayer'

registerBackground('liquid', (ctx) => {
  const g = ctx.scene.gradientConfig || {}
  return (
    <GradientLayer
      config={g}
      effectsConfig={ctx.effectsConfig}
      mousePos={ctx.mousePos}
      mouseIntensity={ctx.mouseIntensity}
      isPaused={ctx.isPaused}
    />
  )
})
