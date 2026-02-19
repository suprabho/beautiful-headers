import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

const supabase = createClient(
  'https://grbrfpaznehikakupavx.supabase.co',
  'sb_publishable_nFT6O21VoCZSKs7lQe-UaA_tSkoc4su'
)

async function exportAll() {
  const allScenes = []
  const pageSize = 100
  let offset = 0

  while (true) {
    const { data, error, count } = await supabase
      .from('scenes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Error fetching scenes:', error)
      break
    }

    allScenes.push(...data)
    console.log(`Fetched ${allScenes.length}/${count} scenes...`)

    if (data.length < pageSize) break
    offset += pageSize
  }

  // Write full export with scene_data
  writeFileSync('scenes_export_full.json', JSON.stringify(allScenes, null, 2))
  console.log(`\nExported ${allScenes.length} scenes to scenes_export_full.json`)

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
