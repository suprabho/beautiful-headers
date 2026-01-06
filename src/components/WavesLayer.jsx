import { useRef, useEffect, useMemo, useState } from 'react'
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

// Interpolate between colors
const interpolateColor = (color1, color2, t) => {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  return {
    r: Math.round(rgb1.r + (rgb2.r - rgb1.r) * t),
    g: Math.round(rgb1.g + (rgb2.g - rgb1.g) * t),
    b: Math.round(rgb1.b + (rgb2.b - rgb1.b) * t),
  }
}

const WavesLayer = ({ config, paletteColors = [], effectsConfig }) => {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const tempCanvasRef = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const animationRef = useRef(null)
  const timeRef = useRef(0)
  const isVisibleRef = useRef(true)
  
  // Store config values in refs to avoid animation restarts
  const configRef = useRef(config)
  const colorsRef = useRef([])
  const layerColorDataRef = useRef([])

  const flutedEnabled = effectsConfig?.flutedGlass?.enabled ?? false

  // Derive wave colors
  const waveColors = useMemo(() => {
    if (paletteColors.length >= 2) {
      return paletteColors
    }
    return config.colors || ['#06b6d4', '#a855f7', '#ec4899', '#3b82f6']
  }, [paletteColors, config.colors])

  // Pre-compute layer color data
  const layerColorData = useMemo(() => {
    const layers = config.layers ?? 4
    const numLayers = Math.max(2, Math.min(layers, waveColors.length + 2))
    const data = []
    
    for (let layer = 0; layer < numLayers; layer++) {
      const layerProgress = layer / numLayers
      const colorIndex = Math.floor(layerProgress * (waveColors.length - 1))
      const nextColorIndex = Math.min(colorIndex + 1, waveColors.length - 1)
      const colorT = (layerProgress * (waveColors.length - 1)) - colorIndex
      
      const layerColor = interpolateColor(
        waveColors[colorIndex],
        waveColors[nextColorIndex],
        colorT
      )
      
      const endColor = waveColors[Math.min(colorIndex + 2, waveColors.length - 1)] || waveColors[waveColors.length - 1]
      const endRgb = hexToRgb(endColor)
      
      data.push({
        layerProgress,
        layerColor,
        endRgb,
        colorIndex,
      })
    }
    
    return data
  }, [waveColors, config.layers])

  // Update refs when props change (doesn't restart animation)
  useEffect(() => {
    configRef.current = config
  }, [config])

  useEffect(() => {
    colorsRef.current = waveColors
    layerColorDataRef.current = layerColorData
  }, [waveColors, layerColorData])

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
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      tempCanvas.width = window.innerWidth
      tempCanvas.height = window.innerHeight
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

      // Read config values from ref
      const cfg = configRef.current
      const currentColors = colorsRef.current
      const currentLayerData = layerColorDataRef.current
      
      const waveHeight = cfg.waveHeight ?? 0.15
      const waveFrequency = cfg.waveFrequency ?? 3
      const rotation = cfg.rotation ?? 0
      const speed = cfg.speed ?? 0.5
      const blur = cfg.blur ?? 40
      const phaseOffset = cfg.phaseOffset ?? 0

      timeRef.current += 0.016 * speed

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

      // Draw gradient background
      const bgGradient = ctx.createLinearGradient(
        offsetX,
        offsetY,
        offsetX,
        offsetY + extendedHeight
      )
      
      currentColors.forEach((color, index) => {
        bgGradient.addColorStop(index / Math.max(1, currentColors.length - 1), color)
      })
      
      ctx.fillStyle = bgGradient
      ctx.fillRect(offsetX, offsetY, extendedWidth, extendedHeight)

      // Draw wave layers using pre-computed color data
      const numLayers = currentLayerData.length
      const time = timeRef.current

      for (let layer = 0; layer < numLayers; layer++) {
        const { layerProgress, layerColor, endRgb } = currentLayerData[layer]

        const baseY = offsetY + (layerProgress * extendedHeight)
        
        ctx.beginPath()
        ctx.moveTo(offsetX, offsetY + extendedHeight)
        ctx.lineTo(offsetX, baseY)

        const amplitude = extendedHeight * waveHeight * (0.5 + layer * 0.15)
        const freq = waveFrequency * (1 + layer * 0.2)
        const layerPhase = phaseOffset * layer * Math.PI * 0.5 + time
        
        // Use larger step size when blur is high (optimization)
        const step = blur > 20 ? 4 : 2
        for (let x = 0; x <= extendedWidth; x += step) {
          const normalizedX = x / extendedWidth
          const waveY = baseY + 
            Math.sin(normalizedX * Math.PI * 2 * freq + layerPhase) * amplitude +
            Math.sin(normalizedX * Math.PI * 4 * freq * 0.5 + layerPhase * 1.5) * amplitude * 0.3
          ctx.lineTo(offsetX + x, waveY)
        }

        ctx.lineTo(offsetX + extendedWidth, offsetY + extendedHeight)
        ctx.closePath()

        const waveGradient = ctx.createLinearGradient(
          offsetX,
          baseY - amplitude,
          offsetX,
          offsetY + extendedHeight
        )
        
        const startColor = `rgba(${layerColor.r}, ${layerColor.g}, ${layerColor.b}, 0.9)`
        
        waveGradient.addColorStop(0, startColor)
        waveGradient.addColorStop(0.5, `rgba(${layerColor.r}, ${layerColor.g}, ${layerColor.b}, 0.95)`)
        waveGradient.addColorStop(1, `rgba(${endRgb.r}, ${endRgb.g}, ${endRgb.b}, 1)`)

        ctx.fillStyle = waveGradient
        ctx.fill()
      }

      ctx.restore()

      // Apply blur if specified using pre-created temp canvas
      if (blur > 0) {
        ctx.filter = `blur(${blur}px)`
        tempCtx.clearRect(0, 0, width, height)
        tempCtx.drawImage(canvas, 0, 0)
        
        ctx.filter = 'none'
        ctx.clearRect(0, 0, width, height)
        ctx.filter = `blur(${blur}px)`
        ctx.drawImage(tempCanvas, 0, 0)
        ctx.filter = 'none'
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
}

export default WavesLayer
