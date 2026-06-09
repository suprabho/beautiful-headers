/**
 * @aura/headers-core — shared internals bundled into each published package.
 *
 * Importing this entry registers the three.js-free Canvas2D/DOM backgrounds
 * (simple, aurora, fluid, waves). WebGL backgrounds register themselves via
 * the `./backgrounds/*` side-effect modules, which only the relevant packages
 * import — that's how `lite` stays free of three.js.
 */
import './backgrounds/canvas2d'

export { default as AuraHeader } from './AuraHeader'
export { default as ColorPlaceholder } from './components/ColorPlaceholder'

export {
  registerBackground,
  getBackground,
  hasBackground,
  registeredBackgrounds,
  registerGlassOverlay,
  getGlassOverlay,
} from './registry'

export { useColorModeValue } from './useColorMode'
export { resolveThemedConfigs, deepMerge, computeOverrideDiff } from './lib/themeUtils'
export { audioData } from './audio/audioData'
