#!/usr/bin/env node

/**
 * generate-scene.mjs — Batch scene generator for Promad's animated background system.
 *
 * Generates one scene per background type (8 total) using the pattern recipes
 * from the scene-context-graph skill. Output is appended to generated-scenes.json.
 *
 * Usage:
 *   node generate-scene.mjs                  # generate 8 scenes (one per type)
 *   node generate-scene.mjs --count 3        # generate 3 random scenes
 *   node generate-scene.mjs --type fluid     # generate 1 scene of a specific type
 *   node generate-scene.mjs --output my.json # write to a custom file
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const requestedType = getArg('type');
const requestedCount = getArg('count') ? parseInt(getArg('count'), 10) : null;
const outputFile = getArg('output') || 'generated-scenes.json';

// ── Shared defaults (present in every scene) ─────────────────────────────────
const defaultBlobConfig = {
  blobCount: 5, minRadius: 40, maxRadius: 120, speed: 0.5,
  orbitRadius: 150, blurAmount: 12, threshold: 180,
  mouseInfluence: 0.3, decaySpeed: 0.95, useGradientColors: true,
  colors: ['#40204c', '#a3225c', '#e24926'],
  backgroundColor: '#152a8e'
};

const defaultAuroraConfig = {
  minWidth: 10, maxWidth: 30, minHeight: 200, maxHeight: 600,
  minTTL: 100, maxTTL: 300, blurAmount: 13,
  hueStart: 120, hueEnd: 180, backgroundColor: '#000000',
  lineCount: 0, decaySpeed: 0.95, useGradientColors: true
};

const defaultFluidConfig = {
  useGradientColors: true, backgroundColor: '#1C89FF',
  colors: ['#71ECFF', '#3b82f6', '#06b6d4', '#1C89FF'],
  speed: 1, intensity: 1, blurAmount: 20
};

const defaultWavesConfig = {
  useGradientColors: true,
  colors: ['#06b6d4', '#3b82f6', '#71ECFF', '#0ea5e9'],
  waveHeight: 0.05, waveFrequency: 2, rotation: 0,
  speed: 0.5, blur: 40, layers: 5, phaseOffset: 0
};

const defaultRibbonConfig = {
  useGradientColors: true, backgroundColor: '#ffffff',
  ribbonCount: 5, speed: 0.5, amplitude: 1.0, spread: 0.5,
  rotation: -30, thickness: 1, taper: -0.3, noise: 0.5, opacity: 0.85
};

const defaultDandelionConfig = {
  useGradientColors: true, backgroundColor: '#e8f4fc',
  lineCount: 120, radiusMin: 0.1, radiusMax: 0.8,
  speed: 0.3, thickness: 1.5, dotSize: 3, spread: 0.3, centerY: 0.85
};

const defaultParticleRingConfig = {
  useGradientColors: true, backgroundColor: '#fef6f9',
  particleCount: 800, ringRadius: 0.35, ringWidth: 0.15,
  speed: 0.5, particleSize: 3, dispersion: 0.3,
  rotationSpeed: 0.2, tiltX: 0, tiltZ: 0
};

const defaultShapeTrailConfig = {
  useGradientColors: true, backgroundColor: '#f0f0f0',
  shape: 'circle', startScale: 1000, endScale: 2000, sizeCycles: 1,
  gap: 30, rotationOffset: 15, speed: 0.3, pathComplexity: 4,
  opacity: 0.8, blendMode: 'normal', trailCount: 3, trailColorStops: null
};

const defaultTessellationConfig = {
  enabled: false, icon: 'Star', rowGap: 60, colGap: 60,
  size: 24, opacity: 0.15, rotation: 0, color: '#9ca3af',
  mouseRotationInfluence: 0.5
};

const defaultFlutedGlass = {
  enabled: false, segments: 80, rotation: 0,
  motionValue: 0.5, motionSpeed: 0.5, overlayOpacity: 0,
  distortionStrength: 0.02, waveFrequency: 1
};

// ── Color palettes ───────────────────────────────────────────────────────────
const palettes = {
  cyan: {
    cyan: {
      '50': '#ecfeff', '100': '#cffafe', '200': '#a5f3fc', '300': '#67e8f9',
      '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2', '700': '#0e7490',
      '800': '#155e75', '900': '#164e63', '950': '#083344'
    }, black: '#000', white: '#fff'
  },
  purple: {
    purple: {
      '50': '#faf5ff', '100': '#f3e8ff', '200': '#e9d5ff', '300': '#d8b4fe',
      '400': '#c084fc', '500': '#a855f7', '600': '#9333ea', '700': '#7e22ce',
      '800': '#6b21a8', '900': '#581c87', '950': '#3b0764'
    }, black: '#000', white: '#fff'
  },
  amber: {
    amber: {
      '50': '#fffbeb', '100': '#fef3c7', '200': '#fde68a', '300': '#fcd34d',
      '400': '#fbbf24', '500': '#f59e0b', '600': '#d97706', '700': '#b45309',
      '800': '#92400e', '900': '#78350f', '950': '#451a03'
    }, black: '#000', white: '#fff'
  },
  blue: {
    blue: {
      '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd',
      '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8',
      '800': '#1e40af', '900': '#1e3a8a', '950': '#172554'
    }, black: '#000', white: '#fff'
  },
  rose: {
    rose: {
      '50': '#fff1f2', '100': '#ffe4e6', '200': '#fecdd3', '300': '#fda4af',
      '400': '#fb7185', '500': '#f43f5e', '600': '#e11d48', '700': '#be123c',
      '800': '#9f1239', '900': '#881337', '950': '#4c0519'
    }, black: '#000', white: '#fff'
  },
  emerald: {
    emerald: {
      '50': '#ecfdf5', '100': '#d1fae5', '200': '#a7f3d0', '300': '#6ee7b7',
      '400': '#34d399', '500': '#10b981', '600': '#059669', '700': '#047857',
      '800': '#065f46', '900': '#064e3b', '950': '#022c22'
    }, black: '#000', white: '#fff'
  },
  slate: {
    slate: {
      '50': '#f8fafc', '100': '#f1f5f9', '200': '#e2e8f0', '300': '#cbd5e1',
      '400': '#94a3b8', '500': '#64748b', '600': '#475569', '700': '#334155',
      '800': '#1e293b', '900': '#0f172a', '950': '#020617'
    }, black: '#000', white: '#fff'
  },
  orange: {
    orange: {
      '50': '#fff7ed', '100': '#ffedd5', '200': '#fed7aa', '300': '#fdba74',
      '400': '#fb923c', '500': '#f97316', '600': '#ea580c', '700': '#c2410c',
      '800': '#9a3412', '900': '#7c2d12', '950': '#431407'
    }, black: '#000', white: '#fff'
  }
};

const paletteKeys = Object.keys(palettes);

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randRange(min, max) { return +(min + Math.random() * (max - min)).toFixed(2); }

// ── Scene templates (one per background type) ────────────────────────────────
const sceneTemplates = [
  // 1. Clean Tech — fluid
  () => {
    const accent = pick(['#71ECFF', '#38bdf8', '#818cf8']);
    const colors = [accent, '#3b82f6', '#06b6d4', '#1C89FF'];
    const pal = palettes.cyan;
    return {
      title: 'Fluid Azure Tech Dashboard',
      short_description: 'A dynamic blue fluid background for modern tech interfaces.',
      long_description: 'Flowing blue and cyan fluid layers shift and blend with soft scanline texture, creating a polished tech-forward atmosphere. Perfect for SaaS dashboards, developer tools, and data visualization headers.',
      scene_data: {
        backgroundType: 'fluid',
        gradientConfig: {
          colors, numColors: 4, type: 'linear',
          startPos: { x: 0, y: 20 }, endPos: { x: 100, y: 80 },
          colorStops: [0, 30, 60, 100], waveIntensity: 0.25,
          mouseInfluence: 0.3, decaySpeed: 0.96,
          wave1Speed: 0.12, wave1Direction: 1,
          wave2Speed: 0.07, wave2Direction: -1
        },
        auroraConfig: { ...defaultAuroraConfig, backgroundColor: '#1C89FF', hueStart: 190, hueEnd: 220 },
        blobConfig: defaultBlobConfig,
        fluidConfig: {
          useGradientColors: true, backgroundColor: '#1C89FF',
          colors, speed: 0.8, intensity: 2.2, blurAmount: 35
        },
        wavesConfig: { ...defaultWavesConfig, colors },
        ribbonConfig: { ...defaultRibbonConfig, backgroundColor: '#1C89FF' },
        dandelionConfig: defaultDandelionConfig,
        particleRingConfig: defaultParticleRingConfig,
        shapeTrailConfig: defaultShapeTrailConfig,
        tessellationConfig: { ...defaultTessellationConfig, color: '#3b82f6' },
        effectsConfig: {
          blur: 10, texture: 'scanlines', textureSize: 25,
          textureOpacity: 0.35, textureBlendMode: 'overlay',
          colorMap: 'none', vignetteIntensity: 0,
          saturation: 100, contrast: 100, brightness: 100,
          flutedGlass: defaultFlutedGlass
        },
        textSections: [
          { id: 1, text: 'NEXUS', size: 120, weight: 700, spacing: 0.08, font: 'sans-serif', italic: false },
          { id: 2, text: 'cloud platform', size: 16, weight: 300, spacing: 0.3, font: 'sans-serif', italic: false }
        ],
        textGap: 14,
        textConfig: { enabled: true, color: '#ffffff', opacity: 0.85 },
        colorPalette: pal,
        selectedProjectIds: []
      }
    };
  },

  // 2. Premium Organic — liquid
  () => {
    const colors = ['#40204c', '#a3225c', '#e24926'];
    const pal = palettes.purple;
    return {
      title: 'Liquid Velvet Premium Portfolio',
      short_description: 'Warm purple and burgundy liquid blobs with vintage grain texture.',
      long_description: 'Rich liquid blobs morph through deep purple, burgundy, and burnt orange with film grain overlay and fluted glass refraction. The vintage color map adds analog warmth perfect for luxury brands and creative portfolios.',
      scene_data: {
        backgroundType: 'liquid',
        gradientConfig: {
          colors: [...colors, '#152a8e'], numColors: 4, type: 'radial',
          startPos: { x: 50, y: 50 }, endPos: { x: 100, y: 100 },
          colorStops: [0, 30, 60, 100], waveIntensity: 0.3,
          mouseInfluence: 0.35, decaySpeed: 0.95,
          wave1Speed: 0.1, wave1Direction: 1,
          wave2Speed: 0.06, wave2Direction: -1
        },
        auroraConfig: { ...defaultAuroraConfig, hueStart: 280, hueEnd: 320 },
        blobConfig: {
          ...defaultBlobConfig, colors,
          speed: 0.5, blobCount: 5, maxRadius: 120,
          blurAmount: 12, mouseInfluence: 0.3
        },
        fluidConfig: { ...defaultFluidConfig, backgroundColor: '#152a8e', colors: [...colors, '#152a8e'] },
        wavesConfig: { ...defaultWavesConfig, colors: [...colors, '#152a8e'] },
        ribbonConfig: { ...defaultRibbonConfig, backgroundColor: '#152a8e' },
        dandelionConfig: defaultDandelionConfig,
        particleRingConfig: defaultParticleRingConfig,
        shapeTrailConfig: defaultShapeTrailConfig,
        tessellationConfig: { ...defaultTessellationConfig, color: '#a3225c' },
        effectsConfig: {
          blur: 12, texture: 'grain', textureSize: 30,
          textureOpacity: 0.45, textureBlendMode: 'overlay',
          colorMap: 'vintage', vignetteIntensity: 0.35,
          saturation: 110, contrast: 105, brightness: 100,
          flutedGlass: {
            enabled: true, rotation: 75, segments: 85,
            motionSpeed: 1, motionValue: 0, overlayOpacity: 11,
            distortionStrength: 0.02, waveFrequency: 1
          }
        },
        textSections: [
          { id: 1, text: 'VELVET', size: 115, weight: 800, spacing: 0.1, font: 'serif', italic: false },
          { id: 2, text: 'creative studio', size: 16, weight: 300, spacing: 0.35, font: 'sans-serif', italic: false }
        ],
        textGap: 14,
        textConfig: { enabled: true, color: '#faff00', opacity: 0.82 },
        colorPalette: pal,
        selectedProjectIds: []
      }
    };
  },

  // 3. Elegant Minimal — ribbon
  () => {
    const accent = '#3b82f6';
    const colors = [accent, '#60a5fa', '#93c5fd', '#dbeafe'];
    const pal = palettes.blue;
    return {
      title: 'Ribbon Elegant White Corporate',
      short_description: 'Clean white ribbons with a single blue accent for professional interfaces.',
      long_description: 'Subtle ribbons sweep across a clean white canvas with soft blue accent tones. The minimal texture and restrained palette project corporate professionalism and clarity. Ideal for law firms, consultancies, and enterprise SaaS landing pages.',
      scene_data: {
        backgroundType: 'ribbon',
        gradientConfig: {
          colors, numColors: 4, type: 'linear',
          startPos: { x: 0, y: 0 }, endPos: { x: 100, y: 100 },
          colorStops: [0, 30, 60, 100], waveIntensity: 0.15,
          mouseInfluence: 0.2, decaySpeed: 0.96,
          wave1Speed: 0.08, wave1Direction: 1,
          wave2Speed: 0.05, wave2Direction: -1
        },
        auroraConfig: { ...defaultAuroraConfig, backgroundColor: '#ffffff', hueStart: 210, hueEnd: 230 },
        blobConfig: defaultBlobConfig,
        fluidConfig: { ...defaultFluidConfig, backgroundColor: '#ffffff', colors },
        wavesConfig: { ...defaultWavesConfig, colors },
        ribbonConfig: {
          useGradientColors: true, backgroundColor: '#ffffff',
          ribbonCount: 3, speed: 0.35, amplitude: 0.8, spread: 0.5,
          rotation: 40, thickness: 1, taper: -0.1, noise: 0, opacity: 0.55,
          colorCycleSpeed: 1.2, enableHoverEffect: true
        },
        dandelionConfig: defaultDandelionConfig,
        particleRingConfig: defaultParticleRingConfig,
        shapeTrailConfig: defaultShapeTrailConfig,
        tessellationConfig: { ...defaultTessellationConfig, color: accent },
        effectsConfig: {
          blur: 5, texture: 'none', textureSize: 30,
          textureOpacity: 0, textureBlendMode: 'overlay',
          colorMap: 'none', vignetteIntensity: 0,
          saturation: 100, contrast: 100, brightness: 100,
          flutedGlass: defaultFlutedGlass
        },
        textSections: [
          { id: 1, text: 'Meridian', size: 100, weight: 300, spacing: -0.02, font: 'serif', italic: false },
          { id: 2, text: 'ADVISORY GROUP', size: 14, weight: 500, spacing: 0.4, font: 'sans-serif', italic: false }
        ],
        textGap: 12,
        textConfig: { enabled: true, color: '#000000', opacity: 0.9 },
        colorPalette: pal,
        selectedProjectIds: []
      }
    };
  },

  // 4. Atmospheric Cinematic — aurora
  () => {
    const colors = ['#a855f7', '#06b6d4', '#71ECFF', '#8b5cf6'];
    const pal = palettes.purple;
    return {
      title: 'Aurora Cinematic Dark Northern Lights',
      short_description: 'Deep purple-to-cyan aurora on black with film grain and heavy vignette.',
      long_description: 'Ethereal aurora bands sweep through deep space in vivid purple and electric cyan. Film grain adds analog warmth while a strong vignette draws the eye inward. An immersive cinematic hero background for creative agencies and portfolio showcases.',
      scene_data: {
        backgroundType: 'aurora',
        gradientConfig: {
          colors, numColors: 4, type: 'radial',
          startPos: { x: 50, y: 40 }, endPos: { x: 100, y: 100 },
          colorStops: [0, 25, 55, 100], waveIntensity: 0.35,
          mouseInfluence: 0.3, decaySpeed: 0.95,
          wave1Speed: 0.1, wave1Direction: 1,
          wave2Speed: 0.07, wave2Direction: -1
        },
        auroraConfig: {
          hueStart: 130, hueEnd: 200, maxTTL: 50, minTTL: 190,
          maxWidth: 10, minWidth: 95, lineCount: 4,
          maxHeight: 50, minHeight: 900, blurAmount: 18,
          decaySpeed: 0.95, backgroundColor: '#000000',
          useGradientColors: true
        },
        blobConfig: defaultBlobConfig,
        fluidConfig: { ...defaultFluidConfig, backgroundColor: '#000000', colors },
        wavesConfig: { ...defaultWavesConfig, colors },
        ribbonConfig: { ...defaultRibbonConfig, backgroundColor: '#000000' },
        dandelionConfig: defaultDandelionConfig,
        particleRingConfig: defaultParticleRingConfig,
        shapeTrailConfig: defaultShapeTrailConfig,
        tessellationConfig: { ...defaultTessellationConfig, color: '#a855f7' },
        effectsConfig: {
          blur: 20, texture: 'grain', textureSize: 25,
          textureOpacity: 0.4, textureBlendMode: 'overlay',
          colorMap: 'none', vignetteIntensity: 0.4,
          saturation: 115, contrast: 110, brightness: 95,
          flutedGlass: defaultFlutedGlass
        },
        textSections: [
          { id: 1, text: 'POLARIS', size: 130, weight: 200, spacing: 0.15, font: 'sans-serif', italic: false },
          { id: 2, text: 'creative agency', size: 16, weight: 300, spacing: 0.3, font: 'sans-serif', italic: false }
        ],
        textGap: 16,
        textConfig: { enabled: true, color: '#ffffff', opacity: 0.85 },
        colorPalette: pal,
        selectedProjectIds: []
      }
    };
  },

  // 5. Ocean Waves — waves
  () => {
    const colors = ['#0ea5e9', '#06b6d4', '#14b8a6', '#0284c7'];
    const pal = palettes.cyan;
    return {
      title: 'Waves Teal Ocean Motion Header',
      short_description: 'Layered ocean waves in deep teal and aqua with smooth motion.',
      long_description: 'Multiple wave layers in teal, aqua, and deep sky blue ripple with organic fluidity. The gentle motion and marine palette evoke calm seas and coastal energy. Ideal for travel brands, marine industry, and wellness platforms.',
      scene_data: {
        backgroundType: 'waves',
        gradientConfig: {
          colors, numColors: 4, type: 'linear',
          startPos: { x: 0, y: 30 }, endPos: { x: 100, y: 70 },
          colorStops: [0, 30, 60, 100], waveIntensity: 0.2,
          mouseInfluence: 0.25, decaySpeed: 0.96,
          wave1Speed: 0.1, wave1Direction: 1,
          wave2Speed: 0.06, wave2Direction: -1
        },
        auroraConfig: { ...defaultAuroraConfig, backgroundColor: '#0ea5e9', hueStart: 175, hueEnd: 200 },
        blobConfig: defaultBlobConfig,
        fluidConfig: { ...defaultFluidConfig, backgroundColor: '#0ea5e9', colors },
        wavesConfig: {
          useGradientColors: true, colors,
          waveHeight: 0.06, waveFrequency: 1.8,
          rotation: 5, speed: 0.35, blur: 45,
          layers: 6, phaseOffset: 0.2
        },
        ribbonConfig: { ...defaultRibbonConfig, backgroundColor: '#0ea5e9' },
        dandelionConfig: defaultDandelionConfig,
        particleRingConfig: defaultParticleRingConfig,
        shapeTrailConfig: defaultShapeTrailConfig,
        tessellationConfig: { ...defaultTessellationConfig, color: '#06b6d4' },
        effectsConfig: {
          blur: 5, texture: 'none', textureSize: 30,
          textureOpacity: 0, textureBlendMode: 'overlay',
          colorMap: 'none', vignetteIntensity: 0.2,
          saturation: 105, contrast: 100, brightness: 100,
          flutedGlass: defaultFlutedGlass
        },
        textSections: [
          { id: 1, text: 'Oceana', size: 110, weight: 400, spacing: -0.01, font: 'serif', italic: true },
          { id: 2, text: 'COASTAL RETREATS', size: 15, weight: 400, spacing: 0.35, font: 'sans-serif', italic: false }
        ],
        textGap: 14,
        textConfig: { enabled: true, color: '#ffffff', opacity: 0.9 },
        colorPalette: pal,
        selectedProjectIds: []
      }
    };
  },

  // 6. Subtle Texture — dandelion
  () => {
    const colors = ['#f59e0b', '#fbbf24', '#fcd34d', '#d97706'];
    const pal = palettes.amber;
    return {
      title: 'Dandelion Warm Gentle Wellness',
      short_description: 'Soft dandelion wisps on a warm cream background with dot texture.',
      long_description: 'Delicate dandelion tendrils float gently across a warm cream canvas with a subtle dot overlay. The warm amber and golden palette radiates calm and organic beauty. Built for wellness brands, yoga studios, and lifestyle blogs.',
      scene_data: {
        backgroundType: 'dandelion',
        gradientConfig: {
          colors, numColors: 4, type: 'linear',
          startPos: { x: 30, y: 0 }, endPos: { x: 70, y: 100 },
          colorStops: [0, 30, 60, 100], waveIntensity: 0.1,
          mouseInfluence: 0.15, decaySpeed: 0.96,
          wave1Speed: 0.06, wave1Direction: 1,
          wave2Speed: 0.04, wave2Direction: -1
        },
        auroraConfig: { ...defaultAuroraConfig, backgroundColor: '#fef3c7', hueStart: 35, hueEnd: 50 },
        blobConfig: defaultBlobConfig,
        fluidConfig: { ...defaultFluidConfig, backgroundColor: '#fef3c7', colors },
        wavesConfig: { ...defaultWavesConfig, colors },
        ribbonConfig: { ...defaultRibbonConfig, backgroundColor: '#fef3c7' },
        dandelionConfig: {
          useGradientColors: true, backgroundColor: '#fef3c7',
          lineCount: 100, radiusMin: 0.12, radiusMax: 0.75,
          speed: 0.25, thickness: 1.2, dotSize: 2.5,
          spread: 0.35, centerY: 0.8
        },
        particleRingConfig: defaultParticleRingConfig,
        shapeTrailConfig: defaultShapeTrailConfig,
        tessellationConfig: { ...defaultTessellationConfig, color: '#f59e0b' },
        effectsConfig: {
          blur: 3, texture: 'dots', textureSize: 30,
          textureOpacity: 0.25, textureBlendMode: 'overlay',
          colorMap: 'none', vignetteIntensity: 0,
          saturation: 90, contrast: 100, brightness: 105,
          flutedGlass: defaultFlutedGlass
        },
        textSections: [
          { id: 1, text: 'Solace', size: 100, weight: 300, spacing: 0.02, font: 'serif', italic: true },
          { id: 2, text: 'WELLNESS COLLECTIVE', size: 13, weight: 400, spacing: 0.35, font: 'sans-serif', italic: false }
        ],
        textGap: 12,
        textConfig: { enabled: true, color: '#78350f', opacity: 0.88 },
        colorPalette: pal,
        selectedProjectIds: []
      }
    };
  },

  // 7. Minimal Gradient — simple
  () => {
    const colors = ['#f8fafc', '#e2e8f0', '#94a3b8', '#64748b'];
    const pal = palettes.slate;
    return {
      title: 'Simple Slate Minimal Gradient',
      short_description: 'A clean slate gradient background with no texture or effects.',
      long_description: 'A pure, distraction-free gradient from near-white to cool slate gray. Designed for maximum text readability and accessibility. Ideal for documentation sites, text-heavy pages, and content-first interfaces.',
      scene_data: {
        backgroundType: 'simple',
        gradientConfig: {
          colors, numColors: 4, type: 'linear',
          startPos: { x: 0, y: 0 }, endPos: { x: 100, y: 100 },
          colorStops: [0, 30, 60, 100], waveIntensity: 0.08,
          mouseInfluence: 0.1, decaySpeed: 0.97,
          wave1Speed: 0.05, wave1Direction: 1,
          wave2Speed: 0.03, wave2Direction: -1
        },
        auroraConfig: { ...defaultAuroraConfig, backgroundColor: '#f8fafc', hueStart: 210, hueEnd: 220 },
        blobConfig: defaultBlobConfig,
        fluidConfig: { ...defaultFluidConfig, backgroundColor: '#f8fafc', colors },
        wavesConfig: { ...defaultWavesConfig, colors },
        ribbonConfig: { ...defaultRibbonConfig, backgroundColor: '#f8fafc' },
        dandelionConfig: defaultDandelionConfig,
        particleRingConfig: defaultParticleRingConfig,
        shapeTrailConfig: defaultShapeTrailConfig,
        tessellationConfig: { ...defaultTessellationConfig, enabled: false, color: '#94a3b8' },
        effectsConfig: {
          blur: 3, texture: 'none', textureSize: 30,
          textureOpacity: 0, textureBlendMode: 'overlay',
          colorMap: 'none', vignetteIntensity: 0,
          saturation: 100, contrast: 100, brightness: 100,
          flutedGlass: defaultFlutedGlass
        },
        textSections: [
          { id: 1, text: 'Clarity', size: 96, weight: 200, spacing: 0.05, font: 'sans-serif', italic: false },
          { id: 2, text: 'DOCUMENTATION', size: 14, weight: 500, spacing: 0.4, font: 'sans-serif', italic: false }
        ],
        textGap: 12,
        textConfig: { enabled: true, color: '#0f172a', opacity: 0.9 },
        colorPalette: pal,
        selectedProjectIds: []
      }
    };
  },

  // 8. Dynamic Energy — particleRing
  () => {
    const colors = ['#ec4899', '#71ECFF', '#3b82f6', '#a855f7'];
    const pal = palettes.rose;
    return {
      title: 'Particle Ring Neon Cyberpunk Orbit',
      short_description: 'Neon pink and cyan particles orbiting in cyberpunk space.',
      long_description: 'A dense ring of neon-lit particles orbits through dark space with diagonal texture and cyberpunk color mapping. Pink, cyan, and electric blue create a high-energy futuristic atmosphere. Perfect for gaming brands, startup launches, and sci-fi interfaces.',
      scene_data: {
        backgroundType: 'particleRing',
        gradientConfig: {
          colors, numColors: 4, type: 'radial',
          startPos: { x: 50, y: 50 }, endPos: { x: 100, y: 100 },
          colorStops: [0, 30, 60, 100], waveIntensity: 0.2,
          mouseInfluence: 0.25, decaySpeed: 0.96,
          wave1Speed: 0.1, wave1Direction: 1,
          wave2Speed: 0.06, wave2Direction: -1
        },
        auroraConfig: { ...defaultAuroraConfig, hueStart: 300, hueEnd: 340 },
        blobConfig: defaultBlobConfig,
        fluidConfig: { ...defaultFluidConfig, backgroundColor: '#000000', colors },
        wavesConfig: { ...defaultWavesConfig, colors },
        ribbonConfig: { ...defaultRibbonConfig, backgroundColor: '#000000' },
        dandelionConfig: defaultDandelionConfig,
        particleRingConfig: {
          useGradientColors: true, backgroundColor: '#000000',
          particleCount: 1200, ringRadius: 0.38, ringWidth: 0.12,
          speed: 0.4, particleSize: 2.5, dispersion: 0.2,
          rotationSpeed: 0.15, tiltX: 30, tiltZ: -10
        },
        shapeTrailConfig: defaultShapeTrailConfig,
        tessellationConfig: { ...defaultTessellationConfig, color: '#ec4899' },
        effectsConfig: {
          blur: 7, texture: 'diagonal', textureSize: 35,
          textureOpacity: 0.3, textureBlendMode: 'overlay',
          colorMap: 'cyberpunk', vignetteIntensity: 0.2,
          saturation: 120, contrast: 110, brightness: 100,
          flutedGlass: defaultFlutedGlass
        },
        textSections: [
          { id: 1, text: 'VORTEX', size: 125, weight: 900, spacing: 0.06, font: 'sans-serif', italic: false },
          { id: 2, text: 'game studio', size: 16, weight: 300, spacing: 0.3, font: 'sans-serif', italic: false }
        ],
        textGap: 14,
        textConfig: { enabled: true, color: '#71ECFF', opacity: 0.9 },
        colorPalette: pal,
        selectedProjectIds: []
      }
    };
  }
];

// ── Generate scenes ──────────────────────────────────────────────────────────
let scenes;

if (requestedType) {
  const typeMap = {
    fluid: 0, liquid: 1, ribbon: 2, aurora: 3,
    waves: 4, dandelion: 5, simple: 6, particleRing: 7
  };
  const idx = typeMap[requestedType];
  if (idx === undefined) {
    console.error(`Unknown type: ${requestedType}. Valid types: ${Object.keys(typeMap).join(', ')}`);
    process.exit(1);
  }
  scenes = [sceneTemplates[idx]()];
} else if (requestedCount) {
  scenes = [];
  for (let i = 0; i < requestedCount; i++) {
    scenes.push(sceneTemplates[i % sceneTemplates.length]());
  }
} else {
  // Default: generate all 8 (one per type)
  scenes = sceneTemplates.map(fn => fn());
}

// ── Output ───────────────────────────────────────────────────────────────────
let existing = [];
if (existsSync(outputFile)) {
  try {
    existing = JSON.parse(readFileSync(outputFile, 'utf8'));
    if (!Array.isArray(existing)) existing = [];
  } catch { existing = []; }
}

const merged = [...existing, ...scenes];
writeFileSync(outputFile, JSON.stringify(merged, null, 2) + '\n');

console.log(`Generated ${scenes.length} scene(s) across ${new Set(scenes.map(s => s.scene_data.backgroundType)).size} background type(s).`);
console.log(`Total scenes in ${outputFile}: ${merged.length}`);
console.log('');
console.log('Scenes created:');
scenes.forEach((s, i) => {
  console.log(`  ${i + 1}. [${s.scene_data.backgroundType}] ${s.title}`);
});
