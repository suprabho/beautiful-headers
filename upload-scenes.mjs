#!/usr/bin/env node

/**
 * upload-scenes.mjs — Bulk upload generated scenes to the production API.
 *
 * Usage:
 *   node upload-scenes.mjs                          # upload last 8 from generated-scenes.json
 *   node upload-scenes.mjs --file my-scenes.json    # upload from a custom file
 *   node upload-scenes.mjs --last 3                 # upload only the last 3 scenes
 *   node upload-scenes.mjs --all                    # upload everything in the file
 */

import { readFileSync } from 'fs';

const API_URL = 'https://aura.promad.design/api/bulk-create-scenes';
const PASSWORD = process.argv.includes('--password')
  ? process.argv[process.argv.indexOf('--password') + 1]
  : 'Pr0m@dDe5ign#26';

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const inputFile = getArg('file') || 'generated-scenes.json';
const lastN = getArg('last') ? parseInt(getArg('last'), 10) : null;
const uploadAll = args.includes('--all');

const allScenes = JSON.parse(readFileSync(inputFile, 'utf8'));
const scenes = uploadAll ? allScenes : allScenes.slice(-(lastN || 8));

console.log(`Uploading ${scenes.length} scene(s) from ${inputFile} to ${API_URL}...\n`);

try {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: PASSWORD, scenes }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error(`API error (${res.status}):`, data.error || data);
    process.exit(1);
  }

  console.log('Summary:', data.summary);
  console.log('');

  for (const r of data.results) {
    const icon = r.success ? '+' : 'x';
    const detail = r.success ? `slug: ${r.slug}, id: ${r.id}` : `error: ${r.error}`;
    console.log(`  [${icon}] ${r.index + 1}. ${r.title} — ${detail}`);
  }

  if (data.summary.failed > 0) {
    process.exit(1);
  }
} catch (err) {
  console.error('Network error:', err.message);
  process.exit(1);
}
