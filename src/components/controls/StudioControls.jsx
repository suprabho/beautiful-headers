import { memo, useRef, useState, useCallback, useMemo } from 'react'
import { Star, Leaf, Rows, Cube, Triangle, Shuffle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { STUDIO_TYPES } from '@/lib/studioShaders'
import {
  STUDIO_DEFAULTS, STUDIO_PALETTES, GLOW_SHAPE_LABELS, FORM_SHAPE_LABELS, evenStops,
} from '@/lib/studioPresets'

// ============================================
// TYPE CATALOGUE
// ============================================
export const TYPE_LABELS = {
  fluid: 'Mesh', sky: 'Sky', aurora: 'Aurora', watercolor: 'Watercolors', liquid: 'Fog',
  forms: 'Forms', glow: 'Glow', waves: 'Waves', prism: 'Prism', simple: 'Simple',
  ribbon: 'Ribbon', dandelion: 'Dandelion', particleRing: 'Particles', guilloche: 'Guilloché',
}

export const TYPE_CATEGORIES = [
  { id: 'popular', label: 'Popular', icon: Star, types: ['fluid', 'sky', 'aurora', 'watercolor', 'liquid', 'forms', 'glow', 'waves', 'prism'] },
  { id: 'organic', label: 'Organic', icon: Leaf, types: ['liquid', 'fluid', 'watercolor', 'sky', 'aurora', 'simple'] },
  { id: 'lines', label: 'Lines', icon: Rows, types: ['waves', 'ribbon', 'prism', 'guilloche', 'dandelion'] },
  { id: 'depth', label: 'Depth', icon: Cube, types: ['particleRing', 'guilloche', 'ribbon'] },
  { id: 'shapes', label: 'Shapes', icon: Triangle, types: ['forms', 'glow', 'simple'] },
]

// ============================================
// SMALL PRIMITIVES
// ============================================
export const SectionLabel = ({ children, hint, action }) => (
  <div className="flex items-center justify-between gap-2">
    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/80">
      {children}
      {hint && <span className="ml-1.5 normal-case tracking-normal font-normal text-muted-foreground">{hint}</span>}
    </div>
    {action}
  </div>
)

// Filled pill track with a label and value, dragged like a slider
export const PillSlider = memo(({ label, value, min = 0, max = 1, step = 0.01, onChange, format }) => {
  const trackRef = useRef(null)
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)))

  const setFromClientX = useCallback((clientX) => {
    const rect = trackRef.current.getBoundingClientRect()
    const r = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const raw = min + r * (max - min)
    const snapped = Math.round(raw / step) * step
    onChange(Math.round(snapped * 1000) / 1000)
  }, [min, max, step, onChange])

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setFromClientX(e.clientX)
  }
  const onPointerMove = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) setFromClientX(e.clientX)
  }
  const onKeyDown = (e) => {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    onChange(Math.max(min, Math.min(max, Math.round((value + dir * step) * 1000) / 1000)))
  }

  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/80">{label}</span>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        className="relative h-8 flex-1 cursor-ew-resize touch-none select-none overflow-hidden rounded-full bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="absolute inset-y-0 left-0 rounded-full bg-foreground/25" style={{ width: `${pct * 100}%` }} />
        <span className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold tabular-nums">
          {format ? format(value) : `${Math.round(pct * 100)}%`}
        </span>
      </div>
    </div>
  )
})
PillSlider.displayName = 'PillSlider'

export const Segmented = ({ options, value, onChange, className }) => (
  <div className={cn('flex rounded-full bg-muted p-1', className)}>
    {options.map((opt) => (
      <button
        key={String(opt.value)}
        type="button"
        onClick={() => onChange(opt.value)}
        className={cn(
          'flex-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all',
          value === opt.value ? 'bg-background text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
)

// Circle split into up to four quadrants, as on the preset grid
export const QuadSwatch = ({ colors, selected, size = 40 }) => {
  const c = colors.length >= 4 ? colors.slice(0, 4) : [...colors, ...colors, ...colors, ...colors].slice(0, 4)
  return (
    <span
      className={cn('block rounded-full transition-shadow', selected ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : 'ring-1 ring-black/10')}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${c[1]} 0 25%, ${c[3]} 0 50%, ${c[2]} 0 75%, ${c[0]} 0)`,
      }}
    />
  )
}

const sameColors = (a = [], b = []) =>
  a.length === b.length && a.every((c, i) => String(c).toLowerCase() === String(b[i]).toLowerCase())

// ============================================
// TYPE PICKER
// ============================================
export const TypePicker = ({ value, onChange }) => {
  const initial = TYPE_CATEGORIES.find((c) => c.types.includes(value))?.id || 'popular'
  const [category, setCategory] = useState(initial)
  const active = TYPE_CATEGORIES.find((c) => c.id === category) || TYPE_CATEGORIES[0]

  return (
    <div className="rounded-2xl bg-muted/60 p-1.5">
      <div className="flex items-center gap-1 border-b border-border/60 pb-1.5">
        {TYPE_CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const on = cat.id === category
          return (
            <button
              key={cat.id}
              type="button"
              title={cat.label}
              onClick={() => setCategory(cat.id)}
              className={cn(
                'flex h-8 items-center justify-center gap-1.5 rounded-full transition-all',
                on ? 'bg-background px-3 text-foreground shadow-sm' : 'flex-1 text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon size={14} weight={on ? 'fill' : 'regular'} />
              {on && <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">{cat.label}</span>}
            </button>
          )
        })}
      </div>
      <div className="grid grid-cols-3 gap-1 pt-1.5">
        {active.types.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={cn(
              'h-9 rounded-full text-[12px] transition-all',
              value === type
                ? 'bg-background font-semibold text-foreground shadow-md ring-1 ring-border'
                : 'text-muted-foreground hover:bg-background/40 hover:text-foreground'
            )}
          >
            {TYPE_LABELS[type] || type}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// SHAPE THUMBNAILS
// ============================================
const polarPath = (n, amp, sharp, r = 8, cx = 12, cy = 12) => {
  const pts = []
  for (let i = 0; i <= 120; i++) {
    const a = (i / 120) * Math.PI * 2
    let w = Math.cos(a * n)
    w = Math.sign(w) * Math.abs(w) ** sharp
    const rr = r * (1 + amp * w)
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`)
  }
  return `M${pts.join('L')}Z`
}

const FORM_ICONS = {
  arch: <path d="M3 20a9 9 0 0 1 18 0h-5a4 4 0 0 0-8 0z" />,
  circle: <circle cx="12" cy="12" r="8.5" />,
  flower: <path d={polarPath(6, 0.22, 1, 7.5)} />,
  star: <path d={polarPath(5, 0.4, 0.6, 7)} />,
  ring: <path fillRule="evenodd" d="M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zm0 4.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />,
  blob: <path d="M12 3.5c4 0 8 2.5 8 7.5s-3 9.5-8 9.5-8.5-3-8.5-8 4.5-9 8.5-9z" />,
  heart: <path d="M12 20s-8-4.8-8-10.5A4.5 4.5 0 0 1 12 6.8a4.5 4.5 0 0 1 8 2.7C20 15.2 12 20 12 20z" />,
  square: <rect x="4" y="4" width="16" height="16" rx="3" />,
  sparkle: <path d={polarPath(4, 0.9, 6, 5.5)} />,
  clover: <path d={polarPath(4, 0.3, 0.35, 7.5)} />,
  drop: <path d="M12 3s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12z" />,
  burst: <path d={polarPath(12, 0.18, 0.8, 8)} />,
}

// Tiny SVG renderings of each glow arrangement, tinted with the palette
const GlowThumb = ({ shape, colors }) => {
  const bg = colors[0] || '#0A2A33'
  const c = (i) => colors[1 + (i % Math.max(1, colors.length - 1))] || '#fff'
  const id = `gl-${shape}`
  const glow = { filter: `url(#${id})`, fill: 'none', strokeWidth: 2.5 }
  const shapes = {
    edge: [<circle key="a" cx="62" cy="-8" r="38" stroke={c(0)} style={glow} />, <circle key="b" cx="32" cy="80" r="44" stroke={c(1)} style={glow} />],
    circles: [[16, 14, 7], [44, 12, 10], [30, 30, 8], [58, 30, 6]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} stroke={c(i)} style={glow} />),
    moons: [[18, 20], [40, 20], [62, 20]].map(([x, y], i) => <path key={i} d={`M${x - 4} ${y - 9}a9 9 0 1 0 0 18a7 7 0 1 1 0-18z`} stroke={c(i)} style={glow} />),
    pebbles: [[8, 6, 16, 11], [30, 16, 16, 13], [52, 6, 18, 12], [14, 24, 14, 10], [48, 26, 16, 10]].map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} rx="5" stroke={c(i)} style={glow} />),
    ellipses: [0, 1, 2].map((i) => <ellipse key={i} cx={24 + i * 16} cy="20" rx="20" ry="8" transform={`rotate(${40 + i * 25} ${24 + i * 16} 20)`} stroke={c(i)} style={glow} />),
    halo: [<ellipse key="a" cx="40" cy="20" rx="24" ry="11" transform="rotate(-18 40 20)" stroke={c(0)} style={glow} />, <circle key="b" cx="40" cy="20" r="5" fill={c(1)} style={{ filter: `url(#${id})` }} />],
    dunes: [0, 1, 2, 3].map((i) => <circle key={i} cx={4 + i * 24} cy={58 - (i % 2) * 6} r="28" stroke={c(i)} style={glow} />),
    petals: [0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={22 + i * 9} cy={40 - (8 - Math.abs(i - 2) * 3)} rx="4" ry={14 - Math.abs(i - 2) * 3} stroke={c(i)} style={glow} />),
  }
  return (
    <svg viewBox="0 0 80 40" className="block h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect width="80" height="40" fill={bg} />
      {shapes[shape]}
    </svg>
  )
}

// ============================================
// COLOUR PRESET GRIDS
// ============================================
const PresetCircles = ({ palettes, current, onPick }) => (
  <div className="grid grid-cols-4 gap-x-2 gap-y-3">
    {palettes.map((p) => {
      const selected = sameColors(p.colors, current)
      return (
        <button key={p.name} type="button" onClick={() => onPick(p.colors)} className="group flex flex-col items-center gap-1.5">
          <QuadSwatch colors={p.colors} selected={selected} />
          <span className={cn('text-center text-[11px] leading-tight', selected ? 'font-semibold text-foreground' : 'text-muted-foreground group-hover:text-foreground')}>
            {p.name}
          </span>
        </button>
      )
    })}
  </div>
)

const Colourways = ({ palettes, current, onPick }) => (
  <div className="grid grid-cols-3 gap-2">
    {palettes.map((p) => {
      const selected = sameColors(p.colors, current)
      const bands = p.colors.slice(1)
      return (
        <button key={p.name} type="button" onClick={() => onPick(p.colors)} className="group flex flex-col items-center gap-1">
          <span className={cn('flex h-9 w-full overflow-hidden rounded-xl', selected ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : 'ring-1 ring-black/10')}>
            {bands.map((c, i) => <span key={i} className="flex-1" style={{ background: c }} />)}
          </span>
          <span className={cn('text-[11px]', selected ? 'font-semibold text-foreground' : 'text-muted-foreground group-hover:text-foreground')}>{p.name}</span>
        </button>
      )
    })}
  </div>
)

// ============================================
// MAIN STUDIO CONTROLS
// ============================================
const SLIDER_LABELS = {
  sky: { amount: 'Clouds', softness: 'Soften', scale: 'Scale' },
  watercolor: { amount: 'Pigment', softness: 'Bleed', scale: 'Scale' },
  glow: { amount: 'Glow', softness: 'Spread', scale: 'Scale' },
  forms: { amount: 'Depth', softness: 'Feather', scale: 'Size' },
  prism: { amount: 'Light', softness: 'Blend', scale: 'Width' },
}

export const isStudioType = (type) => STUDIO_TYPES.includes(type)

export const StudioControls = ({ backgroundType, studioConfig, setStudioConfig, gradientConfig, setGradientConfig }) => {
  const cfg = useMemo(() => ({ ...STUDIO_DEFAULTS, ...studioConfig }), [studioConfig])
  const update = (patch) => setStudioConfig({ ...cfg, ...patch })
  const labels = SLIDER_LABELS[backgroundType] || SLIDER_LABELS.sky
  const palettes = STUDIO_PALETTES[backgroundType] || []

  const applyPalette = (colors) => {
    setGradientConfig({ ...gradientConfig, colors: [...colors], colorStops: evenStops(colors.length), numColors: colors.length })
  }

  return (
    <div className="flex flex-col gap-5">
      {backgroundType === 'glow' && (
        <div className="flex flex-col gap-2.5">
          <SectionLabel hint="glowing shapes">Presets</SectionLabel>
          <div className="grid grid-cols-4 gap-2">
            {Object.keys(GLOW_SHAPE_LABELS).map((shape) => (
              <button
                key={shape}
                type="button"
                onClick={() => update({ glowShape: shape })}
                className={cn(
                  'flex flex-col overflow-hidden rounded-xl bg-background/60 p-1 transition-all',
                  cfg.glowShape === shape ? 'ring-2 ring-foreground' : 'ring-1 ring-border hover:ring-foreground/40'
                )}
              >
                <span className="block aspect-[2/1] overflow-hidden rounded-lg"><GlowThumb shape={shape} colors={gradientConfig.colors} /></span>
                <span className="pt-1 text-center text-[10px] font-medium">{GLOW_SHAPE_LABELS[shape]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {backgroundType === 'forms' && (
        <div className="flex flex-col gap-2.5">
          <SectionLabel hint="from the SVG set">Silhouettes</SectionLabel>
          <div className="grid grid-cols-6 gap-1.5">
            {Object.keys(FORM_SHAPE_LABELS).map((shape) => (
              <button
                key={shape}
                type="button"
                title={FORM_SHAPE_LABELS[shape]}
                onClick={() => update({ formShape: shape })}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-xl bg-background/60 transition-all',
                  cfg.formShape === shape ? 'ring-2 ring-foreground' : 'ring-1 ring-border hover:ring-foreground/40'
                )}
              >
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-current">{FORM_ICONS[shape]}</svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {(backgroundType === 'watercolor' || backgroundType === 'sky') && (
        <div className="flex flex-col gap-2.5">
          <SectionLabel>Motion</SectionLabel>
          <Segmented
            value={cfg.motion}
            onChange={(motion) => update({ motion })}
            options={[{ value: false, label: 'Off' }, { value: true, label: 'On' }]}
          />
        </div>
      )}

      {palettes.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {backgroundType === 'forms' ? (
            <>
              <SectionLabel action={<span className="text-[11px] text-muted-foreground">{palettes.length}</span>}>Colourways</SectionLabel>
              <Colourways palettes={palettes} current={gradientConfig.colors} onPick={applyPalette} />
            </>
          ) : (
            <>
              <SectionLabel hint={backgroundType === 'glow' ? 'retint your arrangement' : `for ${backgroundType}`}>
                {backgroundType === 'glow' ? 'Colours' : backgroundType === 'prism' ? 'Palettes' : 'Presets'}
              </SectionLabel>
              <PresetCircles palettes={palettes} current={gradientConfig.colors} onPick={applyPalette} />
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <SectionLabel
          action={
            <button
              type="button"
              title="New variation"
              onClick={() => update({ seed: Math.round(Math.random() * 1000) / 10 })}
              className="flex h-7 items-center gap-1 rounded-full bg-muted px-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              <Shuffle size={12} /> Vary
            </button>
          }
        >
          Shape &amp; Motion
        </SectionLabel>
        {!(backgroundType === 'watercolor' || backgroundType === 'sky') && (
          <Segmented
            value={cfg.motion}
            onChange={(motion) => update({ motion })}
            options={[{ value: false, label: 'Still' }, { value: true, label: 'Moving' }]}
          />
        )}
        <PillSlider label="Speed" value={cfg.speed} onChange={(speed) => update({ speed })} />
        <PillSlider label={labels.amount} value={cfg.amount} onChange={(amount) => update({ amount })} />
        <PillSlider label={labels.softness} value={cfg.softness} onChange={(softness) => update({ softness })} />
        <PillSlider
          label={labels.scale}
          value={cfg.scale}
          min={0.4}
          max={2}
          step={0.05}
          onChange={(scale) => update({ scale })}
          format={(v) => `${v.toFixed(2)}×`}
        />
        <PillSlider label="Grain" value={cfg.grain} max={0.5} onChange={(grain) => update({ grain })} />
      </div>
    </div>
  )
}
