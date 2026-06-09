import { memo, useRef, useEffect, useState, useCallback } from 'react'
import { getGlassOverlay } from '../registry'

/**
 * SimpleGradientLayer - Renders a gradient to canvas without any animated effects
 * Supports fluted glass overlay effect
 */
const SimpleGradientLayer = memo(({ config, gradientColors, effectsConfig }) => {
  const canvasRef = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)

  const colors = gradientColors || config?.colors || ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0']
  const colorStops = config?.colorStops || colors.map((_, i) => Math.round((i / (colors.length - 1)) * 100))
  const gradientType = config?.type || 'linear'
  const startPos = config?.startPos || { x: 0, y: 0 }
  const endPos = config?.endPos || { x: 100, y: 100 }

  const flutedEnabled = effectsConfig?.flutedGlass?.enabled ?? false
  const GlassOverlay = getGlassOverlay()

  // Draw gradient to canvas
  const drawGradient = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    let gradient

    switch (gradientType) {
      case 'linear': {
        // Convert percentage positions to pixel coordinates
        const x0 = (startPos.x / 100) * width
        const y0 = (startPos.y / 100) * height
        const x1 = (endPos.x / 100) * width
        const y1 = (endPos.y / 100) * height
        gradient = ctx.createLinearGradient(x0, y0, x1, y1)
        break
      }
      case 'radial': {
        // Center is midpoint between start and end
        const centerX = ((startPos.x + endPos.x) / 2 / 100) * width
        const centerY = ((startPos.y + endPos.y) / 2 / 100) * height
        // Radius based on distance between start and end
        const dx = ((endPos.x - startPos.x) / 100) * width
        const dy = ((endPos.y - startPos.y) / 100) * height
        const radius = Math.sqrt(dx * dx + dy * dy) / 2
        gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius || Math.max(width, height))
        break
      }
      case 'conic': {
        // Center is midpoint between start and end
        const centerX = ((startPos.x + endPos.x) / 2 / 100) * width
        const centerY = ((startPos.y + endPos.y) / 2 / 100) * height
        gradient = ctx.createConicGradient(0, centerX, centerY)
        break
      }
      default: {
        gradient = ctx.createLinearGradient(0, 0, width, height)
      }
    }

    // Add color stops
    colors.forEach((color, i) => {
      const stop = (colorStops[i] ?? (i / (colors.length - 1) * 100)) / 100
      gradient.addColorStop(Math.max(0, Math.min(1, stop)), color)
    })

    // Fill with gradient
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    setCanvasReady(true)
  }, [colors, colorStops, gradientType, startPos, endPos])

  // Initialize canvas size and draw
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateSize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      drawGradient()
    }

    updateSize()

    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [drawGradient])

  // Redraw when gradient config changes
  useEffect(() => {
    drawGradient()
  }, [drawGradient])

  const containerStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  }

  const canvasStyle = {
    width: '100%',
    height: '100%',
    display: 'block',
  }

  return (
    <div className="simple-gradient-layer" style={containerStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />
      {flutedEnabled && GlassOverlay && canvasReady && canvasRef.current && (
        <GlassOverlay
          sourceCanvasRef={canvasRef}
          effectsConfig={effectsConfig}
        />
      )}
    </div>
  )
})

SimpleGradientLayer.displayName = 'SimpleGradientLayer'

export default SimpleGradientLayer
