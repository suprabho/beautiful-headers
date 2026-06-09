import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowsClockwise, CircleNotch, Warning, MagnifyingGlass } from '@phosphor-icons/react'
import { getAllScenesForAnalysis, titleToSlug } from '@/lib/scenesApi'
import { analyzeScenes } from '@/lib/sceneAnalysis'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Per-type accent colors for charts/badges (semantic tokens don't cover these).
const TYPE_COLORS = {
  liquid: '#a855f7', fluid: '#1C89FF', ribbon: '#d6dae6', aurora: '#71ECFF',
  waves: '#06b6d4', dandelion: '#F0CBA8', simple: '#94a3b8', particleRing: '#ec4899',
  unknown: '#64748b',
}

const ISSUE_LABELS = {
  untitled: 'untitled', 'missing-desc': 'no description',
  'undoc-texture': 'texture?', 'inline-thumb': 'inline thumb',
}
const ISSUE_CLASSES = {
  untitled: 'bg-rose-500/15 text-rose-300',
  'missing-desc': 'bg-amber-500/15 text-amber-300',
  'undoc-texture': 'bg-purple-500/15 text-purple-300',
  'inline-thumb': 'bg-primary/15 text-primary',
  old: 'bg-muted text-muted-foreground',
}

const pct = (n, total) => (total ? (n / total * 100).toFixed(1) : '0') + '%'

function Kpi({ value, label, accent }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className={cn('text-2xl font-extrabold tracking-tight tabular-nums',
        accent === 'primary' && 'text-primary', accent === 'warn' && 'text-amber-400')}>
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

function Panel({ title, sub, children, className }) {
  return (
    <section className={cn('rounded-2xl border border-border bg-card p-5', className)}>
      <h2 className="text-sm font-bold mb-4 flex items-baseline gap-2">
        {title}{sub && <span className="font-medium text-muted-foreground text-xs">{sub}</span>}
      </h2>
      {children}
    </section>
  )
}

function BarChart({ entries, total, color }) {
  const max = Math.max(1, ...entries.map((e) => e[1]))
  return (
    <div>
      {entries.map(([name, value]) => (
        <div key={name} className="flex items-center gap-2.5 my-1.5 text-[13px]">
          <span className="w-28 shrink-0 capitalize truncate" title={name}>{name}</span>
          <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
            <div className="h-full rounded" style={{ width: pct(value, max), minWidth: 2, background: typeof color === 'function' ? color(name) : (color || 'var(--color-primary)') }} />
          </div>
          <span className="w-20 shrink-0 text-right text-muted-foreground tabular-nums">{value} · {pct(value, total)}</span>
        </div>
      ))}
    </div>
  )
}

function Timeline({ byMonth }) {
  const max = Math.max(1, ...byMonth.map((m) => m[1]))
  return (
    <div className="flex items-end gap-3 h-36 pt-2">
      {byMonth.map(([month, count]) => (
        <div key={month} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
          <span className="text-xs font-bold tabular-nums">{count}</span>
          <div className="w-full max-w-14 rounded-t bg-gradient-to-t from-sky-700 to-primary" style={{ height: pct(count, max), minHeight: 3 }} />
          <span className="text-[11px] text-muted-foreground">{month.slice(2)}</span>
        </div>
      ))}
    </div>
  )
}

function ExplorerCard({ s }) {
  const [imgError, setImgError] = useState(false)
  const slug = s.slug || titleToSlug(s.title)
  return (
    <Link to={`/scenes/${slug}`}
      className="group rounded-xl overflow-hidden bg-card border border-border transition-all hover:border-primary/60 hover:-translate-y-0.5 flex flex-col">
      <div className="aspect-[16/10] bg-muted relative overflow-hidden">
        {s.thumb && !imgError ? (
          <img src={s.thumb} alt={s.title} loading="lazy" onError={() => setImgError(true)}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex">
            {(s.colors.length ? s.colors : ['#222']).map((c, i) => (
              <span key={i} className="flex-1" style={{ background: c }} />
            ))}
          </div>
        )}
        <span className="absolute top-2 right-2 rounded-md border border-border bg-background/80 backdrop-blur px-2 py-0.5 text-[11px] font-bold">cx {s.complexity}</span>
        {s.ageDays != null && (
          <span className="absolute top-2 left-2 rounded-md bg-background/80 px-2 py-0.5 text-[11px] text-muted-foreground">{s.ageDays}d</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-[13px] font-semibold leading-snug line-clamp-2 min-h-9">{s.title}</p>
        <div className="flex items-center gap-1.5 flex-wrap mt-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded border border-border bg-muted capitalize">
            <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[s.type] || '#888' }} />{s.type}
          </span>
          {s.texture !== 'none' && <span className="text-[11px] px-2 py-0.5 rounded border border-border bg-muted capitalize">{s.texture}</span>}
          {s.fluted && <span className="text-[11px] px-2 py-0.5 rounded border border-border bg-muted">fluted</span>}
          {s.issues.map((i) => (
            <span key={i} className={cn('text-[10.5px] px-2 py-0.5 rounded font-semibold', ISSUE_CLASSES[i])}>{ISSUE_LABELS[i] || i}</span>
          ))}
          {s.old && s.issues.length === 0 && <span className={cn('text-[10.5px] px-2 py-0.5 rounded font-semibold', ISSUE_CLASSES.old)}>old</span>}
        </div>
        {s.colors.length > 0 && (
          <div className="flex gap-1 mt-2.5">
            {s.colors.map((c, i) => <span key={i} className="w-3.5 h-3.5 rounded border border-white/10" style={{ background: c }} />)}
          </div>
        )}
      </div>
    </Link>
  )
}

const selectCls = 'bg-input border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary'

function DashboardPage() {
  const navigate = useNavigate()
  const [rawScenes, setRawScenes] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Explorer filters
  const [q, setQ] = useState('')
  const [fType, setFType] = useState('')
  const [fAge, setFAge] = useState('')
  const [sort, setSort] = useState('age-desc')
  const [onlyFlagged, setOnlyFlagged] = useState(false)
  const [issueFilter, setIssueFilter] = useState(null)
  const explorerRef = useRef(null)

  useEffect(() => { document.title = 'Scene Dashboard · Aura' }, [])

  const load = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAllScenesForAnalysis()
      setRawScenes(data)
    } catch (err) {
      console.error(err)
      setError('Failed to load scenes. Check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const analysis = useMemo(() => (rawScenes ? analyzeScenes(rawScenes) : null), [rawScenes])

  const filtered = useMemo(() => {
    if (!analysis) return []
    const needle = q.trim().toLowerCase()
    const rows = analysis.scenes.filter((s) => {
      if (needle && !s.title.toLowerCase().includes(needle)) return false
      if (fType && s.type !== fType) return false
      if (fAge === 'old' && !s.old) return false
      if (fAge === 'recent' && !(s.ageDays != null && s.ageDays <= 30)) return false
      if (onlyFlagged && s.issues.length === 0) return false
      if (issueFilter && !s.issues.includes(issueFilter)) return false
      return true
    })
    rows.sort((a, b) => {
      if (sort === 'age-desc') return (b.ageDays || 0) - (a.ageDays || 0)
      if (sort === 'age-asc') return (a.ageDays || 0) - (b.ageDays || 0)
      if (sort === 'cx-desc') return b.complexity - a.complexity
      if (sort === 'cx-asc') return a.complexity - b.complexity
      if (sort === 'title') return a.title.localeCompare(b.title)
      return 0
    })
    return rows
  }, [analysis, q, fType, fAge, sort, onlyFlagged, issueFilter])

  const clearExplorerFilters = () => { setQ(''); setFType(''); setFAge(''); setOnlyFlagged(false); setIssueFilter(null) }

  const focusIssue = (key) => {
    clearExplorerFilters()
    if (key === 'old') setFAge('old')
    else { setOnlyFlagged(true); setIssueFilter(key) }
    requestAnimationFrame(() => explorerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const S = analysis?.summary
  const undoc = S ? S.texture.filter((t) => !S.documentedTextures.includes(t[0])) : []

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container max-w-420 mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft size={20} weight="bold" /></Button>
          <div className="flex flex-row flex-wrap items-baseline gap-3">
            <h1 className="text-lg font-semibold">Scene Dashboard</h1>
            {S && <span className="text-sm text-muted-foreground">{S.total} scenes · live</span>}
          </div>
          <div className="ml-auto">
            <Button variant="ghost" size="icon" onClick={load} disabled={isLoading} title="Refresh">
              <ArrowsClockwise size={18} weight="bold" className={isLoading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container w-full max-w-420 mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24"><CircleNotch size={32} className="animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Warning size={48} className="text-destructive mb-4" weight="light" />
            <p className="text-muted-foreground max-w-md">{error}</p>
            <Button variant="outline" className="mt-4" onClick={load}>Try Again</Button>
          </div>
        ) : !S ? null : (
          <div className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Kpi value={S.total} label="Total scenes" accent="primary" />
              <Kpi value={S.byType.length} label="Background types" />
              <Kpi value={S.cxAvg} label="Avg complexity" />
              <Kpi value={`${S.flutedPct}%`} label="Fluted glass" />
              <Kpi value={`${S.ages.oldest}d / ${S.ages.newest}d`} label="Oldest / newest" />
              <Kpi value={S.flaggedTotal} label="Flagged scenes" accent="warn" />
            </div>

            {/* Composition */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Panel title="Background types" sub={S.byType[0] ? `${S.byType[0][0]} leads` : ''}>
                <BarChart entries={S.byType} total={S.total} color={(n) => TYPE_COLORS[n] || 'var(--color-primary)'} />
              </Panel>
              <Panel title="Complexity distribution" sub={`avg ${S.cxAvg}`}>
                <BarChart entries={Object.entries(S.cxBuckets)} total={S.total} color="#39F58A" />
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  {pct(S.cxBuckets['Minimal (6–15)'] + S.cxBuckets['Moderate (16–25)'], S.total)} of scenes are Minimal or Moderate.
                  {S.cxBuckets['Immersive (36–52)'] === 0 && ' Nothing reaches the Immersive tier (36+) — headroom for premium cinematic scenes.'}
                </p>
              </Panel>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Panel title="Texture" sub="overlay channel">
                <BarChart entries={S.texture} total={S.total} color={(n) => (S.documentedTextures.includes(n) ? 'var(--color-primary)' : '#a855f7')} />
              </Panel>
              <Panel title="Color map" sub="most scenes ship neutral">
                <BarChart entries={S.colorMap} total={S.total} />
              </Panel>
            </div>

            {/* Timeline */}
            <Panel title="Production over time" sub="scenes created per month">
              <Timeline byMonth={S.byMonth} />
              <p className="text-xs text-muted-foreground mt-3">Median scene age is {S.ages.median} days.</p>
            </Panel>

            {/* Attention */}
            <Panel title="Needs attention" sub="click a tile to filter the catalog below">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  ['untitled', S.attentionCounts.untitled, 'Untitled scenes'],
                  ['missing-desc', S.attentionCounts.missingDesc, 'Missing descriptions'],
                  ['undoc-texture', S.attentionCounts.undocTexture, 'Undocumented texture'],
                  ['old', S.attentionCounts.old, 'Old (≥120 days)'],
                ].map(([key, value, label]) => (
                  <button key={key} onClick={() => focusIssue(key)}
                    className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary transition-colors">
                    <div className="text-2xl font-extrabold text-amber-400 tabular-nums">{value}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Undocumented texture values in use: {undoc.map((t) => `${t[0]} (${t[1]})`).join(', ') || 'none'} — not in the scene-system spec (grain / scanlines / diagonal / dots / grid), likely schema drift.
                {S.attentionCounts.inlineThumb > 0 && ` ${S.attentionCounts.inlineThumb} scene still stores an inline base64 thumbnail instead of a CDN URL.`}
                {S.dupTitles.length > 0 && ` Duplicate titles: ${S.dupTitles.slice(0, 3).map((d) => `“${d[0]}” ×${d[1]}`).join(', ')}.`}
              </p>
            </Panel>

            {/* Explorer */}
            <Panel title="Scene explorer" sub="live thumbnails">
              <div ref={explorerRef} className="flex flex-wrap items-center gap-2.5 mb-4 scroll-mt-16">
                <div className="relative">
                  <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setIssueFilter(null) }}
                    placeholder="Search title…" className={cn(selectCls, 'pl-9 min-w-56')} />
                </div>
                <select value={fType} onChange={(e) => { setFType(e.target.value); setIssueFilter(null) }} className={selectCls}>
                  <option value="">All types</option>
                  {S.byType.map((t) => <option key={t[0]} value={t[0]}>{t[0]} ({t[1]})</option>)}
                </select>
                <select value={fAge} onChange={(e) => setFAge(e.target.value)} className={selectCls}>
                  <option value="">Any age</option>
                  <option value="old">Old (≥120d)</option>
                  <option value="recent">Recent (≤30d)</option>
                </select>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectCls}>
                  <option value="age-desc">Oldest first</option>
                  <option value="age-asc">Newest first</option>
                  <option value="cx-desc">Most complex</option>
                  <option value="cx-asc">Least complex</option>
                  <option value="title">Title A–Z</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                  <input type="checkbox" checked={onlyFlagged} onChange={(e) => { setOnlyFlagged(e.target.checked); setIssueFilter(null) }} />
                  Only flagged
                </label>
                {(q || fType || fAge || onlyFlagged || issueFilter) && (
                  <button onClick={clearExplorerFilters} className="text-sm text-primary hover:underline">Clear</button>
                )}
                <span className="ml-auto text-sm text-muted-foreground tabular-nums">{filtered.length} of {S.total}</span>
              </div>

              {filtered.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">No scenes match these filters.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                  {filtered.slice(0, 600).map((s) => <ExplorerCard key={s.id} s={s} />)}
                </div>
              )}
            </Panel>
          </div>
        )}
      </main>
    </div>
  )
}

export default DashboardPage
