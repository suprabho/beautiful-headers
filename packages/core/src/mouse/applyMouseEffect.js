import { MOUSE_MAPPINGS } from './mouseMappings'

/**
 * Smooths mouse position using lerp with the layer's configured factor.
 * Mutates `smoothed` in place. Call once per frame.
 */
export function smoothMouse(smoothed, target, layerType) {
  const factor = MOUSE_MAPPINGS[layerType]?.lerpFactor ?? 0.08
  smoothed.x += (target.x - smoothed.x) * factor
  smoothed.y += (target.y - smoothed.y) * factor
}

/**
 * Given a layer type, smoothed mouse position (0-1), and mouseIntensity,
 * returns an object with computed effect values based on MOUSE_MAPPINGS.
 *
 * Supported effect types:
 *   positionOffset → { offsetX, offsetY }  (normalized, multiply by canvas size)
 *   phaseOffset    → { [param]: value }     (radians)
 *   amplitudeModulation → { [param]: multiplier }
 *   tilt           → { [param]: radians }
 *
 * Returns {} for unknown/custom effect types (those are applied in-layer).
 */
export function getMouseEffects(layerType, smoothedMouse, mouseIntensity) {
  const mapping = MOUSE_MAPPINGS[layerType]
  if (!mapping) return {}

  const results = {}

  for (const effect of mapping.effects) {
    const mx = (smoothedMouse.x - 0.5) * mouseIntensity
    const my = (smoothedMouse.y - 0.5) * mouseIntensity

    switch (effect.type) {
      case 'positionOffset':
        results[effect.param + 'OffsetX'] = mx * effect.strength
        results[effect.param + 'OffsetY'] = my * effect.strength
        break
      case 'phaseOffset':
        results[effect.param] = (effect.axis === 'x' ? mx : my) * effect.strength
        break
      case 'amplitudeModulation':
        results[effect.param] = 1 + (effect.axis === 'y' ? my : mx) * effect.strength
        break
      case 'tilt':
        results[effect.param] = (effect.axis === 'x' ? mx : my) * effect.strength
        break
      // 'custom' types are handled directly in each layer
    }
  }

  return results
}
