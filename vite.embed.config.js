import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { embedHtmlOptimizations } from './vite.embed.plugin.js'

// Embed build (embed.html -> /embed/:slug). Runs after the studio build and
// adds its hashed chunks next to the studio's in dist/ (see package.json).
export default defineConfig({
  plugins: [react(), embedHtmlOptimizations()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'embed.html'),
    },
  },
})
