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
  Plus,
  SquaresFour,
  Sun,
  WarningCircle,
  X,
} from '@phosphor-icons/react'
import type { MainToUi, RenderOptions, Target } from '../shared'
import { fetchScenes, sceneUrl, type Scene } from './api'
import { createScene } from './newScene'
import { DraftPreview, initialDraft, NewScenePanel, type SceneDraft } from './NewScenePanel'
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
  | { kind: 'saving' }
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
  const [view, setView] = useState<'gallery' | 'create'>('gallery')
  const [draft, setDraft] = useState<SceneDraft>(initialDraft)
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

  const busy = status.kind === 'rendering' || status.kind === 'saving'

  const apply = async (scene: Scene | null = selected) => {
    if (!scene || busy) return
    let jobTargets = targets
    if (jobTargets.length === 0) {
      const p = FRAME_PRESETS[preset]
      const created = waitForFrame()
      postToMain({ type: 'create-frame', width: p.width, height: p.height, name: `${scene.title} — ${p.label}` })
      jobTargets = [await created]
    }
    setStatus({ kind: 'rendering', done: 0, total: 1 })
    const { failed, errors } = await renderToLayers(
      {
        targets: jobTargets,
        data: { slug: scene.slug, title: scene.title, options },
        previewUrl: scene.thumb.large,
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

  // Save the draft as a new gallery scene, then render it like any other.
  const createAndApply = async () => {
    if (busy) return
    setStatus({ kind: 'saving' })
    let scene: Scene
    try {
      scene = await createScene(draft)
    } catch (err) {
      const message = (err as Error).message
      setStatus({ kind: 'error', message })
      postToMain({ type: 'notify', message: `Aura: ${message}`, error: true })
      return
    }
    setScenes((prev) => [scene, ...prev.filter((s) => s.id !== scene.id)])
    setSelected(scene)
    setDraft(initialDraft())
    setView('gallery')
    postToMain({ type: 'notify', message: `Aura: created "${scene.title}"` })
    await apply(scene)
  }

  const refreshSelection = async () => {
    if (busy) return
    setStatus({ kind: 'rendering', done: 0, total: 1 })
    const errors = await rerenderLayers(targets)
    setStatus(errors.length ? { kind: 'error', message: errors[0] } : { kind: 'done', message: 'Re-rendered' })
  }

  const extent = targets.length === 1 ? `${Math.round(targets[0].width)} × ${Math.round(targets[0].height)}` : null
  const auraTargets = targets.filter((t) => t.aura)
  // The frame the render will land in: the (first) selected layer, or the new-frame preset.
  const frameSize = targets.length > 0 ? targets[0] : FRAME_PRESETS[preset]

  return (
    <div className="flex h-screen bg-bg text-fg">
      <div className="flex min-w-0 flex-1 flex-col">
      {/* Gallery / New scene switch */}
      <div className="flex gap-1 border-b border-line px-3 pt-2">
        <Tab active={view === 'gallery'} onClick={() => setView('gallery')} icon={<SquaresFour size={12} />}>
          Gallery
        </Tab>
        <Tab active={view === 'create'} onClick={() => setView('create')} icon={<Plus size={12} />}>
          New scene
        </Tab>
      </div>

      {view === 'create' ? (
        <div className="flex-1 overflow-y-auto p-3">
          <NewScenePanel draft={draft} onChange={setDraft} />
        </div>
      ) : (
      <>
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
          {!loading && !loadError && scenes.length === 0 && (
            <button onClick={() => setView('create')} className="flex items-center gap-1 text-brand hover:underline">
              No scenes match — create one <Plus size={12} />
            </button>
          )}
        </div>
      </div>
      </>
      )}
      </div>

      {/* Render panel */}
      <div className="flex w-[300px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-line p-3">
        <FramePreview width={frameSize.width} height={frameSize.height}>
          {view === 'create' ? (
            <DraftPreview draft={draft} />
          ) : selected?.thumb.large || selected?.thumb.small ? (
            <img src={selected.thumb.large || selected.thumb.small || undefined} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-fg-3">
              <ImageSquare size={20} />
            </div>
          )}
        </FramePreview>
        {view === 'create' && <div className="-mt-1 text-fg-3">Palette preview — the render is animated</div>}

        {view === 'create' ? null : selected ? (
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
          onClick={() => (view === 'create' ? createAndApply() : apply())}
          disabled={view === 'create' ? busy || !draft.title.trim() : !selected || busy}
          className="mt-auto flex h-8 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-brand font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-40"
        >
          {status.kind === 'saving' ? (
            <>
              <CircleNotch size={14} className="animate-spin" />
              Saving scene…
            </>
          ) : status.kind === 'rendering' ? (
            <>
              <CircleNotch size={14} className="animate-spin" />
              Rendering{status.total > 1 ? ` ${status.done}/${status.total}` : '…'}
            </>
          ) : view === 'create' ? (
            targets.length > 0 ? 'Create & apply' : 'Create & insert frame'
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

/** A box with the target frame's aspect ratio, fitted inside a fixed preview area. */
function FramePreview({ width, height, children }: { width: number; height: number; children: React.ReactNode }) {
  const AREA_W = 276
  const AREA_H = 180
  const scale = Math.min(AREA_W / width, AREA_H / height)
  return (
    <div className="shrink-0 space-y-1">
      <div className="flex items-center justify-center rounded-md bg-bg-2" style={{ height: AREA_H }}>
        <div
          className="relative overflow-hidden rounded border border-line"
          style={{ width: Math.max(8, Math.round(width * scale)), height: Math.max(8, Math.round(height * scale)) }}
        >
          {children}
        </div>
      </div>
      <div className="text-center text-fg-3">
        {Math.round(width)} × {Math.round(height)}
      </div>
    </div>
  )
}

function Tab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`-mb-px flex items-center gap-1 border-b-2 px-2 pb-2 font-semibold ${
        active ? 'border-brand text-fg' : 'border-transparent text-fg-2 hover:text-fg'
      }`}
    >
      {icon}
      {children}
    </button>
  )
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
