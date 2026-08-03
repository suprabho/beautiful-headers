#!/usr/bin/env node
/**
 * Local headless-render spike for the capture endpoint.
 *
 * Loads /embed/:slug?capture=1 in a real headless Chromium at the requested
 * frame size, waits for window.__auraCaptureReady, calls window.__auraCapture()
 * (the same pipeline the in-app "capture" button uses), and writes a PNG.
 *
 * This proves the headless render works before we wire up the Vercel endpoint
 * and caching. The production endpoint reuses this exact flow with
 * @sparticuz/chromium instead of a local browser.
 *
 * Prereq:  npm install -D puppeteer        (downloads its own Chromium)
 *          ...or have Chrome installed and set CHROME_PATH=/path/to/chrome
 *          and `npm install -D puppeteer-core`.
 *
 * Usage:
 *   # start the dev server first:  npm run dev   (serves http://localhost:5173)
 *   node scripts/capture-spike.mjs <slug> [--w=1200] [--h=630] [--dpr=2] \
 *        [--base=http://localhost:5173] [--out=capture.png] \
 *        [--hideText] [--hideIcons] [--theme=dark]
 */

import { writeFileSync } from 'node:fs'

// ---- arg parsing -----------------------------------------------------------
const args = process.argv.slice(2)
const slug = args.find((a) => !a.startsWith('--'))
if (!slug) {
  console.error('Usage: node scripts/capture-spike.mjs <slug> [--w=] [--h=] [--dpr=] [--base=] [--out=]')
  process.exit(1)
}
const flag = (name, def) => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`))
  if (!hit) return def
  const eq = hit.indexOf('=')
  return eq === -1 ? true : hit.slice(eq + 1)
}

const width = Number(flag('w', 1200))
const height = Number(flag('h', 630))
const dpr = Number(flag('dpr', 2))
const base = String(flag('base', 'http://localhost:5173')).replace(/\/$/, '')
const out = String(flag('out', `capture-${slug}.png`))

const params = new URLSearchParams({ capture: '1' })
if (flag('hideText', false)) params.set('hideText', 'true')
if (flag('hideIcons', false)) params.set('hideIcons', 'true')
if (flag('theme', null)) params.set('theme', String(flag('theme')))
const url = `${base}/embed/${encodeURIComponent(slug)}?${params.toString()}`

// ---- launch a real browser -------------------------------------------------
// Flags below force software WebGL (SwiftShader) so output matches a headless
// server, where there's no GPU. Drop --use-gl to use the local GPU instead.
const LAUNCH = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader', // required for software WebGL on Chromium 136+
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--hide-scrollbars',
  ],
}

async function getBrowser() {
  try {
    const puppeteer = (await import('puppeteer')).default
    return puppeteer.launch(LAUNCH)
  } catch {
    const puppeteer = (await import('puppeteer-core')).default
    const executablePath =
      process.env.CHROME_PATH ||
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    return puppeteer.launch({ ...LAUNCH, executablePath })
  }
}

const main = async () => {
  console.log(`→ rendering ${url} @ ${width}x${height} (dpr ${dpr})`)
  const browser = await getBrowser()
  try {
    const page = await browser.newPage()
    await page.setViewport({ width, height, deviceScaleFactor: dpr })
    page.on('console', (m) => console.log('  [page]', m.text()))
    page.on('pageerror', (e) => console.error('  [page error]', e.message))

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
    await page.waitForFunction('window.__auraCaptureReady === true', { timeout: 30000 })

    const dataUrl = await page.evaluate((scale) => window.__auraCapture({ scale }), dpr)
    const b64 = dataUrl.replace(/^data:image\/png;base64,/, '')
    writeFileSync(out, Buffer.from(b64, 'base64'))
    console.log(`✓ wrote ${out} (${(Buffer.from(b64, 'base64').length / 1024).toFixed(0)} KB, ${width * dpr}x${height * dpr}px)`)
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('✗ capture failed:', err.message)
  process.exit(1)
})
