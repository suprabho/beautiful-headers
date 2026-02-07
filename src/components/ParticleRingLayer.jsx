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

const ParticleRingLayer = memo(({ config, paletteColors = [], effectsConfig, isPaused }) => {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const configRef = useRef(config)
  const colorsRef = useRef(paletteColors)
  const isPausedRef = useRef(isPaused)
  const timeRef = useRef(0)
  const particlesRef = useRef([])
  const [canvasReady, setCanvasReady] = useState(false)

  const flutedEnabled = effectsConfig?.flutedGlass?.enabled ?? false

  // Update refs when props change
  useEffect(() => {
    configRef.current = config
  }, [config])

  useEffect(() => {
    colorsRef.current = paletteColors.length >= 2 ? paletteColors : ['#ec4899', '#a855f7', '#8b5cf6', '#6366f1']
  }, [paletteColors])

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  // Initialize particles
  useEffect(() => {
    const cfg = configRef.current
    const particles = []

    for (let i = 0; i < cfg.particleCount; i++) {
      // Random angle around the ring
      const angle = Math.random() * Math.PI * 2

      // Random radius within the ring
      const radiusOffset = (Math.random() - 0.5) * cfg.ringWidth
      const baseRadius = cfg.ringRadius + radiusOffset

      // Add some dispersion
      const dispersionX = (Math.random() - 0.5) * cfg.dispersion
      const dispersionY = (Math.random() - 0.5) * cfg.dispersion

      particles.push({
        angle,
        baseRadius,
        dispersionX,
        dispersionY,
        size: 0.5 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.5 + Math.random() * 1,
        colorIdx: Math.floor(Math.random() * 4),
        opacity: 0.6 + Math.random() * 0.4,
      })
    }

    particlesRef.current = particles
  }, [config.particleCount, config.ringRadius, config.ringWidth, config.dispersion])

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
      const centerY = height / 2
      const maxRadius = Math.min(width, height) / 2

      // Create radial background gradient
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height))
      bgGradient.addColorStop(0, cfg.radialGradientCenter || cfg.backgroundColor || '#fef6f9')
      bgGradient.addColorStop(1, cfg.radialGradientOuter || colors[colors.length - 1] || '#fef3c7')
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      // Update time
      if (!isPausedRef.current) {
        timeRef.current += 0.016 * cfg.speed
      }

      const time = timeRef.current

      // Draw particles
      const particles = particlesRef.current

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Calculate position with rotation
        const rotatedAngle = p.angle + time * cfg.rotationSpeed

        // Pulsing effect on radius
        const pulse = Math.sin(time * p.pulseSpeed + p.phase) * 0.02
        const currentRadius = (p.baseRadius + pulse) * maxRadius

        // Calculate x, y with dispersion
        const x = centerX + Math.cos(rotatedAngle) * currentRadius + p.dispersionX * maxRadius
        const y = centerY + Math.sin(rotatedAngle) * currentRadius + p.dispersionY * maxRadius

        // Get color based on angle for gradient effect
        const normalizedAngle = ((rotatedAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
        const colorProgress = normalizedAngle / (Math.PI * 2)
        const colorIdx = Math.floor(colorProgress * colors.length) % colors.length
        const nextColorIdx = (colorIdx + 1) % colors.length
        const colorT = (colorProgress * colors.length) % 1

        const c1 = hexToRgb(colors[colorIdx])
        const c2 = hexToRgb(colors[nextColorIdx])

        const r = Math.round(c1.r + (c2.r - c1.r) * colorT)
        const g = Math.round(c1.g + (c2.g - c1.g) * colorT)
        const b = Math.round(c1.b + (c2.b - c1.b) * colorT)

        // Draw particle
        ctx.beginPath()
        ctx.arc(x, y, cfg.particleSize * p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`
        ctx.fill()
      }

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
      className="particle-ring-layer"
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

ParticleRingLayer.displayName = 'ParticleRingLayer'

export default ParticleRingLayer
