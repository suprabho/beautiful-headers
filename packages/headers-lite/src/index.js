/**
 * @aura/headers-lite — no WebGL.
 *
 * Core registers the Canvas2D/DOM backgrounds (simple, aurora, fluid, waves)
 * on import. The four WebGL background types (liquid, ribbon, dandelion,
 * particleRing) are intentionally not registered here, so they fall back to
 * the SVG `ColorPlaceholder`. three.js is never pulled into this bundle.
 */
export * from '@aura/headers-core'
