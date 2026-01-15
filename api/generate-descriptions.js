import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { sceneData } = req.body;

    if (!sceneData) {
        return res.status(400).json({ error: 'Missing sceneData' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: API Key missing' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const sceneSummary = buildSceneSummary(sceneData);

        // Construct the prompt
        const prompt = `You are describing a beautiful gradient/visual header design for a website. 

    Here are some examples of how to describe the design:

- 📁 BY TYPE
--Gradient Background Free

---Free Gradient Backgrounds – Download Stunning Color Blends for Any Project
---Gradient Background Free Download – 500+ Beautiful Color Transitions
---Free Gradient Backgrounds HD – Smooth Color Blends for Design & Web

--Minimalist Background

---Minimalist Backgrounds – Clean & Simple Designs for Modern Projects
---Free Minimalist Background Images – Elegant Simplicity for Any Design
---Minimalist Background Download – Simple, Clean & Professional Designs

--Textured Background Images

---Free Textured Background Images – Add Depth & Character to Your Designs
---Textured Backgrounds Download – Paper, Fabric, Stone & More Textures
---HD Textured Background Images – Free Downloads for Creative Projects

--Dark Background HD

--- Dark Background HD – Free Black & Dark-Themed Images for Your Projects
---Free Dark Backgrounds Download – HD Black, Navy & Deep Color Designs
---Dark Background Images HD – Dramatic & Elegant Dark Aesthetics

--Light Background for Text

---Light Backgrounds for Text – Clean & Readable Designs for Any Content
---Free Light Background Images – Perfect Backdrops for Text & Typography
---Light Background Download – Soft, Bright & Text-Friendly Designs

--📁 BY USE CASE Background for Website

---Free Website Backgrounds – Professional Designs for Modern Web Pages
---Background Images for Websites – Download Free HD Web Backgrounds
---Website Background Download – Stunning Visuals for Your Web Design

--Background for Presentation

---Free Presentation Backgrounds – Professional Slides for PowerPoint & Google Slides
---Background for Presentations – Download Stunning Slide Designs Free
---Presentation Background Images – Make Your Slides Stand Out

--Zoom Background Images

---Free Zoom Backgrounds – Professional Virtual Meeting Backdrops
---Zoom Background Images Download – HD Backgrounds for Video Calls
---Virtual Meeting Backgrounds – Free Zoom & Teams Background Images

--YouTube Thumbnail Background

---YouTube Thumbnail Backgrounds – Eye-Catching Designs That Get Clicks
---Free YouTube Thumbnail Background Images – Stand Out in Search Results
---Thumbnail Background for YouTube – High-Impact Designs for More Views

--Social Media Background Template

---Free Social Media Background Templates – Instagram, Facebook & More
---Social Media Backgrounds Download – Templates for Every Platform
---Social Media Background Templates – Create Scroll-Stopping Posts

--Banner Background Design

---Free Banner Background Designs – Web Banners, Ads & Headers
---Banner Background Images – Professional Designs for Digital Marketing
---Download Banner Backgrounds – Eye-Catching Designs for Any Campaign

--Poster Background Free

---Free Poster Backgrounds – Stunning Designs for Print & Digital Posters
---Poster Background Download – HD Images for Eye-Catching Posters
---Free Poster Background Images – Create Professional Posters Instantly

--📁 BY COLORBlue Abstract Background

---Blue Abstract Backgrounds – Free Downloads in Navy, Sky & Ocean Tones
---Free Blue Abstract Background Images – HD Designs for Any Project

--Abstract Blue Backgrounds – Download Stunning Blue-Themed Designs

--White Background Images

---Free White Background Images – Clean & Professional White Backdrops
---White Background Download – Pure White to Off-White Designs
---White Background Images HD – Minimalist White Designs for Any Use

--Black Background HD

---Black Background HD – Free Downloads for Dark & Elegant Designs
---Free Black Background Images – Pure Black to Dark Gray Variations
---HD Black Backgrounds – Download Dark, Dramatic Designs Instantly

--Pastel Background Aesthetic

---Pastel Background Aesthetic – Soft & Dreamy Colors for Beautiful Designs
---Free Pastel Backgrounds – Aesthetic Soft Color Palettes Download
---Aesthetic Pastel Backgrounds – Pink, Blue, Mint & Lavender Designs

--Neon Background Design

---Neon Background Designs – Vibrant Glowing Colors for Bold Projects
---Free Neon Backgrounds – Electric Colors That Pop Off the Screen
---Neon Background Download – Bright, Glowing Designs for Modern Use

--Gold Background Texture

---Gold Background Textures – Luxurious & Elegant Golden Designs
---Free Gold Background Images – Metallic, Glitter & Foil Textures
---Gold Texture Backgrounds – Premium-Looking Designs for Free

--📁 TRENDING & SEASONALCalming Rhythms – Abstract, Repetitive Patterns

---Calming Abstract Backgrounds – Soothing Repetitive Patterns for Relaxation
---Rhythmic Abstract Backgrounds – Flowing, Meditative Designs Download
---Calming Background Patterns – Abstract Designs for Peaceful Aesthetics

--Macro Texture Backgrounds

---Macro Texture Backgrounds – Stunning Close-Up Details for Unique Designs
---Free Macro Backgrounds – Extreme Close-Up Textures & Patterns
---Macro Photography Backgrounds – Detailed Textures at Microscopic Level

--Free Gradient Backgrounds HD – Smooth Color Blends for Design & Web


    
    Based on the above guidelines, and following configuration,  generate two descriptions:

Configuration:
${sceneSummary}

Include the major color in the short description. Do not include specific gradient type in the short description.

Please respond in JSON format with exactly these two fields:
{
  "shortDescription": "Using Formula: [Primary Keyword] – [Benefit/Descriptor] | [Brand Name].
    - Best Practices:
-- Include primary keyword near the beginning
-- Keep under 60 characters when possible
-- Make it compelling and descriptive.
",

"longDescription": "A detailed 2-3 sentence SEO-optimized description explaining the effect, colors, icons used. Include the mood and feel of the design."
}

Focus on the aesthetic qualities, color harmony, and visual impact. Be creative and evocative.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return res.status(200).json({
                shortDescription: parsed.shortDescription || '',
                longDescription: parsed.longDescription || ''
            });
        } else {
            console.warn('Could not parse JSON from Gemini response:', responseText);
            // Fallback or error
            return res.status(500).json({ error: 'Failed to parse AI response' });
        }

    } catch (error) {
        console.error('Error generating descriptions:', error);
        return res.status(500).json({ error: error.message });
    }
}

function buildSceneSummary(sceneData) {
    const parts = [];

    // Gradient info
    if (sceneData.gradientConfig) {
        const gc = sceneData.gradientConfig;
        if (gc.colors && gc.colors.length > 0) {
            parts.push(`Colors: ${gc.colors.join(', ')}`);
        }
        if (gc.type) {
            parts.push(`Gradient type: ${gc.type}`);
        }
        if (gc.speed !== undefined) {
            parts.push(`Animation speed: ${gc.speed}`);
        }
    }

    // Aurora config
    if (sceneData.auroraConfig?.enabled) {
        parts.push('Aurora effect: enabled');
        if (sceneData.auroraConfig.intensity) {
            parts.push(`Aurora intensity: ${sceneData.auroraConfig.intensity}`);
        }
    }

    // Blob config
    if (sceneData.blobConfig?.enabled) {
        parts.push('Blob effect: enabled');
    }

    // Fluid config
    if (sceneData.fluidConfig?.enabled) {
        parts.push('Fluid effect: enabled');
    }

    // Waves config
    if (sceneData.wavesConfig?.enabled) {
        parts.push('Waves effect: enabled');
    }

    // Tessellation/pattern
    if (sceneData.tessellationConfig?.enabled) {
        parts.push(`Pattern: ${sceneData.tessellationConfig.type || 'tessellation'}`);
    }

    // Effects
    if (sceneData.effectsConfig) {
        const effects = [];
        if (sceneData.effectsConfig.bloom) effects.push('bloom');
        if (sceneData.effectsConfig.grain) effects.push('grain');
        if (sceneData.effectsConfig.vignette) effects.push('vignette');
        if (effects.length > 0) {
            parts.push(`Effects: ${effects.join(', ')}`);
        }
    }

    // Text sections
    if (sceneData.textSections && sceneData.textSections.length > 0) {
        const texts = sceneData.textSections.map(s => s.text).filter(Boolean);
        if (texts.length > 0) {
            parts.push(`Text: "${texts.join('" "')}"`);
        }
    }

    return parts.join('\n') || 'A custom gradient design';
}
