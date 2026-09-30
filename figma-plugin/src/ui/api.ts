// Network layer for the UI iframe: the public scene gallery (Supabase REST,
// read-only with the publishable key the embed also ships) and the capture
// endpoint that renders a scene to PNG at an exact frame size.

import type { RenderOptions } from '../shared'

export const AURA_ORIGIN = 'https://aura.promad.design'
export const SUPABASE_URL = 'https://grbrfpaznehikakupavx.supabase.co'
export const SUPABASE_KEY = 'sb_publishable_nFT6O21VoCZSKs7lQe-UaA_tSkoc4su'

export interface Scene {
  id: number
  title: string
  slug: string
  shortDescription: string | null
  backgroundType: string | null
  thumb: { small: string | null; large: string | null }
}

type ThumbnailField = string | Record<string, unknown> | null

interface SceneRow {
  id: number
  title: string | null
  slug: string | null
  short_description: string | null
  thumbnail: ThumbnailField
  backgroundType: string | null
}

// Mirrors titleToSlug in src/lib/scenesApi.js — older rows have no slug column.
export function titleToSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function pickThumb(thumb: ThumbnailField, sizes: string[]): string | null {
  if (!thumb) return null
  // Legacy rows stored a single URL (or an inline data URL) as a string.
  if (typeof thumb === 'string') return thumb
  for (const size of sizes) {
    const url = thumb[size]
    if (typeof url === 'string') return url
  }
  return null
}

function toScene(row: SceneRow): Scene | null {
  const title = (row.title || '').trim()
  const slug = row.slug || (title ? titleToSlug(title) : '')
  if (!slug) return null
  return {
    id: row.id,
    title: title || 'Untitled scene',
    slug,
    shortDescription: row.short_description,
    backgroundType: row.backgroundType,
    thumb: {
      small: pickThumb(row.thumbnail, ['small', 'medium', 'large', 'full']),
      large: pickThumb(row.thumbnail, ['large', 'full', 'medium', 'small']),
    },
  }
}

export const PAGE_SIZE = 24

export async function fetchScenes({
  offset,
  search,
  backgroundType,
  signal,
}: {
  offset: number
  search: string
  backgroundType: string | null
  signal?: AbortSignal
}): Promise<{ scenes: Scene[]; hasMore: boolean }> {
  const params = new URLSearchParams({
    select: 'id,title,slug,short_description,thumbnail,backgroundType:scene_data->>backgroundType',
    order: 'created_at.desc',
    offset: String(offset),
    limit: String(PAGE_SIZE),
  })
  const term = search.trim().replace(/[*,()]/g, ' ').trim()
  if (term) params.set('title', `ilike.*${term}*`)
  if (backgroundType) params.set('scene_data->>backgroundType', `eq.${backgroundType}`)

  const res = await fetch(`${SUPABASE_URL}/rest/v1/scenes?${params}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    signal,
  })
  if (!res.ok) throw new Error(`Gallery request failed (${res.status})`)
  const rows = (await res.json()) as SceneRow[]
  return {
    scenes: rows.map(toScene).filter((s): s is Scene => s !== null),
    hasMore: rows.length === PAGE_SIZE,
  }
}

// The capture endpoint accepts 16–3840 CSS px; Figma images max out at 4096 px.
const MAX_CSS = 3840
const MAX_PIXELS = 4096

/**
 * Work out the capture size for a layer. Oversized layers are rendered at a
 * proportionally smaller CSS size (the image fill scales it back up), and the
 * DPR is lowered until the final bitmap fits Figma's 4096 px limit.
 */
export function captureSize(width: number, height: number, requestedDpr: number) {
  const down = Math.min(1, MAX_CSS / Math.max(width, height))
  const w = Math.max(16, Math.round(width * down))
  const h = Math.max(16, Math.round(height * down))
  let dpr = requestedDpr
  while (dpr > 1 && Math.max(w, h) * dpr > MAX_PIXELS) dpr--
  return { w, h, dpr }
}

export function captureUrl(slug: string, width: number, height: number, options: RenderOptions) {
  const { w, h, dpr } = captureSize(width, height, options.dpr)
  const params = new URLSearchParams({ w: String(w), h: String(h), dpr: String(dpr) })
  if (options.hideText) params.set('hideText', 'true')
  if (options.hideIcons) params.set('hideIcons', 'true')
  params.set('theme', options.theme)
  return `${AURA_ORIGIN}/scenes/${encodeURIComponent(slug)}/capture.png?${params}`
}

// One shared, text-free render per scene, theme, icon setting and orientation.
// Image fills crop it to cover the layer, so a single cached URL serves every
// frame size — the server fallback uses it instead of an exact-size render
// (far fewer cache misses), and it replaces the small thumbnail as soon as it
// lands. 1920 × 1080 at 1× renders in ~30 s on a miss; 2× runs into the capture
// function's 60 s limit.
const MASTER_LONG = 1920
const MASTER_SHORT = 1080

/** The shared render for a layer of this size, or null when scene text is on (text can't be cropped). */
export function masterUrl(slug: string, width: number, height: number, options: RenderOptions) {
  if (!options.hideText) return null
  const landscape = width >= height
  return captureUrl(slug, landscape ? MASTER_LONG : MASTER_SHORT, landscape ? MASTER_SHORT : MASTER_LONG, {
    ...options,
    dpr: 1,
  })
}

/** The live embed, with the same text/icon/theme options the render uses. */
export function embedUrl(slug: string, options: RenderOptions) {
  const params = new URLSearchParams({ input: 'off', theme: options.theme })
  if (options.hideText) params.set('hideText', 'true')
  if (options.hideIcons) params.set('hideIcons', 'true')
  return `${AURA_ORIGIN}/embed/${encodeURIComponent(slug)}?${params}`
}

/** A capture miss renders for up to ~60 s (the function's limit), plus the download. */
export const SERVER_TIMEOUT = 65_000

/**
 * Download an image, giving up after `timeoutMs` (the body included) so a
 * stalled server can never leave a render spinning.
 */
export async function fetchBytes(
  url: string,
  { signal, timeoutMs = SERVER_TIMEOUT }: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<Uint8Array> {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const onAbort = () => controller.abort()
  if (signal?.aborted) controller.abort()
  signal?.addEventListener('abort', onAbort)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      let detail = ''
      try {
        detail = ((await res.json()) as { error?: string }).error || ''
      } catch {
        /* not JSON */
      }
      throw new Error(detail || `Render failed (${res.status})`)
    }
    return new Uint8Array(await res.arrayBuffer())
  } catch (err) {
    if (timedOut) throw new Error('The server took too long to render this scene')
    throw err
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

export function sceneUrl(slug: string) {
  return `${AURA_ORIGIN}/scenes/${encodeURIComponent(slug)}`
}
