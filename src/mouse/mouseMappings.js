// Centralized mouse-to-visual parameter mappings for each background type.
// Mirrors the structure of audio/audioMappings.js for consistency.
//
// lerpFactor: smoothing speed for mouse interpolation (higher = snappier)
// effects[]: list of mouse-driven effects per layer
//   param:    target parameter name
//   type:     'positionOffset' | 'phaseOffset' | 'amplitudeModulation' | 'tilt'
//   axis:     'x' | 'y' | 'both' — which mouse axis drives the effect
//   strength: multiplier applied to (mouse - 0.5) * mouseIntensity

export const MOUSE_MAPPINGS = {
  // --- Layers with simple, centralized mouse effects ---
  fluid: {
    lerpFactor: 0.08,
    effects: [
      { param: 'center', type: 'positionOffset', axis: 'both', strength: 0.15 },
    ],
  },
  waves: {
    lerpFactor: 0.08,
    effects: [
      { param: 'layerPhase', type: 'phaseOffset', axis: 'x', strength: Math.PI },
    ],
  },
  ribbon: {
    lerpFactor: 0.08,
    effects: [
      { param: 'u_speed', type: 'amplitudeModulation', axis: 'y', strength: 0.5 },
    ],
  },
  particleRing: {
    lerpFactor: 0.08,
    effects: [
      { param: 'tiltX', type: 'tilt', axis: 'y', strength: 0.4 },
      { param: 'tiltZ', type: 'tilt', axis: 'x', strength: 0.4 },
    ],
  },
  shapeTrail: {
    lerpFactor: 0.08,
    effects: [
      { param: 'center', type: 'positionOffset', axis: 'both', strength: 0.15 },
    ],
  },

  aurora: {
    lerpFactor: 0.05, // uses 1 - decaySpeed internally
    effects: [
      { param: 'width', type: 'proximity', axis: 'x', strength: 420 },
    ],
  },

  // --- Layers with custom mouse logic (mapping data only, applied in-layer) ---
  liquid: {
    lerpFactor: 0.08, // uses 1 - decaySpeed internally
    effects: [
      { param: 'u_mouse', type: 'custom', description: 'UV distortion with exp(-dist*1.5) falloff' },
    ],
  },
  tessellation: {
    lerpFactor: 0.1,
    effects: [
      { param: 'rotation', type: 'custom', description: 'atan2 rotation toward cursor, 300px linear falloff' },
    ],
  },
  dandelion: {
    lerpFactor: 0.05,
    effects: [
      { param: 'direction', type: 'custom', description: 'Quadratic repulsion within 0.35 NDC radius' },
    ],
  },
}
