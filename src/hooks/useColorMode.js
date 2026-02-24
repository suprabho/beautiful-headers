import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Detects the current color mode ('dark' | 'light') for embedded scenes.
 *
 * Priority order:
 *  1. URL param ?theme=dark|light (explicit override from embedder)
 *  2. postMessage from parent frame { type: 'setColorMode', mode: 'dark'|'light' }
 *  3. prefers-color-scheme media query (auto-detect, reactive to changes)
 */
export function useColorMode() {
  const [searchParams] = useSearchParams()
  const urlTheme = searchParams.get('theme') // 'dark' | 'light' | null

  const getSystemMode = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

  const [systemMode, setSystemMode] = useState(getSystemMode)
  const [messageMode, setMessageMode] = useState(null)

  // Listen for prefers-color-scheme changes
  useEffect(() => {
    // URL param is authoritative — no need to listen to system changes
    if (urlTheme === 'dark' || urlTheme === 'light') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setSystemMode(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [urlTheme])

  // Listen for postMessage from parent frame
  useEffect(() => {
    if (urlTheme === 'dark' || urlTheme === 'light') return

    const handler = (e) => {
      if (e.data?.type === 'setColorMode' && (e.data.mode === 'dark' || e.data.mode === 'light')) {
        setMessageMode(e.data.mode)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [urlTheme])

  // URL param > postMessage > system
  if (urlTheme === 'dark' || urlTheme === 'light') return urlTheme
  if (messageMode) return messageMode
  return systemMode
}
