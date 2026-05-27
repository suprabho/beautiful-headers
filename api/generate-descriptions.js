import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

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

    const { thumbnailImage } = req.body;

    if (!thumbnailImage) {
        return res.status(400).json({ error: 'Missing thumbnailImage' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: API Key missing' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

        // Construct the prompt
        const prompt = `You are describing a beautiful gradient/visual header design for a website in a SEO-friendly way to help it get discovered by search engines.
Based on the guidelines below and the attached image, generate descriptions for this visual design.
x
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

"longDescription": "SEO META DESCRIPTION BEST PRACTICES AND EXAMPLES

PART 1: META DESCRIPTION BEST PRACTICES
Google Desktop: 150-160 characters (approximately 920 pixels)

Meta Description Formulas

Formula 1: Action + Keyword + Benefit + CTA
Structure: [Action verb] + [primary keyword] + [benefit/value] + [CTA]
Example: "Download free gradient backgrounds in HD quality. Perfect for websites, social media & presentations. Get instant access now!"

Formula 2: Question + Answer + CTA
Structure: [Question addressing user need] + [Your solution] + [CTA]
Example: "Looking for professional Zoom backgrounds? Browse 500+ HD virtual meeting backdrops for free. Download instantly, no sign-up required!"

Formula 3: Number + Keyword + Benefit + Trust Signal
Structure: [Number] + [keyword] + [benefit] + [trust signal]
Example: "Explore 1000+ free minimalist backgrounds for clean, modern designs. High-resolution PNG & vector files. 100% free for commercial use."

Formula 4: Keyword + Use Cases + CTA
Structure: [Primary keyword] + [specific use cases] + [CTA]
Example: "Free dark background images in HD & 4K. Ideal for YouTube thumbnails, websites & graphic design. Download your favorites now!"

Formula 5: Benefit-First + Keyword + Differentiator
Structure: [Key benefit] + [keyword] + [what makes you different]
Example: "Create stunning designs with free textured backgrounds. Paper, fabric, wood & stone textures in HD. New uploads added weekly!"

BY TYPE

GRADIENT BACKGROUND FREE

Example 1 (155 chars):
Download free gradient backgrounds in HD quality. Explore 500+ smooth color transitions perfect for websites, social media & graphic design. Free download

Example 2 (158 chars):
Get stunning gradient backgrounds for free. Vibrant color blends in PNG & vector formats. Perfect for web design, presentations & digital art. Download now!

Example 3 (152 chars):
Free gradient background images with beautiful color transitions. Blue, purple, sunset & pastel gradients in HD. Instant download, no sign-up required.

Example 4 (160 chars):
Browse 1000+ free gradient backgrounds for modern designs. Smooth color blends, bold transitions & soft pastels. High-resolution files ready for download

Example 5 (148 chars):
Discover free gradient backgrounds in every color combination. Perfect for websites, social media posts & creative projects. Download instantly!


MINIMALIST BACKGROUND

Example 1 (155 chars):
Download free minimalist backgrounds with clean, simple designs. Perfect for websites, presentations & branding projects. HD minimal backgrounds instantly

Example 2 (158 chars):
Explore elegant minimalist background images for modern aesthetics. White space designs, subtle textures & clean layouts. Free HD download, commercial use OK.

Example 3 (151 chars):
Free minimalist backgrounds for professional projects. Simple, clean & sophisticated designs in HD quality. Download vectors & PNGs instantly. Free

Example 4 (156 chars):
Get beautiful minimalist background designs for websites & apps. Neutral tones, clean lines & elegant simplicity. High-resolution free downloads available.

Example 5 (149 chars):
Browse 500+ free minimalist backgrounds. Clean aesthetic designs perfect for modern branding, web design & presentations. Instant HD download!


TEXTURED BACKGROUND IMAGES

Example 1 (160 chars):
Download free textured background images in HD. Paper, fabric, stone, wood & grunge textures for graphic design, websites & creative projects. Free download

Example 2 (157 chars):
Explore stunning textured backgrounds for unique designs. Vintage paper, linen fabric, concrete & wood textures. High-resolution free downloads available now.

Example 3 (154 chars):
Free textured background images to add depth & character. Paper, metal, fabric & natural textures in HD quality. Perfect for professional design projects.

Example 4 (159 chars):
Get realistic textured backgrounds for free. Seamless patterns in paper, stone, wood & fabric. High-resolution images for web, print & digital design. Free

Example 5 (152 chars):
Download HD textured backgrounds including grunge, vintage, fabric & natural textures. Add visual interest to any project. Free for commercial use!


DARK BACKGROUND HD

Example 1 (158 chars):
Download free dark background images in HD & 4K. Black, navy & deep color backgrounds perfect for websites, thumbnails & graphic design. Free instant download

Example 2 (155 chars):
Explore stunning dark backgrounds for dramatic designs. Pure black, dark gradients & moody aesthetics in high resolution. Free download for any project.

Example 3 (160 chars):
Free dark background images for modern, elegant designs. HD & 4K quality in black, charcoal & deep blue tones. Perfect for YouTube, websites & social media

Example 4 (153 chars):
Get beautiful dark HD backgrounds for professional projects. Abstract, textured & gradient dark designs. Instant free download, no sign-up required.

Example 5 (157 chars):
Download dark background images in stunning HD quality. Black abstract, dark gradients & moody textures for websites, presentations & graphic design. Free!


LIGHT BACKGROUND FOR TEXT

Example 1 (158 chars):
Download free light backgrounds perfect for text overlay. Clean, bright & readable designs for websites, presentations & graphics. Instant free download

Example 2 (156 chars):
Explore light background images ideal for typography. White, cream & soft pastel backgrounds that make text pop. HD quality, free for commercial use.

Example 3 (154 chars):
Free light backgrounds designed for readability. Soft, bright & clean designs perfect for documents, websites & presentations. Download in HD now!

Example 4 (159 chars):
Get clean light backgrounds for clear text display. Off-white, beige & pale colors in high resolution. Perfect for professional documents & web design. Free

Example 5 (151 chars):
Download light background images optimized for text content. Subtle textures & soft colors that enhance readability. Free HD downloads available!


BY USE CASE
-----------

BACKGROUND FOR WEBSITE

Example 1 (158 chars):
Download free background images for websites. HD quality, fast-loading web backgrounds for hero sections, landing pages & full-width designs. Free download

Example 2 (160 chars):
Explore stunning website backgrounds for modern web design. Responsive, optimized images for headers, hero sections & full-page layouts. Free instant download!

Example 3 (155 chars):
Free website background images in HD. Professional designs for landing pages, portfolios & business sites. Lightweight files optimized for fast loading.

Example 4 (157 chars):
Get beautiful backgrounds for your website. Abstract, minimal & professional designs in web-optimized formats. Perfect for any site. Free download now!

Example 5 (153 chars):
Download professional website backgrounds for free. Hero images, full-width layouts & responsive designs. HD quality optimized for web performance.


BACKGROUND FOR PRESENTATION

Example 1 (160 chars):
Download free presentation backgrounds for PowerPoint & Google Slides. Professional, clean designs that make your slides stand out. Instant free download

Example 2 (158 chars):
Explore stunning presentation backgrounds for business & creative slides. 16:9 format, HD quality & easy to customize. Free templates for PowerPoint & Keynote.

Example 3 (155 chars):
Free presentation background images for professional slides. Corporate, creative & minimal designs. Perfect for PowerPoint, Google Slides & Keynote.

Example 4 (157 chars):
Get beautiful backgrounds for presentations that impress. Business, education & creative themes in HD. Free download for PowerPoint & Google Slides users.

Example 5 (152 chars):
Download HD presentation backgrounds for impactful slides. Professional designs for business meetings, pitches & lectures. Free, easy to use templates!


ZOOM BACKGROUND IMAGES

Example 1 (158 chars):
Download free Zoom background images for professional video calls. Office, nature & creative virtual backgrounds for Zoom, Teams & Google Meet. Free HD

Example 2 (160 chars):
Explore professional Zoom backgrounds for remote work. Home office, corporate & scenic virtual backdrops. HD quality for clear video calls. Free download now!

Example 3 (155 chars):
Free virtual meeting backgrounds for Zoom & Teams. Professional office, home workspace & creative designs. Look polished on every video call. Download free!

Example 4 (157 chars):
Get stunning Zoom background images for professional meetings. 500+ virtual backdrops in HD. Perfect for remote work, interviews & online events. Free

Example 5 (153 chars):
Download HD Zoom backgrounds to upgrade your video calls. Office, nature & minimal designs for a professional look. Free for Zoom, Teams & Meet users.


YOUTUBE THUMBNAIL BACKGROUND

Example 1 (160 chars):
Download free YouTube thumbnail backgrounds that get clicks. Bold, eye-catching designs optimized for CTR. Perfect for gaming, vlogs & tutorials. Free HD

Example 2 (158 chars):
Explore YouTube thumbnail backgrounds designed for maximum clicks. Vibrant colors, bold designs & attention-grabbing styles. Free download for content creators.

Example 3 (155 chars):
Free thumbnail backgrounds for YouTube videos. Bright, bold & designed to stand out in search results. Boost your CTR with eye-catching designs. Download!

Example 4 (159 chars):
Get high-impact YouTube thumbnail backgrounds for free. Gaming, tech, lifestyle & vlog designs. Optimized for visibility & clicks. HD quality, instant download

Example 5 (154 chars):
Download thumbnail backgrounds that make your YouTube videos pop. Bold colors & professional designs for higher click-through rates. Free for creators!


SOCIAL MEDIA BACKGROUND TEMPLATE

Example 1 (159 chars):
Download free social media background templates for Instagram, Facebook, LinkedIn & more. Optimized sizes for every platform. Instant free download

Example 2 (160 chars):
Explore social media backgrounds designed for engagement. Instagram stories, Facebook posts & LinkedIn banners in perfect dimensions. Free templates available!

Example 3 (156 chars):
Free social media background templates for all platforms. Instagram, TikTok, Facebook & Pinterest sizes included. Create scroll-stopping posts. Download now!

Example 4 (158 chars):
Get beautiful social media backgrounds for your brand. Customizable templates for posts, stories & covers. Perfect dimensions for every platform. Free HD

Example 5 (153 chars):
Download social media background templates in all sizes. Instagram, Facebook, Twitter & LinkedIn ready. Professional designs for engaging content. Free!


BANNER BACKGROUND DESIGN

Example 1 (157 chars):
Download free banner background designs for web ads, headers & promotions. Professional, high-converting banner backgrounds in all sizes. Instant free download

Example 2 (159 chars):
Explore stunning banner backgrounds for digital marketing. Web ads, email headers & promotional banners. Eye-catching designs that convert. Free HD download!

Example 3 (155 chars):
Free banner background designs for advertising & promotions. Sale banners, web ads & email headers. Professional quality, ready to customize. Download now!

Example 4 (158 chars):
Get professional banner backgrounds for your campaigns. Leaderboard, skyscraper & rectangle sizes available. High-quality designs for better conversions. Free

Example 5 (152 chars):
Download banner backgrounds for websites & ads. Event promotions, sale announcements & marketing campaigns. HD quality, all standard sizes. Free!


POSTER BACKGROUND FREE

Example 1 (160 chars):
Download free poster backgrounds for events, movies, music & more. High-resolution designs for print & digital posters. Professional quality, instant free download

Example 2 (158 chars):
Explore stunning poster background images for any occasion. Concert, movie, event & promotional posters. HD & print-ready quality. Free download available!

Example 3 (155 chars):
Free poster backgrounds for professional print designs. Event flyers, movie posters & promotional materials. High-resolution files ready for printing.

Example 4 (157 chars):
Get beautiful poster backgrounds for your next project. Creative, corporate & artistic designs in print-ready resolution. Free download for any use case!

Example 5 (152 chars):
Download HD poster backgrounds for events & promotions. Music, film, corporate & artistic styles. Print-ready quality, free for commercial use!


BY COLOR
--------

BLUE ABSTRACT BACKGROUND

Example 1 (159 chars):
Download free blue abstract backgrounds in HD. Navy, sky blue, ocean & gradient designs perfect for websites, presentations & graphics. Free instant download

Example 2 (157 chars):
Explore stunning blue abstract backgrounds for professional projects. Corporate navy, calming sky blue & vibrant ocean tones. HD quality, free to download!

Example 3 (155 chars):
Free blue abstract background images in every shade. Dark navy, light blue, teal & aqua designs. Perfect for business & creative projects. Download now!

Example 4 (158 chars):
Get beautiful blue abstract backgrounds for your designs. Geometric, gradient & flowing wave patterns in HD. Corporate & creative styles available. Free

Example 5 (152 chars):
Download blue abstract backgrounds for websites & graphics. Navy corporate, ocean waves & sky blue gradients. High-resolution, free for any project!


WHITE BACKGROUND IMAGES

Example 1 (156 chars):
Download free white background images in HD. Pure white, off-white & cream backgrounds perfect for products, websites & clean designs. Free download

Example 2 (158 chars):
Explore clean white backgrounds for professional use. Product photography, websites & minimalist designs. Pure white to subtle cream tones. Free HD download!

Example 3 (154 chars):
Free white background images for clean, professional aesthetics. Perfect for e-commerce, portfolios & modern web design. High-resolution downloads.

Example 4 (157 chars):
Get pure white backgrounds for product shots & clean designs. Subtle textures & seamless whites in HD quality. Free for commercial & personal use. Download!

Example 5 (151 chars):
Download white background images in various shades. Pure white, ivory & cream for products, websites & print. HD quality, free instant download!


BLACK BACKGROUND HD

Example 1 (158 chars):
Download free black background images in HD & 4K. Pure black, textured & gradient dark designs for websites, graphics & mobile wallpapers. Free instant download

Example 2 (156 chars):
Explore stunning black backgrounds for dramatic designs. AMOLED blacks, dark gradients & textured surfaces. High-resolution downloads for any project. Free!

Example 3 (154 chars):
Free black background images in HD & 4K quality. Pure black, charcoal & dark abstract designs. Perfect for modern, elegant projects. Download now!

Example 4 (159 chars):
Get beautiful black backgrounds for high-contrast designs. Abstract, textured & gradient options in 4K resolution. Free for websites, graphics & wallpapers.

Example 5 (152 chars):
Download black HD backgrounds for professional designs. Pure black, dark textures & subtle gradients. AMOLED-friendly for mobile. Free instant download!


PASTEL BACKGROUND AESTHETIC

Example 1 (158 chars):
Download free pastel aesthetic backgrounds in soft pink, blue, mint & lavender. Dreamy, cute designs for social media & creative projects. Free download

Example 2 (160 chars):
Explore beautiful pastel backgrounds for aesthetic designs. Soft colors, dreamy gradients & kawaii styles. Perfect for Instagram, branding & creative projects!

Example 3 (155 chars):
Free pastel aesthetic backgrounds in gorgeous soft tones. Pink, lavender, mint & peach colors for feminine & cute designs. HD quality, instant download!

Example 4 (157 chars):
Get stunning pastel backgrounds for dreamy aesthetics. Soft gradients, cloud textures & gentle color blends. Perfect for social media & branding. Free

Example 5 (153 chars):
Download pastel aesthetic backgrounds for creative projects. Soft pink, baby blue, mint green & lavender. Cute, dreamy designs in HD. Free download!


NEON BACKGROUND DESIGN

Example 1 (158 chars):
Download free neon background designs with vibrant glowing colors. Cyberpunk, retro 80s & futuristic neon styles for bold, eye-catching projects. Free HD

Example 2 (160 chars):
Explore electric neon backgrounds for bold designs. Pink, blue & green glowing effects. Synthwave, cyberpunk & retro aesthetics. Free high-resolution downloads!

Example 3 (155 chars):
Free neon background images with vibrant glowing effects. Retro 80s, cyberpunk & futuristic styles. Perfect for gaming, music & modern designs. Download!

Example 4 (157 chars):
Get stunning neon backgrounds for eye-catching projects. Electric colors, glow effects & grid patterns. Synthwave & cyberpunk aesthetics available. Free

Example 5 (152 chars):
Download neon background designs that pop. Vibrant pinks, blues & greens with glowing effects. Retro & futuristic styles in HD. Free instant download!


GOLD BACKGROUND TEXTURE

Example 1 (158 chars):
Download free gold background textures for luxury designs. Metallic foil, glitter & brushed gold textures for elegant branding & graphics. Free download

Example 2 (160 chars):
Explore premium gold backgrounds for sophisticated projects. Metallic shine, sparkle & foil textures. Perfect for invitations, branding & luxury designs. Free!

Example 3 (155 chars):
Free gold background textures for elegant aesthetics. Glitter, foil, metallic & brushed gold in HD. Create luxurious designs without the premium price.

Example 4 (157 chars):
Get beautiful gold backgrounds for upscale designs. Rose gold, champagne & classic metallic textures. High-resolution files for print & digital. Free download!

Example 5 (152 chars):
Download gold texture backgrounds for luxury branding. Metallic foil, glitter sparkle & brushed metal. Premium look, free for commercial use!


TRENDING AND SEASONAL
---------------------

CALMING RHYTHMS - ABSTRACT, REPETITIVE PATTERNS

Example 1 (159 chars):
Download calming abstract backgrounds with soothing repetitive patterns. Flowing, rhythmic designs perfect for wellness, meditation & relaxation content. Free HD

Example 2 (160 chars):
Explore peaceful abstract backgrounds with gentle flowing patterns. Meditative designs for wellness apps, yoga studios & relaxation content. Free HD downloads!

Example 3 (156 chars):
Free calming backgrounds with rhythmic, flowing patterns. Soft waves, organic shapes & repetitive designs for peaceful aesthetics. Instant download available!

Example 4 (158 chars):
Get soothing abstract backgrounds for wellness projects. Calming waves, gentle rhythms & meditative patterns. Perfect for mindfulness apps & content. Free

Example 5 (153 chars):
Download peaceful abstract backgrounds with flowing designs. Soft, rhythmic patterns for meditation, wellness & relaxation themes. HD quality, free!


MACRO TEXTURE BACKGROUNDS

Example 1 (158 chars):
Download free macro texture backgrounds with stunning close-up details. Nature, fabric & abstract macro photography for unique creative projects. Free HD

Example 2 (160 chars):
Explore beautiful macro backgrounds featuring extreme close-up textures. Leaves, water droplets, fabric & organic details. High-resolution free downloads!

Example 3 (155 chars):
Free macro texture backgrounds with incredible detail. Nature close-ups, fabric weaves & abstract surfaces. Add unique depth to your designs. Download now!

Example 4 (157 chars):
Get stunning macro photography backgrounds for creative projects. Detailed textures of nature, materials & abstract surfaces. HD quality, free download!

Example 5 (152 chars):
Download macro texture backgrounds with amazing close-up detail. Organic, industrial & abstract textures for unique, eye-catching designs. Free HD!

Template 1: Standard Product/Download Page

Structure: [Action] free [keyword] in [quality]. [Specific types/variations] perfect for [use cases]. [Trust signal] [CTA]
Character count target: 150-155


Template 2: Collection/Gallery Page

Structure: [Action] [number]+ [keyword] for [benefit]. [Variations available]. [Quality indicator], [trust signal]. [CTA]!
Character count target: 150-158


Template 3: Use-Case Specific Page

Structure: [Action] [keyword] for [specific use case]. [Benefit statement]. Perfect for [platforms/tools]. [CTA]
Character count target: 148-155


Template 4: Comparison/Category Page

Structure: [Action] [keyword] in [variations]. From [type A] to [type B]. [Quality] for [use cases]. [CTA]!
Character count target: 145-155

META DESCRIPTION CHECKLIST

Before publishing, verify your meta description:

-- Length is 150-155 characters
-- Primary keyword appears in first 100 characters
-- Includes a clear call-to-action
-- Highlights key benefit or value proposition
-- Is unique (not duplicated from other pages)
-- Matches the page content accurately
-- Uses active voice and action verbs
-- Includes trust signals (Free, HD, etc.)
-- Reads naturally (not keyword-stuffed)
-- Creates curiosity or urgency to click

"
};

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

