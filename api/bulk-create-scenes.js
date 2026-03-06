import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://grbrfpaznehikakupavx.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_nFT6O21VoCZSKs7lQe-UaA_tSkoc4su'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

function titleToSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { password, scenes, projectId } = req.body

  if (!password) {
    return res.status(401).json({ error: 'Password is required' })
  }

  if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
    return res.status(400).json({ error: '`scenes` must be a non-empty array' })
  }

  // Verify admin password
  const { data: isValid, error: rpcError } = await supabase.rpc('verify_delete_password', {
    input_password: password,
  })

  if (rpcError || isValid !== true) {
    return res.status(403).json({ error: 'Invalid password' })
  }

  // Fetch rejected slugs to skip previously rejected scenes
  const { data: rejectedRows } = await supabase
    .from('rejected_scenes')
    .select('slug')
  const rejectedSlugs = new Set((rejectedRows || []).map(r => r.slug))

  const results = []
  const now = new Date().toISOString()

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]

    if (!scene.title || !scene.scene_data) {
      results.push({
        index: i,
        title: scene.title || null,
        success: false,
        error: 'Missing required fields: title and scene_data',
      })
      continue
    }

    const slug = titleToSlug(scene.title)
    if (rejectedSlugs.has(slug)) {
      results.push({
        index: i,
        title: scene.title,
        slug,
        success: false,
        error: 'Scene was previously rejected',
      })
      continue
    }

    try {
      const row = {
        title: scene.title,
        slug: titleToSlug(scene.title),
        scene_data: {
          ...scene.scene_data,
          pendingReview: true,
          ...(projectId ? { selectedProjectIds: [...(scene.scene_data.selectedProjectIds || []), projectId] } : {}),
        },
        short_description: scene.short_description || null,
        long_description: scene.long_description || null,
        thumbnail: scene.thumbnail || null,
        created_at: scene.created_at || now,
        updated_at: now,
      }

      const { data, error } = await supabase
        .from('scenes')
        .insert(row)
        .select('id, title, slug')
        .single()

      if (error) {
        results.push({ index: i, title: scene.title, success: false, error: error.message })
      } else {
        results.push({ index: i, title: data.title, slug: data.slug, id: data.id, success: true })
      }
    } catch (err) {
      results.push({ index: i, title: scene.title, success: false, error: err.message })
    }
  }

  const created = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return res.status(200).json({
    summary: { total: scenes.length, created, failed },
    results,
  })
}
