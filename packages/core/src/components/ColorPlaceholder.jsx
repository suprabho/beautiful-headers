/**
 * ColorPlaceholder — an instant, zero-network low-quality placeholder (LQIP)
 * built from a scene's config. Given the (theme-resolved) `scene`, it renders
 * the same SVG the embed's inline bootstrap paints before React loads — the
 * scene's own background colour with its palette placed the way the live
 * renderer places it — so the crossfade into the real scene is seamless. With
 * only `colors` (or nothing) it renders the classic blurred palette blobs.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { buildPlaceholderSvg } from '../lib/lqip'

// Measure before paint in the browser; on the server there is nothing to measure.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

// Only for a box that cannot be measured (e.g. display: none), so something
// still paints once it shows.
const DEFAULT_SIZE = { width: 1600, height: 900 }

function ColorPlaceholder({ scene, colors, className, style }) {
  const ref = useRef(null)
  const [size, setSize] = useState(null)

  // The placeholder is laid out in the pixel box it fills (line heights,
  // ring radii and the like are in px in the live scenes), so track it.
  useIsomorphicLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const measure = () => {
      const rect = el.getBoundingClientRect()
      const width = Math.round(rect.width)
      const height = Math.round(rect.height)
      setSize((prev) => {
        if (!width || !height) return prev || DEFAULT_SIZE
        return prev && prev.width === width && prev.height === height ? prev : { width, height }
      })
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Nothing is built until the box has been measured — which happens in the
  // mount frame, before paint — so server and client markup always agree.
  const markup = useMemo(
    () => (size ? buildPlaceholderSvg(scene || (colors ? { gradientConfig: { colors } } : null), size.width, size.height) : ''),
    [scene, colors, size],
  )

  // The markup is generated from validated numbers and hex colours only.
  return <div ref={ref} className={className} style={style} aria-hidden="true" dangerouslySetInnerHTML={{ __html: markup }} />
}

export default ColorPlaceholder
