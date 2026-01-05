import { useRef, useEffect, useMemo, useState } from 'react'
import FlutedGlassCanvas from './FlutedGlassCanvas'

const FluidGradientLayer = ({ config, paletteColors = [], effectsConfig }) => {
  const {
    backgroundColor = '#1C89FF',
    useGradientColors = true,
    colors = ['#71ECFF', '#39F58A', '#71ECFF', '#F0CBA8'],
    speed = 1,
    intensity = 0.5,
    blurAmount = 0,
  } = config

  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const animationRef = useRef(null)
  const timeRef = useRef(0)

  const flutedEnabled = effectsConfig?.flutedGlass?.enabled ?? false

  // Determine which colors to use
  const gradientColors = useMemo(() => {
    if (useGradientColors && paletteColors.length >= 4) {
      return paletteColors.slice(0, 4)
    }
    if (useGradientColors && paletteColors.length >= 2) {
      const repeated = []
      for (let i = 0; i < 4; i++) {
        repeated.push(paletteColors[i % paletteColors.length])
      }
      return repeated
    }
    return colors
  }, [useGradientColors, paletteColors, colors])

  // Get background color
  const bgColor = useMemo(() => {
    if (useGradientColors && paletteColors.length > 0) {
      return paletteColors[0]
    }
    return backgroundColor
  }, [useGradientColors, paletteColors, backgroundColor])

  // Convert hex to rgba
  const hexToRgba = (hex, alpha = 1) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return `rgba(0, 0, 0, ${alpha})`
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create canvas
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position: absolute; left: 0; top: 0; width: 100%; height: 100%;'
    canvasRef.current = canvas
    container.appendChild(canvas)

    const ctx = canvas.getContext('2d')

    // Animation configuration matching original SVG behavior
    // Each layer has: x oscillation, y oscillation, rotation, and focal point animation
    // Duration values from original SVG (will be divided by speed)
    const layers = [
      {
        // Rect 1: x: 25%→0%→25%, y: 0%→25%→0%, rotation: 0→360
        xBase: 0.25, xRange: 0.25, xDur: 20,
        yBase: 0, yRange: 0.25, yDur: 21,
        rotDur: 17, rotDir: 1,
        fxBase: 0.1, fxDur: 34  // fx animated 0%→3%→0%
      },
      {
        // Rect 2: x: -25%→0%→-25%, y: 0%→50%→0%, rotation: 0→360
        xBase: -0.25, xRange: 0.25, xDur: 23,
        yBase: 0, yRange: 0.50, yDur: 24,
        rotDur: 18, rotDir: 1,
        fxBase: 0.1, fxDur: 23.5
      },
      {
        // Rect 3: x: 0%→25%→0%, y: 0%→25%→0%, rotation: 360→0 (reverse)
        xBase: 0, xRange: 0.25, xDur: 25,
        yBase: 0, yRange: 0.25, yDur: 26,
        rotDur: 19, rotDir: -1,
        fxBase: 0.5, fxDur: 21.5
      },
      {
        // Rect 4: x: 25%→50%→25%, y: 25%→0%→25%, rotation: 0→360
        xBase: 0.25, xRange: 0.25, xDur: 22,
        yBase: 0.25, yRange: -0.25, yDur: 27,
        rotDur: 20, rotDir: 1,
        fxBase: 0.9, fxDur: 28
      }
    ]

    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = width
      canvas.height = height
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

      // Clear and fill background
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)

      const time = timeRef.current
      const size = Math.max(width, height)
      // Gradient radius as proportion of canvas (intensity controls this)
      const gradientRadius = size * intensity

      // Draw each gradient layer
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i]
        const color = gradientColors[i % gradientColors.length]

        // Calculate oscillating x and y offsets (matching SVG animation pattern)
        // SVG used values like "25%;0%;25%" which oscillates
        const xOffset = (layer.xBase + Math.sin(time * (Math.PI * 2 / layer.xDur)) * layer.xRange) * width
        const yOffset = (layer.yBase + Math.sin(time * (Math.PI * 2 / layer.yDur)) * layer.yRange) * height

        // Calculate rotation (continuous)
        const rotation = (time / layer.rotDur) * Math.PI * 2 * layer.rotDir

        // Animated focal point offset (fx animation: 0%→3%→0%)
        const fxOffset = Math.sin(time * (Math.PI * 2 / layer.fxDur)) * 0.03 * gradientRadius

        ctx.save()

        // Transform: translate to center, rotate, translate back, then apply layer offset
        const centerX = width / 2
        const centerY = height / 2

        ctx.translate(centerX, centerY)
        ctx.rotate(rotation)
        ctx.translate(-centerX + xOffset, -centerY + yOffset)

        // Create radial gradient centered on canvas
        // The gradient has an offset focal point (fx, fy in SVG)
        const gradient = ctx.createRadialGradient(
          centerX + fxOffset, centerY, 0,  // Focal point (inner circle) - animated fx
          centerX, centerY, gradientRadius  // Outer circle
        )

        // Color stops matching SVG: solid color at center, transparent at edge
        gradient.addColorStop(0, hexToRgba(color, 1))
        gradient.addColorStop(1, hexToRgba(color, 0))

        // Fill the entire transformed area
        ctx.fillStyle = gradient
        ctx.fillRect(-width, -height, width * 3, height * 3)

        ctx.restore()
      }

      // Apply blur if specified
      if (blurAmount > 0) {
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = width
        tempCanvas.height = height
        const tempCtx = tempCanvas.getContext('2d')

        tempCtx.filter = `blur(${blurAmount}px)`
        tempCtx.drawImage(canvas, 0, 0)

        ctx.clearRect(0, 0, width, height)
        ctx.drawImage(tempCanvas, 0, 0)
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
  }, [bgColor, gradientColors, speed, intensity, blurAmount])

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
}

export default FluidGradientLayer
