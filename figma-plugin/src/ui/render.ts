// Drives a render: paints the scene's thumbnail into the layers straight away,
// upgrades it to the shared server render (see masterUrl) when that arrives
// first, then swaps in the real render at each layer's exact size. Scenes
// render locally in an embed iframe first, falling back to the server. Layers
// that share a size share one render. Every step has a time limit, so a render
// always ends in an image or an error.

import type { AuraNodeData, Target, UiToMain } from '../shared'
import { captureUrl, fetchBytes, masterUrl } from './api'
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

export interface RenderProgress {
  done: number
  total: number
  /** A device render failed, so at least one layer is waiting on the server. */
  server: boolean
}

export interface RenderResult {
  failed: number
  errors: string[]
  /** Layer groups filled with the shared server render (cropped) instead of an exact one. */
  approximate: number
}

const PREVIEW_TIMEOUT = 15_000

// How good the image currently in a group's layers is. Each group only ever
// moves up, so a slow thumbnail can never overwrite a finished render.
const THUMB = 1
const MASTER = 2
const FINAL = 3

interface Group {
  width: number
  height: number
  nodeIds: string[]
  exactUrl: string
  masterUrl: string | null
  level: number
}

export async function renderToLayers(
  { targets, data, previewUrl }: RenderJob,
  onProgress?: (progress: RenderProgress) => void,
): Promise<RenderResult> {
  const groups = new Map<string, Group>()
  for (const t of targets) {
    const exactUrl = captureUrl(data.slug, t.width, t.height, data.options)
    const group = groups.get(exactUrl) || {
      width: t.width,
      height: t.height,
      nodeIds: [],
      exactUrl,
      masterUrl: masterUrl(data.slug, t.width, t.height, data.options),
      level: 0,
    }
    group.nodeIds.push(t.id)
    groups.set(exactUrl, group)
  }

  const paint = (group: Group, bytes: Uint8Array, level: number) => {
    if (level <= group.level) return
    group.level = level
    postToMain({ type: 'apply-image', nodeIds: group.nodeIds, bytes, data, preview: level < FINAL })
  }

  // Previews are best-effort: failures are ignored and the real render follows.
  if (previewUrl) {
    fetchBytes(previewUrl, { timeoutMs: PREVIEW_TIMEOUT })
      .then((bytes) => groups.forEach((g) => paint(g, bytes, THUMB)))
      .catch(() => {})
  }

  // The shared server render starts right away: it upgrades the thumbnail and
  // is ready (or nearly) if the device render fails. Aborted once every group
  // is done; the server still finishes and caches it for next time.
  const stopMasters = new AbortController()
  const masters = new Map<string, Promise<Uint8Array>>()
  for (const g of groups.values()) {
    if (!g.masterUrl || masters.has(g.masterUrl)) continue
    const url = g.masterUrl
    const request = fetchBytes(url, { signal: stopMasters.signal })
    request
      .then((bytes) => groups.forEach((other) => other.masterUrl === url && paint(other, bytes, MASTER)))
      .catch(() => {})
    masters.set(url, request)
  }

  let done = 0
  let server = false
  let approximate = 0
  const errors: string[] = []
  const report = () => onProgress?.({ done, total: groups.size, server })
  report()

  await Promise.all(
    [...groups.values()].map(async (group) => {
      try {
        let bytes: Uint8Array
        try {
          bytes = await renderLocally(data.slug, group.width, group.height, data.options)
        } catch (err) {
          console.warn(`[aura] local render failed (${(err as Error).message}); using the server render`)
          server = true
          report()
          const master = group.masterUrl ? masters.get(group.masterUrl) : undefined
          if (master) {
            bytes = await master
            approximate++
          } else {
            bytes = await fetchBytes(group.exactUrl)
          }
        }
        paint(group, bytes, FINAL)
      } catch (err) {
        errors.push((err as Error).message)
      } finally {
        done++
        report()
      }
    }),
  )
  stopMasters.abort()
  return { failed: errors.length, errors, approximate }
}

/**
 * Re-render layers that already carry an Aura background, each with its own
 * stored scene and options, at the layer's current size.
 */
export async function rerenderLayers(targets: Target[], onProgress?: (progress: RenderProgress) => void) {
  const bySlug = new Map<string, Target[]>()
  for (const t of targets) {
    if (!t.aura) continue
    const key = JSON.stringify(t.aura)
    bySlug.set(key, [...(bySlug.get(key) || []), t])
  }
  const results = await Promise.all(
    [...bySlug.values()].map((group) => renderToLayers({ targets: group, data: group[0].aura! }, onProgress)),
  )
  return {
    errors: results.flatMap((r) => r.errors),
    approximate: results.reduce((n, r) => n + r.approximate, 0),
  }
}
