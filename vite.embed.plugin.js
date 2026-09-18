// Vite plugin bits for the embed entry (/embed/:slug -> embed.html).
//
// The embed is built separately from the studio (see vite.embed.config.js) so
// Rollup chunks it on its own terms: a tiny bootstrap, one chunk with React +
// the page, and one lazily loaded chunk per background type (with three.js in
// a shared chunk that only the WebGL types pull in). Bundling it together with
// the studio entry made Rollup fold those lazy chunks back into the studio's
// main chunk, which is exactly what an embed must never download.

/** Dev/preview: mirror the Vercel rewrite of /embed/:slug to embed.html. */
export function embedDevRewrite() {
  const rewrite = (req, _res, next) => {
    if (req.url.startsWith('/embed/')) req.url = '/embed.html'
    next()
  }
  return {
    name: 'aura-embed-dev-rewrite',
    configureServer(server) {
      server.middlewares.use(rewrite)
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite)
    },
  }
}

/**
 * Build: post-process embed.html so that, inside a host page, the embed never
 * competes with the host's own critical resources — its scripts are fetched at
 * low priority and its (tiny) stylesheet is inlined instead of being an extra
 * render-blocking request.
 */
export function embedHtmlOptimizations() {
  return {
    name: 'aura-embed-html',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle || !ctx.path.endsWith('embed.html')) return html
        return html
          .replace(/<script type="module" crossorigin src="/g, '<script type="module" crossorigin fetchpriority="low" src="')
          .replace(/<link rel="modulepreload" crossorigin href="/g, '<link rel="modulepreload" crossorigin fetchpriority="low" href="')
          .replace(/<link rel="stylesheet" crossorigin href="\/([^"]+)">/g, (tag, file) => {
            const asset = ctx.bundle[file]
            return asset && asset.type === 'asset' ? `<style>${asset.source}</style>` : tag
          })
      },
    },
  }
}
