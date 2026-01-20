import { useEffect } from 'react'

/**
 * Hook to dynamically update document meta tags
 * @param {Object} meta - Meta tag configuration
 * @param {string} meta.title - Page title
 * @param {string} meta.description - Meta description
 * @param {string} meta.image - OG image URL
 * @param {string} meta.url - Canonical URL
 */
export function useDocumentMeta({ title, description, image, url }) {
  useEffect(() => {
    // Store original values to restore on unmount
    const originalTitle = document.title
    const originalMeta = {}

    const setMeta = (property, content) => {
      if (!content) return

      // Try both name and property attributes
      let element = document.querySelector(`meta[property="${property}"]`) ||
                    document.querySelector(`meta[name="${property}"]`)

      if (element) {
        originalMeta[property] = element.getAttribute('content')
        element.setAttribute('content', content)
      }
    }

    // Set title
    if (title) {
      document.title = title
    }

    // Set meta tags
    if (description) {
      setMeta('description', description)
      setMeta('og:description', description)
      setMeta('twitter:description', description)
    }

    if (title) {
      setMeta('og:title', title)
      setMeta('twitter:title', title)
    }

    if (image) {
      setMeta('og:image', image)
      setMeta('twitter:image', image)
    }

    if (url) {
      setMeta('og:url', url)
      setMeta('twitter:url', url)
    }

    // Cleanup: restore original values on unmount
    return () => {
      document.title = originalTitle
      Object.entries(originalMeta).forEach(([property, content]) => {
        const element = document.querySelector(`meta[property="${property}"]`) ||
                        document.querySelector(`meta[name="${property}"]`)
        if (element && content) {
          element.setAttribute('content', content)
        }
      })
    }
  }, [title, description, image, url])
}
