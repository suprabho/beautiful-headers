/**
 * Pure scene-catalog analytics. Takes normalized scene rows (see
 * getAllScenesForAnalysis in scenesApi) and returns aggregate `summary` stats
 * plus a per-scene `enriched` list with derived complexity, age, and quality
 * flags. No DOM / network — safe to run in a useMemo.
 */

export const DOCUMENTED_TEXTURES = ['none', 'grain', 'scanlines', 'diagonal', 'dots', 'grid']
export const DOCUMENTED_TYPES = ['liquid', 'fluid', 'ribbon', 'aurora', 'waves', 'dandelion', 'simple', 'particleRing']

const DAY = 86400000

function firstThumb(t) {
  if (!t) return null
  if (typeof t === 'string') return t
  return t.small || t.medium || t.large || t.full || null
}

/**
 * @param {Array} scenes - normalized rows: { id, title, slug, short_description,
 *   long_description, thumbnail, created_at, backgroundType, effectsConfig, colors }
 * @param {Object} [opts]
 * @param {number|string} [opts.asOf] - reference time for age math (default now)
 * @returns {{ summary: Object, scenes: Array }}
 */
export function analyzeScenes(scenes, { asOf = Date.now() } = {}) {
  const now = typeof asOf === 'number' ? asOf : new Date(asOf).getTime()
  const byType = {}, texture = {}, colorMap = {}, byMonth = {}, titles = {}
  let flutedOn = 0, vignetteOn = 0
  const blurVals = [], cxVals = [], ages = []
  const inc = (o, k) => { o[k] = (o[k] || 0) + 1 }

  const enriched = scenes.map((s) => {
    const bt = s.backgroundType || 'unknown'
    const e = s.effectsConfig || {}
    const tex = e.texture || 'none'
    const cm = e.colorMap || 'none'
    const blur = Number(e.blur) || 0
    const fluted = !!(e.flutedGlass && e.flutedGlass.enabled)
    const vig = Number(e.vignetteIntensity) || 0

    inc(byType, bt); inc(texture, tex); inc(colorMap, cm)
    if (fluted) flutedOn++
    if (vig > 0) vignetteOn++
    blurVals.push(blur)

    const effectCount = [tex !== 'none', cm !== 'none', vig > 0, fluted, blur > 0].filter(Boolean).length
    let cx = 6 + effectCount * 2 + blur / 3 + (tex !== 'none' ? 1.5 : 0) + (cm !== 'none' ? 1 : 0) + (vig > 0 ? 1 : 0) + (fluted ? 2 : 0)
    cx = Math.min(52, Math.round(cx))
    cxVals.push(cx)

    const created = s.created_at ? new Date(s.created_at).getTime() : null
    const ageDays = created != null && !isNaN(created) ? Math.round((now - created) / DAY) : null
    if (ageDays != null) ages.push(ageDays)
    if (created && !isNaN(created)) inc(byMonth, new Date(created).toISOString().slice(0, 7))

    const title = (s.title || '').trim()
    inc(titles, title.toLowerCase())
    const short = (s.short_description || '').trim()
    const long = (s.long_description || '').trim()

    let thumb = firstThumb(s.thumbnail)
    const legacyThumb = typeof thumb === 'string' && (thumb.startsWith('data:') || thumb.length > 500)
    if (legacyThumb) thumb = null

    const issues = []
    if (!title || title.toLowerCase() === 'untitled scene') issues.push('untitled')
    if (!short || !long) issues.push('missing-desc')
    if (!DOCUMENTED_TEXTURES.includes(tex)) issues.push('undoc-texture')
    if (legacyThumb) issues.push('inline-thumb')

    return {
      id: s.id, title: title || '(untitled)', slug: s.slug || '', type: bt,
      blur, texture: tex, colorMap: cm, fluted, vignette: vig, complexity: cx,
      created_at: s.created_at || null, ageDays, thumb,
      colors: Array.isArray(s.colors) ? s.colors.filter((c) => typeof c === 'string').slice(0, 6) : [],
      issues, old: ageDays != null && ageDays >= 120,
    }
  })

  const total = scenes.length || 1
  const sortDesc = (o) => Object.entries(o).sort((a, b) => b[1] - a[1])
  ages.sort((a, b) => a - b)
  const avg = (a) => (a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : 0)

  const cxBuckets = { 'Minimal (6–15)': 0, 'Moderate (16–25)': 0, 'Rich (26–35)': 0, 'Immersive (36–52)': 0 }
  cxVals.forEach((c) => {
    if (c <= 15) cxBuckets['Minimal (6–15)']++
    else if (c <= 25) cxBuckets['Moderate (16–25)']++
    else if (c <= 35) cxBuckets['Rich (26–35)']++
    else cxBuckets['Immersive (36–52)']++
  })

  const has = (key) => (s) => s.issues.includes(key)
  const attentionCounts = {
    untitled: enriched.filter(has('untitled')).length,
    missingDesc: enriched.filter(has('missing-desc')).length,
    undocTexture: enriched.filter(has('undoc-texture')).length,
    inlineThumb: enriched.filter(has('inline-thumb')).length,
    old: enriched.filter((s) => s.old).length,
  }

  const summary = {
    total: scenes.length,
    byType: sortDesc(byType),
    texture: sortDesc(texture),
    colorMap: sortDesc(colorMap),
    cxBuckets,
    flutedPct: +(flutedOn / total * 100).toFixed(1),
    vignettePct: +(vignetteOn / total * 100).toFixed(1),
    blurAvg: avg(blurVals),
    cxAvg: avg(cxVals),
    byMonth: Object.entries(byMonth).sort(),
    ages: { oldest: ages[ages.length - 1] ?? 0, newest: ages[0] ?? 0, median: ages[Math.floor(ages.length / 2)] ?? 0 },
    documentedTypes: DOCUMENTED_TYPES,
    documentedTextures: DOCUMENTED_TEXTURES,
    attentionCounts,
    flaggedTotal: enriched.filter((s) => s.issues.length > 0).length,
    dupTitles: Object.entries(titles).filter(([k, v]) => v > 1 && k).sort((a, b) => b[1] - a[1]),
  }

  return { summary, scenes: enriched }
}
