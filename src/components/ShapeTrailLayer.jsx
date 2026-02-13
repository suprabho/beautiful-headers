import { useRef, useEffect, useMemo, useState, memo } from 'react'
import FlutedGlassCanvas from './FlutedGlassCanvas'

// Color cache for hex to RGB conversions
const colorCache = new Map()

const hexToRgb = (hex) => {
  if (colorCache.has(hex)) return colorCache.get(hex)
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  const rgb = result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 }
  colorCache.set(hex, rgb)
  return rgb
}

// Interpolate color across an array of hex colors at a given progress (0-1)
// colorStops are percentages (0-100) for each color's position
function lerpColorArray(colors, rgbCache, progress, colorStops) {
  if (colors.length === 0) return 'rgb(0,0,0)'
  if (colors.length === 1) {
    const c = rgbCache[0] || hexToRgb(colors[0])
    return `rgb(${c.r},${c.g},${c.b})`
  }

  const t = Math.max(0, Math.min(1, progress)) * 100 // convert to 0-100

  // Build sorted pairs of (stop, colorIndex)
  const pairs = colors.map((_, i) => ({
    stop: colorStops ? colorStops[i] : (i / (colors.length - 1)) * 100,
    idx: i,
  })).sort((a, b) => a.stop - b.stop)

  // Clamp to first/last color
  if (t <= pairs[0].stop) {
    const c = rgbCache[pairs[0].idx] || hexToRgb(colors[pairs[0].idx])
    return `rgb(${c.r},${c.g},${c.b})`
  }
  if (t >= pairs[pairs.length - 1].stop) {
    const c = rgbCache[pairs[pairs.length - 1].idx] || hexToRgb(colors[pairs[pairs.length - 1].idx])
    return `rgb(${c.r},${c.g},${c.b})`
  }

  // Find the two surrounding stops
  for (let i = 0; i < pairs.length - 1; i++) {
    if (t >= pairs[i].stop && t <= pairs[i + 1].stop) {
      const segLen = pairs[i + 1].stop - pairs[i].stop
      const localT = segLen > 0 ? (t - pairs[i].stop) / segLen : 0

      const c1 = rgbCache[pairs[i].idx] || hexToRgb(colors[pairs[i].idx])
      const c2 = rgbCache[pairs[i + 1].idx] || hexToRgb(colors[pairs[i + 1].idx])

      const r = Math.round(c1.r + (c2.r - c1.r) * localT)
      const g = Math.round(c1.g + (c2.g - c1.g) * localT)
      const b = Math.round(c1.b + (c2.b - c1.b) * localT)

      return `rgb(${r},${g},${b})`
    }
  }

  const c = rgbCache[0] || hexToRgb(colors[0])
  return `rgb(${c.r},${c.g},${c.b})`
}

// Catmull-Rom spline interpolation
function catmullRomPoint(p0, p1, p2, p3, t) {
  const t2 = t * t
  const t3 = t2 * t
  return {
    x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  }
}

// Generate points along a golden (Fibonacci) spiral in normalized [0,1] coords
function generateTrailPoints(complexity) {
  const numTurns = Math.max(2, complexity || 4)
  const maxTheta = numTurns * 2 * Math.PI
  const numPoints = Math.max(16, numTurns * 8)

  const minR = 0.01
  const maxR = 1.2

  // Slight center offset and random start angle for variety
  const cx = 0.4 + Math.random() * 0.2
  const cy = 0.4 + Math.random() * 0.2
  const startAngle = Math.random() * 2 * Math.PI
  const direction = Math.random() > 0.5 ? 1 : -1

  const points = []
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1)
    const theta = startAngle + direction * t * maxTheta
    // Logarithmic spiral growth (golden spiral characteristic)
    const r = minR * Math.pow(maxR / minR, t)

    points.push({
      x: Math.max(0, Math.min(1, cx + r * Math.cos(theta))),
      y: Math.max(0, Math.min(1, cy + r * Math.sin(theta))),
    })
  }

  return { points, cx, cy }
}

// Generate trail paths with normalized [0,1] control points
function generateTrails(count, complexity) {
  const trails = []
  for (let t = 0; t < count; t++) {
    const { points, cx, cy } = generateTrailPoints(complexity)
    trails.push({
      points,
      cx,
      cy,
      seed: Math.random() * 1000,
    })
  }
  return trails
}

// Sample points along a Catmull-Rom spline at uniform spacing
function samplePath(normalizedPoints, width, height, gap) {
  if (normalizedPoints.length < 2) return []

  // Scale normalized points to canvas dimensions
  const pts = normalizedPoints.map(p => ({ x: p.x * width, y: p.y * height }))

  // Sample densely along the spline to approximate arc length
  const dense = []
  const segments = pts.length - 1
  const samplesPerSegment = 100

  for (let seg = 0; seg < segments; seg++) {
    const p0 = pts[Math.max(0, seg - 1)]
    const p1 = pts[seg]
    const p2 = pts[Math.min(segments, seg + 1)]
    const p3 = pts[Math.min(segments, seg + 2)]

    for (let i = 0; i < samplesPerSegment; i++) {
      const t = i / samplesPerSegment
      dense.push(catmullRomPoint(p0, p1, p2, p3, t))
    }
  }
  // Add final point
  const lastIdx = pts.length - 1
  dense.push(pts[lastIdx])

  // Compute cumulative arc lengths
  const arcLengths = [0]
  for (let i = 1; i < dense.length; i++) {
    const dx = dense[i].x - dense[i - 1].x
    const dy = dense[i].y - dense[i - 1].y
    arcLengths.push(arcLengths[i - 1] + Math.sqrt(dx * dx + dy * dy))
  }
  const totalLength = arcLengths[arcLengths.length - 1]

  // Walk along at gap intervals
  const result = []
  const effectiveGap = Math.max(5, gap)
  let currentDist = 0
  let denseIdx = 0

  while (currentDist <= totalLength) {
    // Find the dense segment containing currentDist
    while (denseIdx < arcLengths.length - 1 && arcLengths[denseIdx + 1] < currentDist) {
      denseIdx++
    }

    if (denseIdx >= dense.length - 1) {
      result.push({ ...dense[dense.length - 1], progress: 1 })
      break
    }

    const segLen = arcLengths[denseIdx + 1] - arcLengths[denseIdx]
    const localT = segLen > 0 ? (currentDist - arcLengths[denseIdx]) / segLen : 0

    result.push({
      x: dense[denseIdx].x + (dense[denseIdx + 1].x - dense[denseIdx].x) * localT,
      y: dense[denseIdx].y + (dense[denseIdx + 1].y - dense[denseIdx].y) * localT,
      progress: currentDist / totalLength,
    })

    currentDist += effectiveGap
  }

  return result
}

// Draw a single shape
function drawShape(ctx, shape, x, y, size, rotation, color, opacity, blendMode) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.globalAlpha = opacity
  ctx.globalCompositeOperation = blendMode || 'source-over'
  ctx.fillStyle = color

  const half = size / 2

  switch (shape) {
    case 'circle':
      ctx.beginPath()
      ctx.arc(0, 0, half, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'square':
      ctx.fillRect(-half, -half, size, size)
      break
    case 'triangle':
      ctx.beginPath()
      ctx.moveTo(0, -half)
      ctx.lineTo(-half, half)
      ctx.lineTo(half, half)
      ctx.closePath()
      ctx.fill()
      break
    default:
      ctx.beginPath()
      ctx.arc(0, 0, half, 0, Math.PI * 2)
      ctx.fill()
  }

  ctx.restore()
}

const ShapeTrailLayer = memo(({ config, paletteColors = [], effectsConfig, isPaused }) => {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const animationRef = useRef(null)
  const isVisibleRef = useRef(true)
  const isPausedRef = useRef(false)

  const configRef = useRef(config)
  const colorsRef = useRef([])
  const trailsRef = useRef(null)
  const trailStatesRef = useRef(null)
  const timeRef = useRef(0)

  const flutedEnabled = effectsConfig?.flutedGlass?.enabled ?? false

  const trailColors = useMemo(() => {
    if (paletteColors.length >= 2) return paletteColors
    return ['#06b6d4', '#a855f7', '#ec4899', '#3b82f6']
  }, [paletteColors])

  useEffect(() => { configRef.current = config }, [config])
  useEffect(() => { colorsRef.current = trailColors }, [trailColors])
  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])

  // Generate trails on mount and when key params change
  useEffect(() => {
    const count = config.trailCount || 3
    trailsRef.current = generateTrails(count, config.pathComplexity || 4)
    trailStatesRef.current = Array.from({ length: count }, (_, i) => ({
      progress: 0,
      delay: i * 0.4 + Math.random() * 0.5,
      holdTime: 0,
      fadeAlpha: 1,
    }))
  }, [config.trailCount, config.pathComplexity])

  // Animation setup - runs only once on mount
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position: absolute; left: 0; top: 0; width: 100%; height: 100%;'
    canvasRef.current = canvas
    container.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden
      if (!document.hidden && animationRef.current === null) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    handleResize()
    setCanvasReady(true)
    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const animate = () => {
      if (!isVisibleRef.current) {
        animationRef.current = null
        return
      }

      const width = canvas.width / dpr
      const height = canvas.height / dpr

      if (!ctx) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      const cfg = configRef.current
      const currentColors = colorsRef.current
      const trails = trailsRef.current
      const trailStates = trailStatesRef.current

      if (!trails || !trailStates || trails.length === 0) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      const shape = cfg.shape || 'circle'
      const startScale = cfg.startScale ?? 1000
      const endScale = cfg.endScale ?? 2000
      const gap = cfg.gap ?? 30
      const rotationOffset = ((cfg.rotationOffset ?? 15) * Math.PI) / 180
      const speed = cfg.speed ?? 0.3
      const opacity = cfg.opacity ?? 0.8
      const blendMode = cfg.blendMode === 'normal' ? 'source-over' : cfg.blendMode || 'source-over'
      const bgColor = cfg.backgroundColor || '#f0f0f0'
      const trailColorStops = cfg.trailColorStops && cfg.trailColorStops.length === currentColors.length ? cfg.trailColorStops : null

      // Clear and fill background
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)

      // Pre-compute RGB cache for smooth color interpolation
      const rgbCache = currentColors.map(c => hexToRgb(c))

      // Advance time for continuous rotation
      if (!isPausedRef.current) {
        timeRef.current += 0.016
      }

      // Draw each trail with progressive growth
      for (let t = 0; t < trails.length; t++) {
        const trail = trails[t]
        const state = trailStates[t]
        if (!state) continue

        // Phase 1: waiting to start (not visible yet)
        if (state.delay > 0) {
          if (!isPausedRef.current) {
            state.delay -= 0.016
          }
          continue
        }

        if (!isPausedRef.current) {
          if (state.progress < 1) {
            // Phase 2: growing
            state.progress = Math.min(1, state.progress + speed * 0.008)
            if (state.progress >= 1) {
              state.holdTime = 10 + Math.random() * 5
            }
          } else if (state.holdTime > 0) {
            // Phase 3: complete, holding visible
            state.holdTime -= 0.016
          } else if (state.fadeAlpha > 0) {
            // Phase 4: fading out
            state.fadeAlpha = Math.max(0, state.fadeAlpha - 0.016 * 0.1)
            if (state.fadeAlpha <= 0) {
              // Phase 5: regenerate
              state.progress = 0
              state.delay = Math.random() * 0.1
              state.holdTime = 0
              state.fadeAlpha = 1
              const generated = generateTrailPoints(cfg.pathComplexity || 4)
              trail.points = generated.points
              trail.cx = generated.cx
              trail.cy = generated.cy
              trail.seed = Math.random() * 1000
              continue
            }
          }
        }

        // Draw the trail, rotated around spiral center
        const trailOpacity = opacity * state.fadeAlpha
        const points = samplePath(trail.points, width, height, gap)
        if (points.length === 0) continue

        const centerX = trail.cx * width
        const centerY = trail.cy * height
        const rotAngle = timeRef.current * speed * 0.5

        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(rotAngle)
        ctx.translate(-centerX, -centerY)

        for (let i = 0; i < points.length; i++) {
          const pt = points[i]
          if (pt.progress > state.progress) break

          const progress = pt.progress
          // Ping-pong size: triangle wave so size oscillates start→end→start→end...
          const sizeCycles = cfg.sizeCycles ?? 1
          let sizeT
          if (sizeCycles <= 1) {
            sizeT = progress
          } else {
            const scaled = progress * sizeCycles
            const phase = scaled % 1
            sizeT = Math.floor(scaled) % 2 === 1 ? 1 - phase : phase
          }
          const scale = startScale + (endScale - startScale) * sizeT
          const rotation = rotationOffset * i
          const color = lerpColorArray(currentColors, rgbCache, progress, trailColorStops)

          // Fade in shapes at the leading edge for organic feel
          let shapeOpacity = trailOpacity
          const edgeDist = state.progress - pt.progress
          if (edgeDist < 0.05 && state.progress < 1) {
            shapeOpacity *= edgeDist / 0.05
          }

          drawShape(ctx, shape, pt.x, pt.y, scale, rotation, color, shapeOpacity, blendMode)
        }

        ctx.restore()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (canvas && container.contains(canvas)) {
        container.removeChild(canvas)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="shape-trail-layer"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      {flutedEnabled && canvasReady && canvasRef.current && (
        <FlutedGlassCanvas
          sourceCanvasRef={canvasRef}
          effectsConfig={effectsConfig}
        />
      )}
    </div>
  )
})

ShapeTrailLayer.displayName = 'ShapeTrailLayer'

export default ShapeTrailLayer
