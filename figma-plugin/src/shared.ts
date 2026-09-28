// Types shared by the plugin's main thread (code.ts) and its UI (ui/*).

/** Render options forwarded to /scenes/:slug/capture.png. */
export interface RenderOptions {
  hideText: boolean
  hideIcons: boolean
  theme: 'dark' | 'light'
  /** Requested supersampling; clamped per node so the image stays ≤ 4096 px. */
  dpr: 1 | 2 | 3
}

/** What we remember on a node so it can be re-rendered after a resize. */
export interface AuraNodeData {
  slug: string
  title: string
  options: RenderOptions
}

/** A selected layer that can take an image fill. */
export interface Target {
  id: string
  name: string
  width: number
  height: number
  /** Present when the layer already carries an Aura background. */
  aura: AuraNodeData | null
}

export type MainToUi =
  | { type: 'selection'; targets: Target[]; unsupported: number }
  | { type: 'frame-created'; target: Target }
  /** Launched from a layer's "Refresh" relaunch button: re-render these, then close. */
  | { type: 'refresh'; targets: Target[] }

export type UiToMain =
  /** The UI has mounted and is listening; the main thread sends its initial state. */
  | { type: 'ready' }
  | { type: 'create-frame'; width: number; height: number; name: string }
  | {
      type: 'apply-image'
      nodeIds: string[]
      bytes: Uint8Array
      data: AuraNodeData
      /** A quick thumbnail shown while the full render is on its way. */
      preview: boolean
    }
  | { type: 'notify'; message: string; error?: boolean }
  | { type: 'done'; message?: string }
