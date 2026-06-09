/**
 * Fluted-glass overlay (WebGL / three.js). Registering this makes the Canvas2D
 * layers apply the glass distortion when a scene has `effectsConfig.flutedGlass.
 * enabled`. Without it (e.g. the `lite` build) the layers skip the effect.
 */
import { registerGlassOverlay } from '../registry'
import FlutedGlassCanvas from '../components/FlutedGlassCanvas'

registerGlassOverlay(FlutedGlassCanvas)
