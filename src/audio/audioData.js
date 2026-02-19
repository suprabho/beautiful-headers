// Module-level mutable ref — NOT React state, to avoid 60fps re-renders.
// Updated by useAudioAnalyser, read by every layer's animation loop.
// Works inside R3F <Canvas> (separate React reconciler) where Context doesn't propagate.

export const audioData = {
  // Normalized 0-1 values, smoothed
  bass: 0,
  mid: 0,
  treble: 0,
  amplitude: 0,

  // Raw frequency data (Uint8Array) for advanced use
  frequencyData: null,

  // Whether audio is currently active and providing data
  isActive: false,
}
