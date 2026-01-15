/**
 * Generate short and long descriptions for a scene based on its configuration
 * Calls the server-side API endpoint function.
 * @param {Object} sceneData - The scene configuration data
 * @returns {Promise<{shortDescription: string, longDescription: string} | null>}
 */
export async function generateSceneDescriptions(sceneData) {
  console.log('generateSceneDescriptions called with:', sceneData)

  try {
    const response = await fetch('/api/generate-descriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sceneData }),
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
 * Check if Gemini is available
 * Since logic is moved to server, we assume it is available or let the server error out.
 */
export function isGeminiAvailable() {
  return true
}

