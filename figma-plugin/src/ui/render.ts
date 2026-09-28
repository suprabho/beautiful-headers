// Drives a render: paints the scene's thumbnail into the layers straight away,
// then swaps in the real render at each layer's exact size. Scenes render
// locally in an embed iframe first, with the capture endpoint as a fallback.
// Layers that share a size share one render.

import type { AuraNodeData, Target, UiToMain } from '../shared'
import { captureUrl, fetchBytes } from './api'
import { renderLocally } from './localRender'

export function postToMain(msg: UiToMain) {
  parent.postMessage({ pluginMessage: msg }, '*')
}

export interface RenderJob {
  targets: Target[]
  data: AuraNodeData
  /** Thumbnail URL for the instant preview, if the scene has one. */
  previewUrl?: string | null
}

export async function renderToLayers(
  { targets, data, previewUrl }: RenderJob,
  onProgress?: (done: number, total: number) => void,
): Promise<{ failed: number; errors: string[] }> {
  const groups = new Map<string, { width: number; height: number; nodeIds: string[] }>()
  for (const t of targets) {
    const url = captureUrl(data.slug, t.width, t.height, data.options)
    const group = groups.get(url) || { width: t.width, height: t.height, nodeIds: [] }
    group.nodeIds.push(t.id)
    groups.set(url, group)
  }

  // Renders start right away; each one waits for the preview to land before
  // posting, so a slow thumbnail can never overwrite a finished render.
  const preview = previewUrl
    ? fetchBytes(previewUrl)
        .then((bytes) => {
          postToMain({ type: 'apply-image', nodeIds: targets.map((t) => t.id), bytes, data, preview: true })
        })
        .catch(() => {
          // Preview is best-effort; the real render follows regardless.
        })
    : Promise.resolve()

  let done = 0
  const errors: string[] = []
  onProgress?.(0, groups.size)
  await Promise.all(
    [...groups].map(async ([url, { width, height, nodeIds }]) => {
      try {
        const bytes = await renderLocally(data.slug, width, height, data.options).catch((err) => {
          console.warn(`[aura] local render failed (${(err as Error).message}); using the capture endpoint`)
          return fetchBytes(url)
        })
        await preview
        postToMain({ type: 'apply-image', nodeIds, bytes, data, preview: false })
      } catch (err) {
        errors.push((err as Error).message)
      } finally {
        onProgress?.(++done, groups.size)
      }
    }),
  )
  return { failed: errors.length, errors }
}

/**
 * Re-render layers that already carry an Aura background, each with its own
 * stored scene and options, at the layer's current size.
 */
export async function rerenderLayers(targets: Target[]): Promise<string[]> {
  const bySlug = new Map<string, Target[]>()
  for (const t of targets) {
    if (!t.aura) continue
    const key = JSON.stringify(t.aura)
    bySlug.set(key, [...(bySlug.get(key) || []), t])
  }
  const results = await Promise.all(
    [...bySlug.values()].map((group) => renderToLayers({ targets: group, data: group[0].aura! })),
  )
  return results.flatMap((r) => r.errors)
}
