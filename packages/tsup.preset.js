import { defineConfig } from 'tsup'

/**
 * Shared build config for every Aura header package.
 *
 * - Bundles `@aura/headers-core` (and all relative source) into the package so
 *   each published package is standalone — no shared runtime dependency.
 * - Externalizes react + the three.js ecosystem as peer dependencies, so they
 *   are never duplicated in a consumer's bundle. (Lite simply never imports the
 *   three.js ones, so externalizing them there is a harmless no-op.)
 */
export default defineConfig({
  entry: ['src/index.js'],
  format: ['esm', 'cjs'],
  outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.js' }),
  target: 'es2020',
  platform: 'browser',
  external: [
    /^react$/,
    /^react\//,
    /^react-dom$/,
    /^react-dom\//,
    'three',
    '@react-three/fiber',
    '@react-three/postprocessing',
  ],
  noExternal: [/^@aura\/headers-core/],
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
  clean: true,
  splitting: false,
  sourcemap: false,
  dts: false,
  treeshake: true,
})
