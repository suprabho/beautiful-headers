import { useRef, useEffect, useMemo, useState } from 'react'
import FlutedGlassCanvas from './FlutedGlassCanvas'

const WavesLayer = ({ config, paletteColors = [], effectsConfig }) => {
  const {
    useGradientColors = true,
    colors = ['#06b6d4', '#a855f7', '#ec4899', '#3b82f6'],
    waveHeight = 0.15,
    waveFrequency = 3,
    rotation = 0,
    speed = 0.5,
    blur = 40,
    layers = 4,
    phaseOffset = 0, // 0 = aligned/stacked, higher values = more offset between layers
  } = config

  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const animationRef = useRef(null)
  const timeRef = useRef(0)

  const flutedEnabled = effectsConfig?.flutedGlass?.enabled ?? false

  // Determine which colors to use
  const waveColors = useMemo(() => {
    if (useGradientColors && paletteColors.length >= 2) {
      return paletteColors
    }
    return colors
  }, [useGradientColors, paletteColors, colors])

  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return { r: 0, g: 0, b: 0 }
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
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

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position: absolute; left: 0; top: 0; width: 100%; height: 100%;'
    canvasRef.current = canvas
    container.appendChild(canvas)

    const ctx = canvas.getContext('2d')

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    handleResize()
    setCanvasReady(true)
    window.addEventListener('resize', handleResize)

    const animate = () => {
      const width = canvas.width
      const height = canvas.height

      if (!ctx) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

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
      
      waveColors.forEach((color, index) => {
        bgGradient.addColorStop(index / Math.max(1, waveColors.length - 1), color)
      })
      
      ctx.fillStyle = bgGradient
      ctx.fillRect(offsetX, offsetY, extendedWidth, extendedHeight)

      // Draw wave layers
      const numLayers = Math.max(2, Math.min(layers, waveColors.length + 2))
      const time = timeRef.current

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

        // Base Y position for this layer
        const baseY = offsetY + (layerProgress * extendedHeight)
        
        // Create wave path
        ctx.beginPath()
        ctx.moveTo(offsetX, offsetY + extendedHeight)
        ctx.lineTo(offsetX, baseY)

        // Draw wave curve
        const amplitude = extendedHeight * waveHeight * (0.5 + layer * 0.15)
        const freq = waveFrequency * (1 + layer * 0.2)
        const layerPhase = phaseOffset * layer * Math.PI * 0.5 + time
        
        for (let x = 0; x <= extendedWidth; x += 2) {
          const normalizedX = x / extendedWidth
          const waveY = baseY + 
            Math.sin(normalizedX * Math.PI * 2 * freq + layerPhase) * amplitude +
            Math.sin(normalizedX * Math.PI * 4 * freq * 0.5 + layerPhase * 1.5) * amplitude * 0.3
          ctx.lineTo(offsetX + x, waveY)
        }

        ctx.lineTo(offsetX + extendedWidth, offsetY + extendedHeight)
        ctx.closePath()

        // Fill with gradient for this wave
        const waveGradient = ctx.createLinearGradient(
          offsetX,
          baseY - amplitude,
          offsetX,
          offsetY + extendedHeight
        )
        
        // Get colors for this layer's gradient
        const startColor = `rgba(${layerColor.r}, ${layerColor.g}, ${layerColor.b}, 0.9)`
        const endColor = waveColors[Math.min(colorIndex + 2, waveColors.length - 1)] || waveColors[waveColors.length - 1]
        const endRgb = hexToRgb(endColor)
        
        waveGradient.addColorStop(0, startColor)
        waveGradient.addColorStop(0.5, `rgba(${layerColor.r}, ${layerColor.g}, ${layerColor.b}, 0.95)`)
        waveGradient.addColorStop(1, `rgba(${endRgb.r}, ${endRgb.g}, ${endRgb.b}, 1)`)

        ctx.fillStyle = waveGradient
        ctx.fill()
      }

      ctx.restore()

      // Apply blur if specified
      if (blur > 0) {
        ctx.filter = `blur(${blur}px)`
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = width
        tempCanvas.height = height
        const tempCtx = tempCanvas.getContext('2d')
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (canvas && container.contains(canvas)) {
        container.removeChild(canvas)
      }
    }
  }, [waveColors, waveHeight, waveFrequency, rotation, speed, blur, layers, phaseOffset])

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

