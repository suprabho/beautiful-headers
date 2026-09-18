/**
 * Dependency-free scene lookup for the embed entry.
 *
 * Talks to Supabase's PostgREST endpoint with plain fetch (no supabase-js, which
 * would add ~40 KB gzipped to every embed) and reuses the request that
 * embed.html starts inline before the bundle has even downloaded.
 */

const DEFAULT_URL = 'https://grbrfpaznehikakupavx.supabase.co'
const DEFAULT_KEY = 'sb_publishable_nFT6O21VoCZSKs7lQe-UaA_tSkoc4su'
const COLUMNS = 'id,title,slug,scene_data,thumbnail,short_description,long_description'

function supabaseConfig() {
  if (typeof window !== 'undefined' && window.__AURA_SUPABASE) return window.__AURA_SUPABASE
  return {
    url: import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY,
  }
}

async function rest(query) {
  const { url, key } = supabaseConfig()
  const res = await fetch(`${url}/rest/v1/${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (!res.ok) throw new Error(`Failed to fetch scene (${res.status})`)
  return res.json()
}

// Same slug derivation as scenesApi.js / api/scenes/[slug].js (kept local so
// this module never imports the supabase client).
export function titleToSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Resolve a scene by slug. Mirrors scenesApi.getSceneBySlug: exact `slug`
 * column first, then a title search for legacy rows that never got a slug.
 */
export async function fetchSceneBySlug(slug) {
  // 1. The inline bootstrap in embed.html may already have the row in flight.
  //    null = no such slug (fall through to the legacy search); undefined = the
  //    early request failed, so query again from here.
  let early
  if (typeof window !== 'undefined' && window.__auraScenePromise) {
    early = await window.__auraScenePromise
    if (early) return early
  }

  if (early !== null) {
    const rows = await rest(`scenes?select=${COLUMNS}&slug=eq.${encodeURIComponent(slug)}&limit=1`)
    if (rows[0]) return rows[0]
  }

  // 2. Legacy scenes: match on the longest words of the slug, then confirm by
  //    re-deriving the slug from the title.
  const words = slug.split('-').filter((w) => w.length >= 3)
  if (words.length === 0) throw new Error('Scene not found')
  const searchWords = [...words].sort((a, b) => b.length - a.length).slice(0, 3)
  const filters = searchWords.map((w) => `title=ilike.${encodeURIComponent(`%${w}%`)}`).join('&')
  const candidates = await rest(`scenes?select=${COLUMNS}&${filters}`)
  const scene = candidates.find((s) => s.title && titleToSlug(s.title) === slug)
  if (!scene) throw new Error('Scene not found')
  return scene
}
