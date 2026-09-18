import { useState, useEffect } from 'react'

/**
 * Whether an element is inside the (top-level) viewport. Inside an iframe the
 * IntersectionObserver's implicit root is the top-level viewport, so this works
 * for cross-origin embeds too: a hero background that has been scrolled past
 * reports false and the scene can stop animating.
 *
 * Returns `[ref, inView]`. `ref` is a callback ref, so observation (re)starts
 * whenever the observed element mounts — including after a loading state.
 */
export function useInView({ rootMargin = '0px' } = {}) {
  const [node, setNode] = useState(null)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((e) => e.isIntersecting)),
      { rootMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [node, rootMargin])

  return [setNode, inView]
}

/** Tracks the `prefers-reduced-motion: reduce` media query. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
