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

    const { sceneData, thumbnailImage } = req.body;

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
        const prompt = `You are describing a beautiful gradient/visual header design for a website in a SEO-friendly way to help it get discovered by search engines. 
    Based on the above guidelines, and attached image which is generated using following configuration, generate two descriptions:


    Image: ${thumbnailImage}
    Configuration:
${sceneSummary}


Include the major color in the short description. Do not include specific gradient type in the short description.

Please respond in JSON format with exactly these three fields:
{
  "title": "
    - Best Practices:
-- Include primary keyword near the beginning
-- Keep under 60 characters when possible
-- Make it compelling and descriptive.

Samples Patterns:
[Keyword] – [Benefit Statement]
Free [Keyword] – [What's Included]
[Keyword] Download – [Descriptive Benefit]
[Adjective] [Keyword] – [Action + Benefit]

📁 BY TYPE
Gradient Background Free

Free Gradient Backgrounds – Download Stunning Color Blends for Any Project
Gradient Background Free Download – 500+ Beautiful Color Transitions
Free Gradient Backgrounds HD – Smooth Color Blends for Design & Web

Minimalist Background

Minimalist Backgrounds – Clean & Simple Designs for Modern Projects
Free Minimalist Background Images – Elegant Simplicity for Any Design
Minimalist Background Download – Simple, Clean & Professional Designs

Textured Background Images

Free Textured Background Images – Add Depth & Character to Your Designs
Textured Backgrounds Download – Paper, Fabric, Stone & More Textures
HD Textured Background Images – Free Downloads for Creative Projects

Dark Background HD

Dark Background HD – Free Black & Dark-Themed Images for Your Projects
Free Dark Backgrounds Download – HD Black, Navy & Deep Color Designs
Dark Background Images HD – Dramatic & Elegant Dark Aesthetics

Light Background for Text

Light Backgrounds for Text – Clean & Readable Designs for Any Content
Free Light Background Images – Perfect Backdrops for Text & Typography
Light Background Download – Soft, Bright & Text-Friendly Designs


📁 BY USE CASE
Background for Website

Free Website Backgrounds – Professional Designs for Modern Web Pages
Background Images for Websites – Download Free HD Web Backgrounds
Website Background Download – Stunning Visuals for Your Web Design

Background for Presentation

Free Presentation Backgrounds – Professional Slides for PowerPoint & Google Slides
Background for Presentations – Download Stunning Slide Designs Free
Presentation Background Images – Make Your Slides Stand Out

Zoom Background Images

Free Zoom Backgrounds – Professional Virtual Meeting Backdrops
Zoom Background Images Download – HD Backgrounds for Video Calls
Virtual Meeting Backgrounds – Free Zoom & Teams Background Images

YouTube Thumbnail Background

YouTube Thumbnail Backgrounds – Eye-Catching Designs That Get Clicks
Free YouTube Thumbnail Background Images – Stand Out in Search Results
Thumbnail Background for YouTube – High-Impact Designs for More Views

Social Media Background Template

Free Social Media Background Templates – Instagram, Facebook & More
Social Media Backgrounds Download – Templates for Every Platform
Social Media Background Templates – Create Scroll-Stopping Posts

Banner Background Design

Free Banner Background Designs – Web Banners, Ads & Headers
Banner Background Images – Professional Designs for Digital Marketing
Download Banner Backgrounds – Eye-Catching Designs for Any Campaign

Poster Background Free

Free Poster Backgrounds – Stunning Designs for Print & Digital Posters
Poster Background Download – HD Images for Eye-Catching Posters
Free Poster Background Images – Create Professional Posters Instantly


📁 BY COLOR
Blue Abstract Background

Blue Abstract Backgrounds – Free Downloads in Navy, Sky & Ocean Tones
Free Blue Abstract Background Images – HD Designs for Any Project
Abstract Blue Backgrounds – Download Stunning Blue-Themed Designs

White Background Images

Free White Background Images – Clean & Professional White Backdrops
White Background Download – Pure White to Off-White Designs
White Background Images HD – Minimalist White Designs for Any Use

Black Background HD

Black Background HD – Free Downloads for Dark & Elegant Designs
Free Black Background Images – Pure Black to Dark Gray Variations
HD Black Backgrounds – Download Dark, Dramatic Designs Instantly

Pastel Background Aesthetic

Pastel Background Aesthetic – Soft & Dreamy Colors for Beautiful Designs
Free Pastel Backgrounds – Aesthetic Soft Color Palettes Download
Aesthetic Pastel Backgrounds – Pink, Blue, Mint & Lavender Designs

Neon Background Design

Neon Background Designs – Vibrant Glowing Colors for Bold Projects
Free Neon Backgrounds – Electric Colors That Pop Off the Screen
Neon Background Download – Bright, Glowing Designs for Modern Use

Gold Background Texture

Gold Background Textures – Luxurious & Elegant Golden Designs
Free Gold Background Images – Metallic, Glitter & Foil Textures
Gold Texture Backgrounds – Premium-Looking Designs for Free


📁 TRENDING & SEASONAL
Calming Rhythms – Abstract, Repetitive Patterns

Calming Abstract Backgrounds – Soothing Repetitive Patterns for Relaxation
Rhythmic Abstract Backgrounds – Flowing, Meditative Designs Download
Calming Background Patterns – Abstract Designs for Peaceful Aesthetics

Macro Texture Backgrounds

Macro Texture Backgrounds – Stunning Close-Up Details for Unique Designs
Free Macro Backgrounds – Extreme Close-Up Textures & Patterns
Macro Photography Backgrounds – Detailed Textures at Microscopic Level

",

  "shortDescription": "
 BEST PRACTICES REMINDER

Include secondary keywords – Each H2 should target a related long-tail keyword
Support the H1 – All H2s should be subtopics of the main H1 heading
Keep under 60 characters – Optimal for readability and SEO
Make them scannable – Users should understand content by reading H2s alone
Include action words – Download, Create, Choose, Use, Get
Be specific – "Gaming Thumbnail Backgrounds" is better than "Different Backgrounds"

  Examples: 
  📁 BY TYPE
Gradient Background Free

Vibrant Gradient Backgrounds for Modern Designs
Download Free Gradient Vectors & PNG Files
Popular Gradient Color Combinations for 2025
How to Use Gradient Backgrounds in Your Projects

Minimalist Background

Simple Minimalist Backgrounds for Clean Aesthetics
White Space Minimalist Designs for Professional Use
Minimalist Background Ideas for Websites & Apps
Download Free Minimal Background Vectors

Textured Background Images

Paper Texture Backgrounds for Vintage & Rustic Designs
Fabric & Linen Textured Backgrounds
Concrete & Stone Texture Images HD
Grunge Textured Backgrounds for Edgy Designs
Wood Texture Background Collection

Dark Background HD

Black Abstract Dark Backgrounds for Modern Design
Dark Gradient Backgrounds for Websites & Apps
Dramatic Dark Backgrounds for YouTube & Social Media
Dark Textured Backgrounds for Professional Projects
Moody Dark Aesthetic Backgrounds

Light Background for Text

White & Off-White Backgrounds for Clear Text Display
Soft Pastel Light Backgrounds for Readability
Light Textured Backgrounds That Don't Distract from Text
Clean Light Backgrounds for Presentations & Documents
Best Light Background Colors for Website Typography


📁 BY USE CASE
Background for Website

Hero Section Backgrounds for Landing Pages
Full-Width Website Background Images
Responsive Web Backgrounds That Scale Perfectly
Light vs Dark Website Backgrounds: Which Works Best?
Animated & Static Website Background Options

Background for Presentation

Professional Business Presentation Backgrounds
Creative Presentation Backgrounds for Engaging Slides
Simple & Clean Presentation Background Templates
Dark Theme Presentation Backgrounds
How to Choose the Right Background for Your Presentation

Zoom Background Images

Professional Office Zoom Backgrounds
Home Office Virtual Backgrounds for Remote Work
Fun & Creative Zoom Backgrounds
Nature & Scenic Zoom Background Images
Best Practices for Zoom Background Selection

YouTube Thumbnail Background

Bold & Bright YouTube Thumbnail Backgrounds
Gaming Thumbnail Backgrounds for YouTube Channels
Vlog & Lifestyle YouTube Thumbnail Designs
Text-Friendly Thumbnail Backgrounds for Clear Titles
Color Psychology: Best Background Colors for YouTube Thumbnails

Social Media Background Template

Instagram Post & Story Background Templates
Facebook Cover & Post Backgrounds
LinkedIn Professional Background Templates
TikTok & Reels Background Designs
Pinterest Pin Background Templates

Banner Background Design

Web Banner Background Designs for Advertising
Email Header Banner Backgrounds
Event & Promotional Banner Backgrounds
Sale & Discount Banner Background Templates
Animated Banner Background Options

Poster Background Free

Event Poster Background Templates
Movie & Film Poster Backgrounds
Motivational & Quote Poster Backgrounds
Concert & Music Poster Background Designs
How to Choose the Perfect Poster Background


📁 BY COLOR
Blue Abstract Background

Navy Blue Abstract Backgrounds for Corporate Design
Light Blue Abstract Backgrounds for Calm Aesthetics
Ocean & Water-Inspired Blue Backgrounds
Blue Gradient Abstract Designs
Geometric Blue Abstract Patterns

White Background Images

Pure White Backgrounds for Product Photography
Off-White & Cream Background Variations
White Textured Background Images
White Backgrounds with Subtle Patterns
When to Use White vs Off-White Backgrounds

Black Background HD

Pure Black Backgrounds for Maximum Contrast
Black Textured Backgrounds with Depth
Black Gradient Backgrounds with Color Accents
Black Abstract Backgrounds for Modern Design
AMOLED Black Backgrounds for Mobile Devices

Pastel Background Aesthetic

Soft Pink Pastel Backgrounds for Feminine Designs
Pastel Blue & Mint Aesthetic Backgrounds
Lavender & Purple Pastel Backgrounds
Pastel Gradient Backgrounds for Social Media
Kawaii & Cute Pastel Aesthetic Designs

Neon Background Design

Neon Pink & Purple Cyberpunk Backgrounds
Neon Blue & Green Futuristic Designs
Neon Light Effect Backgrounds
Retro Neon 80s Style Backgrounds
Neon Grid & Synthwave Backgrounds

Gold Background Texture

Metallic Gold Foil Background Textures
Gold Glitter & Sparkle Backgrounds
Brushed Gold Metal Texture Backgrounds
Gold Gradient Backgrounds for Luxury Branding
Rose Gold & Champagne Gold Variations


📁 TRENDING & SEASONAL
Calming Rhythms – Abstract, Repetitive Patterns

Flowing Wave Patterns for Calming Visuals
Repetitive Abstract Backgrounds for Meditation Apps
Soft, Rhythmic Backgrounds for Wellness Brands
Gentle Motion Backgrounds for Relaxation Content
Organic Flow Patterns for Soothing Design

Macro Texture Backgrounds

Nature Macro Textures: Leaves, Petals & Organic Details
Fabric & Material Macro Close-Up Backgrounds
Macro Water Droplet & Liquid Textures
Abstract Macro Textures for Creative Projects
Industrial & Metal Macro Detail Backgrounds
",

"longDescription": "A detailed 2-3 sentence SEO-optimized description explaining the effect, colors, icons used. Include the mood and feel of the design."
}

Focus on the aesthetic qualities, color harmony, and visual impact. Be creative and evocative.`;

        // Build content parts - text prompt + optional image
        const contentParts = [{ text: prompt }];

        if (thumbnailImage) {
            // thumbnailImage should be base64 string (with or without data URL prefix)
            let base64Data = thumbnailImage;
            let mimeType = 'image/png';

            // Handle data URL format: "data:image/png;base64,..."
            if (thumbnailImage.startsWith('data:')) {
                const matches = thumbnailImage.match(/^data:(.+);base64,(.+)$/);
                if (matches) {
                    mimeType = matches[1];
                    base64Data = matches[2];
                }
            }

            contentParts.push({
                inlineData: {
                    mimeType,
                    data: base64Data
                }
            });
        }

        const result = await model.generateContent(contentParts);
        const responseText = result.response.text();

        // Parse JSON - find the first complete JSON object
        const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
            // Try to parse, if it fails due to nested braces, try the greedy match
            let parsed;
            try {
                parsed = JSON.parse(jsonMatch[0]);
            } catch {
                // The response likely has nested braces, try to extract valid JSON
                const startIdx = responseText.indexOf('{');
                if (startIdx !== -1) {
                    let braceCount = 0;
                    let endIdx = -1;
                    for (let i = startIdx; i < responseText.length; i++) {
                        if (responseText[i] === '{') braceCount++;
                        else if (responseText[i] === '}') braceCount--;
                        if (braceCount === 0) {
                            endIdx = i + 1;
                            break;
                        }
                    }
                    if (endIdx !== -1) {
                        parsed = JSON.parse(responseText.slice(startIdx, endIdx));
                    }
                }
            }
            if (parsed) {
                return res.status(200).json({
                    title: parsed.title || '',
                    shortDescription: parsed.shortDescription || '',
                    longDescription: parsed.longDescription || ''
                });
            }
        }

        console.warn('Could not parse JSON from Gemini response:', responseText);
        return res.status(500).json({ error: 'Failed to parse AI response' });

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
