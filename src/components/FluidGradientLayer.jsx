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

    // 4 circles with varying radii, each with a radial gradient
    // Gradient goes from one edge (full opacity) to opposite edge (0 opacity)
    // Circles are translated and rotated
    const circles = [
      {
        // Circle 1: cyan, large
        radius: 0.5,  // 50% of viewport
        xValues: [0.25, 0, 0.25], xDur: 20,
        yValues: [0, 0.25, 0], yDur: 21,
        rotDir: 1, rotDur: 17,
        color: '#71ECFF'
      },
      {
        // Circle 2: green, medium-large
        radius: 0.45,
        xValues: [-0.25, 0, -0.25], xDur: 23,
        yValues: [0, 0.50, 0], yDur: 24,
        rotDir: 1, rotDur: 18,
        color: '#39F58A'
      },
      {
        // Circle 3: cyan, medium
        radius: 0.4,
        xValues: [0, 0.25, 0], xDur: 25,
        yValues: [0, 0.25, 0], yDur: 26,
        rotDir: -1, rotDur: 19,  // Reverse rotation
        color: '#71ECFF'
      },
      {
        // Circle 4: peach/orange, smaller
        radius: 0.35,
        xValues: [0.25, 0.50, 0.25], xDur: 22,
        yValues: [0.25, 0, 0.25], yDur: 27,
        rotDir: 1, rotDur: 20,
        color: '#F0CBA8'
      }
    ]

    // Helper: interpolate values array based on time (0→1→0 pattern for "a;b;a" animation)
    const interpolateValues = (values, progress) => {
      // SVG values="a;b;a" means: start at a, go to b at 50%, return to a at 100%
      const t = progress % 1
      if (t < 0.5) {
        // First half: interpolate from values[0] to values[1]
        return values[0] + (values[1] - values[0]) * (t * 2)
      } else {
        // Second half: interpolate from values[1] to values[2]
        return values[1] + (values[2] - values[1]) * ((t - 0.5) * 2)
      }
    }

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
      
      // Base size for calculations
      const size = Math.max(width, height)
      const centerX = width / 2
      const centerY = height / 2

      // Draw each circle with its own radial gradient
      for (let i = 0; i < circles.length; i++) {
        const circle = circles[i]
        const color = gradientColors[i % gradientColors.length] || circle.color

        // Circle radius scaled by intensity
        const circleRadius = size * circle.radius * intensity

        // Calculate position animation (oscillating x and y)
        const xProgress = time / circle.xDur
        const yProgress = time / circle.yDur
        const offsetX = interpolateValues(circle.xValues, xProgress) * width
        const offsetY = interpolateValues(circle.yValues, yProgress) * height

        // Calculate rotation angle (continuous rotation)
        const rotation = (time / circle.rotDur) * Math.PI * 2 * circle.rotDir

        // Circle center position (centered + offset)
        const circleCenterX = centerX + offsetX
        const circleCenterY = centerY + offsetY

        ctx.save()

        // Translate to circle center, rotate, then translate back
        // This rotates the gradient direction within the circle
        ctx.translate(circleCenterX, circleCenterY)
        ctx.rotate(rotation)
        ctx.translate(-circleCenterX, -circleCenterY)

        // Create radial gradient from one edge to the opposite edge:
        // - Focal point (start) at left edge of circle: (cx - radius, cy)
        // - Center at circle center, radius extends to right edge
        // This creates a gradient that goes from left edge (full color) to right edge (transparent)
        const gradient = ctx.createRadialGradient(
          circleCenterX - circleRadius, circleCenterY, 0,  // Start at left edge (point)
          circleCenterX, circleCenterY, circleRadius * 2   // Extend through center to right edge (diameter)
        )

        // Color stops: full opacity at start edge, transparent at opposite edge
        gradient.addColorStop(0, hexToRgba(color, 1))
        gradient.addColorStop(0.5, hexToRgba(color, 0.5))  // Half opacity at center
        gradient.addColorStop(1, hexToRgba(color, 0))

        // Draw the circle
        ctx.beginPath()
        ctx.arc(circleCenterX, circleCenterY, circleRadius, 0, Math.PI * 2)
        ctx.closePath()

        ctx.fillStyle = gradient
        ctx.fill()

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
