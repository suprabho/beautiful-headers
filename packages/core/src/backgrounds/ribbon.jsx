/** Ribbon background (WebGL / three.js). Side-effect registration. */
import { registerBackground } from '../registry'
import RibbonLayer from '../components/RibbonLayer'

registerBackground('ribbon', (ctx) => {
  const r = ctx.scene.ribbonConfig || {}
  const g = ctx.scene.gradientConfig || {}
  return (
    <RibbonLayer
      config={r}
      paletteColors={g.colors}
      effectsConfig={ctx.effectsConfig}
      mousePos={ctx.mousePos}
      mouseIntensity={ctx.mouseIntensity}
      isPaused={ctx.isPaused}
    />
  )
})
