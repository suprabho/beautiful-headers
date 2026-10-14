import { useEffect, useMemo, useState } from 'react'
import useStore from '../store/useStore'

// Loads the base image from backgroundImageConfig. Returns
// { image, config, status, error }; `image` is null until it has loaded (and
// whenever the image is disabled), so layers can treat a null image as "no
// base image" and render exactly as before.
//
// crossOrigin is required: WebGL refuses to upload a cross-origin image
// without CORS, and a 2D canvas drawn with one is tainted, which breaks
// capture/download.
export function useBackgroundImage() {
  const config = useStore((state) => state.backgroundImageConfig)
  const src = config.enabled ? config.src : null
  const [state, setState] = useState({ src: null, image: null, status: 'idle', error: null })

  useEffect(() => {
    if (!src) {
      setState({ src: null, image: null, status: 'idle', error: null })
      return
    }
    let cancelled = false
    setState((prev) => ({ ...prev, src, status: 'loading', error: null }))
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => {
      if (!cancelled) setState({ src, image: img, status: 'ready', error: null })
    }
    img.onerror = () => {
      if (cancelled) return
      setState({
        src,
        image: null,
        status: 'error',
        error: "Couldn't load this image. The host may not allow cross-origin use.",
      })
    }
    img.src = src
    return () => {
      cancelled = true
      img.onload = null
      img.onerror = null
    }
  }, [src])

  // Keep the previous image on screen while a new one loads
  const image = src && state.image ? state.image : null

  return useMemo(
    () => ({ image, config, status: src ? state.status : 'idle', error: src ? state.error : null }),
    [image, config, src, state.status, state.error]
  )
}

// What layers receive: null when there's nothing to draw
export function toLayerImage({ image, config }) {
  if (!image) return null
  return {
    image,
    fit: config.fit,
    imageOpacity: config.imageOpacity,
    gradientOpacity: config.gradientOpacity,
    blendMode: config.blendMode,
  }
}
