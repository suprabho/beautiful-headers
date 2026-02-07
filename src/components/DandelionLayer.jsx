import { useRef, useEffect, useState, memo } from 'react'
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

const interpolateColor = (color1, color2, t) => {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t),
  }
}

const DandelionLayer = memo(({ config, paletteColors = [], effectsConfig, isPaused }) => {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const configRef = useRef(config)
  const colorsRef = useRef(paletteColors)
  const isPausedRef = useRef(isPaused)
  const timeRef = useRef(0)
  const linesRef = useRef([])
  const [canvasReady, setCanvasReady] = useState(false)

  const flutedEnabled = effectsConfig?.flutedGlass?.enabled ?? false

  // Update refs when props change
  useEffect(() => {
    configRef.current = config
  }, [config])

  useEffect(() => {
    colorsRef.current = paletteColors.length >= 2 ? paletteColors : ['#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899']
  }, [paletteColors])

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  // Initialize lines
  useEffect(() => {
    const cfg = configRef.current
    const lines = []

    for (let i = 0; i < cfg.lineCount; i++) {
      const baseAngle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * cfg.spread * 2
      const length = cfg.radiusMin + Math.random() * (cfg.radiusMax - cfg.radiusMin)
      const phaseOffset = Math.random() * Math.PI * 2
      const swayAmount = 0.02 + Math.random() * 0.03

      lines.push({
        baseAngle,
        length,
        phaseOffset,
        swayAmount,
        colorIdx: Math.floor(Math.random() * 4),
      })
    }

    linesRef.current = lines
  }, [config.lineCount, config.radiusMin, config.radiusMax, config.spread])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create canvas
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;'
    container.appendChild(canvas)
    canvasRef.current = canvas
    setCanvasReady(true)

    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    const animate = () => {
      const cfg = configRef.current
      const colors = colorsRef.current
      const rect = container.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      const centerX = width / 2
      const centerY = height * cfg.centerY
      const maxLength = Math.min(width, height)

      // Create radial background gradient
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height))
      bgGradient.addColorStop(0, cfg.radialGradientCenter || cfg.backgroundColor || '#e8f4fc')
      bgGradient.addColorStop(1, cfg.radialGradientOuter || colors[colors.length - 1] || '#fef3c7')
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      // Update time
      if (!isPausedRef.current) {
        timeRef.current += 0.016 * cfg.speed
      }

      const time = timeRef.current

      // Draw lines
      const lines = linesRef.current
      const lineOpacity = cfg.lineOpacity ?? 0.8

      ctx.globalAlpha = lineOpacity

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Calculate sway
        const sway = Math.sin(time * 2 + line.phaseOffset) * line.swayAmount
        const angle = line.baseAngle + sway

        const lineLength = line.length * maxLength

        // Start point
        const startX = centerX
        const startY = centerY

        // End point
        const endX = centerX + Math.cos(angle) * lineLength
        const endY = centerY + Math.sin(angle) * lineLength

        // Create gradient for line: origin color to dot color
        const lineGradient = ctx.createLinearGradient(startX, startY, endX, endY)
        const originColor = colors[colors.length - 1] || '#fef3c7'
        const dotColor = colors[line.colorIdx % colors.length]

        lineGradient.addColorStop(0, originColor)
        lineGradient.addColorStop(1, dotColor)

        // Draw line
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.strokeStyle = lineGradient
        ctx.lineWidth = cfg.thickness
        ctx.lineCap = 'round'
        ctx.stroke()

        // Draw dot at end
        ctx.beginPath()
        ctx.arc(endX, endY, cfg.dotSize, 0, Math.PI * 2)
        ctx.fillStyle = dotColor
        ctx.fill()
      }

      // Reset opacity
      ctx.globalAlpha = 1.0

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (canvasRef.current && container.contains(canvasRef.current)) {
        container.removeChild(canvasRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="dandelion-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
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

DandelionLayer.displayName = 'DandelionLayer'

export default DandelionLayer
