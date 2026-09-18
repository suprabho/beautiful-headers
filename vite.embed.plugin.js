// Vite plugin bits for the embed entry (/embed/:slug -> embed.html).
//
// The embed is built separately from the studio (see vite.embed.config.js) so
// Rollup chunks it on its own terms: a tiny bootstrap, one chunk with React +
// the page, and one lazily loaded chunk per background type (with three.js in
// a shared chunk that only the WebGL types pull in). Bundling it together with
// the studio entry made Rollup fold those lazy chunks back into the studio's
// main chunk, which is exactly what an embed must never download.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformWithEsbuild } from 'vite'

const ROOT = path.dirname(fileURLToPath(import.meta.url))

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

// Source modules the inline bootstrap in embed.html shares with the app: the
// theme resolver and the placeholder ("preload gradient") builder. Both are
// plain ES modules without imports, so with their `export` keywords stripped
// they become ordinary declarations inside the bootstrap's closure — one
// source of truth for the SVG that the bootstrap paints before React loads and
// that <ColorPlaceholder> then re-renders.
const INLINE_MODULES = ['src/lib/themeUtils.js', 'src/lib/lqip.js']
const INLINE_MARKER = '/* __AURA_INLINE_MODULES__ */'

/**
 * Dev + build: splice the shared modules into embed.html's inline bootstrap at
 * the marker comment. Minified in build (it ships in every embed's HTML), left
 * readable in dev.
 */
export function embedInlineModules() {
  return {
    name: 'aura-embed-inline-modules',
    transformIndexHtml: {
      order: 'pre',
      async handler(html, ctx) {
        if (!ctx.path.endsWith('embed.html') || !html.includes(INLINE_MARKER)) return html
        let code = INLINE_MODULES
          .map((file) => fs.readFileSync(path.resolve(ROOT, file), 'utf8').replace(/^export\s+(?=(?:function|const|let|var|class)\b)/gm, ''))
          .join('\n')
        // `ctx.server` is only set by the dev server; a build has no server.
        if (!ctx.server) {
          code = (await transformWithEsbuild(code, 'aura-inline-modules.js', { minify: true, target: 'es2020', sourcemap: false })).code
        }
        // A function replacer so `$` sequences in the code are inserted verbatim.
        return html.replace(INLINE_MARKER, () => code)
      },
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
