import type { ComponentType, CSSProperties, ReactNode } from 'react'

/** Interaction source for a header. */
export type AuraInput = 'off' | 'mouse' | 'mic'

/** Color-mode handling. 'auto' detects parent-frame messages + system theme. */
export type AuraColorMode = 'auto' | 'dark' | 'light' | 'default'

/** Props for the fallback component used when a background is not registered. */
export interface AuraFallbackProps {
  colors?: string[]
  className?: string
  style?: CSSProperties
}

export interface AuraHeaderProps {
  /** The `scene_data` object produced by the Aura editor. */
  config: Record<string, unknown> | null | undefined
  /** Interaction source (default 'mouse'). */
  input?: AuraInput
  /** Color mode (default 'auto'). */
  colorMode?: AuraColorMode
  /** Hide the text layer (default false). */
  hideText?: boolean
  /** Hide the tessellation / icon layer (default false). */
  hideIcons?: boolean
  /** Freeze animation (default false). */
  paused?: boolean
  /** Component rendered for backgrounds with no registered renderer. */
  fallback?: ComponentType<AuraFallbackProps>
  className?: string
  /** Applied to the root element — set the header height here. */
  style?: CSSProperties
}

/** Renders an animated header background from a scene_data config. */
export const AuraHeader: ComponentType<AuraHeaderProps>

/** SVG palette placeholder — the default fallback for unregistered backgrounds. */
export const ColorPlaceholder: ComponentType<AuraFallbackProps>

/** A background renderer receives the resolved scene context and returns a node. */
export type BackgroundRenderer = (ctx: {
  scene: Record<string, any>
  effectsConfig: Record<string, any>
  paletteColors?: string[]
  mousePos: { x: number; y: number }
  mouseIntensity: number
  mouseEnabled: boolean
  isPaused: boolean
}) => ReactNode

export function registerBackground(type: string, render: BackgroundRenderer): void
export function getBackground(type: string): BackgroundRenderer | null
export function hasBackground(type: string): boolean
export function registeredBackgrounds(): string[]
export function registerGlassOverlay(component: ComponentType<any>): void
export function getGlassOverlay(): ComponentType<any> | null

export function useColorModeValue(colorMode?: AuraColorMode): 'dark' | 'light' | null
export function resolveThemedConfigs(sceneData: Record<string, any>, mode: 'dark' | 'light' | null): Record<string, any>
export function deepMerge<T>(base: T, overrides: Partial<T>): T
export function computeOverrideDiff(base: Record<string, any>, edited: Record<string, any>): Record<string, any>

export const audioData: {
  bass: number
  mid: number
  treble: number
  amplitude: number
  frequencyData: Uint8Array | null
  isActive: boolean
}
