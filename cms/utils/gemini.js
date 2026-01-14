import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = (process.env.GEMINI_API_KEY || '').trim()
const modelName = (process.env.GEMINI_MODEL || 'gemini-2.0-flash').trim().replace(/['"]/g, '')
const genAI = new GoogleGenerativeAI(apiKey)

/**
 * Generates scene metadata (title, short & long descriptions) from scene data.
 * @param {object} sceneData - The scene configuration object
 * @returns {Promise<{title: string, shortDescription: string, longDescription: string}>}
 */
export async function generateSceneMetadata(sceneData) {
    console.log('[Gemini] ========== GENERATION START ==========')
    console.log('[Gemini] API Key configured:')

    if (!process.env.GEMINI_API_KEY) {
        console.warn('[Gemini] API key not configured, skipping generation')
        console.log('[Gemini] ========== GENERATION END (no key) ==========')
        return null
    }

    try {
        console.log('[Gemini] Getting model:', modelName)
        const model = genAI.getGenerativeModel({ model: modelName })

        const sceneDataStr = JSON.stringify(sceneData, null, 2)
        console.log('[Gemini] Scene data size:', sceneDataStr.length, 'chars')
        console.log('[Gemini] Scene data preview:', sceneDataStr.substring(0, 200) + '...')

        const prompt = `You are an expert at describing visual scenes and effects. Given the following scene configuration data in JSON format, generate creative and descriptive metadata.

Scene Configuration:
${sceneDataStr}

Based on this configuration, generate:
1. A catchy, memorable title (3-6 words)
2. A short description (1-2 sentences, max 150 characters) suitable for a card preview
3. A long description (2-4 sentences) that describes the visual experience, mood, and technical aspects

Respond in JSON format only:
{
  "title": "...",
  "shortDescription": "...",
  "longDescription": "..."
}`

        console.log('[Gemini] Sending request to API...')
        const startTime = Date.now()

        const result = await model.generateContent(prompt)

        const elapsed = Date.now() - startTime
        console.log('[Gemini] Response received in', elapsed, 'ms')

        const response = result.response.text()
        console.log('[Gemini] Raw response:', response)

        // Extract JSON from response (handle potential markdown code blocks)
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            console.error('[Gemini] Could not parse JSON from response')
            console.log('[Gemini] ========== GENERATION END (parse error) ==========')
            return null
        }

        const parsed = JSON.parse(jsonMatch[0])
        console.log('[Gemini] Parsed metadata:')
        console.log('[Gemini]   title:', parsed.title)
        console.log('[Gemini]   shortDescription:', parsed.shortDescription)
        console.log('[Gemini]   longDescription:', parsed.longDescription)
        console.log('[Gemini] ========== GENERATION END (success) ==========')
        return parsed
    } catch (error) {
        console.error('[Gemini] Error generating metadata:', error.message)
        console.error('[Gemini] Full error:', error)
        console.log('[Gemini] ========== GENERATION END (error) ==========')
        return null
    }
}
