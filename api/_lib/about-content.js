// Static copy for the /about route's noscript fallback.
// Mirrors src/components/about/AboutHeroSection.jsx + src/components/about/sectionScenes.js
// (the "i" info dialog on the home page renders the same content via AboutAuraModal).

export const ABOUT_HERO = {
  title: 'Beautiful animated headers',
  tagline: 'Interactive backgrounds with effects, tessellation, and text. Embed anywhere, customize everything.',
};

export const ABOUT_SECTIONS = [
  {
    title: '8 Background Types',
    description: 'Choose from liquid mesh gradients, aurora borealis, fluid simulations, wave patterns, ribbon trails, dandelion particles, particle rings, and simple gradients.',
  },
  {
    title: 'Icon Tessellation',
    description: 'Overlay a repeating grid of 65+ icons over any background. Adjust size, spacing, rotation, and opacity.',
  },
  {
    title: 'Overlay Effects',
    description: 'Add texture overlays like grain, scanlines, dots, and grid patterns. Control vignette, blur, saturation, contrast, and color maps.',
  },
  {
    title: 'Fluted Glass Effect',
    description: 'Apply a refractive glass distortion that warps the background with animated wave patterns. Adjust segment count, rotation, and distortion strength.',
  },
  {
    title: 'Text & Fonts',
    description: 'Add centered text with 4 font families: Manrope, Playfair Display, Space Grotesk, and Petit Formal Script. Configure size, weight, spacing, and glow effects.',
  },
  {
    title: 'Interactive Input',
    description: 'Control how the background reacts. Mouse mode follows the cursor, microphone mode reacts to audio with bass, mid, and treble bands.',
  },
  {
    title: 'Dark & Light Mode',
    description: 'Every scene supports dark and light theme overrides. Store a single scene with different color palettes, brightness, and contrast for each mode.',
  },
  {
    title: 'Color Palettes',
    description: 'Load custom color palettes or choose from presets. Colors propagate through gradients, tessellation, and effects. Supports Tailwind OKLCH palettes.',
  },
  {
    title: 'Embed Anywhere',
    description: 'Drop a lightweight iframe snippet into your site. Your animated scene renders in real-time, with mouse reactivity and theme support.',
  },
];
