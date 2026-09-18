/**
 * Load Google Fonts on demand — only the families a scene's text layer uses.
 * The embed entry deliberately ships no font <link>: most scenes hide text or
 * use a single family, and a render-blocking 4-family stylesheet inside the
 * iframe competes with the host page's own critical resources.
 */

const GOOGLE_FAMILIES = {
  'sans-serif': { name: 'Manrope', spec: 'Manrope:wght@200..800' },
  'serif': { name: 'Playfair Display', spec: 'Playfair+Display:ital,wght@0,400..900;1,400..900' },
  'mono': { name: 'Space Grotesk', spec: 'Space+Grotesk:wght@300..700' },
  'scribble': { name: 'Petit Formal Script', spec: 'Petit+Formal+Script' },
}

const pending = new Map() // family key -> Promise<void>

function alreadyLinked(familyName) {
  const needle = familyName.replace(/ /g, '+')
  return Array.from(document.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com"]'))
    .some((link) => link.href.includes(needle))
}

/**
 * Ensure the fonts for the given text sections are requested. Resolves once
 * the stylesheet has loaded (or failed), so callers can await it before
 * `document.fonts.ready`.
 */
export function ensureTextFonts(sections = []) {
  if (typeof document === 'undefined') return Promise.resolve()

  const keys = [...new Set(sections.map((s) => (GOOGLE_FAMILIES[s?.font] ? s.font : 'sans-serif')))]
  const toLoad = keys.filter((k) => !pending.has(k) && !alreadyLinked(GOOGLE_FAMILIES[k].name))

  if (toLoad.length) {
    const href = `https://fonts.googleapis.com/css2?${toLoad.map((k) => `family=${GOOGLE_FAMILIES[k].spec}`).join('&')}&display=swap`
    const promise = new Promise((resolve) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.onload = () => resolve()
      link.onerror = () => resolve()
      document.head.appendChild(link)
    })
    toLoad.forEach((k) => pending.set(k, promise))
  }

  return Promise.all(keys.map((k) => pending.get(k) || Promise.resolve()))
}
