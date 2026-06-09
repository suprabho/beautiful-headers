/**
 * @aura/headers-pro — everything.
 *
 * Registers all four WebGL backgrounds plus the fluted-glass overlay, on top of
 * the Canvas2D/DOM backgrounds that core registers by default. Renders any
 * scene_data the Aura editor can produce.
 */
import '@aura/headers-core/backgrounds/liquid'
import '@aura/headers-core/backgrounds/ribbon'
import '@aura/headers-core/backgrounds/dandelion'
import '@aura/headers-core/backgrounds/particleRing'
import '@aura/headers-core/backgrounds/glass'
export * from '@aura/headers-core'
