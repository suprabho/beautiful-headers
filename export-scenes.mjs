import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

const supabase = createClient(
  'https://grbrfpaznehikakupavx.supabase.co',
  'sb_publishable_nFT6O21VoCZSKs7lQe-UaA_tSkoc4su'
)

// Wrap a CSV field: stringify objects, escape quotes, wrap in double quotes.
function csvField(value) {
  if (value === null || value === undefined) return ''
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return `"${str.replace(/"/g, '""')}"`
}

function toCsv(scenes) {
  const columns = ['id', 'title', 'short_description', 'long_description', 'scene_data', 'thumbnail', 'created_at', 'updated_at']
  const rows = [columns.join(',')]
  for (const s of scenes) {
    rows.push(columns.map(col => csvField(s[col])).join(','))
  }
  return rows.join('\n')
}

async function exportAll() {
  const byId = new Map()
  const pageSize = 100
  let offset = 0
  let total = 0

  // Paginate by the unique `id` column. Ordering by a non-unique column
  // (e.g. created_at, which has ties/nulls) lets rows shift across page
  // boundaries, silently skipping some — that's why a prior run returned
  // 407 of 411. A unique sort key guarantees complete, stable pagination.
  while (true) {
    const { data, error, count } = await supabase
      .from('scenes')
      .select('*', { count: 'exact' })
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Error fetching scenes:', error)
      break
    }

    total = count ?? total
    for (const s of data) byId.set(s.id, s)
    console.log(`Fetched ${byId.size}/${total} scenes...`)

    if (data.length < pageSize) break
    offset += pageSize
  }

  // Present newest-first in the output files.
  const allScenes = [...byId.values()].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  )

  if (allScenes.length !== total) {
    console.warn(`\n⚠️  Row count mismatch: table reports ${total}, fetched ${allScenes.length} unique. ${total - allScenes.length} unaccounted for.`)
  }

  // Write full export with scene_data
  writeFileSync('scenes_export_full.json', JSON.stringify(allScenes, null, 2))
  console.log(`\nExported ${allScenes.length} scenes to scenes_export_full.json`)

  // Write CSV (id, title, descriptions, scene_data, thumbnail, timestamps)
  writeFileSync('scenes_export.csv', toCsv(allScenes))
  console.log(`Exported ${allScenes.length} scenes to scenes_export.csv`)

  // Write a lighter version without thumbnails (for LLM analysis)
  const lightScenes = allScenes.map(s => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    short_description: s.short_description,
    long_description: s.long_description,
    scene_data: s.scene_data,
    created_at: s.created_at,
  }))
  writeFileSync('scenes_export_light.json', JSON.stringify(lightScenes, null, 2))
  console.log(`Exported ${lightScenes.length} scenes to scenes_export_light.json (no thumbnails)`)
}

exportAll()
