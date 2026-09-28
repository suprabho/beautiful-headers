import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowSquareOut,
  ArrowsClockwise,
  CheckCircle,
  CircleNotch,
  FrameCorners,
  ImageSquare,
  MagnifyingGlass,
  Moon,
  Sun,
  WarningCircle,
  X,
} from '@phosphor-icons/react'
import type { MainToUi, RenderOptions, Target } from '../shared'
import { fetchScenes, sceneUrl, type Scene } from './api'
import { postToMain, renderToLayers, rerenderLayers } from './render'

const BACKGROUND_TYPES = [
  { value: null, label: 'All' },
  { value: 'aurora', label: 'Aurora' },
  { value: 'fluid', label: 'Mesh' },
  { value: 'liquid', label: 'Fog' },
  { value: 'waves', label: 'Waves' },
  { value: 'ribbon', label: 'Ribbon' },
  { value: 'simple', label: 'Simple' },
  { value: 'dandelion', label: 'Dandelion' },
  { value: 'particleRing', label: 'Particle Ring' },
  { value: 'guilloche', label: 'Guilloché' },
  { value: 'sky', label: 'Sky' },
  { value: 'watercolor', label: 'Watercolors' },
  { value: 'glow', label: 'Glow' },
  { value: 'forms', label: 'Forms' },
  { value: 'prism', label: 'Prism' },
] as const

const FRAME_PRESETS = [
  { label: 'Web header', width: 1440, height: 560 },
  { label: 'OG image', width: 1200, height: 630 },
  { label: 'Desktop', width: 1920, height: 1080 },
  { label: 'Mobile', width: 390, height: 844 },
  { label: 'Square post', width: 1080, height: 1080 },
  { label: 'Story', width: 1080, height: 1920 },
]

const DEFAULT_OPTIONS: RenderOptions = { hideText: true, hideIcons: false, theme: 'dark', dpr: 2 }

type Status =
  | { kind: 'idle' }
  | { kind: 'rendering'; done: number; total: number }
  | { kind: 'done'; message: string }
  | { kind: 'error'; message: string }

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return debounced
}

export default function App() {
  const [search, setSearch] = useState('')
  const [bgType, setBgType] = useState<string | null>(null)
  const [scenes, setScenes] = useState<Scene[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selected, setSelected] = useState<Scene | null>(null)
  const [options, setOptions] = useState<RenderOptions>(DEFAULT_OPTIONS)
  const [preset, setPreset] = useState(0)

  const [targets, setTargets] = useState<Target[]>([])
  const [unsupported, setUnsupported] = useState(0)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const debouncedSearch = useDebounced(search, 300)
  const requestId = useRef(0)

  const loadPage = useCallback(
    async (reset: boolean) => {
      const id = ++requestId.current
      setLoading(true)
      setLoadError(null)
      try {
        const offset = reset ? 0 : scenes.length
        const page = await fetchScenes({ offset, search: debouncedSearch, backgroundType: bgType })
        if (id !== requestId.current) return
        setScenes((prev) => (reset ? page.scenes : [...prev, ...page.scenes]))
        setHasMore(page.hasMore)
      } catch (err) {
        if (id === requestId.current) setLoadError((err as Error).message)
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    },
    [debouncedSearch, bgType, scenes.length],
  )

  // Reload from the top whenever the query changes.
  useEffect(() => {
    loadPage(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, bgType])

  // Infinite scroll.
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && scenes.length > 0 && hasMore && !loading && !loadError) loadPage(false)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [scenes.length, hasMore, loading, loadError, loadPage])

  // Messages from the main thread.
  useEffect(() => {
    const onMessage = async (event: MessageEvent) => {
      const msg = event.data?.pluginMessage as MainToUi | undefined
      if (!msg) return
      if (msg.type === 'selection') {
        setTargets(msg.targets)
        setUnsupported(msg.unsupported)
      } else if (msg.type === 'refresh') {
        await runRefresh(msg.targets)
      }
    }
    window.addEventListener('message', onMessage)
    postToMain({ type: 'ready' })
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const waitForFrame = () =>
    new Promise<Target>((resolve) => {
      const handler = (event: MessageEvent) => {
        const msg = event.data?.pluginMessage as MainToUi | undefined
        if (msg?.type !== 'frame-created') return
        window.removeEventListener('message', handler)
        resolve(msg.target)
      }
      window.addEventListener('message', handler)
    })

  const apply = async () => {
    if (!selected || status.kind === 'rendering') return
    let jobTargets = targets
    if (jobTargets.length === 0) {
      const p = FRAME_PRESETS[preset]
      const created = waitForFrame()
      postToMain({ type: 'create-frame', width: p.width, height: p.height, name: `${selected.title} — ${p.label}` })
      jobTargets = [await created]
    }
    setStatus({ kind: 'rendering', done: 0, total: 1 })
    const { failed, errors } = await renderToLayers(
      {
        targets: jobTargets,
        data: { slug: selected.slug, title: selected.title, options },
        previewUrl: selected.thumb.large,
      },
      (done, total) => setStatus({ kind: 'rendering', done, total }),
    )
    if (failed) {
      setStatus({ kind: 'error', message: errors[0] })
      postToMain({ type: 'notify', message: `Aura: ${errors[0]}`, error: true })
    } else {
      const n = jobTargets.length
      setStatus({ kind: 'done', message: `Applied to ${n} layer${n === 1 ? '' : 's'}` })
    }
  }

  const refreshSelection = async () => {
    if (status.kind === 'rendering') return
    setStatus({ kind: 'rendering', done: 0, total: 1 })
    const errors = await rerenderLayers(targets)
    setStatus(errors.length ? { kind: 'error', message: errors[0] } : { kind: 'done', message: 'Re-rendered' })
  }

  const extent = targets.length === 1 ? `${Math.round(targets[0].width)} × ${Math.round(targets[0].height)}` : null
  const auraTargets = targets.filter((t) => t.aura)

  return (
    <div className="flex h-screen flex-col bg-bg text-fg">
      {/* Search + filters */}
      <div className="space-y-2 border-b border-line p-3">
        <label className="flex h-8 items-center gap-2 rounded-md border border-line bg-bg-2 px-2 focus-within:border-brand">
          <MagnifyingGlass size={14} className="text-fg-2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scenes"
            className="w-full bg-transparent outline-none placeholder:text-fg-3"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-fg-2 hover:text-fg" aria-label="Clear search">
              <X size={12} />
            </button>
          )}
        </label>
        <div className="no-scrollbar -mx-3 flex gap-1 overflow-x-auto px-3">
          {BACKGROUND_TYPES.map((t) => (
            <button
              key={t.label}
              onClick={() => setBgType(t.value)}
              className={`shrink-0 rounded-full border px-2.5 py-1 ${
                bgType === t.value ? 'border-brand bg-brand text-on-brand' : 'border-line text-fg-2 hover:text-fg'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => setSelected(scene)}
              title={scene.shortDescription || scene.title}
              className={`group overflow-hidden rounded-md border text-left ${
                selected?.id === scene.id ? 'border-brand ring-2 ring-brand' : 'border-line hover:border-fg-3'
              }`}
            >
              <div className="aspect-video w-full bg-bg-2">
                {scene.thumb.small ? (
                  <img src={scene.thumb.small} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-fg-3">
                    <ImageSquare size={20} />
                  </div>
                )}
              </div>
              <div className="truncate px-2 py-1.5 text-fg-2 group-hover:text-fg">{scene.title}</div>
            </button>
          ))}
        </div>
        <div ref={sentinel} className="flex h-12 items-center justify-center text-fg-2">
          {loading && <CircleNotch size={16} className="animate-spin" />}
          {loadError && (
            <button onClick={() => loadPage(scenes.length === 0)} className="flex items-center gap-1 text-danger">
              <WarningCircle size={14} /> {loadError} — retry
            </button>
          )}
          {!loading && !loadError && scenes.length === 0 && 'No scenes match'}
        </div>
      </div>

      {/* Action panel */}
      <div className="space-y-3 border-t border-line p-3">
        {selected ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-semibold">{selected.title}</div>
              <div className="text-fg-2">
                {BACKGROUND_TYPES.find((t) => t.value === selected.backgroundType)?.label || 'Scene'}
              </div>
            </div>
            <a
              href={sceneUrl(selected.slug)}
              target="_blank"
              rel="noreferrer"
              className="flex shrink-0 items-center gap-1 text-brand hover:underline"
            >
              Open in Aura <ArrowSquareOut size={12} />
            </a>
          </div>
        ) : (
          <div className="text-fg-2">Pick a scene to use as a background.</div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Toggle label="Scene text" checked={!options.hideText} onChange={(v) => setOptions({ ...options, hideText: !v })} />
          <Toggle label="Icons" checked={!options.hideIcons} onChange={(v) => setOptions({ ...options, hideIcons: !v })} />
          <Segmented
            value={options.theme}
            onChange={(theme) => setOptions({ ...options, theme })}
            items={[
              { value: 'dark', label: <Moon size={12} />, title: 'Dark' },
              { value: 'light', label: <Sun size={12} />, title: 'Light' },
            ]}
          />
          <Segmented
            value={options.dpr}
            onChange={(dpr) => setOptions({ ...options, dpr })}
            items={[1, 2, 3].map((d) => ({ value: d as 1 | 2 | 3, label: `${d}x`, title: `${d}x resolution` }))}
          />
        </div>

        {/* Target */}
        {targets.length > 0 ? (
          <div className="flex items-center gap-2 rounded-md bg-bg-2 px-2 py-1.5 text-fg-2">
            <FrameCorners size={14} />
            <span className="min-w-0 flex-1 truncate">
              {targets.length === 1 ? `${targets[0].name} · ${extent}` : `${targets.length} layers selected`}
            </span>
            {auraTargets.length > 0 && (
              <button
                onClick={refreshSelection}
                title="Re-render at the current size with each layer's original scene"
                className="flex items-center gap-1 text-fg hover:text-brand"
              >
                <ArrowsClockwise size={12} /> Re-render
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-fg-2">New frame</span>
            <select
              value={preset}
              onChange={(e) => setPreset(Number(e.target.value))}
              className="h-7 w-full rounded-md border border-line bg-bg-2 px-1.5 outline-none focus:border-brand"
            >
              {FRAME_PRESETS.map((p, i) => (
                <option key={p.label} value={i}>
                  {p.label} — {p.width} × {p.height}
                </option>
              ))}
            </select>
          </div>
        )}
        {unsupported > 0 && (
          <div className="text-fg-3">
            {unsupported} selected layer{unsupported === 1 ? '' : 's'} can't take an image fill and will be skipped.
          </div>
        )}

        <button
          onClick={apply}
          disabled={!selected || status.kind === 'rendering'}
          className="flex h-8 w-full items-center justify-center gap-2 rounded-md bg-brand font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-40"
        >
          {status.kind === 'rendering' ? (
            <>
              <CircleNotch size={14} className="animate-spin" />
              Rendering{status.total > 1 ? ` ${status.done}/${status.total}` : '…'}
            </>
          ) : targets.length > 0 ? (
            `Apply to ${targets.length === 1 ? 'selection' : `${targets.length} layers`}`
          ) : (
            'Insert frame'
          )}
        </button>
        {status.kind === 'done' && (
          <div className="flex items-center gap-1 text-success">
            <CheckCircle size={14} /> {status.message}
          </div>
        )}
        {status.kind === 'error' && (
          <div className="flex items-center gap-1 text-danger">
            <WarningCircle size={14} className="shrink-0" /> {status.message}
          </div>
        )}
      </div>
    </div>
  )
}

/** Headless re-render from a layer's "Refresh" relaunch button. */
async function runRefresh(targets: Target[]) {
  const errors = await rerenderLayers(targets)
  postToMain({ type: 'done', message: errors.length ? `Aura: ${errors[0]}` : 'Aura background re-rendered' })
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex h-7 items-center justify-between rounded-md border border-line px-2 text-fg-2 hover:text-fg"
    >
      {label}
      <span className={`relative h-3.5 w-6 rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-fg-3'}`}>
        <span
          className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all ${checked ? 'left-3' : 'left-0.5'}`}
        />
      </span>
    </button>
  )
}

function Segmented<T extends string | number>({
  value,
  onChange,
  items,
}: {
  value: T
  onChange: (v: T) => void
  items: { value: T; label: React.ReactNode; title: string }[]
}) {
  return (
    <div className="flex h-7 rounded-md border border-line p-0.5">
      {items.map((item) => (
        <button
          key={String(item.value)}
          title={item.title}
          onClick={() => onChange(item.value)}
          className={`flex flex-1 items-center justify-center rounded ${
            value === item.value ? 'bg-bg-2 text-fg' : 'text-fg-2 hover:text-fg'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
