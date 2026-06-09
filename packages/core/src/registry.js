/**
 * Background + overlay registry.
 *
 * This is what makes the "lite vs pro" split possible. Instead of `AuraHeader`
 * hardcoding `backgroundType === 'ribbon' && <RibbonLayer>` (which would pull
 * three.js into every build), backgrounds register themselves here. Each
 * published package imports only the background modules it ships, so the
 * bundler only includes the layer code (and three.js) that was actually
 * registered. Any `backgroundType` with no registered renderer falls back to
 * the SVG `ColorPlaceholder` in `AuraHeader`.
 *
 * A background entry is a render function `(ctx) => ReactNode`, where `ctx`
 * carries the resolved scene config + interaction state (see AuraHeader).
 */

const backgroundRegistry = new Map()
let glassOverlayComponent = null

/** Register (or replace) the renderer for a `backgroundType`. */
export function registerBackground(type, render) {
  backgroundRegistry.set(type, render)
}

/** Get the renderer for a `backgroundType`, or `null` if none is registered. */
export function getBackground(type) {
  return backgroundRegistry.get(type) || null
}

/** True if a renderer is registered for `type`. */
export function hasBackground(type) {
  return backgroundRegistry.has(type)
}

/** List every registered `backgroundType` (useful for diagnostics / docs). */
export function registeredBackgrounds() {
  return Array.from(backgroundRegistry.keys())
}

/**
 * Register the fluted-glass overlay component (WebGL). When absent — as in the
 * `lite` build — the Canvas2D layers simply skip the glass effect.
 */
export function registerGlassOverlay(component) {
  glassOverlayComponent = component
}

/** The registered glass overlay component, or `null`. */
export function getGlassOverlay() {
  return glassOverlayComponent
}
