import html2canvas from 'html2canvas'

const TEXT_FONT_FAMILIES = {
  'sans-serif': "'Manrope', sans-serif",
  'serif': "'Playfair Display', serif",
  'mono': "'Space Grotesk', monospace",
  'scribble': "'Petit Formal Script', cursive",
}

/**
 * Draw text sections directly onto the canvas at absolute positions
 * computed from font sizes and the configured gap — no animation pausing needed.
 */
export const drawTextToCanvas = (ctx, canvasWidth, canvasHeight, textData, scale) => {
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

  // Manual difference blend — canvas globalCompositeOperation='difference'
  // does not match CSS mix-blend-mode:difference in all browsers, so we
  // compute the blend per-pixel.  Opacity is already baked into the
  // offscreen pixel alpha via offCtx.globalAlpha, so we use it directly.
  const backdrop = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
  const bd = backdrop.data
  const textImg = offCtx.getImageData(0, 0, canvasWidth, canvasHeight)
  const tp = textImg.data

  for (let i = 0; i < bd.length; i += 4) {
    const srcA = tp[i + 3]
    if (srcA === 0) continue
    const a = srcA / 255 // opacity already included
    bd[i]     = Math.round(a * Math.abs(bd[i]     - tp[i])     + (1 - a) * bd[i])
    bd[i + 1] = Math.round(a * Math.abs(bd[i + 1] - tp[i + 1]) + (1 - a) * bd[i + 1])
    bd[i + 2] = Math.round(a * Math.abs(bd[i + 2] - tp[i + 2]) + (1 - a) * bd[i + 2])
  }

  ctx.putImageData(backdrop, 0, 0)
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
export const captureLayersToCanvas = async (container, effectsConfig, { scale = 2, mode = 'all', targetAspectRatio = null, textData = null, hideIcons = false, hideText = false } = {}) => {
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
    effectsConfig.texture || 'none',
    (effectsConfig.textureSize || 20) * scale,
    effectsConfig.textureOpacity ?? 0.5,
    effectsConfig.textureBlendMode || 'overlay'
  )

  drawVignetteToCanvas(ctx, outputCanvas.width, outputCanvas.height, effectsConfig.vignetteIntensity ?? 0)

  if (mode === 'all') {
    if (!hideIcons) {
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
    }

    // Capture text layer via html2canvas to preserve CSS mix-blend-mode:difference.
    // We set absolute positions and dimensions on each text section so html2canvas
    // sees simple absolutely-positioned elements instead of flexbox layout (which
    // html2canvas doesn't handle reliably).
    if (!hideText && textData?.sections?.length) {
      const textLayer = container.querySelector('.text-layer')
      if (textLayer) {
        // Pause text-float animation and reset transform
        const pauseStyle = document.createElement('style')
        pauseStyle.textContent = '.text-layer .text-section { animation: none !important; transform: translateY(0px) !important; }'
        document.head.appendChild(pauseStyle)

        const containerW = textLayer.offsetWidth
        const containerH = textLayer.offsetHeight

        const textSectionEls = textLayer.querySelectorAll('.text-section')
        const savedStyles = []

        // Apply the same responsive scaling as TextLayer.jsx
        const containerWidth = containerW
        let responsiveScale = 1
        if (containerWidth <= 480) responsiveScale = 0.35
        else if (containerWidth <= 768) responsiveScale = 0.65
        else if (containerWidth <= 1024) responsiveScale = 0.85

        const getResponsiveFontSize = (baseSize) =>
          responsiveScale < 1 ? Math.max(14, Math.round(baseSize * responsiveScale)) : baseSize

        // Step 1: Override to responsive font sizes while still in flexbox layout
        // so we can measure the actual rendered heights.
        textSectionEls.forEach((el, i) => {
          savedStyles.push({
            position: el.style.position,
            top: el.style.top,
            left: el.style.left,
            width: el.style.width,
            height: el.style.height,
            fontSize: el.style.fontSize,
            marginBottom: el.style.marginBottom,
          })
          if (textData.sections[i]) {
            el.style.fontSize = `${getResponsiveFontSize(textData.sections[i].size)}px`
          }
        })

        // Force reflow so font sizes take effect
        void textLayer.offsetHeight

        // Step 2: Measure actual rendered heights from the DOM
        const rowHeights = Array.from(textSectionEls).map((el) => el.offsetHeight)

        // Tuned multiplier + offset to match live preview spacing
        const effectiveGap = textData.gap * 2 + 5

        const totalTextHeight =
          rowHeights.reduce((sum, h) => sum + h, 0) +
          (rowHeights.length - 1) * effectiveGap

        // Vertically center the text block
        let currentY = (containerH - totalTextHeight) / 2

        // Step 3: Switch to absolute positioning with measured heights
        const savedLayerStyles = {
          display: textLayer.style.display,
          flexDirection: textLayer.style.flexDirection,
          alignItems: textLayer.style.alignItems,
          justifyContent: textLayer.style.justifyContent,
          gap: textLayer.style.gap,
          position: textLayer.style.position,
        }

        textLayer.style.display = 'block'
        textLayer.style.position = 'relative'
        textLayer.style.gap = '0px'

        textSectionEls.forEach((el, i) => {
          const sectionHeight = rowHeights[i] || 0

          el.style.position = 'absolute'
          el.style.top = `${currentY}px`
          el.style.left = '0px'
          el.style.width = `${containerW}px`
          el.style.height = `${sectionHeight}px`
          el.style.marginBottom = '0px'

          currentY += sectionHeight + effectiveGap
        })

        // Force reflow so style overrides take effect before capture
        void textLayer.offsetHeight

        try {
          const textCanvas = await html2canvas(textLayer, {
            useCORS: true,
            allowTaint: true,
            scale,
            backgroundColor: null,
            logging: false,
          })

          ctx.drawImage(textCanvas, 0, 0, outputCanvas.width, outputCanvas.height)
        } catch (err) {
          // Fallback to programmatic drawing if html2canvas fails
          console.warn('html2canvas text capture failed, falling back to canvas drawing:', err)
          drawTextToCanvas(ctx, outputCanvas.width, outputCanvas.height, textData, scale)
        }

        // Restore original styles
        textSectionEls.forEach((el, i) => {
          if (savedStyles[i]) {
            el.style.position = savedStyles[i].position
            el.style.top = savedStyles[i].top
            el.style.left = savedStyles[i].left
            el.style.width = savedStyles[i].width
            el.style.height = savedStyles[i].height
            el.style.fontSize = savedStyles[i].fontSize
            el.style.marginBottom = savedStyles[i].marginBottom
          }
        })
        textLayer.style.display = savedLayerStyles.display
        textLayer.style.flexDirection = savedLayerStyles.flexDirection
        textLayer.style.alignItems = savedLayerStyles.alignItems
        textLayer.style.justifyContent = savedLayerStyles.justifyContent
        textLayer.style.gap = savedLayerStyles.gap
        textLayer.style.position = savedLayerStyles.position
        document.head.removeChild(pauseStyle)
      } else {
        // Text layer not in DOM — fall back to programmatic drawing
        drawTextToCanvas(ctx, outputCanvas.width, outputCanvas.height, textData, scale)
      }
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
