import { useRef, useEffect, useCallback, useMemo, useState } from 'react'
import FlutedGlassCanvas from './FlutedGlassCanvas'

// Convert hex color to HSL
const hexToHsl = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { h: 0, s: 0, l: 0 }
  
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

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
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

  // Derive hues from palette colors if useGradientColors is enabled
  const derivedColors = useMemo(() => {
    if (!config.useGradientColors || !paletteColors || paletteColors.length === 0) {
      return null
    }
    
    const hues = paletteColors.map(color => hexToHsl(color).h)
    const minHue = Math.min(...hues)
    const maxHue = Math.max(...hues)
    
    // Use the darkest color or derive a dark background from the first color
    const firstColor = paletteColors[0]
    const bgColor = darkenHex(firstColor, 0.85)
    
    return {
      hueStart: minHue,
      hueEnd: maxHue === minHue ? minHue + 60 : maxHue, // Ensure there's some range
      backgroundColor: bgColor,
      // Store all hues for random selection
      hues: hues
    }
  }, [config.useGradientColors, paletteColors])

  // Config defaults with user overrides (or derived from palette)
  const minWidth = config.minWidth ?? 10
  const maxWidth = config.maxWidth ?? 30
  const minHeight = config.minHeight ?? 200
  const maxHeight = config.maxHeight ?? 600
  const minTTL = config.minTTL ?? 100
  const maxTTL = config.maxTTL ?? 300
  const blurAmount = config.blurAmount ?? 13
  const hueStart = derivedColors?.hueStart ?? config.hueStart ?? 120
  const hueEnd = derivedColors?.hueEnd ?? config.hueEnd ?? 180
  const backgroundColor = derivedColors?.backgroundColor ?? config.backgroundColor ?? '#000000'
  const lineCount = config.lineCount ?? 0 // 0 = auto-calculate
  const paletteHues = derivedColors?.hues ?? null

  const getRandomInt = (min, max) => {
    return Math.round(Math.random() * (max - min)) + min
  }

  const fadeInOut = (t, m) => {
    const hm = 0.5 * m
    return Math.abs((t + hm) % m - hm) / hm
  }

  // Get a hue value - either from palette or random range
  const getHue = () => {
    if (paletteHues && paletteHues.length > 0) {
      // Pick a random hue from the palette
      return paletteHues[Math.floor(Math.random() * paletteHues.length)]
    }
    return getRandomInt(hueStart, hueEnd)
  }

  class Line {
    constructor(canvasWidth, canvasHeight) {
      this.canvasWidth = canvasWidth
      this.canvasHeight = canvasHeight
      this.reset()
    }

    reset() {
      this.x = getRandomInt(0, this.canvasWidth)
      this.y = this.canvasHeight / 2 + minHeight
      this.width = getRandomInt(minWidth, maxWidth)
      this.height = getRandomInt(minHeight, maxHeight)
      this.hue = getHue()
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
      this.life++
      if (this.life > this.ttl) {
        this.life = 0
        this.x = getRandomInt(0, this.canvasWidth)
        this.width = getRandomInt(minWidth, maxWidth)
        this.height = getRandomInt(minHeight, maxHeight)
        this.hue = getHue()
        this.ttl = getRandomInt(minTTL, maxTTL)
      }
    }
  }

  const initLines = useCallback((width) => {
    const count = lineCount > 0 ? lineCount : Math.floor(width / minWidth * 5)
    const lines = []
    const height = window.innerHeight
    for (let i = 0; i < count; i++) {
      lines.push(new Line(width, height))
    }
    return lines
  }, [lineCount, minWidth, minHeight, maxHeight, minTTL, maxTTL, hueStart, hueEnd])

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

    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      // Preserve current state when resizing
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

      // Reinitialize lines on resize
      linesRef.current = initLines(width)
    }

    handleResize()
    setCanvasReady(true)
    window.addEventListener('resize', handleResize)

    const animate = () => {
      const ctxA = ctxARef.current
      const ctxB = ctxBRef.current
      const canvasA = canvasARef.current
      const canvasB = canvasBRef.current
      const lines = linesRef.current

      if (!ctxA || !ctxB || !canvasA || !canvasB) return

      // Smooth mouse following
      const lerpFactor = 1 - (config.decaySpeed ?? 0.95)
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (canvasB && container.contains(canvasB)) {
        container.removeChild(canvasB)
      }
    }
  }, [config, initLines, backgroundColor, blurAmount])

  useEffect(() => {
    targetMouseRef.current = mousePos
  }, [mousePos])

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

