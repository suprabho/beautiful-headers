/**
 * Backfill script: Migrate aurora config in saved scenes
 * Converts minWidth/maxWidth → width, minTTL/maxTTL → ttl
 *
 * Usage: node scripts/backfill-aurora-config.js [--dry-run]
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://grbrfpaznehikakupavx.supabase.co'
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_nFT6O21VoCZSKs7lQe-UaA_tSkoc4su'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const dryRun = process.argv.includes('--dry-run')

function migrateAuroraConfig(cfg) {
  if (!cfg || !('minWidth' in cfg || 'minTTL' in cfg)) return null

  const { minWidth, maxWidth, minTTL, maxTTL, ...rest } = cfg
  const migrated = { ...rest }

  if (minWidth != null || maxWidth != null) {
    migrated.width = Math.round(((minWidth ?? 10) + (maxWidth ?? 30)) / 2)
  }
  if (minTTL != null || maxTTL != null) {
    migrated.ttl = Math.round(((minTTL ?? 100) + (maxTTL ?? 300)) / 2)
  }

  return migrated
}

async function backfill() {
  console.log(dryRun ? '=== DRY RUN ===' : '=== BACKFILL ===')

  const { data: scenes, error } = await supabase
    .from('scenes')
    .select('id, title, scene_data')

  if (error) {
    console.error('Failed to fetch scenes:', error.message)
    process.exit(1)
  }

  console.log(`Found ${scenes.length} scenes`)

  let updated = 0
  let skipped = 0

  for (const scene of scenes) {
    const aurora = scene.scene_data?.auroraConfig
    const migrated = migrateAuroraConfig(aurora)

    if (!migrated) {
      skipped++
      continue
    }

    console.log(`  [${scene.id}] "${scene.title}" — migrating aurora config`)

    if (!dryRun) {
      const newSceneData = {
        ...scene.scene_data,
        auroraConfig: migrated,
      }

      const { error: updateError } = await supabase
        .from('scenes')
        .update({ scene_data: newSceneData, updated_at: new Date().toISOString() })
        .eq('id', scene.id)

      if (updateError) {
        console.error(`    FAILED: ${updateError.message}`)
        continue
      }
    }

    updated++
  }

  console.log(`\nDone. Updated: ${updated}, Skipped (already migrated): ${skipped}`)
}

backfill()
