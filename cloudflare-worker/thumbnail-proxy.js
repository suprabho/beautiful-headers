const SUPABASE_STORAGE_URL =
  'https://grbrfpaznehikakupavx.supabase.co/storage/v1/object/public/thumbnails'

const CACHE_TTL = 60 * 60 * 24 * 30 // 30 days

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const filename = url.pathname.slice(1) // strip leading /

    if (!filename) {
      return new Response('Not found', { status: 404 })
    }

    const supabaseUrl = `${SUPABASE_STORAGE_URL}/${filename}`

    // Check Cloudflare cache first
    const cache = caches.default
    const cacheKey = new Request(url.toString(), request)
    const cached = await cache.match(cacheKey)
    if (cached) return cached

    // Fetch from Supabase
    const origin = await fetch(supabaseUrl, {
      headers: { Accept: 'image/*' },
    })

    if (!origin.ok) {
      return new Response('Not found', { status: 404 })
    }

    // Build response with aggressive cache headers
    const response = new Response(origin.body, {
      status: 200,
      headers: {
        'Content-Type': origin.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`,
        'CDN-Cache-Control': `public, max-age=${CACHE_TTL}`,
        'Access-Control-Allow-Origin': '*',
      },
    })

    // Store in Cloudflare edge cache
    request.method === 'GET' && cache.put(cacheKey, response.clone())

    return response
  },
}
