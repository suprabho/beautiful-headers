import { useState, useEffect } from 'react'

/**
 * Detects color mode for embed pages.
 * Priority: URL ?theme= param > postMessage > prefers-color-scheme
 *
 * Returns 'dark' | 'light' | null.
 *   - 'default' param → null (use base config as-is, no theme resolution)
 *   - 'dark' / 'light' param → fixed mode
 *   - no param → auto-detect from postMessage or system preference
 */
export function useColorMode(searchParams) {
  const urlTheme = searchParams.get('theme')

  const [mode, setMode] = useState(() => {
    if (urlTheme === 'default') return null
    if (urlTheme === 'dark' || urlTheme === 'light') return urlTheme
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    }
    return 'dark'
  })

  useEffect(() => {
    // 'default' disables theming entirely
    if (urlTheme === 'default') {
      setMode(null)
      return
    }

    // URL param is fixed — no listeners needed
    if (urlTheme === 'dark' || urlTheme === 'light') {
      setMode(urlTheme)
      return
    }

    // Listen for postMessage from parent frame
    const handleMessage = (event) => {
      if (
        event.data?.type === 'theme-change' &&
        (event.data.theme === 'dark' || event.data.theme === 'light')
      ) {
        setMode(event.data.theme)
      }
    }
    window.addEventListener('message', handleMessage)

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    const handleMediaChange = (e) => setMode(e.matches ? 'light' : 'dark')
    mediaQuery.addEventListener('change', handleMediaChange)

    return () => {
      window.removeEventListener('message', handleMessage)
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  }, [urlTheme])

  return mode
}
