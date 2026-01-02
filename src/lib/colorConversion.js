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

