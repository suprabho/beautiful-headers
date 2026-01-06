import { useRef, useEffect, useMemo, useState } from 'react'
import FlutedGlassCanvas from './FlutedGlassCanvas'

// Color cache for hex to RGBA conversions
const colorCache = new Map()

// Convert hex to rgba with caching
const hexToRgba = (hex, alpha = 1) => {
  const cacheKey = `${hex}-${alpha}`
  if (colorCache.has(cacheKey)) return colorCache.get(cacheKey)
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    const rgba = `rgba(0, 0, 0, ${alpha})`
    colorCache.set(cacheKey, rgba)
    return rgba
  }
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  const rgba = `rgba(${r}, ${g}, ${b}, ${alpha})`
  colorCache.set(cacheKey, rgba)
  return rgba
}

// Circle configurations - static, won't change
const CIRCLE_CONFIGS = [
  {
    radius: 0.5,
    xValues: [0.25, 0, 0.25], xDur: 20,
    yValues: [0, 0.25, 0], yDur: 21,
    rotDir: 1, rotDur: 17,
  },
  {
    radius: 0.45,
    xValues: [-0.25, 0, -0.25], xDur: 23,
    yValues: [0, 0.50, 0], yDur: 24,
    rotDir: 1, rotDur: 18,
  },
  {
    radius: 0.4,
    xValues: [0, 0.25, 0], xDur: 25,
    yValues: [0, 0.25, 0], yDur: 26,
    rotDir: -1, rotDur: 19,
  },
  {
    radius: 0.35,
    xValues: [0.25, 0.50, 0.25], xDur: 22,
    yValues: [0.25, 0, 0.25], yDur: 27,
    rotDir: 1, rotDur: 20,
  }
]

// Helper: interpolate values array based on time
const interpolateValues = (values, progress) => {
  const t = progress % 1
  if (t < 0.5) {
    return values[0] + (values[1] - values[0]) * (t * 2)
  } else {
    return values[1] + (values[2] - values[1]) * ((t - 0.5) * 2)
  }
}

const FluidGradientLayer = ({ config, paletteColors = [], effectsConfig }) => {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const tempCanvasRef = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const animationRef = useRef(null)
  const timeRef = useRef(0)
  const isVisibleRef = useRef(true)
  
  // Store config values in refs to avoid animation restarts
  const configRef = useRef(config)
  const gradientColorsRef = useRef([])
  const bgColorRef = useRef('')

  const flutedEnabled = effectsConfig?.flutedGlass?.enabled ?? false

  // Derive gradient colors
  const gradientColors = useMemo(() => {
    if (paletteColors.length >= 4) {
      return paletteColors.slice(0, 4)
    }
    if (paletteColors.length >= 2) {
      const repeated = []
      for (let i = 0; i < 4; i++) {
        repeated.push(paletteColors[i % paletteColors.length])
      }
      return repeated
    }
    return config.colors || ['#71ECFF', '#39F58A', '#71ECFF', '#F0CBA8']
  }, [paletteColors, config.colors])

  // Background color
  const bgColor = useMemo(() => {
    if (paletteColors.length > 0) {
      return paletteColors[0]
    }
    return config.backgroundColor || '#1C89FF'
  }, [paletteColors, config.backgroundColor])

  // Update refs when props change (doesn't restart animation)
  useEffect(() => {
    configRef.current = config
  }, [config])

  useEffect(() => {
    gradientColorsRef.current = gradientColors
    bgColorRef.current = bgColor
  }, [gradientColors, bgColor])

  // Animation setup - runs only once on mount
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position: absolute; left: 0; top: 0; width: 100%; height: 100%;'
    canvasRef.current = canvas
    container.appendChild(canvas)

    const tempCanvas = document.createElement('canvas')
    tempCanvasRef.current = tempCanvas

    const ctx = canvas.getContext('2d')
    const tempCtx = tempCanvas.getContext('2d')

    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = width
      canvas.height = height
      tempCanvas.width = width
      tempCanvas.height = height
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

      const width = canvas.width
      const height = canvas.height

      if (!ctx || !tempCtx) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      // Read config values from refs
      const cfg = configRef.current
      const colors = gradientColorsRef.current
      const background = bgColorRef.current
      
      const speed = cfg.speed ?? 1
      const intensity = cfg.intensity ?? 1
      const blurAmount = cfg.blurAmount ?? 20

      timeRef.current += 0.016 * speed

      // Clear and fill background
      ctx.fillStyle = background
      ctx.fillRect(0, 0, width, height)

      const time = timeRef.current
      const size = Math.max(width, height)
      const centerX = width / 2
      const centerY = height / 2

      // Draw each circle with its own radial gradient
      for (let i = 0; i < CIRCLE_CONFIGS.length; i++) {
        const circle = CIRCLE_CONFIGS[i]
        const color = colors[i % colors.length]

        const circleRadius = size * circle.radius * intensity

        const xProgress = time / circle.xDur
        const yProgress = time / circle.yDur
        const offsetX = interpolateValues(circle.xValues, xProgress) * width
        const offsetY = interpolateValues(circle.yValues, yProgress) * height

        const rotation = (time / circle.rotDur) * Math.PI * 2 * circle.rotDir

        const circleCenterX = centerX + offsetX
        const circleCenterY = centerY + offsetY

        ctx.save()

        ctx.translate(circleCenterX, circleCenterY)
        ctx.rotate(rotation)
        ctx.translate(-circleCenterX, -circleCenterY)

        const gradient = ctx.createRadialGradient(
          circleCenterX - circleRadius, circleCenterY, 0,
          circleCenterX, circleCenterY, circleRadius * 2
        )

        gradient.addColorStop(0, hexToRgba(color, 1))
        gradient.addColorStop(1, hexToRgba(background, 0))

        ctx.beginPath()
        ctx.arc(circleCenterX, circleCenterY, circleRadius, 0, Math.PI * 2)
        ctx.closePath()

        ctx.fillStyle = gradient
        ctx.fill()

        ctx.restore()
      }

      // Apply blur if specified using pre-created temp canvas
      if (blurAmount > 0) {
        tempCtx.filter = `blur(${blurAmount}px)`
        tempCtx.clearRect(0, 0, width, height)
        tempCtx.drawImage(canvas, 0, 0)

        ctx.clearRect(0, 0, width, height)
        ctx.drawImage(tempCanvas, 0, 0)
        tempCtx.filter = 'none'
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
  }, []) // Empty deps - only runs on mount

  return (
    <div
      ref={containerRef}
      className="fluid-gradient-layer"
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
}

export default FluidGradientLayer
