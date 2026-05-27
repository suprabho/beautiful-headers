import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: API Key missing' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

        const prompt = `Generate 10 creative pairs of text for a visual header/hero section design tool. Each pair should have:
- A "title": a bold, short headline (1 word, trendy, evocative or artistic)
- A "subtitle": a smaller tagline or descriptor (2-3 words, complementary to the title)

The pairs should be diverse in theme — spanning creative, tech, nature, abstract, editorial, and artistic vibes. They should look great as large display text on colorful gradient backgrounds.

Respond ONLY with a JSON array, no other text:
[
  { "title": "...", "subtitle": "..." },
  ...
]`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Extract JSON array from response
        const arrayMatch = responseText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            const parsed = JSON.parse(arrayMatch[0]);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return res.status(200).json({ pairs: parsed.slice(0, 10) });
            }
        }

        console.warn('Could not parse JSON array from Gemini response:', responseText);
        return res.status(500).json({ error: 'Failed to parse AI response' });

    } catch (error) {
        console.error('Error generating text pairs:', error);
        return res.status(500).json({ error: error.message });
    }
}
