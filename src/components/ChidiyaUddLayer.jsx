import { useRef, useEffect, useState, useMemo, memo } from 'react'
import FlutedGlassCanvas from './FlutedGlassCanvas'

// Chidiya Udd — items that can fly vs items that can't
const FLYING_ITEMS = [
  { name: 'Chidiya', emoji: '\u{1F426}' },
  { name: 'Tota', emoji: '\u{1F99C}' },
  { name: 'Titli', emoji: '\u{1F98B}' },
  { name: 'Macchar', emoji: '\u{1FAB0}' },
  { name: 'Rocket', emoji: '\u{1F680}' },
  { name: 'Hawai Jahaz', emoji: '\u{2708}\u{FE0F}' },
  { name: 'Patang', emoji: '\u{1FA81}' },
  { name: 'Chamgaadad', emoji: '\u{1F987}' },
  { name: 'Ullu', emoji: '\u{1F989}' },
  { name: 'Bumblebee', emoji: '\u{1F41D}' },
  { name: 'Morpankh', emoji: '\u{1FAB6}' },
  { name: 'Superman', emoji: '\u{1F9B8}' },
  { name: 'Gubbare', emoji: '\u{1F388}' },
  { name: 'Tara', emoji: '\u{2B50}' },
  { name: 'Baadal', emoji: '\u{2601}\u{FE0F}' },
]

const GROUNDED_ITEMS = [
  { name: 'Billi', emoji: '\u{1F431}' },
  { name: 'Kutta', emoji: '\u{1F436}' },
  { name: 'Haathi', emoji: '\u{1F418}' },
  { name: 'Mez', emoji: '\u{1FA91}' }, // chair as proxy
  { name: 'Patthar', emoji: '\u{1FAA8}' },
  { name: 'Machli', emoji: '\u{1F41F}' },
  { name: 'Saanp', emoji: '\u{1F40D}' },
  { name: 'Gaay', emoji: '\u{1F404}' },
  { name: 'Ghoda', emoji: '\u{1F40E}' },
  { name: 'Mendhak', emoji: '\u{1F438}' },
  { name: 'Chuha', emoji: '\u{1F42D}' },
  { name: 'Sher', emoji: '\u{1F981}' },
  { name: 'Kekda', emoji: '\u{1F980}' },
  { name: 'Paudha', emoji: '\u{1F331}' },
  { name: 'Cycle', emoji: '\u{1F6B2}' },
]

function createParticle(width, height, config) {
  const canFly = Math.random() > 0.5
  const items = canFly ? FLYING_ITEMS : GROUNDED_ITEMS
  const item = items[Math.floor(Math.random() * items.length)]

  return {
    x: Math.random() * width,
    y: height + Math.random() * 100,
    canFly,
    item,
    size: (config.itemSize ?? 32) + Math.random() * 16,
    speed: (0.5 + Math.random() * 1.5) * (config.speed ?? 1),
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.5 + Math.random() * 1.5,
    wobbleAmount: 10 + Math.random() * 20,
    opacity: 0.7 + Math.random() * 0.3,
    // For grounded items: how high they rise before falling
    maxRise: canFly ? -1 : (height * (0.3 + Math.random() * 0.3)),
    risen: 0,
    falling: false,
    fallSpeed: 0,
    rotation: 0,
    rotationSpeed: (Math.random() - 0.5) * 0.02,
  }
}

const ChidiyaUddLayer = memo(({ config, paletteColors = [], effectsConfig, isPaused, mousePos = { x: 0.5, y: 0.5 }, mouseIntensity = 1 }) => {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const animationRef = useRef(null)
  const isVisibleRef = useRef(true)
  const isPausedRef = useRef(false)
  const configRef = useRef(config)
  const particlesRef = useRef([])
  const colorsRef = useRef([])

  const flutedEnabled = effectsConfig?.flutedGlass?.enabled ?? false

  const bgColors = useMemo(() => {
    if (paletteColors.length >= 2) return paletteColors
    return config.colors || ['#1a1a2e', '#16213e', '#0f3460', '#e94560']
  }, [paletteColors, config.colors])

  useEffect(() => { configRef.current = config }, [config])
  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])
  useEffect(() => { colorsRef.current = bgColors }, [bgColors])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position: absolute; left: 0; top: 0; width: 100%; height: 100%;'
    canvasRef.current = canvas
    container.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    let width, height

    const handleResize = () => {
      width = container.clientWidth || window.innerWidth
      height = container.clientHeight || window.innerHeight
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

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const animate = () => {
      if (!isVisibleRef.current) {
        animationRef.current = null
        return
      }

      const cfg = configRef.current
      const colors = colorsRef.current
      const itemCount = cfg.itemCount ?? 25
      const speed = cfg.speed ?? 1
      const showLabels = cfg.showLabels ?? true
      const trailLength = cfg.trailLength ?? 0.3

      // Ensure we have enough particles
      while (particlesRef.current.length < itemCount) {
        particlesRef.current.push(createParticle(width, height, cfg))
      }
      // Remove excess
      if (particlesRef.current.length > itemCount) {
        particlesRef.current.length = itemCount
      }

      // Draw background gradient
      const bgColor1 = colors[0] || '#1a1a2e'
      const bgColor2 = colors[1] || '#16213e'
      const grad = ctx.createLinearGradient(0, 0, 0, height)
      grad.addColorStop(0, bgColor1)
      grad.addColorStop(1, bgColor2)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      if (!isPausedRef.current) {
        // Update particles
        for (let i = 0; i < particlesRef.current.length; i++) {
          const p = particlesRef.current[i]

          if (p.canFly) {
            // Flying items go up continuously
            p.y -= p.speed * speed
            p.x += Math.sin(p.wobblePhase) * p.wobbleAmount * 0.02
            p.wobblePhase += p.wobbleSpeed * 0.02
            p.rotation += p.rotationSpeed

            // Reset when off screen top
            if (p.y < -p.size * 2) {
              particlesRef.current[i] = createParticle(width, height, cfg)
            }
          } else {
            // Grounded items rise then fall
            if (!p.falling) {
              p.y -= p.speed * speed * 0.8
              p.risen += p.speed * speed * 0.8
              p.x += Math.sin(p.wobblePhase) * p.wobbleAmount * 0.02
              p.wobblePhase += p.wobbleSpeed * 0.02

              if (p.risen >= p.maxRise) {
                p.falling = true
                p.fallSpeed = 0.5
              }
            } else {
              // Fall with acceleration
              p.fallSpeed += 0.15
              p.y += p.fallSpeed
              p.rotation += p.rotationSpeed * 3
              p.opacity = Math.max(0.2, p.opacity - 0.005)

              // Reset when off screen bottom
              if (p.y > height + p.size * 2) {
                particlesRef.current[i] = createParticle(width, height, cfg)
              }
            }
          }
        }
      }

      // Draw particles
      for (const p of particlesRef.current) {
        ctx.save()
        ctx.globalAlpha = p.opacity

        // Draw trail for flying items
        if (p.canFly && trailLength > 0) {
          const trailLen = p.size * trailLength * 3
          const trailGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + trailLen)
          const trailColor = colors[2] || colors[0] || '#e94560'
          trailGrad.addColorStop(0, trailColor + '60')
          trailGrad.addColorStop(1, trailColor + '00')
          ctx.fillStyle = trailGrad
          ctx.beginPath()
          ctx.ellipse(p.x, p.y + trailLen * 0.5, p.size * 0.15, trailLen * 0.5, 0, 0, Math.PI * 2)
          ctx.fill()
        }

        // Draw emoji
        ctx.translate(p.x, p.y)
        if (!p.canFly && p.falling) {
          ctx.rotate(p.rotation)
        }
        ctx.font = `${p.size}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(p.item.emoji, 0, 0)

        // Draw label
        if (showLabels) {
          const labelColor = p.canFly
            ? (colors[2] || '#4ade80')
            : (colors[3] || colors[0] || '#ef4444')
          ctx.font = `bold ${Math.max(10, p.size * 0.35)}px system-ui, sans-serif`
          ctx.fillStyle = labelColor
          ctx.globalAlpha = p.opacity * 0.9

          const labelText = `${p.item.name} ${p.canFly ? 'Udd!' : 'Dhapp!'}`
          // Text shadow for readability
          ctx.strokeStyle = 'rgba(0,0,0,0.5)'
          ctx.lineWidth = 2.5
          ctx.strokeText(labelText, 0, p.size * 0.65)
          ctx.fillText(labelText, 0, p.size * 0.65)
        }

        ctx.restore()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (canvas && container.contains(canvas)) container.removeChild(canvas)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="chidiya-udd-layer"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    >
      {flutedEnabled && canvasReady && canvasRef.current && (
        <FlutedGlassCanvas sourceCanvasRef={canvasRef} effectsConfig={effectsConfig} />
      )}
    </div>
  )
})

ChidiyaUddLayer.displayName = 'ChidiyaUddLayer'

export default ChidiyaUddLayer
