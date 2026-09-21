import { useRef, useEffect, useMemo, useState, memo } from 'react'
import { getGlassOverlay } from '../registry'
import { createMainThreadRenderer } from '../lib/auroraRenderer'

// Color cache for hex to HSL conversions
const hslCache = new Map()

// Convert hex color to HSL with caching
const hexToHsl = (hex) => {
  if (hslCache.has(hex)) return hslCache.get(hex)

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    const hsl = { h: 0, s: 0, l: 0 }
    hslCache.set(hex, hsl)
    return hsl
  }

  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
      default: h = 0
    }
  }

  const hsl = { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
  hslCache.set(hex, hsl)
  return hsl
}

// Darken a hex color
const darkenHex = (hex, amount = 0.7) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '#000000'

  const r = Math.round(parseInt(result[1], 16) * (1 - amount))
  const g = Math.round(parseInt(result[2], 16) * (1 - amount))
  const b = Math.round(parseInt(result[3], 16) * (1 - amount))

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// The drawing itself lives in ../lib/auroraScene.js; this component owns the
// DOM canvas, forwards prop changes to the renderer (../lib/auroraRenderer.js)
// and mounts the optional glass overlay from the registry. `blurScale`
// ('auto' or a fraction) opts into the reduced-resolution blur stage described
// in auroraScene.js; 1 renders exactly as before.
const AuroraLayer = memo(({ config, mousePos, paletteColors = [], effectsConfig, isPaused, mouseIntensity = 1, blurScale = 1 }) => {
  const containerRef = useRef(null)
  const canvasBRef = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const rendererRef = useRef(null)

  // Latest props, read by the mount effect when the renderer is created.
  const stateRef = useRef(null)

  // Derive colors from palette
  const derivedColors = useMemo(() => {
    if (!paletteColors || paletteColors.length === 0) {
      return null
    }

    const hues = paletteColors.map(color => hexToHsl(color).h)
    const minHue = Math.min(...hues)
    const maxHue = Math.max(...hues)

    const firstColor = paletteColors[0]
    const bgColor = darkenHex(firstColor, 0.85)

    return {
      hueStart: minHue,
      hueEnd: maxHue === minHue ? minHue + 60 : maxHue,
      backgroundColor: bgColor,
      hues: hues
    }
  }, [paletteColors])

  stateRef.current = {
    config,
    derived: derivedColors,
    mouse: mouseIntensity === 0 ? null : mousePos,
    mouseIntensity,
    paused: !!isPaused,
  }

  // Forward prop changes to the running renderer (never restarts the animation).
  useEffect(() => {
    rendererRef.current?.setConfig(config)
  }, [config])

  useEffect(() => {
    rendererRef.current?.setDerivedColors(derivedColors)
  }, [derivedColors])

  useEffect(() => {
    rendererRef.current?.setMouseTarget(mouseIntensity === 0 ? null : mousePos)
  }, [mousePos, mouseIntensity])

  useEffect(() => {
    rendererRef.current?.setPaused(!!isPaused)
  }, [isPaused])

  useEffect(() => {
    rendererRef.current?.setMouseIntensity(mouseIntensity)
  }, [mouseIntensity])

  // Canvas + renderer setup - runs only once on mount
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Cap DPR at 2.0 for performance - higher values offer diminishing returns
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let size = { width: 0, height: 0 }

    const measure = () => ({
      width: container.clientWidth || window.innerWidth,
      height: container.clientHeight || window.innerHeight,
    })

    const canvasB = document.createElement('canvas')
    canvasB.style.cssText = 'position: absolute; left: 0; top: 0; width: 100%; height: 100%;'
    // Ahead of any overlay canvas, which the capture pipeline expects last.
    container.insertBefore(canvasB, container.firstChild)
    canvasBRef.current = canvasB

    const renderer = createMainThreadRenderer({ canvas: canvasB, dpr, state: stateRef.current, blurScale })
    rendererRef.current = renderer

    const handleResize = () => {
      const next = measure()
      if (next.width === size.width && next.height === size.height) return
      size = next
      canvasB.style.width = `${size.width}px`
      canvasB.style.height = `${size.height}px`
      renderer.resize(size.width, size.height)
    }

    handleResize()
    renderer.start()
    setCanvasReady(true)

    // Use ResizeObserver to track container size changes
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      renderer.destroy()
      rendererRef.current = null
      if (container.contains(canvasB)) {
        container.removeChild(canvasB)
      }
      canvasBRef.current = null
    }
  }, []) // Empty deps - only runs on mount

  const flutedEnabled = effectsConfig?.flutedGlass?.enabled ?? false
  const GlassOverlay = getGlassOverlay()

  return (
    <div
      ref={containerRef}
      className="aurora-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
    >
      {flutedEnabled && GlassOverlay && canvasReady && canvasBRef.current && (
        <GlassOverlay
          sourceCanvasRef={canvasBRef}
          effectsConfig={effectsConfig}
        />
      )}
    </div>
  )
})

AuroraLayer.displayName = 'AuroraLayer'

export default AuroraLayer
