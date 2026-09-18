import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { embedDevRewrite, embedInlineModules } from './vite.embed.plugin.js'

// Studio build (index.html). The embed page has its own build, see
// vite.embed.config.js; the dev/preview rewrite here just routes /embed/:slug
// to it, and the inline-modules plugin serves its bootstrap complete in dev.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), embedDevRewrite(), embedInlineModules()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
