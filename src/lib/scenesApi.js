import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://grbrfpaznehikakupavx.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_nFT6O21VoCZSKs7lQe-UaA_tSkoc4su'
const THUMBNAIL_CDN_URL = import.meta.env.VITE_THUMBNAIL_CDN_URL || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const SUPABASE_STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/thumbnails/`

function rewriteThumbnailUrl(url) {
  if (!THUMBNAIL_CDN_URL || !url) return url
  return url.replace(SUPABASE_STORAGE_BASE, `${THUMBNAIL_CDN_URL}/`)
}

function rewriteThumbnails(thumbnailObj) {
  if (!thumbnailObj || !THUMBNAIL_CDN_URL) return thumbnailObj
  const rewritten = {}
  for (const [size, value] of Object.entries(thumbnailObj)) {
    // `webp` is a nested { small, medium, ... } object; everything else is a URL.
    rewritten[size] = value && typeof value === 'object'
      ? rewriteThumbnails(value)
      : rewriteThumbnailUrl(value)
  }
  return rewritten
}

/**
 * Thumbnail size configurations
 */
const THUMBNAIL_SIZES = {
  small: { width: 400, quality: 0.7 },
  medium: { width: 800, quality: 0.8 },
  large: { width: 1200, quality: 0.85 },
  full: { width: 1920, quality: 0.9 },
}

/**
 * Convert a base64 data URL to a Blob for upload
 */
function base64ToBlob(base64Data, type = 'image/jpeg') {
  const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '')
  const byteCharacters = atob(base64String)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type })
}

/**
 * Load a base64 image into an <img> element
 */
function loadImage(base64Data) {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = base64Data
  })
}

/**
 * Encode a canvas to the given format and upload it; returns the public URL
 * (with cache-buster, CDN-rewritten) or null on failure.
 */
async function uploadCanvas(canvas, contentType, quality, filename) {
  const dataUrl = canvas.toDataURL(contentType, quality)
  // Browsers that can't encode the requested format silently return a PNG.
  if (!dataUrl.startsWith(`data:${contentType}`)) return null

  const blob = base64ToBlob(dataUrl, contentType)
  const { error } = await supabase.storage
    .from('thumbnails')
    .upload(filename, blob, { contentType, upsert: true })

  if (error) {
    console.error(`Error uploading ${filename}:`, error)
    return null
  }

  const { data: { publicUrl } } = supabase.storage
    .from('thumbnails')
    .getPublicUrl(filename)

  // Append cache-buster so recaptured thumbnails aren't served stale by CDN/browser
  const bustUrl = `${publicUrl}?t=${Date.now()}`
  return rewriteThumbnailUrl(bustUrl)
}

/**
 * Upload thumbnails to Supabase Storage in multiple sizes and formats.
 * Returns { small, medium, large, full, webp: { small, ... } } where the
 * top-level keys are JPEG URLs (back-compat) and `webp` holds the WebP URLs.
 */
async function uploadThumbnail(base64Data, sceneId) {
  if (!base64Data) return null

  let img
  try {
    img = await loadImage(base64Data)
  } catch {
    return null
  }

  const jpg = {}
  const webp = {}
  const sizes = Object.entries(THUMBNAIL_SIZES)

  // Generate and upload all sizes (JPEG + WebP) in parallel
  await Promise.all(sizes.map(async ([sizeName, config]) => {
    const scale = Math.min(1, config.width / img.width)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)

    const [jpgUrl, webpUrl] = await Promise.all([
      uploadCanvas(canvas, 'image/jpeg', config.quality, `${sceneId}-${sizeName}.jpg`),
      uploadCanvas(canvas, 'image/webp', config.quality, `${sceneId}-${sizeName}.webp`),
    ])

    if (jpgUrl) jpg[sizeName] = jpgUrl
    if (webpUrl) webp[sizeName] = webpUrl
  }))

  // JPEG is the baseline; if none uploaded, treat as failure
  if (Object.keys(jpg).length === 0) return null

  const result = { ...jpg }
  if (Object.keys(webp).length > 0) result.webp = webp
  return result
}

/**
 * Delete all thumbnail sizes (JPEG + WebP) from Supabase Storage
 */
async function deleteThumbnail(sceneId) {
  const filenames = Object.keys(THUMBNAIL_SIZES).flatMap(size => [
    `${sceneId}-${size}.jpg`,
    `${sceneId}-${size}.webp`,
  ])
  await supabase.storage.from('thumbnails').remove(filenames)
}

/**
 * Fetch saved scenes with pagination and optional filters
 * @param {Object} options
 * @param {number} options.offset - Number of rows to skip (default 0)
 * @param {number} options.limit - Number of rows to fetch (default 20)
 * @param {string|null} options.backgroundType - Filter by background type (e.g. 'aurora', 'fluid')
 * @param {string|null} options.projectId - Filter by project ID (scenes linked to this project)
 */
export async function getScenes({ offset = 0, limit = 20, backgroundType = null, projectId = null } = {}) {
  let query = supabase
    .from('scenes')
    .select('id, title, slug, short_description, long_description, thumbnail, scene_data, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (backgroundType) {
    query = query.eq('scene_data->>backgroundType', backgroundType)
  }

  if (projectId) {
    query = query.contains('scene_data', { selectedProjectIds: [projectId] })
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    throw new Error('Failed to fetch scenes')
  }

  // Rewrite thumbnail URLs to use CDN if configured
  const docs = data.map(scene => ({
    ...scene,
    thumbnail: rewriteThumbnails(scene.thumbnail),
  }))

  return { docs, totalDocs: count }
}

/**
 * Fetch every scene in a lightweight shape for the analytics dashboard.
 *
 * Selects only the JSON sub-fields the analysis needs (not the full scene_data,
 * which carries a multi-KB color palette per row), and paginates by the unique
 * `id` so no rows slip across page boundaries — ordering by a non-unique column
 * like created_at can silently skip rows when values tie.
 *
 * @returns {Promise<Array>} normalized rows consumable by analyzeScenes()
 */
export async function getAllScenesForAnalysis() {
  const pageSize = 200
  let offset = 0
  const rows = []

  while (true) {
    const { data, error } = await supabase
      .from('scenes')
      .select(
        'id, title, slug, short_description, long_description, thumbnail, created_at, ' +
        'backgroundType:scene_data->>backgroundType, ' +
        'effectsConfig:scene_data->effectsConfig, ' +
        'gradientColors:scene_data->gradientConfig->colors'
      )
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Failed to fetch scenes for analysis:', error)
      throw new Error('Failed to fetch scenes for analysis')
    }

    rows.push(...data)
    if (data.length < pageSize) break
    offset += pageSize
  }

  return rows.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    short_description: s.short_description,
    long_description: s.long_description,
    thumbnail: rewriteThumbnails(s.thumbnail),
    created_at: s.created_at,
    backgroundType: s.backgroundType || 'unknown',
    effectsConfig: s.effectsConfig || {},
    colors: Array.isArray(s.gradientColors) ? s.gradientColors : [],
  }))
}

/**
 * Fetch a single scene by ID
 */
export async function getScene(id) {
  const { data, error } = await supabase
    .from('scenes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error('Scene not found')
  }

  return { ...data, thumbnail: rewriteThumbnails(data.thumbnail) }
}

/**
 * Convert title to URL-friendly slug
 */
export function titleToSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
}

/**
 * Generate a slug from a title that is unique across the scenes table.
 * Falls back to the bare base slug if the uniqueness lookup fails so a
 * transient error never blocks a save.
 *
 * @param {string} title - Scene title
 * @param {string|null} excludeId - Scene id to ignore (when re-slugging an
 *   existing scene during an update, so it doesn't collide with itself)
 * @returns {Promise<string>} A slug not currently used by any other scene
 */
export async function generateUniqueSlug(title, excludeId = null) {
  const base = titleToSlug(title) || 'scene'

  // Pull every existing slug that could collide with `base` or `base-<n>`.
  const { data, error } = await supabase
    .from('scenes')
    .select('id, slug')
    .like('slug', `${base}%`)

  if (error) {
    console.error('Failed to check slug uniqueness:', error)
    return base
  }

  const taken = new Set(
    (data || [])
      .filter(r => r.id !== excludeId && r.slug)
      .map(r => r.slug)
  )

  if (!taken.has(base)) return base

  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

/**
 * Fetch a single scene by slug (URL-friendly title)
 */
export async function getSceneBySlug(slug) {
  // Try server-side slug column first (new scenes have this populated)
  const { data: slugMatch, error: slugError } = await supabase
    .from('scenes')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (slugError) {
    throw new Error('Failed to fetch scene')
  }

  if (slugMatch) {
    return { ...slugMatch, thumbnail: rewriteThumbnails(slugMatch.thumbnail) }
  }

  // Fallback: for older scenes without a slug column value.
  // Use individual words from the slug for broader matching since titles may
  // contain special characters (em-dashes, ampersands, etc.) that titleToSlug strips.
  const words = slug.split('-').filter(w => w.length >= 3)

  if (words.length === 0) {
    throw new Error('Scene not found')
  }

  // Search using the longest words for specificity
  const searchWords = [...words].sort((a, b) => b.length - a.length).slice(0, 3)

  let query = supabase.from('scenes').select('*')
  for (const word of searchWords) {
    query = query.ilike('title', `%${word}%`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error('Failed to fetch scenes')
  }

  const scene = data.find(s => titleToSlug(s.title) === slug)

  if (!scene) {
    throw new Error('Scene not found')
  }

  // Backfill the slug column so future lookups use the fast path
  if (!scene.slug) {
    supabase
      .from('scenes')
      .update({ slug: titleToSlug(scene.title) })
      .eq('id', scene.id)
      .then()
      .catch(() => {})
  }

  return { ...scene, thumbnail: rewriteThumbnails(scene.thumbnail) }
}

/**
 * Save a new scene
 * @param {string} title - Scene title
 * @param {Object} sceneData - Scene configuration data
 * @param {string|null} thumbnail - Base64 thumbnail image
 * @param {Object|null} descriptions - Pre-generated descriptions { shortDescription, longDescription }
 */
export async function createScene(title, sceneData, thumbnail = null, descriptions = null) {
  // First create the scene to get an ID
  const slug = await generateUniqueSlug(title)
  const { data: scene, error } = await supabase
    .from('scenes')
    .insert({
      title,
      slug,
      scene_data: sceneData,
      thumbnail: null,
      short_description: descriptions?.shortDescription || null,
      long_description: descriptions?.longDescription || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase create error:', error)
    throw new Error(`Failed to create scene: ${error.message}`)
  }

  // Upload thumbnail if provided
  if (thumbnail) {
    const thumbnailUrls = await uploadThumbnail(thumbnail, scene.id)
    if (thumbnailUrls) {
      const { data: updatedScene, error: updateError } = await supabase
        .from('scenes')
        .update({
          thumbnail: thumbnailUrls,
          updated_at: new Date().toISOString()
        })
        .eq('id', scene.id)
        .select()
        .single()

      if (updateError) {
        console.error('Failed to update scene thumbnail:', updateError)
      } else {
        return updatedScene
      }
    }
  }

  return scene
}

/**
 * Update an existing scene
 */
export async function updateScene(id, data) {
  const updateData = {
    updated_at: new Date().toISOString(),
  }

  if (data.title !== undefined) {
    updateData.title = data.title
    updateData.slug = await generateUniqueSlug(data.title, id)
  }
  if (data.sceneData !== undefined) updateData.scene_data = data.sceneData
  if (data.short_description !== undefined) updateData.short_description = data.short_description
  if (data.long_description !== undefined) updateData.long_description = data.long_description
  if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail

  const { data: scene, error } = await supabase
    .from('scenes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error('Failed to update scene')
  }

  return scene
}

/**
 * Re-capture and update thumbnail for an existing scene
 */
export async function recaptureThumbnail(sceneId, base64Data) {
  if (!base64Data) {
    throw new Error('No image data provided')
  }

  // Upload new thumbnails
  const thumbnailUrls = await uploadThumbnail(base64Data, sceneId)

  if (!thumbnailUrls) {
    throw new Error('Failed to upload thumbnails')
  }

  // Update scene with new thumbnail URLs
  const { data: scene, error } = await supabase
    .from('scenes')
    .update({
      thumbnail: thumbnailUrls,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sceneId)
    .select()
    .single()

  if (error) {
    throw new Error('Failed to update scene thumbnail')
  }

  return scene
}

/**
 * Delete a scene
 */
export async function deleteScene(id) {
  // Delete thumbnail first
  await deleteThumbnail(id)

  const { error } = await supabase
    .from('scenes')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error('Failed to delete scene')
  }

  return { success: true }
}

/**
 * Check if Supabase is available
 */
export async function checkCmsHealth() {
  try {
    const { error } = await supabase.from('scenes').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}

/**
 * Record a rejected scene slug so it won't be re-generated
 * @param {string} slug - The URL slug of the rejected scene
 * @param {string} title - The original title of the rejected scene
 */
export async function addRejectedScene(slug, title) {
  const { error } = await supabase
    .from('rejected_scenes')
    .insert({ slug, title, rejected_at: new Date().toISOString() })

  if (error) {
    console.error('Failed to record rejected scene:', error)
  }
}

/**
 * Fetch all rejected scene slugs
 * @returns {Promise<string[]>} - Array of rejected slugs
 */
export async function getRejectedSlugs() {
  const { data, error } = await supabase
    .from('rejected_scenes')
    .select('slug')

  if (error) {
    console.error('Failed to fetch rejected scenes:', error)
    return []
  }

  return (data || []).map(r => r.slug)
}

/**
 * Verify delete password via Supabase RPC function
 * @param {string} password - The password to verify
 * @returns {Promise<boolean>} - Whether the password is valid
 */
export async function verifyDeletePassword(password) {
  const { data, error } = await supabase.rpc('verify_delete_password', {
    input_password: password
  })

  if (error) {
    console.error('Password verification error:', error)
    return false
  }

  return data === true
}

// ============================================
// Projects API
// ============================================

/**
 * Fetch all projects
 */
export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch projects:', error)
    throw new Error('Failed to fetch projects')
  }

  return data || []
}

/**
 * Create a new project (password protected)
 * @param {string} name - Project name
 * @param {string} url - Project URL
 * @param {string} password - Admin password for verification
 * @param {Object|null} paletteData - Optional color palette JSON data
 */
export async function createProject(name, url, password, paletteData = null) {
  // Verify password first
  const isValid = await verifyDeletePassword(password)
  if (!isValid) {
    throw new Error('Invalid password')
  }

  const insertData = {
    name,
    url,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  if (paletteData) insertData.palette_data = paletteData

  const { data, error } = await supabase
    .from('projects')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Failed to create project:', error)
    throw new Error(`Failed to create project: ${error.message}`)
  }

  return data
}

/**
 * Update an existing project (password protected)
 * @param {string} id - Project ID
 * @param {Object} updates - { name?, url?, paletteData? }
 * @param {string} password - Admin password for verification
 */
export async function updateProject(id, updates, password) {
  // Verify password first
  const isValid = await verifyDeletePassword(password)
  if (!isValid) {
    throw new Error('Invalid password')
  }

  const updateData = {
    updated_at: new Date().toISOString(),
  }
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.url !== undefined) updateData.url = updates.url
  if (updates.paletteData !== undefined) updateData.palette_data = updates.paletteData

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update project:', error)
    throw new Error('Failed to update project')
  }

  return data
}

/**
 * Delete a project (password protected)
 * @param {string} id - Project ID
 * @param {string} password - Admin password for verification
 */
export async function deleteProject(id, password) {
  // Verify password first
  const isValid = await verifyDeletePassword(password)
  if (!isValid) {
    throw new Error('Invalid password')
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete project:', error)
    throw new Error('Failed to delete project')
  }

  return { success: true }
}
