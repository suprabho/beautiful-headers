import { useRef, useEffect, useMemo, useState, memo } from 'react'
import FlutedGlassCanvas from './FlutedGlassCanvas'
import { getAudioModulatedConfig } from '../audio/applyAudioModulation'

// Detect mobile device for performance optimizations
const isMobile = typeof window !== 'undefined' && (
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  window.innerWidth < 768
)

// Check for reduced motion preference
const prefersReducedMotion = typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

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

// Base circle configuration templates for variety
const CIRCLE_TEMPLATES = [
  { xValues: [0.25, 0, 0.25], yValues: [0, 0.25, 0], rotDir: 1 },
  { xValues: [-0.25, 0, -0.25], yValues: [0, 0.50, 0], rotDir: 1 },
  { xValues: [0, 0.25, 0], yValues: [0, 0.25, 0], rotDir: -1 },
  { xValues: [0.25, 0.50, 0.25], yValues: [0.25, 0, 0.25], rotDir: 1 },
  { xValues: [-0.15, 0.15, -0.15], yValues: [0.15, -0.15, 0.15], rotDir: -1 },
  { xValues: [0.3, -0.1, 0.3], yValues: [-0.2, 0.3, -0.2], rotDir: 1 },
]

// Generate circle configs dynamically based on number of colors
const generateCircleConfigs = (numColors) => {
  // Limit circles on mobile for better performance
  const maxCircles = isMobile ? Math.min(numColors, 4) : numColors
  const configs = []
  for (let i = 0; i < maxCircles; i++) {
    const template = CIRCLE_TEMPLATES[i % CIRCLE_TEMPLATES.length]
    // Vary radius, duration based on index for visual variety
    const radiusBase = 0.5 - (i * 0.05)
    const radius = Math.max(0.25, radiusBase + (i % 2) * 0.1)
    configs.push({
      radius,
      xValues: template.xValues,
      xDur: 20 + i * 2,
      yValues: template.yValues,
      yDur: 21 + i * 2,
      rotDir: template.rotDir,
      rotDur: 17 + i,
    })
  }
  return configs
}

// Helper: interpolate values array based on time
const interpolateValues = (values, progress) => {
  const t = progress % 1
  if (t < 0.5) {
    return values[0] + (values[1] - values[0]) * (t * 2)
  } else {
    return values[1] + (values[2] - values[1]) * ((t - 0.5) * 2)
  }
}

const FluidGradientLayer = memo(({ config, paletteColors = [], effectsConfig, isPaused }) => {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const tempCanvasRef = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const animationRef = useRef(null)
  const timeRef = useRef(0)
  const isVisibleRef = useRef(true)
  const isPausedRef = useRef(false)
  
  // Store config values in refs to avoid animation restarts
  const configRef = useRef(config)
  const gradientColorsRef = useRef([])
  const circleConfigsRef = useRef([])
  const bgColorRef = useRef('')

  const flutedEnabled = effectsConfig?.flutedGlass?.enabled ?? false

  // Derive gradient colors - use all palette colors
  const gradientColors = useMemo(() => {
    if (paletteColors.length >= 2) {
      return paletteColors
    }
    return config.colors || ['#71ECFF', '#39F58A', '#71ECFF', '#F0CBA8']
  }, [paletteColors, config.colors])

  // Generate circle configs based on number of colors
  const circleConfigs = useMemo(() => {
    return generateCircleConfigs(gradientColors.length)
  }, [gradientColors.length])

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
    circleConfigsRef.current = circleConfigs
    bgColorRef.current = bgColor
  }, [gradientColors, circleConfigs, bgColor])

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

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

    // Cap DPR lower on mobile for better performance (1.5 vs 2.0 on desktop)
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2)

    // Debounced resize for mobile to prevent excessive redraws during orientation change
    let resizeTimeout = null
    const handleResize = () => {
      const doResize = () => {
        const width = window.innerWidth
        const height = window.innerHeight
        // Use DPR-scaled canvas for crisp rendering on Retina/4K displays
        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        tempCanvas.width = width * dpr
        tempCanvas.height = height * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        tempCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
        // Only mark canvas as ready once dimensions are actually set
        // This prevents WebGL errors when FlutedGlassCanvas tries to use a 0-dimension canvas
        setCanvasReady(true)
      }

      if (isMobile) {
        if (resizeTimeout) clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(doResize, 150)
      } else {
        doResize()
      }
    }

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden
      if (!document.hidden && animationRef.current === null) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Frame throttling for mobile - target ~30fps instead of 60fps
    let lastFrameTime = 0
    const targetFrameInterval = isMobile ? 33 : 16 // ~30fps on mobile, ~60fps on desktop

    const animate = (currentTime) => {
      if (!isVisibleRef.current) {
        animationRef.current = null
        return
      }

      // Throttle frames on mobile
      if (currentTime - lastFrameTime < targetFrameInterval) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }
      lastFrameTime = currentTime

      // Use logical dimensions (pre-DPR scaling)
      const width = canvas.width / dpr
      const height = canvas.height / dpr

      if (!ctx || !tempCtx) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      // Read config values from refs, with audio modulation applied
      const cfg = getAudioModulatedConfig(configRef.current, 'fluid')
      const colors = gradientColorsRef.current
      const background = bgColorRef.current
      
      // Reduce animation speed if user prefers reduced motion
      const baseSpeed = cfg.speed ?? 1
      const speed = prefersReducedMotion ? baseSpeed * 0.3 : baseSpeed
      const intensity = cfg.intensity ?? 1
      // Reduce blur on mobile for better performance
      const baseBlur = cfg.blurAmount ?? 20
      const blurAmount = isMobile ? Math.min(baseBlur, 15) : baseBlur

      // Only update time when not paused
      if (!isPausedRef.current) {
        timeRef.current += 0.016 * speed
      }

      // Clear and fill background
      ctx.fillStyle = background
      ctx.fillRect(0, 0, width, height)

      const time = timeRef.current
      const size = Math.max(width, height)
      const centerX = width / 2
      const centerY = height / 2

      // Draw each circle with its own radial gradient - one per color
      const circles = circleConfigsRef.current
      for (let i = 0; i < circles.length; i++) {
        const circle = circles[i]
        const color = colors[i]

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
        // Reset transforms before cross-canvas operations to avoid DPR scaling issues
        tempCtx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.setTransform(1, 0, 0, 1, 0, 0)

        tempCtx.filter = `blur(${blurAmount}px)`
        tempCtx.clearRect(0, 0, canvas.width, canvas.height)
        tempCtx.drawImage(canvas, 0, 0)

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(tempCanvas, 0, 0)
        tempCtx.filter = 'none'

        // Restore DPR transforms for next frame
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        tempCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (resizeTimeout) clearTimeout(resizeTimeout)
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
})

FluidGradientLayer.displayName = 'FluidGradientLayer'

export default FluidGradientLayer
