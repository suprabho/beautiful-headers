/**
 * Generate short and long descriptions for a scene based on its thumbnail image
 * Calls the server-side API endpoint function.
 * @param {string} thumbnailImage - Base64 encoded thumbnail image (with or without data URL prefix)
 * @returns {Promise<{title: string, shortDescription: string, longDescription: string} | null>}
 */
export async function generateSceneDescriptions(thumbnailImage) {
  console.log('generateSceneDescriptions called with thumbnail image')

  try {
    const response = await fetch('/api/generate-descriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ thumbnailImage }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('API Error:', errorData.error || response.statusText)
      return null
    }

    const data = await response.json()
    console.log('API response:', data)
    return data
  } catch (error) {
    console.error('Failed to generate descriptions:', error)
    return null
  }
}

/**
 * Fetch 10 AI-generated title + subtitle pairs for the text layer.
 * @returns {Promise<Array<{title: string, subtitle: string}> | null>}
 */
export async function fetchTextPairs() {
  try {
    const response = await fetch('/api/generate-text-pairs')

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Text pairs API error:', errorData.error || response.statusText)
      return null
    }

    const data = await response.json()
    return data.pairs || null
  } catch (error) {
    console.error('Failed to fetch text pairs:', error)
    return null
  }
}

/**
 * Check if Gemini is available
 * Since logic is moved to server, we assume it is available or let the server error out.
 */
export function isGeminiAvailable() {
  return true
}

