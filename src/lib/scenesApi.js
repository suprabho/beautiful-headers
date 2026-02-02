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
  for (const [size, url] of Object.entries(thumbnailObj)) {
    rewritten[size] = rewriteThumbnailUrl(url)
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
 * Convert base64 to Blob for upload
 */
function base64ToBlob(base64Data) {
  const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '')
  const byteCharacters = atob(base64String)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: 'image/jpeg' })
}

/**
 * Resize a base64 image to a specific width while maintaining aspect ratio
 */
function resizeImage(base64Data, maxWidth, quality) {
  return new Promise((resolve) => {
    const img = document.createElement('img')
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(base64Data)
    img.src = base64Data
  })
}

/**
 * Upload thumbnail to Supabase Storage in multiple sizes
 */
async function uploadThumbnail(base64Data, sceneId) {
  if (!base64Data) return null

  const thumbnails = {}
  const sizes = Object.entries(THUMBNAIL_SIZES)

  // Generate and upload all sizes in parallel
  const uploadPromises = sizes.map(async ([sizeName, config]) => {
    const resizedBase64 = await resizeImage(base64Data, config.width, config.quality)
    const blob = base64ToBlob(resizedBase64)
    const filename = `${sceneId}-${sizeName}.jpg`

    const { error } = await supabase.storage
      .from('thumbnails')
      .upload(filename, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (error) {
      console.error(`Error uploading ${sizeName} thumbnail:`, error)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(filename)

    return { sizeName, publicUrl: rewriteThumbnailUrl(publicUrl) }
  })

  const results = await Promise.all(uploadPromises)

  // Build thumbnails object from successful uploads
  for (const result of results) {
    if (result) {
      thumbnails[result.sizeName] = result.publicUrl
    }
  }

  // If no uploads succeeded, return null
  if (Object.keys(thumbnails).length === 0) {
    return null
  }

  return thumbnails
}

/**
 * Delete all thumbnail sizes from Supabase Storage
 */
async function deleteThumbnail(sceneId) {
  const filenames = Object.keys(THUMBNAIL_SIZES).map(size => `${sceneId}-${size}.jpg`)
  await supabase.storage.from('thumbnails').remove(filenames)
}

/**
 * Fetch all saved scenes
 */
export async function getScenes() {
  const { data, error } = await supabase
    .from('scenes')
    .select('id, title, slug, short_description, long_description, thumbnail, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    throw new Error('Failed to fetch scenes')
  }

  // Rewrite thumbnail URLs to use CDN if configured
  const docs = data.map(scene => ({
    ...scene,
    thumbnail: rewriteThumbnails(scene.thumbnail),
  }))

  return { docs, totalDocs: docs.length }
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
  const { data: scene, error } = await supabase
    .from('scenes')
    .insert({
      title,
      slug: titleToSlug(title),
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
    updateData.slug = titleToSlug(data.title)
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
