import { useRef, useEffect, useMemo, useState, memo } from 'react'
import FlutedGlassCanvas from './FlutedGlassCanvas'

// Color cache for hex to RGB conversions
const colorCache = new Map()

// Convert hex to RGB with caching
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

const WavesLayer = memo(({ config, paletteColors = [], effectsConfig, isPaused }) => {
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
  const colorsRef = useRef([])

  const flutedEnabled = effectsConfig?.flutedGlass?.enabled ?? false

  // Derive wave colors from palette
  const waveColors = useMemo(() => {
    if (paletteColors.length >= 2) {
      return paletteColors
    }
    return config.colors || ['#06b6d4', '#a855f7', '#ec4899', '#3b82f6']
  }, [paletteColors, config.colors])

  // Update refs when props change (doesn't restart animation)
  useEffect(() => {
    configRef.current = config
  }, [config])

  useEffect(() => {
    colorsRef.current = waveColors
  }, [waveColors])

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

    // Cap DPR at 2.0 for performance - higher values offer diminishing returns
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const handleResize = () => {
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

      // Use logical dimensions (pre-DPR scaling)
      const width = canvas.width / dpr
      const height = canvas.height / dpr

      if (!ctx || !tempCtx) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      // Read config values from ref
      const cfg = configRef.current
      const currentColors = colorsRef.current

      const numLayers = Math.max(1, cfg.layers ?? 3)
      const waveHeight = cfg.waveHeight ?? 0.05
      const waveFrequency = cfg.waveFrequency ?? 2
      const rotation = cfg.rotation ?? 0
      const speed = cfg.speed ?? 0.5
      const blur = cfg.blur ?? 40
      const phaseOffset = cfg.phaseOffset ?? 0

      // Only update time when not paused
      if (!isPausedRef.current) {
        timeRef.current += 0.016 * speed
      }

      const time = timeRef.current

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Apply rotation
      ctx.save()
      const centerX = width / 2
      const centerY = height / 2
      const rotationRad = (rotation * Math.PI) / 180
      ctx.translate(centerX, centerY)
      ctx.rotate(rotationRad)
      ctx.translate(-centerX, -centerY)

      // Calculate extended dimensions for rotation
      const diagonal = Math.sqrt(width * width + height * height)
      const extendedWidth = diagonal * 1.5
      const extendedHeight = diagonal * 1.5
      const offsetX = (width - extendedWidth) / 2
      const offsetY = (height - extendedHeight) / 2

      // Background color (color 1) - fills top 50%
      const backgroundColor = currentColors[0] || '#06b6d4'
      ctx.fillStyle = backgroundColor
      ctx.fillRect(offsetX, offsetY, extendedWidth, extendedHeight)

      // Wave region starts at 50% of the extended height
      const waveRegionStart = offsetY + (extendedHeight * 0.5)
      // Layer spacing uses 20% of height for distributing layer start positions
      const layerSpacingHeight = extendedHeight * 0.2

      // Each layer starts at: 50% + (20% / numLayers) * i
      // Layer i uses color (i + 2) from palette (index i + 1, since color 1 is index 0 for background)

      // Wave region height is from 50% to bottom of extended area
      const waveRegionHeight = extendedHeight * 0.5

      // Draw layers from index 0 to numLayers-1
      // Later layers (higher index) paint over earlier layers (lower index)
      for (let i = 0; i < numLayers; i++) {
        // Calculate the starting Y position for this layer
        // Layer 0 starts at 50%, Layer 1 at 50% + segment, etc.
        const segmentHeight = layerSpacingHeight / numLayers
        const layerStartY = waveRegionStart + (segmentHeight * i)

        // Get color for this layer (color index i+1, since index 0 is background)
        const colorIndex = (i + 1) % currentColors.length
        const layerColor = hexToRgb(currentColors[colorIndex])

        // Calculate wave parameters for this layer
        const amplitude = waveRegionHeight * waveHeight * (0.5 + i * 0.15)
        const freq = waveFrequency * (1 + i * 0.2)
        const layerPhase = phaseOffset * i * Math.PI * 0.5 + time

        ctx.beginPath()

        // Start from bottom-left corner
        ctx.moveTo(offsetX, offsetY + extendedHeight)

        // Move up to the wave starting point on the left edge
        ctx.lineTo(offsetX, layerStartY)

        // Draw the wave curve across the width
        // LOD optimization: use larger step size when blur is high or paused
        const isPausedNow = isPausedRef.current
        const step = (blur > 30 || isPausedNow) ? 6 : (blur > 20 ? 4 : 2)

        for (let x = 0; x <= extendedWidth; x += step) {
          const normalizedX = x / extendedWidth
          // Composite wave with primary and secondary harmonics
          const waveY = layerStartY +
            Math.sin(normalizedX * Math.PI * 2 * freq + layerPhase) * amplitude +
            Math.sin(normalizedX * Math.PI * 4 * freq * 0.5 + layerPhase * 1.5) * amplitude * 0.3
          ctx.lineTo(offsetX + x, waveY)
        }

        // Close the path: go to bottom-right, then back to bottom-left
        ctx.lineTo(offsetX + extendedWidth, offsetY + extendedHeight)
        ctx.closePath()

        // Fill with solid color
        ctx.fillStyle = `rgb(${layerColor.r}, ${layerColor.g}, ${layerColor.b})`
        ctx.fill()
      }

      ctx.restore()

      // Apply blur if specified using pre-created temp canvas
      // Reset transform to identity for pixel-accurate canvas-to-canvas copy
      // (drawImage with DPR transform active would scale by dpr, zooming into a corner)
      if (blur > 0) {
        const pw = canvas.width
        const ph = canvas.height

        tempCtx.save()
        tempCtx.setTransform(1, 0, 0, 1, 0, 0)
        tempCtx.clearRect(0, 0, pw, ph)
        tempCtx.drawImage(canvas, 0, 0)
        tempCtx.restore()

        ctx.save()
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, pw, ph)
        ctx.filter = `blur(${blur * dpr}px)`
        ctx.drawImage(tempCanvas, 0, 0)
        ctx.filter = 'none'
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
  }, []) // Empty deps - only runs on mount

  return (
    <div
      ref={containerRef}
      className="waves-layer"
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

WavesLayer.displayName = 'WavesLayer'

export default WavesLayer
