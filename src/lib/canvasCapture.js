import html2canvas from 'html2canvas'
import { prepareForCapture } from '@/lib/colorConversion'

const TEXT_FONT_FAMILIES = {
  'sans-serif': "'Manrope', sans-serif",
  'serif': "'Playfair Display', serif",
  'mono': "'Space Grotesk', monospace",
  'scribble': "'Pacifico', cursive",
}

/**
 * Draw text sections directly onto the canvas at absolute positions
 * computed from font sizes and the configured gap — no animation pausing needed.
 */
const drawTextToCanvas = (ctx, canvasWidth, canvasHeight, textData, scale) => {
  const { sections, gap, color = '#ffffff', opacity = 1 } = textData
  if (!sections?.length) return

  // Match TextLayer.jsx responsive breakpoints
  const viewportWidth = canvasWidth / scale
  let responsiveScale = 1
  if (viewportWidth <= 480) responsiveScale = 0.35
  else if (viewportWidth <= 768) responsiveScale = 0.65
  else if (viewportWidth <= 1024) responsiveScale = 0.85

  const getResponsiveFontSize = (baseSize) =>
    responsiveScale < 1 ? Math.max(14, Math.round(baseSize * responsiveScale)) : baseSize

  const scaledGap = Math.round(gap * responsiveScale) * scale

  // Parse hex colour for shadow rgba values
  const cleaned = (color || '#ffffff').replace('#', '').trim()
  const rgb = {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16),
  }

  // Measure each section so we know the total block height
  const sectionMetrics = sections.map((section) => {
    const fontSize = getResponsiveFontSize(section.size) * scale
    const fontFamily = TEXT_FONT_FAMILIES[section.font] || TEXT_FONT_FAMILIES['sans-serif']
    const fontStyle = section.italic ? 'italic' : 'normal'
    const letterSpacingPx = section.spacing * fontSize // em → px
    const lineHeight = fontSize * 1.2 // approximate default line-height

    return { section, fontSize, fontFamily, fontStyle, letterSpacingPx, lineHeight }
  })

  const totalHeight =
    sectionMetrics.reduce((sum, m) => sum + m.lineHeight, 0) +
    (sectionMetrics.length - 1) * scaledGap

  // Draw text + shadows onto an offscreen canvas, then composite with 'difference'
  const offscreen = document.createElement('canvas')
  offscreen.width = canvasWidth
  offscreen.height = canvasHeight
  const offCtx = offscreen.getContext('2d')

  offCtx.globalAlpha = opacity
  offCtx.textAlign = 'center'
  offCtx.textBaseline = 'top'

  let currentY = (canvasHeight - totalHeight) / 2

  sectionMetrics.forEach(({ section, fontSize, fontFamily, fontStyle, letterSpacingPx, lineHeight }) => {
    offCtx.font = `${fontStyle} ${section.weight} ${fontSize}px ${fontFamily}`
    if ('letterSpacing' in offCtx) {
      offCtx.letterSpacing = `${letterSpacingPx}px`
    }
    offCtx.fillStyle = color

    const x = canvasWidth / 2
    const textY = currentY + (lineHeight - fontSize) / 2

    // Combined shadow approximating the CSS text-shadow stack
    offCtx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`
    offCtx.shadowBlur = 40 * scale
    offCtx.shadowOffsetX = 0
    offCtx.shadowOffsetY = 2 * scale
    offCtx.fillText(section.text, x, textY)

    offCtx.shadowColor = 'transparent'
    offCtx.shadowBlur = 0
    offCtx.shadowOffsetY = 0

    currentY += lineHeight + scaledGap
  })

  // Composite with mix-blend-mode: difference (matches TextLayer)
  ctx.save()
  ctx.globalCompositeOperation = 'difference'
  ctx.drawImage(offscreen, 0, 0)
  ctx.restore()
}

/**
 * Draw texture patterns directly to a canvas context.
 */
export const drawTextureToCanvas = (ctx, width, height, textureType, textureSize, textureOpacity, blendMode) => {
  if (textureType === 'none') return

  const textureCanvas = document.createElement('canvas')
  textureCanvas.width = width
  textureCanvas.height = height
  const textureCtx = textureCanvas.getContext('2d')

  const lineWidth = Math.max(1, textureSize * 0.1)
  const dotSize = Math.max(1, textureSize * 0.15)

  switch (textureType) {
    case 'grain': {
      const imageData = textureCtx.createImageData(width, height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255
        data[i] = value
        data[i + 1] = value
        data[i + 2] = value
        data[i + 3] = 255
      }
      textureCtx.putImageData(imageData, 0, 0)
      break
    }
    case 'scanlines': {
      textureCtx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      for (let y = 0; y < height; y += textureSize) {
        textureCtx.fillRect(0, y + textureSize - lineWidth, width, lineWidth)
      }
      break
    }
    case 'dots': {
      textureCtx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      for (let y = dotSize; y < height; y += textureSize) {
        for (let x = dotSize; x < width; x += textureSize) {
          textureCtx.beginPath()
          textureCtx.arc(x, y, dotSize, 0, Math.PI * 2)
          textureCtx.fill()
        }
      }
      break
    }
    case 'grid': {
      textureCtx.fillStyle = 'rgba(255, 255, 255, 0.15)'
      for (let y = 0; y < height; y += textureSize) {
        textureCtx.fillRect(0, y, width, lineWidth)
      }
      for (let x = 0; x < width; x += textureSize) {
        textureCtx.fillRect(x, 0, lineWidth, height)
      }
      break
    }
    case 'diagonal': {
      textureCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      textureCtx.lineWidth = lineWidth
      const spacing = textureSize + lineWidth
      const totalDiagonals = Math.ceil((width + height) / spacing)
      for (let i = -Math.ceil(height / spacing); i < totalDiagonals; i++) {
        const startX = i * spacing
        textureCtx.beginPath()
        textureCtx.moveTo(startX, height)
        textureCtx.lineTo(startX + height, 0)
        textureCtx.stroke()
      }
      break
    }
  }

  ctx.save()
  ctx.globalAlpha = textureOpacity
  ctx.globalCompositeOperation = blendMode
  ctx.drawImage(textureCanvas, 0, 0)
  ctx.restore()
}

/**
 * Draw a vignette effect to a canvas context.
 */
export const drawVignetteToCanvas = (ctx, width, height, intensity) => {
  if (intensity <= 0) return

  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) * 0.7
  )
  gradient.addColorStop(0, 'transparent')
  gradient.addColorStop(0.3, 'transparent')
  gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity})`)

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

/**
 * Resize a base64 image for AI API calls (smaller to avoid 413 errors).
 */
export const resizeThumbnailForAI = (base64Data, maxWidth = 800) => {
  return new Promise((resolve) => {
    const img = document.createElement('img')
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, maxWidth / img.width)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      // Use JPEG at 70% quality for much smaller file size
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => resolve(base64Data) // Fallback to original if resize fails
    img.src = base64Data
  })
}

/**
 * Capture the layers container to a canvas.
 * Returns the canvas element — callers can do toDataURL or toBlob as needed.
 *
 * @param {HTMLElement} container - The layers container DOM element
 * @param {object} effectsConfig - The effects configuration
 * @param {object} options - { scale, mode }
 *   - scale: Resolution multiplier (default 2)
 *   - mode: 'all' captures tessellation + text layers, 'background' skips them
 *   - textData: { sections, gap, color, opacity } — when provided, text is drawn
 *     at absolute positions computed from row sizes + gap instead of capturing the DOM
 */
export const captureLayersToCanvas = async (container, effectsConfig, { scale = 2, mode = 'all', targetAspectRatio = null, textData = null } = {}) => {
  const width = container.offsetWidth
  const height = container.offsetHeight

  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = width * scale
  outputCanvas.height = height * scale
  const ctx = outputCanvas.getContext('2d')

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height)

  // For layers with separate FlutedGlassCanvas overlay (fluid, aurora, waves),
  // we need to grab the LAST canvas (fluted glass if enabled, or base canvas)
  // GradientLayer has fluted glass built into its shader, so only has one canvas
  const getLastCanvas = (selector) => {
    const canvases = container.querySelectorAll(`${selector} canvas`)
    return canvases.length > 0 ? canvases[canvases.length - 1] : null
  }

  const backgroundCanvas =
    container.querySelector('.gradient-layer canvas') ||
    getLastCanvas('.simple-gradient-layer') ||
    getLastCanvas('.fluid-gradient-layer') ||
    getLastCanvas('.aurora-layer') ||
    getLastCanvas('.waves-layer') ||
    getLastCanvas('.ribbon-layer') ||
    getLastCanvas('.dandelion-layer') ||
    getLastCanvas('.particle-ring-layer') ||
    getLastCanvas('.shape-trail-layer')

  if (backgroundCanvas) {
    const wrapper = container.querySelector('.gradient-effects-wrapper')
    const filterStyle = wrapper ? getComputedStyle(wrapper).filter : 'none'
    ctx.filter = filterStyle !== 'none' ? filterStyle : 'none'
    ctx.drawImage(backgroundCanvas, 0, 0, outputCanvas.width, outputCanvas.height)
    ctx.filter = 'none'
  }

  drawTextureToCanvas(
    ctx,
    outputCanvas.width,
    outputCanvas.height,
    effectsConfig.texture,
    effectsConfig.textureSize * scale,
    effectsConfig.textureOpacity,
    effectsConfig.textureBlendMode
  )

  drawVignetteToCanvas(ctx, outputCanvas.width, outputCanvas.height, effectsConfig.vignetteIntensity)

  if (mode === 'all') {
    const tessellationLayer = container.querySelector('.tessellation-layer')
    if (tessellationLayer) {
      const tessCanvas = await html2canvas(tessellationLayer, {
        useCORS: true,
        allowTaint: true,
        scale: scale,
        backgroundColor: null,
        logging: false,
      })
      ctx.drawImage(tessCanvas, 0, 0, outputCanvas.width, outputCanvas.height)
    }

    // Draw text at absolute positions computed from row sizes + gap.
    // This avoids the fragile animation-pause approach and produces
    // deterministic spacing regardless of the float-animation cycle.
    if (textData?.sections?.length) {
      drawTextToCanvas(ctx, outputCanvas.width, outputCanvas.height, textData, scale)
    }
  }

  // Crop to target aspect ratio if specified (center crop)
  if (targetAspectRatio) {
    const srcW = outputCanvas.width
    const srcH = outputCanvas.height
    const currentRatio = srcW / srcH

    let cropX = 0, cropY = 0, cropW = srcW, cropH = srcH
    if (currentRatio > targetAspectRatio) {
      // Too wide — crop sides
      cropW = Math.round(srcH * targetAspectRatio)
      cropX = Math.round((srcW - cropW) / 2)
    } else if (currentRatio < targetAspectRatio) {
      // Too tall — crop top/bottom
      cropH = Math.round(srcW / targetAspectRatio)
      cropY = Math.round((srcH - cropH) / 2)
    }

    const croppedCanvas = document.createElement('canvas')
    croppedCanvas.width = cropW
    croppedCanvas.height = cropH
    const croppedCtx = croppedCanvas.getContext('2d')
    croppedCtx.drawImage(outputCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
    return croppedCanvas
  }

  return outputCanvas
}
