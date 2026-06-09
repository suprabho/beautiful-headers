/** Dandelion background (WebGL / three.js). Side-effect registration. */
import { registerBackground } from '../registry'
import DandelionLayer from '../components/DandelionLayer'

registerBackground('dandelion', (ctx) => {
  const d = ctx.scene.dandelionConfig || {}
  const g = ctx.scene.gradientConfig || {}
  return (
    <DandelionLayer
      config={d}
      paletteColors={g.colors}
      effectsConfig={ctx.effectsConfig}
      mouseEnabled={ctx.mouseEnabled}
      mouseIntensity={ctx.mouseIntensity}
      isPaused={ctx.isPaused}
    />
  )
})
