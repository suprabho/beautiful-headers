// Saves a scene built in the embedded Aura studio to the public `scenes` table,
// the same way the web editor's "Save scene" does (src/lib/scenesApi.js
// createScene).

import { AURA_ORIGIN, BACKGROUND_TYPES, SUPABASE_KEY, SUPABASE_URL, titleToSlug, type Scene } from './api'

/** The studio's scene JSON (useStore.getSceneData); opaque to the plugin. */
export type SceneData = Record<string, unknown> & { backgroundType?: string }

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

/** Mirrors generateUniqueSlug in src/lib/scenesApi.js. */
async function uniqueSlug(title: string) {
  const base = titleToSlug(title) || 'scene'
  const params = new URLSearchParams({ select: 'slug', slug: `like.${base}*` })
  const res = await fetch(`${SUPABASE_URL}/rest/v1/scenes?${params}`, { headers: HEADERS })
  if (!res.ok) return base
  const taken = new Set(((await res.json()) as { slug: string | null }[]).map((r) => r.slug))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

/** Thumbnails straight from the capture endpoint until the scene is reviewed. */
function captureThumb(slug: string, w: number, h: number) {
  return `${AURA_ORIGIN}/scenes/${encodeURIComponent(slug)}/capture.png?w=${w}&h=${h}&dpr=1&hideText=true`
}

export async function createScene(title: string, sceneData: SceneData): Promise<Scene> {
  const cleanTitle = title.trim() || 'Untitled scene'
  const slug = await uniqueSlug(cleanTitle)
  const now = new Date().toISOString()
  const thumbnail = {
    small: captureThumb(slug, 400, 225),
    medium: captureThumb(slug, 800, 450),
    large: captureThumb(slug, 1200, 675),
  }
  const type = sceneData.backgroundType || null
  const shortDescription = `${BACKGROUND_TYPES.find((t) => t.value === type)?.label || 'Custom'} background made in Figma`

  const res = await fetch(`${SUPABASE_URL}/rest/v1/scenes?select=id,title,slug`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'return=representation' },
    body: JSON.stringify({
      title: cleanTitle,
      slug,
      scene_data: {
        ...sceneData,
        // Same review flag the bulk-create API sets: shows up in the gallery right
        // away, and accepting it in the web app captures a proper thumbnail.
        pendingReview: true,
        createdWith: 'figma-plugin',
      },
      thumbnail,
      short_description: shortDescription,
      created_at: now,
      updated_at: now,
    }),
  })
  if (!res.ok) {
    let detail = ''
    try {
      detail = ((await res.json()) as { message?: string }).message || ''
    } catch {
      /* not JSON */
    }
    throw new Error(detail || `Couldn't save scene (${res.status})`)
  }
  const [row] = (await res.json()) as { id: number; title: string; slug: string }[]
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    shortDescription,
    backgroundType: type,
    // The small thumbnail renders on demand; skip the instant preview so the
    // first paint isn't blocked on a second capture.
    thumb: { small: thumbnail.small, large: null },
  }
}
