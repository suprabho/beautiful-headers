import { useRef, useEffect, useMemo, useState } from 'react'
import FlutedGlassCanvas from './FlutedGlassCanvas'

// Color cache for hex to HSL conversions
const hslCache = new Map()

// Convert hex color to HSL with caching
const hexToHsl = (hex) => {
  if (hslCache.has(hex)) return hslCache.get(hex)
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    const hsl = { h: 0, s: 0, l: 0 }
    hslCache.set(hex, hsl)
    return hsl
  }
  
  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
      default: h = 0
    }
  }

  const hsl = { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
  hslCache.set(hex, hsl)
  return hsl
}

// Darken a hex color
const darkenHex = (hex, amount = 0.7) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '#000000'
  
  const r = Math.round(parseInt(result[1], 16) * (1 - amount))
  const g = Math.round(parseInt(result[2], 16) * (1 - amount))
  const b = Math.round(parseInt(result[3], 16) * (1 - amount))
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// Helper functions
const getRandomInt = (min, max) => Math.round(Math.random() * (max - min)) + min

const fadeInOut = (t, m) => {
  const hm = 0.5 * m
  return Math.abs((t + hm) % m - hm) / hm
}

const AuroraLayer = ({ config, mousePos, paletteColors = [], effectsConfig }) => {
  const containerRef = useRef(null)
  const canvasARef = useRef(null)
  const canvasBRef = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const ctxARef = useRef(null)
  const ctxBRef = useRef(null)
  const linesRef = useRef([])
  const animationRef = useRef(null)
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 })
  const currentMouseRef = useRef({ x: 0.5, y: 0.5 })
  const isVisibleRef = useRef(true)
  
  // Store config values in refs to avoid animation restarts
  const configRef = useRef(config)
  const derivedColorsRef = useRef(null)

  // Derive colors from palette
  const derivedColors = useMemo(() => {
    if (!paletteColors || paletteColors.length === 0) {
      return null
    }
    
    const hues = paletteColors.map(color => hexToHsl(color).h)
    const minHue = Math.min(...hues)
    const maxHue = Math.max(...hues)
    
    const firstColor = paletteColors[0]
    const bgColor = darkenHex(firstColor, 0.85)
    
    return {
      hueStart: minHue,
      hueEnd: maxHue === minHue ? minHue + 60 : maxHue,
      backgroundColor: bgColor,
      hues: hues
    }
  }, [paletteColors])

  // Update refs when props change (doesn't restart animation)
  useEffect(() => {
    configRef.current = config
  }, [config])

  useEffect(() => {
    derivedColorsRef.current = derivedColors
  }, [derivedColors])

  useEffect(() => {
    targetMouseRef.current = mousePos
  }, [mousePos])

  // Animation setup - runs only once on mount
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create canvas A (offscreen for drawing)
    const canvasA = document.createElement('canvas')
    canvasARef.current = canvasA
    ctxARef.current = canvasA.getContext('2d')

    // Create canvas B (visible with blur)
    const canvasB = document.createElement('canvas')
    canvasB.style.cssText = 'position: absolute; left: 0; top: 0; width: 100%; height: 100%;'
    canvasBRef.current = canvasB
    ctxBRef.current = canvasB.getContext('2d')
    container.appendChild(canvasB)

    // Line class defined inside useEffect to capture current config via refs
    class Line {
      constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth
        this.canvasHeight = canvasHeight
        this.reset()
      }

      getHue() {
        const derived = derivedColorsRef.current
        const cfg = configRef.current
        
        if (derived?.hues && derived.hues.length > 0) {
          return derived.hues[Math.floor(Math.random() * derived.hues.length)]
        }
        
        const hueStart = cfg.hueStart ?? 120
        const hueEnd = cfg.hueEnd ?? 180
        return getRandomInt(hueStart, hueEnd)
      }

      reset() {
        const cfg = configRef.current
        const minWidth = cfg.minWidth ?? 10
        const maxWidth = cfg.maxWidth ?? 30
        const minHeight = cfg.minHeight ?? 200
        const maxHeight = cfg.maxHeight ?? 600
        const minTTL = cfg.minTTL ?? 100
        const maxTTL = cfg.maxTTL ?? 300
        
        this.x = getRandomInt(0, this.canvasWidth)
        this.y = this.canvasHeight / 2 + minHeight
        this.width = getRandomInt(minWidth, maxWidth)
        this.height = getRandomInt(minHeight, maxHeight)
        this.hue = this.getHue()
        this.ttl = getRandomInt(minTTL, maxTTL)
        this.life = 0
      }

      draw(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y - this.height, this.x, this.y)
        gradient.addColorStop(0, `hsla(${this.hue}, 100%, 65%, 0)`)
        gradient.addColorStop(0.5, `hsla(${this.hue}, 100%, 65%, ${fadeInOut(this.life, this.ttl)})`)
        gradient.addColorStop(1, `hsla(${this.hue}, 100%, 65%, 0)`)

        ctx.save()
        ctx.beginPath()
        ctx.strokeStyle = gradient
        ctx.lineWidth = this.width
        ctx.moveTo(this.x, this.y - this.height)
        ctx.lineTo(this.x, this.y)
        ctx.stroke()
        ctx.closePath()
        ctx.restore()
      }

      update() {
        const cfg = configRef.current
        const minWidth = cfg.minWidth ?? 10
        const maxWidth = cfg.maxWidth ?? 30
        const minHeight = cfg.minHeight ?? 200
        const maxHeight = cfg.maxHeight ?? 600
        const minTTL = cfg.minTTL ?? 100
        const maxTTL = cfg.maxTTL ?? 300
        
        this.life++
        if (this.life > this.ttl) {
          this.life = 0
          this.x = getRandomInt(0, this.canvasWidth)
          this.width = getRandomInt(minWidth, maxWidth)
          this.height = getRandomInt(minHeight, maxHeight)
          this.hue = this.getHue()
          this.ttl = getRandomInt(minTTL, maxTTL)
        }
      }
    }

    const initLines = (width, height) => {
      const cfg = configRef.current
      const minWidth = cfg.minWidth ?? 10
      const lineCount = cfg.lineCount ?? 0
      
      const count = lineCount > 0 ? lineCount : Math.floor(width / minWidth * 5)
      const lines = []
      for (let i = 0; i < count; i++) {
        lines.push(new Line(width, height))
      }
      return lines
    }

    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      canvasA.width = width
      canvasA.height = height

      if (canvasB.width && canvasB.height) {
        ctxARef.current.drawImage(canvasB, 0, 0)
      }

      canvasB.width = width
      canvasB.height = height

      if (canvasA.width && canvasA.height) {
        ctxBRef.current.drawImage(canvasA, 0, 0)
      }

      linesRef.current = initLines(width, height)
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

      const ctxA = ctxARef.current
      const ctxB = ctxBRef.current
      const canvasA = canvasARef.current
      const canvasB = canvasBRef.current
      const lines = linesRef.current

      if (!ctxA || !ctxB || !canvasA || !canvasB) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      // Read config values from refs
      const cfg = configRef.current
      const derived = derivedColorsRef.current
      
      const blurAmount = cfg.blurAmount ?? 13
      const decaySpeed = cfg.decaySpeed ?? 0.95
      const backgroundColor = derived?.backgroundColor ?? cfg.backgroundColor ?? '#000000'

      // Smooth mouse following
      const lerpFactor = 1 - decaySpeed
      currentMouseRef.current.x += (targetMouseRef.current.x - currentMouseRef.current.x) * lerpFactor
      currentMouseRef.current.y += (targetMouseRef.current.y - currentMouseRef.current.y) * lerpFactor

      // Clear canvas A
      ctxA.clearRect(0, 0, canvasA.width, canvasA.height)

      // Fill canvas B with background color
      ctxB.fillStyle = backgroundColor
      ctxB.fillRect(0, 0, canvasB.width, canvasB.height)

      // Update and draw lines
      for (let i = 0; i < lines.length; i++) {
        lines[i].update()
        lines[i].draw(ctxA)
      }

      // Apply blur and composite
      ctxB.save()
      ctxB.filter = `blur(${blurAmount}px)`
      ctxA.globalCompositeOperation = 'lighter'
      ctxB.drawImage(canvasA, 0, 0)
      ctxB.restore()

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (canvasB && container.contains(canvasB)) {
        container.removeChild(canvasB)
      }
    }
  }, []) // Empty deps - only runs on mount

  const flutedEnabled = effectsConfig?.flutedGlass?.enabled ?? false

  return (
    <div
      ref={containerRef}
      className="aurora-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
    >
      {flutedEnabled && canvasReady && canvasBRef.current && (
        <FlutedGlassCanvas 
          sourceCanvasRef={canvasBRef} 
          effectsConfig={effectsConfig}
        />
      )}
    </div>
  )
}

export default AuroraLayer
