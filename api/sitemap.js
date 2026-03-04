import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return res.status(500).json({ error: 'Missing Supabase credentials' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        // Fetch all scenes from Supabase
        const { data: scenes, error } = await supabase
            .from('scenes')
            .select('id, title, slug, updated_at')
            .order('updated_at', { ascending: false });

        if (error) throw error;

        // Helper to slugify titles
        const titleToSlug = (title) => {
            return title
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
        };

        const baseUrl = 'https://aura.promad.design';
        const now = new Date().toISOString();

        // Use the most recent scene update as lastmod for the gallery page
        const latestSceneDate = scenes.length > 0
            ? new Date(scenes[0].updated_at).toISOString()
            : now;

        // Static pages
        const staticPages = [
            { url: '/', priority: '1.0', changefreq: 'weekly', lastmod: now },
            { url: '/about', priority: '0.8', changefreq: 'monthly', lastmod: now },
            { url: '/scenes', priority: '0.8', changefreq: 'daily', lastmod: latestSceneDate },
        ];

        // Generate XML
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
                .map((page) => {
                    return `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
                })
                .join('')}
  ${scenes
                .map((scene) => {
                    const slug = scene.slug || titleToSlug(scene.title);
                    return `
  <url>
    <loc>${baseUrl}/scenes/${slug}</loc>
    <lastmod>${new Date(scene.updated_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
                })
                .join('')}
</urlset>`;

        // Set headers
        res.setHeader('Content-Type', 'text/xml');
        // Cache for 1 hour (3600 seconds)
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

        res.status(200).send(sitemap);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to generate sitemap' });
    }
}
