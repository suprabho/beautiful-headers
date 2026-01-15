import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://grbrfpaznehikakupavx.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_nFT6O21VoCZSKs7lQe-UaA_tSkoc4su'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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
 * Upload thumbnail to Supabase Storage
 * Note: For simplicity, we upload the full-size image only.
 * Server-side resizing would require Edge Functions.
 */
async function uploadThumbnail(base64Data, sceneId) {
  if (!base64Data) return null

  const blob = base64ToBlob(base64Data)
  const thumbnails = {}

  // Upload full size image (Supabase Storage doesn't resize automatically)
  // For multiple sizes, you'd need Supabase Edge Functions or client-side resizing
  const filename = `${sceneId}-full.jpg`

  const { error } = await supabase.storage
    .from('thumbnails')
    .upload(filename, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (error) {
    console.error('Error uploading thumbnail:', error)
    return null
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('thumbnails')
    .getPublicUrl(filename)

  // Return same URL for all sizes (or implement client-side resizing if needed)
  thumbnails.small = publicUrl
  thumbnails.medium = publicUrl
  thumbnails.large = publicUrl
  thumbnails.full = publicUrl

  return thumbnails
}

/**
 * Delete thumbnail from Supabase Storage
 */
async function deleteThumbnail(sceneId) {
  const filename = `${sceneId}-full.jpg`
  await supabase.storage.from('thumbnails').remove([filename])
}

/**
 * Fetch all saved scenes
 */
export async function getScenes() {
  const { data, error } = await supabase
    .from('scenes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    throw new Error('Failed to fetch scenes')
  }

  // Transform to match existing API response format
  return { docs: data, totalDocs: data.length }
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

  return data
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
  // First try to find by exact slug match in title
  const { data, error } = await supabase
    .from('scenes')
    .select('*')

  if (error) {
    throw new Error('Failed to fetch scenes')
  }

  // Find scene where the slugified title matches the provided slug
  const scene = data.find(s => titleToSlug(s.title) === slug)

  if (!scene) {
    throw new Error('Scene not found')
  }

  return scene
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

  if (data.title !== undefined) updateData.title = data.title
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
