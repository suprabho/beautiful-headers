import { useRef, useEffect, useCallback, useMemo } from 'react'

// Convert hex to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 }
}

// Interpolate between colors
const interpolateColor = (color1, color2, factor) => {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  return {
    r: Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor),
    g: Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor),
    b: Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor),
  }
}

// Get gradient color from array of colors
const getGradientColor = (colors, t) => {
  if (!colors || colors.length === 0) return { r: 255, g: 255, b: 255 }
  if (colors.length === 1) return hexToRgb(colors[0])
  
  const scaledT = t * (colors.length - 1)
  const index = Math.floor(scaledT)
  const localT = scaledT - index
  
  if (index >= colors.length - 1) return hexToRgb(colors[colors.length - 1])
  
  return interpolateColor(colors[index], colors[index + 1], localT)
}

// Darken a color
const darkenColor = (hex, amount = 0.7) => {
  const rgb = hexToRgb(hex)
  return {
    r: Math.round(rgb.r * (1 - amount)),
    g: Math.round(rgb.g * (1 - amount)),
    b: Math.round(rgb.b * (1 - amount)),
  }
}

const BlobLayer = ({ config, mousePos, paletteColors = [] }) => {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const offscreenCanvasRef = useRef(null)
  const animationRef = useRef(null)
  const timeRef = useRef(0)
  const blobsRef = useRef([])
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 })
  const currentMouseRef = useRef({ x: 0.5, y: 0.5 })

  // Config values with defaults
  const blobCount = config.blobCount ?? 5
  const minRadius = config.minRadius ?? 40
  const maxRadius = config.maxRadius ?? 120
  const speed = config.speed ?? 0.5
  const orbitRadius = config.orbitRadius ?? 100
  const blurAmount = config.blurAmount ?? 12
  const threshold = config.threshold ?? 180
  const useGradientColors = config.useGradientColors ?? true
  const mouseInfluence = config.mouseInfluence ?? 0.3
  const decaySpeed = config.decaySpeed ?? 0.95

  // Derive colors from palette
  const colors = useMemo(() => {
    if (useGradientColors && paletteColors && paletteColors.length > 0) {
      return paletteColors
    }
    return config.colors || ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0']
  }, [useGradientColors, paletteColors, config.colors])

  // Background color derived from first color or config
  const backgroundColor = useMemo(() => {
    if (useGradientColors && paletteColors && paletteColors.length > 0) {
      return darkenColor(paletteColors[0], 0.85)
    }
    const rgb = hexToRgb(config.backgroundColor || '#1a1a2e')
    return rgb
  }, [useGradientColors, paletteColors, config.backgroundColor])

  // Initialize blobs
  const initBlobs = useCallback((width, height) => {
    const blobs = []
    const centerX = width / 2
    const centerY = height / 2
    
    for (let i = 0; i < blobCount; i++) {
      const angle = (i / blobCount) * Math.PI * 2
      const radius = minRadius + Math.random() * (maxRadius - minRadius)
      const orbitOffset = orbitRadius * (0.5 + Math.random() * 0.5)
      const speedMultiplier = 0.5 + Math.random() * 1.0
      const phaseOffset = Math.random() * Math.PI * 2
      
      blobs.push({
        baseX: centerX,
        baseY: centerY,
        x: centerX + Math.cos(angle) * orbitOffset,
        y: centerY + Math.sin(angle) * orbitOffset,
        radius,
        orbitRadius: orbitOffset,
        angle,
        speedMultiplier,
        phaseOffset,
        colorIndex: i / blobCount,
      })
    }
    
    return blobs
  }, [blobCount, minRadius, maxRadius, orbitRadius])

  // Update blob positions
  const updateBlobs = useCallback((blobs, time, width, height, mouse) => {
    const centerX = width / 2
    const centerY = height / 2
    
    // Mouse offset from center (normalized)
    const mouseOffsetX = (mouse.x - 0.5) * width * mouseInfluence
    const mouseOffsetY = (mouse.y - 0.5) * height * mouseInfluence
    
    for (let i = 0; i < blobs.length; i++) {
      const blob = blobs[i]
      const angle = blob.angle + time * speed * blob.speedMultiplier + blob.phaseOffset
      
      // Add some wobble
      const wobble = Math.sin(time * 2 + blob.phaseOffset) * 20
      
      blob.x = centerX + Math.cos(angle) * (blob.orbitRadius + wobble) + mouseOffsetX * blob.speedMultiplier
      blob.y = centerY + Math.sin(angle) * (blob.orbitRadius + wobble) + mouseOffsetY * blob.speedMultiplier
    }
  }, [speed, mouseInfluence])

  // Apply metaball/gooey effect
  const applyMetaballEffect = useCallback((ctx, offCtx, width, height) => {
    // Get image data from offscreen canvas (blurred blobs)
    const imageData = offCtx.getImageData(0, 0, width, height)
    const data = imageData.data
    
    // Apply threshold to create metaball effect
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3]
      if (alpha > threshold) {
        // Keep the pixel fully opaque
        data[i + 3] = 255
      } else if (alpha > threshold * 0.5) {
        // Smooth transition
        data[i + 3] = Math.round((alpha - threshold * 0.5) / (threshold * 0.5) * 255)
      } else {
        // Make transparent
        data[i + 3] = 0
      }
    }
    
    ctx.putImageData(imageData, 0, 0)
  }, [threshold])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create main canvas
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position: absolute; left: 0; top: 0; width: 100%; height: 100%;'
    canvasRef.current = canvas
    container.appendChild(canvas)

    // Create offscreen canvas for blur processing
    const offscreenCanvas = document.createElement('canvas')
    offscreenCanvasRef.current = offscreenCanvas

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const offCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true })

    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      canvas.width = width
      canvas.height = height
      offscreenCanvas.width = width
      offscreenCanvas.height = height
      
      // Reinitialize blobs on resize
      blobsRef.current = initBlobs(width, height)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    const animate = () => {
      const width = canvas.width
      const height = canvas.height
      const blobs = blobsRef.current

      if (!ctx || !offCtx || blobs.length === 0) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      timeRef.current += 0.016

      // Smooth mouse following
      const lerpFactor = 1 - decaySpeed
      currentMouseRef.current.x += (targetMouseRef.current.x - currentMouseRef.current.x) * lerpFactor
      currentMouseRef.current.y += (targetMouseRef.current.y - currentMouseRef.current.y) * lerpFactor

      // Update blob positions
      updateBlobs(blobs, timeRef.current, width, height, currentMouseRef.current)

      // Clear offscreen canvas with transparency
      offCtx.clearRect(0, 0, width, height)

      // Draw blobs to offscreen canvas
      for (let i = 0; i < blobs.length; i++) {
        const blob = blobs[i]
        const color = getGradientColor(colors, blob.colorIndex)
        
        offCtx.beginPath()
        offCtx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2)
        offCtx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`
        offCtx.fill()
      }

      // Apply blur to offscreen canvas
      // Apply blur using filter
      offCtx.filter = `blur(${blurAmount}px)`
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = width
      tempCanvas.height = height
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })
      tempCtx.drawImage(offscreenCanvas, 0, 0)
      
      offCtx.clearRect(0, 0, width, height)
      offCtx.drawImage(tempCanvas, 0, 0)
      offCtx.filter = 'none'

      // Draw background
      ctx.fillStyle = `rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b})`
      ctx.fillRect(0, 0, width, height)

      // Apply metaball effect and draw to main canvas
      applyMetaballEffect(ctx, offCtx, width, height)

      // Create gradient overlay for the blobs
      const gradientCanvas = document.createElement('canvas')
      gradientCanvas.width = width
      gradientCanvas.height = height
      const gradCtx = gradientCanvas.getContext('2d', { willReadFrequently: true })

      // Create diagonal gradient
      const gradient = gradCtx.createLinearGradient(0, 0, width, height)
      colors.forEach((color, index) => {
        gradient.addColorStop(index / (colors.length - 1 || 1), color)
      })
      gradCtx.fillStyle = gradient
      gradCtx.fillRect(0, 0, width, height)

      // Use the metaball shape as a mask for the gradient
      const metaballData = ctx.getImageData(0, 0, width, height)
      const gradientData = gradCtx.getImageData(0, 0, width, height)

      // Clear and redraw background
      ctx.fillStyle = `rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b})`
      ctx.fillRect(0, 0, width, height)

      // Composite: only show gradient where metaballs are
      for (let i = 0; i < metaballData.data.length; i += 4) {
        const alpha = metaballData.data[i + 3] / 255
        if (alpha > 0) {
          metaballData.data[i] = gradientData.data[i]
          metaballData.data[i + 1] = gradientData.data[i + 1]
          metaballData.data[i + 2] = gradientData.data[i + 2]
          metaballData.data[i + 3] = 255
        } else {
          metaballData.data[i] = backgroundColor.r
          metaballData.data[i + 1] = backgroundColor.g
          metaballData.data[i + 2] = backgroundColor.b
          metaballData.data[i + 3] = 255
        }
      }

      ctx.putImageData(metaballData, 0, 0)

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
  }, [config, initBlobs, updateBlobs, applyMetaballEffect, colors, backgroundColor, blurAmount, decaySpeed])

  // Update blob parameters when config changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      blobsRef.current = initBlobs(canvas.width, canvas.height)
    }
  }, [blobCount, minRadius, maxRadius, orbitRadius, initBlobs])

  useEffect(() => {
    targetMouseRef.current = mousePos
  }, [mousePos])

  return (
    <div
      ref={containerRef}
      className="blob-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
    />
  )
}

export default BlobLayer

