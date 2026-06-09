/**
 * Canvas2D / DOM backgrounds — three.js-free. Imported as a side effect by the
 * core entry, so every package (including `lite`) ships these. Each renderer
 * pulls its config slice out of the shared `ctx` built in AuraHeader.
 */
import { registerBackground } from '../registry'
import SimpleGradientLayer from '../components/SimpleGradientLayer'
import AuroraLayer from '../components/AuroraLayer'
import FluidGradientLayer from '../components/FluidGradientLayer'
import WavesLayer from '../components/WavesLayer'

registerBackground('simple', (ctx) => {
  const g = ctx.scene.gradientConfig || {}
  return <SimpleGradientLayer config={g} gradientColors={g.colors} effectsConfig={ctx.effectsConfig} />
})

registerBackground('aurora', (ctx) => {
  const a = ctx.scene.auroraConfig || {}
  const g = ctx.scene.gradientConfig || {}
  return (
    <AuroraLayer
      config={a}
      paletteColors={g.colors}
      effectsConfig={ctx.effectsConfig}
      mousePos={ctx.mousePos}
      mouseIntensity={ctx.mouseIntensity}
      isPaused={ctx.isPaused}
    />
  )
})

registerBackground('fluid', (ctx) => {
  const f = ctx.scene.fluidConfig || {}
  const g = ctx.scene.gradientConfig || {}
  return (
    <FluidGradientLayer
      config={f}
      paletteColors={g.colors}
      effectsConfig={ctx.effectsConfig}
      mousePos={ctx.mousePos}
      mouseIntensity={ctx.mouseIntensity}
      isPaused={ctx.isPaused}
    />
  )
})

registerBackground('waves', (ctx) => {
  const w = ctx.scene.wavesConfig || {}
  const g = ctx.scene.gradientConfig || {}
  return (
    <WavesLayer
      config={w}
      paletteColors={g.colors}
      effectsConfig={ctx.effectsConfig}
      mousePos={ctx.mousePos}
      mouseIntensity={ctx.mouseIntensity}
      isPaused={ctx.isPaused}
    />
  )
})
