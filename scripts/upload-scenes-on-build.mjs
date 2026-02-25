#!/usr/bin/env node

/**
 * upload-scenes-on-build.mjs — Runs during `vercel build` to push
 * scenes from generated-scenes.json into Supabase.
 *
 * Behaviour:
 *  1. Reads generated-scenes.json from the repo root.
 *  2. For each scene, derives a slug from the title.
 *  3. Skips scenes whose slug exists in the DB OR in .uploaded-slugs.json
 *     (prevents deleted/rejected scenes from being re-inserted).
 *  4. Inserts new scenes with pendingReview: true.
 *  5. Appends newly uploaded slugs to .uploaded-slugs.json.
 *  6. Prints a summary and exits 0 (never fails the build).
 *
 * Environment variables (set in Vercel project settings):
 *   SCENES_UPLOAD_PASSWORD  — admin password (required to enable uploads)
 *   VITE_SUPABASE_URL       — optional override
 *   VITE_SUPABASE_ANON_KEY  — optional override
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCENES_FILE = resolve(__dirname, '..', 'generated-scenes.json');
const UPLOADED_SLUGS_FILE = resolve(__dirname, '..', '.uploaded-slugs.json');

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || 'https://grbrfpaznehikakupavx.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_nFT6O21VoCZSKs7lQe-UaA_tSkoc4su';
const PASSWORD = process.env.SCENES_UPLOAD_PASSWORD || '';

function titleToSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function loadUploadedSlugs() {
  if (!existsSync(UPLOADED_SLUGS_FILE)) return new Set();
  try {
    const data = JSON.parse(readFileSync(UPLOADED_SLUGS_FILE, 'utf8'));
    return new Set(Array.isArray(data) ? data : []);
  } catch {
    return new Set();
  }
}

function saveUploadedSlugs(slugSet) {
  const sorted = [...slugSet].sort();
  writeFileSync(UPLOADED_SLUGS_FILE, JSON.stringify(sorted, null, 2) + '\n');
}

async function main() {
  console.log('\n=== Scene Upload (build-time) ===\n');

  // ── Guard: password must be set ──────────────────────────────────────────
  if (!PASSWORD) {
    console.log('SCENES_UPLOAD_PASSWORD not set — skipping scene upload.');
    console.log('Set it in Vercel project settings to enable build-time uploads.\n');
    return;
  }

  // ── Guard: file must exist ───────────────────────────────────────────────
  if (!existsSync(SCENES_FILE)) {
    console.log('generated-scenes.json not found — nothing to upload.\n');
    return;
  }

  const scenes = JSON.parse(readFileSync(SCENES_FILE, 'utf8'));
  if (!Array.isArray(scenes) || scenes.length === 0) {
    console.log('generated-scenes.json is empty — nothing to upload.\n');
    return;
  }

  console.log(`Found ${scenes.length} scene(s) in generated-scenes.json`);

  // ── Load previously uploaded slugs (persisted in repo) ─────────────────
  const uploadedSlugs = loadUploadedSlugs();
  console.log(`Loaded ${uploadedSlugs.size} previously uploaded slug(s) from .uploaded-slugs.json`);

  // ── Init Supabase ────────────────────────────────────────────────────────
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ── Verify password ──────────────────────────────────────────────────────
  const { data: isValid, error: rpcError } = await supabase.rpc(
    'verify_delete_password',
    { input_password: PASSWORD }
  );

  if (rpcError || isValid !== true) {
    console.log('Invalid SCENES_UPLOAD_PASSWORD — skipping upload.\n');
    return;
  }

  // ── Fetch existing slugs from DB ───────────────────────────────────────
  const { data: existing } = await supabase
    .from('scenes')
    .select('slug');
  const dbSlugs = new Set((existing || []).map((r) => r.slug));

  // ── Merge: skip if slug is in DB OR was ever uploaded before ───────────
  const knownSlugs = new Set([...dbSlugs, ...uploadedSlugs]);

  const now = new Date().toISOString();
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const scene of scenes) {
    if (!scene.title || !scene.scene_data) {
      console.log(`  [skip] Missing title or scene_data`);
      skipped++;
      continue;
    }

    const slug = titleToSlug(scene.title);

    if (knownSlugs.has(slug)) {
      console.log(`  [skip] ${slug} (already known)`);
      skipped++;
      continue;
    }

    const row = {
      title: scene.title,
      slug,
      scene_data: { ...scene.scene_data, pendingReview: true },
      short_description: scene.short_description || null,
      long_description: scene.long_description || null,
      thumbnail: scene.thumbnail || null,
      created_at: scene.created_at || now,
      updated_at: now,
    };

    const { error } = await supabase.from('scenes').insert(row);

    if (error) {
      console.log(`  [fail] ${slug}: ${error.message}`);
      failed++;
    } else {
      console.log(`  [  ok] ${slug}`);
      created++;
      knownSlugs.add(slug);
      uploadedSlugs.add(slug);
    }
  }

  // ── Persist uploaded slugs back to file ────────────────────────────────
  // Also add all slugs from generated-scenes.json so they're tracked
  // even if they already existed in DB (covers the initial backfill)
  for (const scene of scenes) {
    if (scene.title) {
      uploadedSlugs.add(titleToSlug(scene.title));
    }
  }
  saveUploadedSlugs(uploadedSlugs);

  console.log(`\nDone: ${created} created, ${skipped} skipped, ${failed} failed.`);
  console.log(`Tracking ${uploadedSlugs.size} total slug(s) in .uploaded-slugs.json\n`);
}

main().catch((err) => {
  // Never fail the build — just log the error
  console.error('Scene upload error (non-fatal):', err.message);
});
