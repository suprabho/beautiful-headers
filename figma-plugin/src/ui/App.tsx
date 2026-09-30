import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowSquareOut,
  ArrowsClockwise,
  CheckCircle,
  CircleNotch,
  FrameCorners,
  ImageSquare,
  MagnifyingGlass,
  Moon,
  PaintBrushBroad,
  Plus,
  SlidersHorizontal,
  SquaresFour,
  Sun,
  WarningCircle,
  X,
} from '@phosphor-icons/react'
import type { MainToUi, RenderOptions, Target } from '../shared'
import { BACKGROUND_TYPES, embedUrl, fetchScenes, sceneUrl, studioUrl, type Scene } from './api'
import { createScene, type SceneData } from './newScene'
import { postToMain, renderToLayers, rerenderLayers } from './render'

/** Note on the success line when the device couldn't render and the shared server image was used. */
const APPROXIMATE_NOTE = ' (server image, cropped to fit)'

const FRAME_PRESETS = [
  { label: 'Web header', width: 1440, height: 560 },
  { label: 'OG image', width: 1200, height: 630 },
  { label: 'Desktop', width: 1920, height: 1080 },
  { label: 'Mobile', width: 390, height: 844 },
  { label: 'Square post', width: 1080, height: 1080 },
  { label: 'Story', width: 1080, height: 1920 },
]

/** Longest side (CSS px) the live preview lays out at; covers every frame preset exactly. */
const PREVIEW_MAX = 1920

/** Height of the preview strip at the top of the window. */
const PREVIEW_HEIGHT = 280

/** Reserved embed slug that renders an unsaved scene posted in by message. */
const DRAFT_SLUG = '__preview'

const DEFAULT_OPTIONS: RenderOptions = { hideText: true, hideIcons: false, theme: 'dark', dpr: 2 }

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'rendering'; done: number; total: number; server?: boolean }
  | { kind: 'done'; message: string }
  | { kind: 'error'; message: string; retry?: () => void }

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return debounced
}

/** A title for a studio scene the user didn't name: its first line of text. */
function sceneTitle(name: string, sceneData: SceneData) {
  const sections = sceneData.textSections as { text?: string }[] | undefined
  return name.trim() || sections?.find((s) => s.text?.trim())?.text?.trim() || 'Untitled scene'
}

export default function App() {
  const [view, setView] = useState<'gallery' | 'studio'>('gallery')
  const [search, setSearch] = useState('')
  const [bgType, setBgType] = useState<string | null>(null)
  const [scenes, setScenes] = useState<Scene[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selected, setSelected] = useState<Scene | null>(null)
  const [options, setOptions] = useState<RenderOptions>(DEFAULT_OPTIONS)
  const [preset, setPreset] = useState(0)

  // Studio tab: which gallery scene it started from (null = a fresh one), what
  // the scene currently is, and the name to save it under. The iframe stays
  // mounted once opened so switching tabs keeps the edits.
  const [studioSrc, setStudioSrc] = useState<string | null>(null)
  const [studioScene, setStudioScene] = useState<SceneData | null>(null)
  const [studioName, setStudioName] = useState('')

  const [targets, setTargets] = useState<Target[]>([])
  const [unsupported, setUnsupported] = useState(0)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  // Launched from a layer's "Re-render" relaunch button: only a status line shows.
  const [relaunch, setRelaunch] = useState(false)

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
        setRelaunch(true)
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

  const apply = async (scene: Scene | null = selected, renderOptions: RenderOptions = options) => {
    if (!scene || busy) return
    let jobTargets = targets
    if (jobTargets.length === 0) {
      const p = FRAME_PRESETS[preset]
      const created = waitForFrame()
      postToMain({ type: 'create-frame', width: p.width, height: p.height, name: `${scene.title} — ${p.label}` })
      jobTargets = [await created]
    }
    setStatus({ kind: 'rendering', done: 0, total: 1 })
    const { failed, errors, approximate } = await renderToLayers(
      {
        targets: jobTargets,
        data: { slug: scene.slug, title: scene.title, options: renderOptions },
        previewUrl: scene.thumb.large,
      },
      (progress) => setStatus({ kind: 'rendering', ...progress }),
    )
    if (failed) {
      // Retry into the same layers (a new frame, if one was just made, is now selected).
      setStatus({ kind: 'error', message: errors[0], retry: () => latest.current.apply(scene, renderOptions) })
      postToMain({ type: 'notify', message: `Aura: ${errors[0]}`, error: true })
    } else {
      const n = jobTargets.length
      setStatus({
        kind: 'done',
        message: `Applied to ${n} layer${n === 1 ? '' : 's'}${approximate ? APPROXIMATE_NOTE : ''}`,
      })
    }
  }

  const openStudio = (scene: Scene | null) => {
    setStudioSrc(studioUrl(scene?.slug ?? null))
    setStudioScene(null)
    setStudioName(scene ? `${scene.title} (custom)` : '')
    setView('studio')
  }

  // Save the studio's scene to the gallery, then render it like any other. The
  // studio controls its own text and icons, so render them as designed.
  const createAndApply = async () => {
    if (!studioScene || busy) return
    setStatus({ kind: 'saving' })
    let scene: Scene
    try {
      scene = await createScene(sceneTitle(studioName, studioScene), studioScene)
    } catch (err) {
      const message = (err as Error).message
      setStatus({ kind: 'error', message })
      postToMain({ type: 'notify', message: `Aura: ${message}`, error: true })
      return
    }
    const renderOptions = { ...options, hideText: false, hideIcons: false }
    setOptions(renderOptions)
    setScenes((prev) => [scene, ...prev.filter((s) => s.id !== scene.id)])
    setSelected(scene)
    setView('gallery')
    postToMain({ type: 'notify', message: `Aura: created "${scene.title}"` })
    await apply(scene, renderOptions)
  }

  const refreshSelection = async () => {
    if (busy) return
    setStatus({ kind: 'rendering', done: 0, total: 1 })
    const { errors, approximate } = await rerenderLayers(targets, ({ server }) =>
      setStatus((s) => (s.kind === 'rendering' ? { ...s, server: s.server || server } : s)),
    )
    setStatus(
      errors.length
        ? { kind: 'error', message: errors[0], retry: () => latest.current.refreshSelection() }
        : { kind: 'done', message: `Re-rendered${approximate ? APPROXIMATE_NOTE : ''}` },
    )
  }

  // Retry buttons call the current handlers, which see the current selection.
  const latest = useRef({ apply, refreshSelection })
  latest.current = { apply, refreshSelection }

  const extent = targets.length === 1 ? `${Math.round(targets[0].width)} × ${Math.round(targets[0].height)}` : null
  const auraTargets = targets.filter((t) => t.aura)
  // The frame the render will land in: the (first) selected layer, or the new-frame preset.
  const frameSize = targets.length > 0 ? targets[0] : FRAME_PRESETS[preset]
  // Live preview: the Aura embed itself, laid out at the frame's size (debounced
  // so resizing a layer doesn't reload it on every nodechange).
  const previewSize = useDebounced(
    { width: Math.round(frameSize.width), height: Math.round(frameSize.height) },
    400,
  )
  const inStudio = view === 'studio'
  const draftScene = useMemo(
    () => (studioScene ? { title: sceneTitle(studioName, studioScene), scene_data: studioScene } : null),
    [studioName, studioScene],
  )
  const embedSrc = inStudio
    ? embedUrl(DRAFT_SLUG, { ...options, hideText: false, hideIcons: false })
    : selected
      ? embedUrl(selected.slug, options)
      : null

  if (relaunch) {
    return (
      <div className="flex h-screen items-center justify-center gap-2 bg-bg text-fg-2">
        <CircleNotch size={14} className="animate-spin" /> Re-rendering…
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-bg text-fg">
      {/* Gallery / Studio switch */}
      <div className="flex shrink-0 items-end gap-1 border-b border-line px-3 pt-2">
        <Tab active={!inStudio} onClick={() => setView('gallery')} icon={<SquaresFour size={12} />}>
          Gallery
        </Tab>
        <Tab
          active={inStudio}
          onClick={() => (studioSrc ? setView('studio') : openStudio(null))}
          icon={<PaintBrushBroad size={12} />}
        >
          Studio
        </Tab>
        {inStudio && (
          <button
            onClick={() => openStudio(null)}
            className="mb-1.5 ml-auto flex items-center gap-1 text-fg-2 hover:text-fg"
            title="Start over from a random scene"
          >
            <Plus size={12} /> New scene
          </button>
        )}
      </div>

      {/* Preview: the scene at the target frame's size */}
      <FramePreview width={frameSize.width} height={frameSize.height}>
        {embedSrc && (!inStudio || studioScene) ? (
          <EmbedPreview
            src={embedSrc}
            width={previewSize.width}
            height={previewSize.height}
            scene={inStudio ? draftScene : null}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-fg-3">
            {inStudio ? <CircleNotch size={20} className="animate-spin" /> : <ImageSquare size={20} />}
          </div>
        )}
      </FramePreview>

      {/* Gallery (kept mounted so scroll position and infinite scroll survive tab switches) */}
      <div className={`min-h-0 flex-1 flex-col ${inStudio ? 'hidden' : 'flex'}`}>
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-3 py-2">
          {selected ? (
            <>
              <div className="min-w-0">
                <span className="font-semibold">{selected.title}</span>
                <span className="text-fg-2">
                  {' '}
                  · {BACKGROUND_TYPES.find((t) => t.value === selected.backgroundType)?.label || 'Scene'}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button onClick={() => openStudio(selected)} className="flex items-center gap-1 text-brand hover:underline">
                  <SlidersHorizontal size={12} /> Customize
                </button>
                <a
                  href={sceneUrl(selected.slug)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-fg-2 hover:text-fg"
                >
                  Open in Aura <ArrowSquareOut size={12} />
                </a>
              </div>
            </>
          ) : (
            <span className="text-fg-2">Pick a scene to use as a background, or design one in the Studio tab.</span>
          )}
        </div>

        {/* Search + filters */}
        <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2">
          <label className="flex h-7 w-52 shrink-0 items-center gap-2 rounded-md border border-line bg-bg-2 px-2 focus-within:border-brand">
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
          <div className="no-scrollbar flex min-w-0 gap-1 overflow-x-auto">
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

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-4 gap-2">
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
              <button onClick={() => openStudio(null)} className="flex items-center gap-1 text-brand hover:underline">
                No scenes match — design one <Plus size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Studio: the Aura editor's full control panel */}
      {studioSrc && (
        <StudioFrame
          key={studioSrc}
          src={studioSrc}
          theme={options.theme}
          hidden={!inStudio}
          onScene={setStudioScene}
        />
      )}

      {/* Render options + apply */}
      <div className="shrink-0 space-y-2 border-t border-line p-3">
        <div className="flex items-center gap-2">
          {!inStudio && (
            <>
              <Toggle
                label="Scene text"
                checked={!options.hideText}
                onChange={(v) => setOptions({ ...options, hideText: !v })}
              />
              <Toggle label="Icons" checked={!options.hideIcons} onChange={(v) => setOptions({ ...options, hideIcons: !v })} />
            </>
          )}
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
          {/* Target */}
          {targets.length > 0 ? (
            <div className="flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md bg-bg-2 px-2 text-fg-2">
              <FrameCorners size={14} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate">
                {targets.length === 1 ? `${targets[0].name} · ${extent}` : `${targets.length} layers selected`}
              </span>
              {auraTargets.length > 0 && (
                <button
                  onClick={refreshSelection}
                  title="Re-render at the current size with each layer's original scene"
                  className="flex shrink-0 items-center gap-1 text-fg hover:text-brand"
                >
                  <ArrowsClockwise size={12} /> Re-render
                </button>
              )}
            </div>
          ) : (
            <label className="flex min-w-0 flex-1 items-center gap-2">
              <span className="shrink-0 text-fg-2">New frame</span>
              <select
                value={preset}
                onChange={(e) => setPreset(Number(e.target.value))}
                className="h-7 w-full min-w-0 rounded-md border border-line bg-bg-2 px-1.5 outline-none focus:border-brand"
              >
                {FRAME_PRESETS.map((p, i) => (
                  <option key={p.label} value={i}>
                    {p.label} — {p.width} × {p.height}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="flex items-center gap-2">
          {inStudio && (
            <input
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              placeholder="Scene name"
              className="h-8 w-56 shrink-0 rounded-md border border-line bg-bg-2 px-2 outline-none placeholder:text-fg-3 focus:border-brand"
            />
          )}
          <div className="min-w-0 flex-1 truncate">
            {status.kind === 'done' && (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle size={14} className="shrink-0" /> {status.message}
              </span>
            )}
            {status.kind === 'error' && (
              <span className="flex items-center gap-1 text-danger" title={status.message}>
                <WarningCircle size={14} className="shrink-0" />
                <span className="min-w-0 truncate">{status.message}</span>
                {status.retry && (
                  <button
                    onClick={status.retry}
                    className="flex shrink-0 items-center gap-1 rounded border border-line px-1.5 py-0.5 text-fg hover:border-fg-3"
                  >
                    <ArrowsClockwise size={12} /> Retry
                  </button>
                )}
              </span>
            )}
            {status.kind === 'idle' && unsupported > 0 && (
              <span className="text-fg-3">
                {unsupported} selected layer{unsupported === 1 ? '' : 's'} can't take an image fill and will be skipped.
              </span>
            )}
          </div>
          <button
            onClick={() => (inStudio ? createAndApply() : apply())}
            disabled={inStudio ? busy || !studioScene : !selected || busy}
            className="flex h-8 w-52 shrink-0 items-center justify-center gap-2 rounded-md bg-brand font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-40"
          >
            {status.kind === 'saving' ? (
              <>
                <CircleNotch size={14} className="animate-spin" />
                Saving scene…
              </>
            ) : status.kind === 'rendering' ? (
              <>
                <CircleNotch size={14} className="animate-spin" />
                {status.server ? 'Rendering on server' : 'Rendering'}
                {status.total > 1 ? ` ${status.done}/${status.total}` : '…'}
              </>
            ) : inStudio ? (
              targets.length > 0 ? 'Save & apply' : 'Save & insert frame'
            ) : targets.length > 0 ? (
              `Apply to ${targets.length === 1 ? 'selection' : `${targets.length} layers`}`
            ) : (
              'Insert frame'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Headless re-render from a layer's "Refresh" relaunch button. */
async function runRefresh(targets: Target[]) {
  const { errors } = await rerenderLayers(targets)
  postToMain({ type: 'done', message: errors.length ? `Aura: ${errors[0]}` : 'Aura background re-rendered' })
}

/** The preview strip: a box with the target frame's aspect ratio, as large as fits. */
function FramePreview({ width, height, children }: { width: number; height: number; children: React.ReactNode }) {
  const ratio = width / height
  return (
    <div className="relative shrink-0 border-b border-line bg-bg-2 px-3 pt-3 pb-6" style={{ height: PREVIEW_HEIGHT }}>
      <div className="flex h-full w-full items-center justify-center [container-type:size]">
        <div
          className="relative overflow-hidden rounded border border-line"
          style={{ width: `min(100cqw, ${ratio} * 100cqh)`, aspectRatio: `${width} / ${height}` }}
        >
          {children}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-1 text-center text-fg-3">
        {Math.round(width)} × {Math.round(height)}
      </div>
    </div>
  )
}

/**
 * The live, animated Aura embed laid out at the frame's own size (so it composes
 * exactly as the render will) and scaled down to fit the preview box. Frames
 * larger than PREVIEW_MAX are laid out at a proportionally smaller size.
 * With a scene, the embed's reserved preview slug renders that unsaved scene,
 * which is posted in (and re-posted whenever it changes).
 */
function EmbedPreview({
  src,
  width,
  height,
  scene,
}: {
  src: string
  width: number
  height: number
  scene: { title: string; scene_data: SceneData } | null
}) {
  const box = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const [boxWidth, setBoxWidth] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const down = Math.min(1, PREVIEW_MAX / Math.max(width, height))
  const w = Math.max(16, Math.round(width * down))
  const h = Math.max(16, Math.round(height * down))

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setBoxWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => setLoaded(false), [src, w, h])

  // Push the scene into the embed: when it announces it's ready, and on changes.
  // '*': if the plugin UI is a sandboxed frame, the embed inherits the sandbox
  // and has an opaque origin, so naming AURA_ORIGIN would drop the message.
  const sceneRef = useRef(scene)
  sceneRef.current = scene
  const sendScene = useCallback(() => {
    if (sceneRef.current) frame.current?.contentWindow?.postMessage({ type: 'promad-aura:set-scene', scene: sceneRef.current }, '*')
  }, [])
  useEffect(sendScene, [scene, sendScene])
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source === frame.current?.contentWindow && e.data?.type === 'promad-aura:preview-ready') sendScene()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [sendScene])

  return (
    <div ref={box} className="absolute inset-0 bg-black">
      {boxWidth > 0 && (
        <iframe
          ref={frame}
          key={`${src}|${w}x${h}`}
          src={src}
          title="Aura preview"
          onLoad={() => setLoaded(true)}
          className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
          style={{ width: w, height: h, transform: `scale(${boxWidth / w})` }}
        />
      )}
      {!loaded && (
        <div className="absolute right-1 bottom-1 flex items-center gap-1 rounded bg-black/60 px-1 text-white">
          <CircleNotch size={12} className="animate-spin" /> Loading
        </div>
      )}
    </div>
  )
}

/**
 * The Aura studio in Figma host mode (just its docked control panel). It streams
 * the scene back on every edit; the preview strip above renders it.
 */
function StudioFrame({
  src,
  theme,
  hidden,
  onScene,
}: {
  src: string
  theme: RenderOptions['theme']
  hidden: boolean
  onScene: (sceneData: SceneData) => void
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)

  // Keep the studio editing the same light/dark variant the render will use.
  const sendTheme = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: 'promad-aura:studio-theme', theme }, '*')
  }, [theme])
  useEffect(sendTheme, [sendTheme])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || e.data?.type !== 'promad-aura:studio-scene') return
      if (!ready) {
        setReady(true)
        sendTheme()
      }
      onScene(e.data.sceneData as SceneData)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [ready, sendTheme, onScene])

  return (
    <div className={`relative min-h-0 flex-1 ${hidden ? 'hidden' : ''}`}>
      <iframe ref={frame} src={src} title="Aura studio" className="h-full w-full border-0" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-bg text-fg-2">
          <CircleNotch size={14} className="animate-spin" /> Loading the Aura studio…
        </div>
      )}
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
      className="flex h-7 shrink-0 items-center gap-2 rounded-md border border-line px-2 text-fg-2 hover:text-fg"
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
    <div className="flex h-7 w-24 shrink-0 rounded-md border border-line p-0.5">
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
