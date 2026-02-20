import { useState, useEffect } from 'react'

export function useKeyboardOffset() {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const handleResize = () => {
      const keyboardHeight = window.innerHeight - viewport.height
      setOffset(Math.max(0, keyboardHeight))
    }

    viewport.addEventListener('resize', handleResize)
    viewport.addEventListener('scroll', handleResize)

    return () => {
      viewport.removeEventListener('resize', handleResize)
      viewport.removeEventListener('scroll', handleResize)
    }
  }, [])

  return offset
}
