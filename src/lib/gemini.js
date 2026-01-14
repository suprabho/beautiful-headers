import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

console.log('Gemini API key configured:', !!GEMINI_API_KEY)

let genAI = null

function getGenAI() {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not configured. Set VITE_GEMINI_API_KEY in your environment.')
    return null
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    console.log('Gemini AI client initialized')
  }
  return genAI
}

/**
 * Generate short and long descriptions for a scene based on its configuration
 * @param {Object} sceneData - The scene configuration data
 * @returns {Promise<{shortDescription: string, longDescription: string} | null>}
 */
export async function generateSceneDescriptions(sceneData) {
  console.log('generateSceneDescriptions called with:', sceneData)

  const ai = getGenAI()
  if (!ai) {
    console.log('Gemini AI not available, skipping description generation')
    return null
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' })
    console.log('Using Gemini model: gemini-2.5-flash')

    // Build a summary of the scene configuration
    const sceneSummary = buildSceneSummary(sceneData)
    console.log('Scene summary:', sceneSummary)

    const prompt = `You are describing a beautiful gradient/visual header design for a website. Based on the following configuration, generate two descriptions:

Configuration:
${sceneSummary}

Please respond in JSON format with exactly these two fields:
{
  "shortDescription": "A brief 10-15 word description suitable for a card preview",
  "longDescription": "A detailed 2-3 sentence description explaining the visual style, colors, and mood"
}

Focus on the aesthetic qualities, color harmony, and visual impact. Be creative and evocative.`

    console.log('Sending prompt to Gemini...')
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    console.log('Gemini response:', text)

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      console.log('Parsed descriptions:', parsed)
      return {
        shortDescription: parsed.shortDescription || '',
        longDescription: parsed.longDescription || ''
      }
    }

    console.warn('Could not parse JSON from Gemini response')
    return null
  } catch (error) {
    console.error('Failed to generate descriptions with Gemini:', error)
    return null
  }
}

/**
 * Build a human-readable summary of the scene configuration
 */
function buildSceneSummary(sceneData) {
  const parts = []

  // Gradient info
  if (sceneData.gradientConfig) {
    const gc = sceneData.gradientConfig
    if (gc.colors && gc.colors.length > 0) {
      parts.push(`Colors: ${gc.colors.join(', ')}`)
    }
    if (gc.type) {
      parts.push(`Gradient type: ${gc.type}`)
    }
    if (gc.speed !== undefined) {
      parts.push(`Animation speed: ${gc.speed}`)
    }
  }

  // Aurora config
  if (sceneData.auroraConfig?.enabled) {
    parts.push('Aurora effect: enabled')
    if (sceneData.auroraConfig.intensity) {
      parts.push(`Aurora intensity: ${sceneData.auroraConfig.intensity}`)
    }
  }

  // Blob config
  if (sceneData.blobConfig?.enabled) {
    parts.push('Blob effect: enabled')
  }

  // Fluid config
  if (sceneData.fluidConfig?.enabled) {
    parts.push('Fluid effect: enabled')
  }

  // Waves config
  if (sceneData.wavesConfig?.enabled) {
    parts.push('Waves effect: enabled')
  }

  // Tessellation/pattern
  if (sceneData.tessellationConfig?.enabled) {
    parts.push(`Pattern: ${sceneData.tessellationConfig.type || 'tessellation'}`)
  }

  // Effects
  if (sceneData.effectsConfig) {
    const effects = []
    if (sceneData.effectsConfig.bloom) effects.push('bloom')
    if (sceneData.effectsConfig.grain) effects.push('grain')
    if (sceneData.effectsConfig.vignette) effects.push('vignette')
    if (effects.length > 0) {
      parts.push(`Effects: ${effects.join(', ')}`)
    }
  }

  // Text sections
  if (sceneData.textSections && sceneData.textSections.length > 0) {
    const texts = sceneData.textSections.map(s => s.text).filter(Boolean)
    if (texts.length > 0) {
      parts.push(`Text: "${texts.join('" "')}"`)
    }
  }

  return parts.join('\n') || 'A custom gradient design'
}

/**
 * Check if Gemini is available
 */
export function isGeminiAvailable() {
  return !!GEMINI_API_KEY
}
