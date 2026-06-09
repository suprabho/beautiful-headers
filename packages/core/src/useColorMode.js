import { useState, useEffect } from 'react'

/**
 * Resolves the active color mode for a header from the `colorMode` prop.
 *
 * Library version of the app's embed hook — takes a string instead of router
 * search params so it has no react-router dependency.
 *
 *   - 'default'        → null (use the base config as-is, no theme resolution)
 *   - 'dark' | 'light' → fixed mode
 *   - 'auto' (default) → auto-detect: postMessage('theme-change') from a parent
 *                        frame, else the system `prefers-color-scheme`
 *
 * Returns 'dark' | 'light' | null.
 */
export function useColorModeValue(colorMode = 'auto') {
  const [mode, setMode] = useState(() => {
    if (colorMode === 'default') return null
    if (colorMode === 'dark' || colorMode === 'light') return colorMode
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    }
    return 'dark'
  })

  useEffect(() => {
    if (colorMode === 'default') {
      setMode(null)
      return
    }
    if (colorMode === 'dark' || colorMode === 'light') {
      setMode(colorMode)
      return
    }
    if (typeof window === 'undefined') return

    // Auto: react to parent-frame messages and system preference changes.
    const handleMessage = (event) => {
      if (
        event.data?.type === 'theme-change' &&
        (event.data.theme === 'dark' || event.data.theme === 'light')
      ) {
        setMode(event.data.theme)
      }
    }
    window.addEventListener('message', handleMessage)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    const handleMediaChange = (e) => setMode(e.matches ? 'light' : 'dark')
    mediaQuery.addEventListener('change', handleMediaChange)

    return () => {
      window.removeEventListener('message', handleMessage)
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  }, [colorMode])

  return mode
}
