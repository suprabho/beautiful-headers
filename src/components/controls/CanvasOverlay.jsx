import { useRef, useState, useCallback, useMemo } from 'react'
import { Tag } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { colorToHex } from '@/lib/colorConversion'
import { nameForColor, evenStops } from '@/lib/studioPresets'
import { useThemedConfig } from '../../hooks/useThemedConfig'

/**
 * Gradient track with a grabber per colour stop. Grabbers are clamped between
 * their neighbours so the palette order never flips.
 */
export const ColorStopBar = ({ colors, stops, onChange, className }) => {
  const trackRef = useRef(null)
  const [drag, setDrag] = useState(null)
  const safeStops = stops?.length === colors.length ? stops : evenStops(colors.length)

  const order = useMemo(
    () => colors.map((c, i) => ({ c, i, s: safeStops[i] })).sort((a, b) => a.s - b.s),
    [colors, safeStops]
  )
  const gradient = order.map(({ c, s }) => `${c} ${s}%`).join(', ')

  const move = useCallback((clientX) => {
    if (drag == null || !trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const pos = order.findIndex((o) => o.i === drag)
    const lo = pos > 0 ? order[pos - 1].s + 1 : 0
    const hi = pos < order.length - 1 ? order[pos + 1].s - 1 : 100
    const pct = Math.round(((clientX - rect.left) / rect.width) * 100)
    const next = [...safeStops]
    next[drag] = Math.max(lo, Math.min(hi, pct))
    onChange(next)
  }, [drag, order, safeStops, onChange])

  return (
    <div
      ref={trackRef}
      className={cn('relative h-9 rounded-full ring-1 ring-black/10', className)}
      style={{ background: `linear-gradient(90deg, ${gradient})` }}
      onPointerMove={(e) => move(e.clientX)}
      onPointerUp={() => setDrag(null)}
      onPointerCancel={() => setDrag(null)}
    >
      {order.map(({ i, s }) => (
        <button
          key={i}
          type="button"
          aria-label={`Colour ${i + 1} stop`}
          onPointerDown={(e) => {
            e.currentTarget.parentElement.setPointerCapture(e.pointerId)
            setDrag(i)
          }}
          className={cn(
            'absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none rounded-full bg-white shadow ring-1 ring-black/20',
            drag === i && 'h-6 w-2'
          )}
          style={{ left: `clamp(6px, ${s}%, calc(100% - 6px))` }}
        />
      ))}
    </div>
  )
}

/** Right-edge chips naming each palette colour, as on Feral's canvas */
export const PaletteTags = ({ colors }) => (
  <div className="pointer-events-none fixed inset-y-0 right-5 z-40 flex flex-col justify-evenly py-24">
    {colors.map((c, i) => {
      const hex = (colorToHex(c) || c).toUpperCase()
      return (
        <div
          key={`${i}-${hex}`}
          className="pointer-events-auto flex items-center gap-2 self-end rounded-full bg-white/85 py-1.5 pl-2 pr-3 text-[11px] text-neutral-900 shadow-sm backdrop-blur-md"
        >
          <span className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10" style={{ background: c }} />
          <span className="font-semibold uppercase tracking-wide">{nameForColor(hex)}</span>
          <span className="font-mono text-neutral-500">{hex}</span>
        </div>
      )
    })}
  </div>
)

/** Editor-only chrome drawn over the canvas (outside the capture container) */
export const CanvasOverlay = () => {
  const [gradientConfig, setGradientConfig] = useThemedConfig('gradientConfig')
  const [showTags, setShowTags] = useState(false)
  const colors = gradientConfig.colors || []

  return (
    <>
      {showTags && <PaletteTags colors={colors} />}
      <div className="fixed bottom-5 left-1/2 z-40 flex w-[min(640px,calc(100vw-420px))] -translate-x-1/2 flex-col gap-1.5 rounded-3xl bg-card/80 p-2 shadow-2xl shadow-black/40 ring-1 ring-border backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTags(!showTags)}
            className={cn(
              'flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors',
              showTags ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <Tag size={14} weight={showTags ? 'fill' : 'regular'} />
            {showTags ? 'Hide tags' : 'Show tags'}
          </button>
          <ColorStopBar
            className="flex-1"
            colors={colors}
            stops={gradientConfig.colorStops}
            onChange={(colorStops) => setGradientConfig({ ...gradientConfig, colorStops })}
          />
        </div>
        <p className="px-2 text-[10px] text-muted-foreground">Drag the grabbers to rebalance how much of the scene each colour owns</p>
      </div>
    </>
  )
}
