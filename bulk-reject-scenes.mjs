import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { createInterface, emitKeypressEvents } from 'readline'

// Bulk-reject scenes by slug. "Reject" mirrors the in-app action exactly:
//   1. verify the admin password (verify_delete_password RPC)
//   2. record the scene's base slug in `rejected_scenes` so bulk-create skips it
//   3. delete the scene's thumbnails from storage, then the row from `scenes`
//
// Usage:
//   ADMIN_PASSWORD='...' node bulk-reject-scenes.mjs slug-one slug-two slug-three
//   ADMIN_PASSWORD='...' node bulk-reject-scenes.mjs --file slugs.txt
//   node bulk-reject-scenes.mjs --file slugs.txt --dry-run   # preview, no writes
//
// Slugs may come from CLI args and/or a newline-separated file (--file).
// The password is read from ADMIN_PASSWORD or prompted (never echoed).

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://grbrfpaznehikakupavx.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_nFT6O21VoCZSKs7lQe-UaA_tSkoc4su'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Thumbnail variants written by uploadThumbnail() — must match scenesApi.js so
// deleteThumbnail() removes every object it created.
const THUMBNAIL_SIZES = ['small', 'medium', 'large', 'full']

// Same slugifier the app and bulk-create use. The value stored in
// `rejected_scenes` is titleToSlug(title), which is what bulk-create checks
// against — so we always record the base slug derived from the title.
function titleToSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Parse CLI args into { slugs, file, dryRun }.
function parseArgs(argv) {
  const slugs = []
  let file = null
  let dryRun = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run') {
      dryRun = true
    } else if (arg === '--file' || arg === '-f') {
      file = argv[++i]
    } else if (arg.startsWith('--file=')) {
      file = arg.slice('--file='.length)
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown flag: ${arg}`)
    } else {
      slugs.push(arg)
    }
  }

  return { slugs, file, dryRun }
}

// Read newline-separated slugs from a file, ignoring blanks and # comments.
function readSlugFile(path) {
  return readFileSync(path, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
}

// Prompt for a password without echoing keystrokes to the terminal.
function promptPassword(prompt = 'Admin password: ') {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error('No password: set ADMIN_PASSWORD or run in an interactive terminal.'))
      return
    }

    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    emitKeypressEvents(process.stdin)
    process.stdout.write(prompt)

    let password = ''
    process.stdin.setRawMode(true)

    const onKey = (char, key) => {
      if (key && (key.name === 'return' || key.name === 'enter')) {
        cleanup()
        process.stdout.write('\n')
        resolve(password)
      } else if (key && key.name === 'backspace') {
        password = password.slice(0, -1)
      } else if (key && key.ctrl && key.name === 'c') {
        cleanup()
        process.stdout.write('\n')
        reject(new Error('Aborted'))
      } else if (char) {
        password += char
      }
    }

    function cleanup() {
      process.stdin.setRawMode(false)
      process.stdin.removeListener('keypress', onKey)
      rl.close()
    }

    process.stdin.on('keypress', onKey)
  })
}

// Look up scenes by their `slug` column. Returns an array (legacy data can have
// several scenes sharing one slug, e.g. "untitled-scene"); rejecting by slug
// rejects every match.
async function findScenesBySlug(slug) {
  const { data, error } = await supabase
    .from('scenes')
    .select('id, title, slug')
    .eq('slug', slug)

  if (error) throw new Error(`lookup failed: ${error.message}`)
  return data || []
}

// Record the scene's base slug in rejected_scenes (idempotent — skips if a row
// for that slug already exists), mirroring addRejectedScene().
async function recordRejected(scene) {
  const rejectedSlug = titleToSlug(scene.title)

  const { data: existing, error: checkError } = await supabase
    .from('rejected_scenes')
    .select('slug')
    .eq('slug', rejectedSlug)
    .maybeSingle()

  if (checkError) throw new Error(`rejected_scenes check failed: ${checkError.message}`)
  if (existing) return rejectedSlug // already recorded

  const { error } = await supabase
    .from('rejected_scenes')
    .insert({ slug: rejectedSlug, title: scene.title, rejected_at: new Date().toISOString() })

  if (error) throw new Error(`rejected_scenes insert failed: ${error.message}`)
  return rejectedSlug
}

// Delete all thumbnail variants then the scene row, mirroring deleteScene().
async function deleteScene(id) {
  const filenames = THUMBNAIL_SIZES.flatMap(size => [`${id}-${size}.jpg`, `${id}-${size}.webp`])
  await supabase.storage.from('thumbnails').remove(filenames)

  const { error } = await supabase.from('scenes').delete().eq('id', id)
  if (error) throw new Error(`scene delete failed: ${error.message}`)
}

async function main() {
  const { slugs: argSlugs, file, dryRun } = parseArgs(process.argv.slice(2))

  const slugs = [...new Set([...argSlugs, ...(file ? readSlugFile(file) : [])])]

  if (slugs.length === 0) {
    console.error('No slugs provided. Pass slugs as arguments and/or via --file <path>.')
    process.exit(1)
  }

  console.log(`Slugs to reject: ${slugs.length}${dryRun ? '  (DRY RUN — no changes will be made)' : ''}`)

  // Verify the admin password up front (unless dry-running).
  if (!dryRun) {
    const password = process.env.ADMIN_PASSWORD || (await promptPassword())
    const { data: isValid, error } = await supabase.rpc('verify_delete_password', {
      input_password: password,
    })
    if (error || isValid !== true) {
      console.error('Invalid admin password.')
      process.exit(1)
    }
    console.log('Password verified.\n')
  }

  const summary = { rejected: 0, notFound: 0, failed: 0, notBlocklisted: 0 }

  for (const slug of slugs) {
    let matches
    try {
      matches = await findScenesBySlug(slug)
    } catch (err) {
      console.log(`  ✗ failed: ${slug} — ${err.message}`)
      summary.failed++
      continue
    }

    if (matches.length === 0) {
      console.log(`  - not found: ${slug}`)
      summary.notFound++
      continue
    }

    if (matches.length > 1) {
      console.log(`  ! ${slug} matches ${matches.length} scenes — all will be rejected`)
    }

    // Reject each matching scene independently so one failure doesn't block the rest.
    for (const scene of matches) {
      try {
        if (dryRun) {
          console.log(`  • would reject: ${slug}  ("${scene.title}", id ${scene.id})`)
          summary.rejected++
          continue
        }

        // Blocklisting is best-effort: if the rejected_scenes table is missing
        // or the insert fails, warn and still delete the scene (matches the app,
        // which swallows addRejectedScene errors and deletes regardless).
        let rejectedSlug = null
        try {
          rejectedSlug = await recordRejected(scene)
        } catch (err) {
          summary.notBlocklisted++
          console.log(`    (warning: not blocklisted — ${err.message})`)
        }

        await deleteScene(scene.id)
        const note = rejectedSlug ? `blocklisted as "${rejectedSlug}"` : 'deleted only (not blocklisted)'
        console.log(`  ✓ rejected: ${slug}  ("${scene.title}", id ${scene.id}) — ${note}`)
        summary.rejected++
      } catch (err) {
        console.log(`  ✗ failed: ${slug} (id ${scene.id}) — ${err.message}`)
        summary.failed++
      }
    }
  }

  console.log(
    `\nDone. ${dryRun ? 'Would reject' : 'Rejected'}: ${summary.rejected}` +
      `, not found: ${summary.notFound}, failed: ${summary.failed}`
  )
  if (summary.notBlocklisted > 0) {
    console.log(
      `Note: ${summary.notBlocklisted} scene(s) were deleted but NOT blocklisted ` +
        `(rejected_scenes unavailable) — those slugs can be recreated.`
    )
  }

  if (summary.failed > 0) process.exit(1)
}

main().catch(err => {
  console.error(err.message || err)
  process.exit(1)
})
