/**
 * Utility to convert oklch colors to RGB for html2canvas compatibility
 * html2canvas doesn't support oklch() color function, so we need to convert them before capture
 */

/**
 * Convert oklch color string to RGB
 * @param {string} oklchString - oklch color string like "oklch(0.7 0.2 280)" or "oklch(0.7 0.2 280 / 0.5)"
 * @returns {string} - RGB/RGBA color string
 */
export function oklchToRgb(oklchString) {
  // Match oklch pattern: oklch(L C H) or oklch(L C H / A)
  const match = oklchString.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?))?\s*\)/i)
  
  if (!match) {
    return oklchString // Return original if not a valid oklch string
  }

  const L = parseFloat(match[1])
  const C = parseFloat(match[2])
  const H = parseFloat(match[3])
  const alpha = match[4] !== undefined ? parseFloat(match[4]) / (match[4].includes('%') ? 100 : 1) : 1

  // Convert OKLch to OKLAB
  const hRad = (H * Math.PI) / 180
  const a = C * Math.cos(hRad)
  const b = C * Math.sin(hRad)

  // Convert OKLAB to linear sRGB
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  // Linear sRGB to sRGB
  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  let bVal = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

  // Apply gamma correction (linear to sRGB)
  const toSrgb = (c) => {
    if (c <= 0) return 0
    if (c >= 1) return 255
    return Math.round((c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 255)
  }

  r = toSrgb(r)
  g = toSrgb(g)
  bVal = toSrgb(bVal)

  if (alpha < 1) {
    return `rgba(${r}, ${g}, ${bVal}, ${alpha})`
  }
  return `rgb(${r}, ${g}, ${bVal})`
}

/**
 * Check if a string contains oklch color
 * @param {string} value
 * @returns {boolean}
 */
export function hasOklch(value) {
  return value && typeof value === 'string' && value.toLowerCase().includes('oklch(')
}

/**
 * Replace all oklch colors in a string with RGB equivalents
 * @param {string} value - CSS value that may contain oklch colors
 * @returns {string} - Value with oklch replaced by RGB
 */
export function replaceOklchInString(value) {
  if (!hasOklch(value)) return value
  
  // Replace all oklch(...) occurrences
  return value.replace(/oklch\([^)]+\)/gi, (match) => oklchToRgb(match))
}

/**
 * Get all CSS custom properties from an element's computed style
 * @param {Element} element
 * @returns {Object} - Object with property names as keys and values
 */
function getCssVariables(element) {
  const styles = getComputedStyle(element)
  const variables = {}
  
  // Get CSS variables from stylesheets
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules || []) {
        if (rule.style) {
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i]
            if (prop.startsWith('--')) {
              const value = rule.style.getPropertyValue(prop)
              if (hasOklch(value)) {
                variables[prop] = value
              }
            }
          }
        }
      }
    } catch (e) {
      // CORS restrictions may prevent reading external stylesheets
    }
  }
  
  return variables
}

/**
 * Convert all oklch colors to RGB in the target element and its children before capture
 * Returns a cleanup function to restore original values
 * @param {Element} container - The container element to process
 * @returns {Function} - Cleanup function to restore original values
 */
export function prepareForCapture(container) {
  const restorations = []
  
  // Find all inline style oklch values and CSS variable oklch values in the document
  const allElements = [document.documentElement, document.body, ...container.querySelectorAll('*')]
  
  // Get computed styles that we need to inline
  const colorProperties = [
    'color', 'background-color', 'backgroundColor', 'border-color', 'borderColor',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'outline-color', 'box-shadow', 'text-shadow', 'fill', 'stroke',
    'caret-color', 'column-rule-color', 'text-decoration-color', 'accent-color'
  ]
  
  // First, handle CSS custom properties at the root level
  const rootStyle = document.documentElement.style
  const originalRootVariables = {}
  
  // Get all CSS custom properties that use oklch
  const computedRoot = getComputedStyle(document.documentElement)
  
  // Check for oklch in any property by examining the stylesheets
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules || []) {
        if (rule.style && rule.selectorText?.includes(':root')) {
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i]
            if (prop.startsWith('--')) {
              const value = rule.style.getPropertyValue(prop)
              if (hasOklch(value)) {
                originalRootVariables[prop] = value
                rootStyle.setProperty(prop, replaceOklchInString(value))
              }
            }
          }
        }
      }
    } catch (e) {
      // CORS restrictions may prevent reading external stylesheets
    }
  }
  
  // Add restoration for root variables
  if (Object.keys(originalRootVariables).length > 0) {
    restorations.push(() => {
      for (const [prop, value] of Object.entries(originalRootVariables)) {
        rootStyle.setProperty(prop, value)
      }
    })
  }
  
  // Process each element's inline styles and computed styles that might have oklch
  for (const el of allElements) {
    const inlineStyle = el.getAttribute('style') || ''
    const computedStyle = getComputedStyle(el)
    const originalInline = inlineStyle
    let needsInlineUpdate = false
    const inlineOverrides = {}
    
    // Check inline style for oklch
    if (hasOklch(inlineStyle)) {
      const newInline = replaceOklchInString(inlineStyle)
      el.setAttribute('style', newInline)
      restorations.push(() => {
        if (originalInline) {
          el.setAttribute('style', originalInline)
        } else {
          el.removeAttribute('style')
        }
      })
    }
    
    // Check computed styles for oklch (might come from CSS variables)
    for (const prop of colorProperties) {
      const value = computedStyle.getPropertyValue(prop)
      if (hasOklch(value)) {
        const originalValue = el.style.getPropertyValue(prop)
        el.style.setProperty(prop, replaceOklchInString(value))
        inlineOverrides[prop] = originalValue
        needsInlineUpdate = true
      }
    }
    
    if (needsInlineUpdate) {
      restorations.push(() => {
        for (const [prop, value] of Object.entries(inlineOverrides)) {
          if (value) {
            el.style.setProperty(prop, value)
          } else {
            el.style.removeProperty(prop)
          }
        }
      })
    }
  }
  
  // Return cleanup function
  return function restore() {
    // Restore in reverse order
    for (let i = restorations.length - 1; i >= 0; i--) {
      try {
        restorations[i]()
      } catch (e) {
        console.warn('Failed to restore style:', e)
      }
    }
  }
}

/**
 * Wrapper for async capture operations
 * @param {Element} container - The container to capture
 * @param {Function} captureFunction - Async function that performs the capture
 * @returns {Promise<any>} - Result from the capture function
 */
export async function captureWithColorConversion(container, captureFunction) {
  const restore = prepareForCapture(container)
  
  try {
    // Wait a frame for styles to apply
    await new Promise(resolve => requestAnimationFrame(resolve))
    
    const result = await captureFunction()
    return result
  } finally {
    restore()
  }
}

/**
 * Convert any color format (oklch, hex, rgb, hsl) to hex
 * @param {string} color - Color string in any format
 * @returns {string} - Hex color string
 */
export function colorToHex(color) {
  if (!color || typeof color !== 'string') return null
  
  // Already hex
  if (color.startsWith('#')) {
    // Normalize 3-digit hex to 6-digit
    if (color.length === 4) {
      return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]
    }
    return color.toLowerCase()
  }
  
  // Handle oklch
  if (hasOklch(color)) {
    const rgb = oklchToRgb(color)
    return rgbStringToHex(rgb)
  }
  
  // Handle rgb/rgba
  if (color.startsWith('rgb')) {
    return rgbStringToHex(color)
  }
  
  // Handle hsl/hsla
  if (color.startsWith('hsl')) {
    return hslStringToHex(color)
  }
  
  // Named color - use canvas to convert
  try {
    const ctx = document.createElement('canvas').getContext('2d')
    ctx.fillStyle = color
    return ctx.fillStyle // Returns hex
  } catch {
    return null
  }
}

/**
 * Convert RGB string to hex
 * @param {string} rgb - RGB/RGBA string like "rgb(255, 0, 0)" or "rgba(255, 0, 0, 0.5)"
 * @returns {string} - Hex color string
 */
function rgbStringToHex(rgb) {
  const match = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (!match) return null
  
  const r = parseInt(match[1]).toString(16).padStart(2, '0')
  const g = parseInt(match[2]).toString(16).padStart(2, '0')
  const b = parseInt(match[3]).toString(16).padStart(2, '0')
  
  return `#${r}${g}${b}`
}

/**
 * Convert HSL string to hex
 * @param {string} hsl - HSL/HSLA string like "hsl(360, 100%, 50%)"
 * @returns {string} - Hex color string
 */
function hslStringToHex(hsl) {
  const match = hsl.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i)
  if (!match) return null
  
  const h = parseFloat(match[1]) / 360
  const s = parseFloat(match[2]) / 100
  const l = parseFloat(match[3]) / 100
  
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  
  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  
  const toHex = (c) => Math.round(c * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Parse a Tailwind-style color palette JSON and extract all colors
 * @param {Object} palette - Palette object with nested color shades
 * @returns {Object} - Object with { colors: Array<{name, shade, color, hex}>, colorsByName: Object }
 */
export function parsePaletteJson(palette) {
  const colors = []
  const colorsByName = {}
  
  const processValue = (name, shade, value) => {
    const hex = colorToHex(value)
    if (hex) {
      const entry = { name, shade, color: value, hex }
      colors.push(entry)
      
      if (!colorsByName[name]) {
        colorsByName[name] = []
      }
      colorsByName[name].push(entry)
    }
  }
  
  for (const [key, value] of Object.entries(palette)) {
    if (typeof value === 'string') {
      // Simple color like "black": "#000"
      processValue(key, null, value)
    } else if (typeof value === 'object' && value !== null) {
      // Nested shades like "red": { "50": "...", "100": "...", ... }
      for (const [shade, shadeValue] of Object.entries(value)) {
        if (typeof shadeValue === 'string') {
          processValue(key, shade, shadeValue)
        }
      }
    }
  }
  
  return { colors, colorsByName }
}

/**
 * Validate if a string is valid JSON palette
 * @param {string} jsonString - JSON string to validate
 * @returns {{ valid: boolean, palette?: Object, error?: string }}
 */
export function validatePaletteJson(jsonString) {
  try {
    const parsed = JSON.parse(jsonString)
    
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { valid: false, error: 'Palette must be a JSON object' }
    }
    
    const { colors } = parsePaletteJson(parsed)
    
    if (colors.length === 0) {
      return { valid: false, error: 'No valid colors found in palette' }
    }
    
    return { valid: true, palette: parsed, colors }
  } catch (e) {
    return { valid: false, error: `Invalid JSON: ${e.message}` }
  }
}

/**
 * Parse a hex color to RGB values
 * @param {string} hex - Hex color string like "#ff0000" or "#f00"
 * @returns {{ r: number, g: number, b: number }} - RGB values (0-255)
 */
export function hexToRgb(hex) {
  // Normalize hex
  let normalized = hex.replace('#', '')
  if (normalized.length === 3) {
    normalized = normalized[0] + normalized[0] + normalized[1] + normalized[1] + normalized[2] + normalized[2]
  }
  
  const r = parseInt(normalized.substring(0, 2), 16)
  const g = parseInt(normalized.substring(2, 4), 16)
  const b = parseInt(normalized.substring(4, 6), 16)
  
  return { r, g, b }
}

/**
 * Calculate the relative luminance of a color (per WCAG 2.1)
 * @param {string} hexColor - Hex color string
 * @returns {number} - Relative luminance value (0-1)
 */
export function getRelativeLuminance(hexColor) {
  const hex = colorToHex(hexColor)
  if (!hex) return 0
  
  const { r, g, b } = hexToRgb(hex)
  
  // Convert to sRGB
  const sR = r / 255
  const sG = g / 255
  const sB = b / 255
  
  // Apply gamma correction
  const R = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4)
  const G = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4)
  const B = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4)
  
  // Calculate luminance using the WCAG formula
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

/**
 * Calculate the contrast ratio between two colors (per WCAG 2.1)
 * @param {string} color1 - First hex color
 * @param {string} color2 - Second hex color
 * @returns {number} - Contrast ratio (1-21)
 */
export function getContrastRatio(color1, color2) {
  const L1 = getRelativeLuminance(color1)
  const L2 = getRelativeLuminance(color2)
  
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if a text color has sufficient contrast against background colors
 * Uses the minimum contrast ratio against all background colors
 * @param {string} textColor - Text color to check
 * @param {string[]} backgroundColors - Array of background colors (gradient colors)
 * @param {'AA' | 'AAA'} level - WCAG contrast level
 * @param {boolean} isLargeText - Whether the text is large (18pt+ or 14pt+ bold)
 * @returns {{ passes: boolean, minRatio: number, ratios: number[] }}
 */
export function checkContrastAgainstGradient(textColor, backgroundColors, level = 'AA', isLargeText = true) {
  if (!backgroundColors || backgroundColors.length === 0) {
    return { passes: true, minRatio: Infinity, ratios: [] }
  }
  
  // WCAG 2.1 contrast requirements:
  // AA normal text: 4.5:1
  // AA large text: 3:1
  // AAA normal text: 7:1
  // AAA large text: 4.5:1
  const requiredRatio = level === 'AAA' 
    ? (isLargeText ? 4.5 : 7)
    : (isLargeText ? 3 : 4.5)
  
  const ratios = backgroundColors.map(bgColor => getContrastRatio(textColor, bgColor))
  const minRatio = Math.min(...ratios)
  
  return {
    passes: minRatio >= requiredRatio,
    minRatio,
    ratios,
    requiredRatio
  }
}

/**
 * Filter palette colors that have sufficient contrast against gradient colors
 * @param {Object} parsedPalette - Parsed palette from parsePaletteJson
 * @param {string[]} gradientColors - Array of gradient background colors
 * @param {'AA' | 'AAA'} level - WCAG contrast level
 * @param {boolean} isLargeText - Whether the text is large
 * @returns {Object} - Filtered palette with only accessible colors
 */
export function filterPaletteByContrast(parsedPalette, gradientColors, level = 'AA', isLargeText = true) {
  if (!parsedPalette || !gradientColors || gradientColors.length === 0) {
    return parsedPalette
  }
  
  const filteredColors = parsedPalette.colors.filter(colorEntry => {
    const result = checkContrastAgainstGradient(colorEntry.hex, gradientColors, level, isLargeText)
    return result.passes
  })
  
  // Rebuild colorsByName from filtered colors
  const colorsByName = {}
  for (const entry of filteredColors) {
    if (!colorsByName[entry.name]) {
      colorsByName[entry.name] = []
    }
    colorsByName[entry.name].push(entry)
  }
  
  // Remove empty color groups
  const filteredColorsByName = {}
  for (const [name, shades] of Object.entries(colorsByName)) {
    if (shades.length > 0) {
      filteredColorsByName[name] = shades
    }
  }
  
  return {
    colors: filteredColors,
    colorsByName: filteredColorsByName
  }
}

