import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { deepMerge } from '../lib/themeUtils'

// localStorage key for color palette
const COLOR_PALETTE_STORAGE_KEY = 'aura-color-palette'

// Default Tailwind OKLCH color palette
const DEFAULT_PALETTE = {
  "black": "#000",
  "white": "#fff",
  "red": {
    "50": "oklch(0.971 0.013 17.380)",
    "100": "oklch(0.936 0.032 17.717)",
    "200": "oklch(0.885 0.062 18.334)",
    "300": "oklch(0.808 0.114 19.571)",
    "400": "oklch(0.704 0.191 22.216)",
    "500": "oklch(0.637 0.237 25.331)",
    "600": "oklch(0.577 0.245 27.325)",
    "700": "oklch(0.505 0.213 27.518)",
    "800": "oklch(0.444 0.177 26.899)",
    "900": "oklch(0.396 0.141 25.723)",
    "950": "oklch(0.258 0.092 26.042)"
  },
  "orange": {
    "50": "oklch(0.980 0.016 73.684)",
    "100": "oklch(0.954 0.038 75.164)",
    "200": "oklch(0.901 0.076 70.697)",
    "300": "oklch(0.837 0.128 66.290)",
    "400": "oklch(0.750 0.183 55.934)",
    "500": "oklch(0.705 0.213 47.604)",
    "600": "oklch(0.646 0.222 41.116)",
    "700": "oklch(0.553 0.195 38.402)",
    "800": "oklch(0.470 0.157 37.304)",
    "900": "oklch(0.408 0.123 38.172)",
    "950": "oklch(0.266 0.079 36.259)"
  },
  "amber": {
    "50": "oklch(0.987 0.022 95.277)",
    "100": "oklch(0.962 0.059 95.617)",
    "200": "oklch(0.924 0.120 95.746)",
    "300": "oklch(0.879 0.169 91.605)",
    "400": "oklch(0.828 0.189 84.429)",
    "500": "oklch(0.769 0.188 70.080)",
    "600": "oklch(0.666 0.179 58.318)",
    "700": "oklch(0.555 0.163 48.998)",
    "800": "oklch(0.473 0.137 46.201)",
    "900": "oklch(0.414 0.112 45.904)",
    "950": "oklch(0.279 0.077 45.635)"
  },
  "yellow": {
    "50": "oklch(0.987 0.026 102.212)",
    "100": "oklch(0.973 0.071 103.193)",
    "200": "oklch(0.945 0.129 101.540)",
    "300": "oklch(0.905 0.182 98.111)",
    "400": "oklch(0.852 0.199 91.936)",
    "500": "oklch(0.795 0.184 86.047)",
    "600": "oklch(0.681 0.162 75.834)",
    "700": "oklch(0.554 0.135 66.442)",
    "800": "oklch(0.476 0.114 61.907)",
    "900": "oklch(0.421 0.095 57.708)",
    "950": "oklch(0.286 0.066 53.813)"
  },
  "lime": {
    "50": "oklch(0.986 0.031 120.757)",
    "100": "oklch(0.967 0.067 122.328)",
    "200": "oklch(0.938 0.127 124.321)",
    "300": "oklch(0.897 0.196 126.665)",
    "400": "oklch(0.841 0.238 128.850)",
    "500": "oklch(0.768 0.233 130.850)",
    "600": "oklch(0.648 0.200 131.684)",
    "700": "oklch(0.532 0.157 131.589)",
    "800": "oklch(0.453 0.124 130.933)",
    "900": "oklch(0.405 0.101 131.063)",
    "950": "oklch(0.274 0.072 132.109)"
  },
  "green": {
    "50": "oklch(0.982 0.018 155.826)",
    "100": "oklch(0.962 0.044 156.743)",
    "200": "oklch(0.925 0.084 155.995)",
    "300": "oklch(0.871 0.150 154.449)",
    "400": "oklch(0.792 0.209 151.711)",
    "500": "oklch(0.723 0.219 149.579)",
    "600": "oklch(0.627 0.194 149.214)",
    "700": "oklch(0.527 0.154 150.069)",
    "800": "oklch(0.448 0.119 151.328)",
    "900": "oklch(0.393 0.095 152.535)",
    "950": "oklch(0.266 0.065 152.934)"
  },
  "emerald": {
    "50": "oklch(0.979 0.021 166.113)",
    "100": "oklch(0.950 0.052 163.051)",
    "200": "oklch(0.905 0.093 164.150)",
    "300": "oklch(0.845 0.143 164.978)",
    "400": "oklch(0.765 0.177 163.223)",
    "500": "oklch(0.696 0.170 162.480)",
    "600": "oklch(0.596 0.145 163.225)",
    "700": "oklch(0.508 0.118 165.612)",
    "800": "oklch(0.432 0.095 166.913)",
    "900": "oklch(0.378 0.077 168.940)",
    "950": "oklch(0.262 0.051 172.552)"
  },
  "teal": {
    "50": "oklch(0.984 0.014 180.720)",
    "100": "oklch(0.953 0.051 180.801)",
    "200": "oklch(0.910 0.096 180.426)",
    "300": "oklch(0.855 0.138 181.071)",
    "400": "oklch(0.777 0.152 181.912)",
    "500": "oklch(0.704 0.140 182.503)",
    "600": "oklch(0.600 0.118 184.704)",
    "700": "oklch(0.511 0.096 186.391)",
    "800": "oklch(0.437 0.078 188.216)",
    "900": "oklch(0.386 0.063 188.416)",
    "950": "oklch(0.277 0.046 192.524)"
  },
  "cyan": {
    "50": "oklch(0.984 0.019 200.873)",
    "100": "oklch(0.956 0.045 203.388)",
    "200": "oklch(0.917 0.080 205.041)",
    "300": "oklch(0.865 0.127 207.078)",
    "400": "oklch(0.789 0.154 211.530)",
    "500": "oklch(0.715 0.143 215.221)",
    "600": "oklch(0.609 0.126 221.723)",
    "700": "oklch(0.520 0.105 223.128)",
    "800": "oklch(0.450 0.085 224.283)",
    "900": "oklch(0.398 0.070 227.392)",
    "950": "oklch(0.302 0.056 229.695)"
  },
  "sky": {
    "50": "oklch(0.977 0.013 236.620)",
    "100": "oklch(0.951 0.026 236.824)",
    "200": "oklch(0.901 0.058 230.902)",
    "300": "oklch(0.828 0.111 230.318)",
    "400": "oklch(0.746 0.160 232.661)",
    "500": "oklch(0.685 0.169 237.323)",
    "600": "oklch(0.588 0.158 241.966)",
    "700": "oklch(0.500 0.134 242.749)",
    "800": "oklch(0.443 0.110 240.790)",
    "900": "oklch(0.391 0.090 240.876)",
    "950": "oklch(0.293 0.066 243.157)"
  },
  "blue": {
    "50": "oklch(0.970 0.014 254.604)",
    "100": "oklch(0.932 0.032 255.585)",
    "200": "oklch(0.882 0.059 254.128)",
    "300": "oklch(0.809 0.105 251.813)",
    "400": "oklch(0.707 0.165 254.624)",
    "500": "oklch(0.623 0.214 259.815)",
    "600": "oklch(0.546 0.245 262.881)",
    "700": "oklch(0.488 0.243 264.376)",
    "800": "oklch(0.424 0.199 265.638)",
    "900": "oklch(0.379 0.146 265.522)",
    "950": "oklch(0.282 0.091 267.935)"
  },
  "indigo": {
    "50": "oklch(0.962 0.018 272.314)",
    "100": "oklch(0.930 0.034 272.788)",
    "200": "oklch(0.870 0.065 274.039)",
    "300": "oklch(0.785 0.115 274.713)",
    "400": "oklch(0.673 0.182 276.935)",
    "500": "oklch(0.585 0.233 277.117)",
    "600": "oklch(0.511 0.262 276.966)",
    "700": "oklch(0.457 0.240 277.023)",
    "800": "oklch(0.398 0.195 277.366)",
    "900": "oklch(0.359 0.144 278.697)",
    "950": "oklch(0.257 0.090 281.288)"
  },
  "violet": {
    "50": "oklch(0.969 0.016 293.756)",
    "100": "oklch(0.943 0.029 294.588)",
    "200": "oklch(0.894 0.057 293.283)",
    "300": "oklch(0.811 0.111 293.571)",
    "400": "oklch(0.702 0.183 293.541)",
    "500": "oklch(0.606 0.250 292.717)",
    "600": "oklch(0.541 0.281 293.009)",
    "700": "oklch(0.491 0.270 292.581)",
    "800": "oklch(0.432 0.232 292.759)",
    "900": "oklch(0.380 0.189 293.745)",
    "950": "oklch(0.283 0.141 291.089)"
  },
  "purple": {
    "50": "oklch(0.977 0.014 308.299)",
    "100": "oklch(0.946 0.033 307.174)",
    "200": "oklch(0.902 0.063 306.703)",
    "300": "oklch(0.827 0.119 306.383)",
    "400": "oklch(0.714 0.203 305.504)",
    "500": "oklch(0.627 0.265 303.900)",
    "600": "oklch(0.558 0.288 302.321)",
    "700": "oklch(0.496 0.265 301.924)",
    "800": "oklch(0.438 0.218 303.724)",
    "900": "oklch(0.381 0.176 304.987)",
    "950": "oklch(0.291 0.149 302.717)"
  },
  "fuchsia": {
    "50": "oklch(0.977 0.017 320.058)",
    "100": "oklch(0.952 0.037 318.852)",
    "200": "oklch(0.903 0.076 319.620)",
    "300": "oklch(0.833 0.145 321.434)",
    "400": "oklch(0.740 0.238 322.160)",
    "500": "oklch(0.667 0.295 322.150)",
    "600": "oklch(0.591 0.293 322.896)",
    "700": "oklch(0.518 0.253 323.949)",
    "800": "oklch(0.452 0.211 324.591)",
    "900": "oklch(0.401 0.170 325.612)",
    "950": "oklch(0.293 0.136 325.661)"
  },
  "pink": {
    "50": "oklch(0.971 0.014 343.198)",
    "100": "oklch(0.948 0.028 342.258)",
    "200": "oklch(0.899 0.061 343.231)",
    "300": "oklch(0.823 0.120 346.018)",
    "400": "oklch(0.718 0.202 349.761)",
    "500": "oklch(0.656 0.241 354.308)",
    "600": "oklch(0.592 0.249 0.584)",
    "700": "oklch(0.525 0.223 3.958)",
    "800": "oklch(0.459 0.187 3.815)",
    "900": "oklch(0.408 0.153 2.432)",
    "950": "oklch(0.284 0.109 3.907)"
  },
  "rose": {
    "50": "oklch(0.969 0.015 12.422)",
    "100": "oklch(0.941 0.030 12.580)",
    "200": "oklch(0.892 0.058 10.001)",
    "300": "oklch(0.810 0.117 11.638)",
    "400": "oklch(0.712 0.194 13.428)",
    "500": "oklch(0.645 0.246 16.439)",
    "600": "oklch(0.586 0.253 17.585)",
    "700": "oklch(0.514 0.222 16.935)",
    "800": "oklch(0.455 0.188 13.697)",
    "900": "oklch(0.410 0.159 10.272)",
    "950": "oklch(0.271 0.105 12.094)"
  },
  "slate": {
    "50": "oklch(0.984 0.003 247.858)",
    "100": "oklch(0.968 0.007 247.896)",
    "200": "oklch(0.929 0.013 255.508)",
    "300": "oklch(0.869 0.022 252.894)",
    "400": "oklch(0.704 0.040 256.788)",
    "500": "oklch(0.554 0.046 257.417)",
    "600": "oklch(0.446 0.043 257.281)",
    "700": "oklch(0.372 0.044 257.287)",
    "800": "oklch(0.279 0.041 260.031)",
    "900": "oklch(0.208 0.042 265.755)",
    "950": "oklch(0.129 0.042 264.695)"
  },
  "gray": {
    "50": "oklch(0.985 0.002 247.839)",
    "100": "oklch(0.967 0.003 264.542)",
    "200": "oklch(0.928 0.006 264.531)",
    "300": "oklch(0.872 0.010 258.338)",
    "400": "oklch(0.707 0.022 261.325)",
    "500": "oklch(0.551 0.027 264.364)",
    "600": "oklch(0.446 0.030 256.802)",
    "700": "oklch(0.373 0.034 259.733)",
    "800": "oklch(0.278 0.033 256.848)",
    "900": "oklch(0.210 0.034 264.665)",
    "950": "oklch(0.130 0.028 261.692)"
  },
  "zinc": {
    "50": "oklch(0.985 0.000 0.000)",
    "100": "oklch(0.967 0.001 286.375)",
    "200": "oklch(0.920 0.004 286.320)",
    "300": "oklch(0.871 0.006 286.286)",
    "400": "oklch(0.705 0.015 286.067)",
    "500": "oklch(0.552 0.016 285.938)",
    "600": "oklch(0.442 0.017 285.786)",
    "700": "oklch(0.370 0.013 285.805)",
    "800": "oklch(0.274 0.006 286.033)",
    "900": "oklch(0.210 0.006 285.885)",
    "950": "oklch(0.141 0.005 285.823)"
  },
  "neutral": {
    "50": "oklch(0.985 0.000 0.000)",
    "100": "oklch(0.970 0.000 0.000)",
    "200": "oklch(0.922 0.000 0.000)",
    "300": "oklch(0.870 0.000 0.000)",
    "400": "oklch(0.708 0.000 0.000)",
    "500": "oklch(0.556 0.000 0.000)",
    "600": "oklch(0.439 0.000 0.000)",
    "700": "oklch(0.371 0.000 0.000)",
    "800": "oklch(0.269 0.000 0.000)",
    "900": "oklch(0.205 0.000 0.000)",
    "950": "oklch(0.145 0.000 0.000)"
  },
  "stone": {
    "50": "oklch(0.985 0.001 106.423)",
    "100": "oklch(0.970 0.001 106.424)",
    "200": "oklch(0.923 0.003 48.717)",
    "300": "oklch(0.869 0.005 56.366)",
    "400": "oklch(0.709 0.010 56.259)",
    "500": "oklch(0.553 0.013 58.071)",
    "600": "oklch(0.444 0.011 73.639)",
    "700": "oklch(0.374 0.010 67.558)",
    "800": "oklch(0.268 0.007 34.298)",
    "900": "oklch(0.216 0.006 56.043)",
    "950": "oklch(0.147 0.004 49.250)"
  }
}

// Create the store with slices for each config type
const useStore = create((set, get) => ({
  // Mouse state
  mousePos: { x: 0.5, y: 0.5 },
  setMousePos: (pos) => set({ mousePos: pos }),

  // Master input toggle (mouse + audio)
  inputEnabled: true,
  setInputEnabled: (enabled) => set({ inputEnabled: enabled }),

  // Global mouse effect config
  mouseConfig: { enabled: true, intensity: 0.5 },
  setMouseConfig: (config) => set({ mouseConfig: config }),

  // UI state
  activePanel: 'gradient',
  setActivePanel: (panel) => set({ activePanel: panel }),

  isPaused: false,
  setIsPaused: (paused) => set({ isPaused: paused }),

  // Background type
  backgroundType: 'mesh',
  setBackgroundType: (type) => set({ backgroundType: type }),

  // Gradient config
  gradientConfig: {
    colors: ['#b80038', '#fdf7f2', '#004d9c', '#00999a'],
    numColors: 4,
    type: 'radial',
    startPos: { x: 0, y: 0 },
    endPos: { x: 100, y: 100 },
    colorStops: [0, 33, 66, 100],
    waveIntensity: 0.3,
    mouseInfluence: 0.5,
    decaySpeed: 0.95,
    wave1Speed: 0.2,
    wave1Direction: 1,
    wave2Speed: 0.15,
    wave2Direction: -1,
  },
  setGradientConfig: (config) => set({ gradientConfig: config }),
  updateGradientConfig: (updates) => set((state) => ({
    gradientConfig: { ...state.gradientConfig, ...updates }
  })),

  // Aurora config
  auroraConfig: {
    width: 20,
    minHeight: 200,
    maxHeight: 600,
    ttl: 200,
    blurAmount: 13,
    hueStart: 120,
    hueEnd: 180,
    backgroundColor: '#000000',
    lineCount: 0,
    decaySpeed: 0.95,
    useGradientColors: true,
  },
  setAuroraConfig: (config) => set({ auroraConfig: config }),
  updateAuroraConfig: (updates) => set((state) => ({
    auroraConfig: { ...state.auroraConfig, ...updates }
  })),

  // Blob config
  blobConfig: {
    blobCount: 5,
    minRadius: 40,
    maxRadius: 120,
    speed: 0.5,
    orbitRadius: 150,
    blurAmount: 12,
    threshold: 180,
    mouseInfluence: 0.3,
    decaySpeed: 0.95,
    useGradientColors: true,
    colors: ['#40204c', '#a3225c', '#e24926'],
    backgroundColor: '#152a8e',
  },
  setBlobConfig: (config) => set({ blobConfig: config }),
  updateBlobConfig: (updates) => set((state) => ({
    blobConfig: { ...state.blobConfig, ...updates }
  })),

  // Fluid config
  fluidConfig: {
    useGradientColors: true,
    backgroundColor: '#1C89FF',
    colors: ['#71ECFF', '#39F58A', '#71ECFF', '#F0CBA8'],
    speed: 1,
    intensity: 1,
    blurAmount: 20,
  },
  setFluidConfig: (config) => set({ fluidConfig: config }),
  updateFluidConfig: (updates) => set((state) => ({
    fluidConfig: { ...state.fluidConfig, ...updates }
  })),

  // Waves config
  wavesConfig: {
    useGradientColors: true,
    colors: ['#06b6d4', '#a855f7', '#ec4899', '#3b82f6'],
    waveHeight: 0.05,
    waveFrequency: 2,
    rotation: 0,
    speed: 0.5,
    blur: 40,
    layers: 5,
    phaseOffset: 0,
  },
  setWavesConfig: (config) => set({ wavesConfig: config }),
  updateWavesConfig: (updates) => set((state) => ({
    wavesConfig: { ...state.wavesConfig, ...updates }
  })),

  // Ribbon config
  ribbonConfig: {
    useGradientColors: true,
    backgroundColor: '#ffffff',
    ribbonCount: 5,
    speed: 0.5,
    amplitude: 1.0,
    spread: 0.5,
    rotation: -30,
    thickness: 1,
    taper: -0.3,
    noise: 0.5,
    opacity: 0.85,
  },
  setRibbonConfig: (config) => set({ ribbonConfig: config }),
  updateRibbonConfig: (updates) => set((state) => ({
    ribbonConfig: { ...state.ribbonConfig, ...updates }
  })),

  // Dandelion config
  dandelionConfig: {
    useGradientColors: true,
    backgroundColor: '#e8f4fc',
    radialGradientColors: ['#e8f4fc', '#fef3c7'],
    radialGradientStops: [0, 100],
    gradientEndX: 100,
    gradientEndY: 100,
    lineCount: 120,
    radiusMin: 0.1,
    radiusMax: 0.8,
    speed: 0.3,
    thickness: 1.5,
    dotSize: 3,
    spread: 0.3,
    centerY: 0.85,
    lineOpacity: 0.8,
  },
  setDandelionConfig: (config) => set({ dandelionConfig: config }),
  updateDandelionConfig: (updates) => set((state) => ({
    dandelionConfig: { ...state.dandelionConfig, ...updates }
  })),

  // ParticleRing config
  particleRingConfig: {
    useGradientColors: true,
    backgroundColor: '#fef6f9',
    radialGradientColors: ['#fef6f9', '#fef3c7'],
    radialGradientStops: [0, 100],
    gradientEndX: 100,
    gradientEndY: 100,
    particleCount: 800,
    ringRadius: 0.35,
    ringWidth: 0.15,
    speed: 0.5,
    particleSize: 3,
    dispersion: 0.3,
    rotationSpeed: 0.2,
    tiltX: 0,
    tiltZ: 0,
  },
  setParticleRingConfig: (config) => set({ particleRingConfig: config }),
  updateParticleRingConfig: (updates) => set((state) => ({
    particleRingConfig: { ...state.particleRingConfig, ...updates }
  })),

  // ShapeTrail config
  shapeTrailConfig: {
    useGradientColors: true,
    backgroundColor: '#f0f0f0',
    shape: 'circle',
    startScale: 1000,
    endScale: 2000,
    sizeCycles: 1,
    gap: 30,
    rotationOffset: 15,
    speed: 0.3,
    pathComplexity: 4,
    opacity: 0.8,
    blendMode: 'normal',
    trailCount: 3,
    trailColorStops: null,
  },
  setShapeTrailConfig: (config) => set({ shapeTrailConfig: config }),
  updateShapeTrailConfig: (updates) => set((state) => ({
    shapeTrailConfig: { ...state.shapeTrailConfig, ...updates }
  })),

  // Tessellation config
  tessellationConfig: {
    enabled: true,
    icon: 'Star',
    rowGap: 60,
    colGap: 60,
    size: 24,
    opacity: 0.15,
    rotation: 0,
    color: '#ffffff',
    mouseRotationInfluence: 0.5,
  },
  setTessellationConfig: (config) => set({ tessellationConfig: config }),
  updateTessellationConfig: (updates) => set((state) => ({
    tessellationConfig: { ...state.tessellationConfig, ...updates }
  })),

  // Effects config
  effectsConfig: {
    blur: 0,
    texture: 'none',
    textureSize: 20,
    textureOpacity: 0.5,
    textureBlendMode: 'overlay',
    colorMap: 'none',
    vignetteIntensity: 0.3,
    saturation: 100,
    contrast: 100,
    brightness: 100,
    flutedGlass: {
      enabled: false,
      segments: 80,
      rotation: 0,
      motionValue: 0.5,
      motionSpeed: 0.5,
      overlayOpacity: 0,
      distortionStrength: 0.02,
      waveFrequency: 1,
    },
  },
  setEffectsConfig: (config) => set({ effectsConfig: config }),
  updateEffectsConfig: (updates) => set((state) => ({
    effectsConfig: { ...state.effectsConfig, ...updates }
  })),

  // Text config
  textSections: [
    { id: 1, text: 'Aura', size: 120, weight: 900, spacing: -0.1, font: 'mono' },
    { id: 2, text: 'BY PROMAD', size: 20, weight: 300, spacing: 0.2, font: 'sans-serif' },
  ],
  textGap: 20,
  textConfig: {
    enabled: true,
    color: '#ffffff',
    opacity: 1,
  },
  setTextSections: (sections) => set({ textSections: sections }),
  setTextGap: (gap) => set({ textGap: gap }),
  setTextConfig: (config) => set({ textConfig: config }),
  updateTextConfig: (updates) => set((state) => ({
    textConfig: { ...state.textConfig, ...updates }
  })),

  // Projects linked to this scene (array of project IDs)
  selectedProjectIds: [],
  setSelectedProjectIds: (ids) => set({ selectedProjectIds: ids }),
  addProjectToScene: (projectId) => set((state) => ({
    selectedProjectIds: state.selectedProjectIds.includes(projectId)
      ? state.selectedProjectIds
      : [...state.selectedProjectIds, projectId]
  })),
  removeProjectFromScene: (projectId) => set((state) => ({
    selectedProjectIds: state.selectedProjectIds.filter(id => id !== projectId)
  })),

  // Color palette with localStorage persistence
  colorPalette: (() => {
    try {
      const stored = localStorage.getItem(COLOR_PALETTE_STORAGE_KEY)
      return stored ? JSON.parse(stored) : DEFAULT_PALETTE
    } catch {
      return DEFAULT_PALETTE
    }
  })(),
  setColorPalette: (palette) => {
    // Save to localStorage
    try {
      if (palette) {
        localStorage.setItem(COLOR_PALETTE_STORAGE_KEY, JSON.stringify(palette))
      } else {
        localStorage.removeItem(COLOR_PALETTE_STORAGE_KEY)
      }
    } catch (e) {
      console.warn('Failed to save color palette to localStorage:', e)
    }
    set({ colorPalette: palette })
  },
  clearColorPalette: () => {
    try {
      localStorage.removeItem(COLOR_PALETTE_STORAGE_KEY)
    } catch (e) {
      console.warn('Failed to clear color palette from localStorage:', e)
    }
    set({ colorPalette: null })
  },

  // Theme overrides (dark is the base config, light stores only differences)
  themeOverrides: { light: {} },
  editorThemeMode: 'dark', // 'dark' | 'light' — which mode the editor previews
  setEditorThemeMode: (mode) => set({ editorThemeMode: mode }),
  setThemeOverrides: (overrides) => set({ themeOverrides: overrides }),
  setLightOverride: (configKey, partialOverride) => set((state) => ({
    themeOverrides: {
      ...state.themeOverrides,
      light: {
        ...state.themeOverrides.light,
        [configKey]: deepMerge(
          state.themeOverrides.light[configKey] || {},
          partialOverride
        ),
      },
    },
  })),
  clearLightOverride: (configKey) => set((state) => {
    const { [configKey]: _, ...rest } = state.themeOverrides.light
    return { themeOverrides: { ...state.themeOverrides, light: rest } }
  }),

  // Audio reactivity config
  audioConfig: {
    enabled: false,
    source: 'mic',        // 'mic' | 'file'
    sensitivity: 1.0,
    smoothing: 0.8,
    fileName: null,
  },
  updateAudioConfig: (updates) => set((state) => ({
    audioConfig: { ...state.audioConfig, ...updates }
  })),

  // Scene management
  currentSceneId: null,
  setCurrentSceneId: (id) => set({ currentSceneId: id }),

  // Navigation
  currentPage: 'editor', // 'editor' | 'scenes'
  setCurrentPage: (page) => set({ currentPage: page }),

  // Get current scene data as JSON
  getSceneData: () => {
    const state = get()
    return {
      backgroundType: state.backgroundType,
      gradientConfig: state.gradientConfig,
      auroraConfig: state.auroraConfig,
      blobConfig: state.blobConfig,
      fluidConfig: state.fluidConfig,
      wavesConfig: state.wavesConfig,
      ribbonConfig: state.ribbonConfig,
      dandelionConfig: state.dandelionConfig,
      particleRingConfig: state.particleRingConfig,
      shapeTrailConfig: state.shapeTrailConfig,
      tessellationConfig: state.tessellationConfig,
      effectsConfig: state.effectsConfig,
      textSections: state.textSections,
      textGap: state.textGap,
      textConfig: state.textConfig,
      colorPalette: state.colorPalette,
      selectedProjectIds: state.selectedProjectIds,
      audioConfig: { ...state.audioConfig, enabled: false, fileName: null },
      inputEnabled: state.inputEnabled,
      themeOverrides: state.themeOverrides,
    }
  },

  // Load scene data from JSON
  loadSceneData: (sceneData) => {
    if (!sceneData) return

    // Migrate legacy aurora config: minWidth/maxWidth → width, minTTL/maxTTL → ttl
    let auroraConfig = sceneData.auroraConfig
    if (auroraConfig && ('minWidth' in auroraConfig || 'minTTL' in auroraConfig)) {
      const { minWidth, maxWidth, minTTL, maxTTL, ...rest } = auroraConfig
      auroraConfig = {
        ...rest,
        ...((minWidth != null || maxWidth != null) && {
          width: Math.round(((minWidth ?? 10) + (maxWidth ?? 30)) / 2)
        }),
        ...((minTTL != null || maxTTL != null) && {
          ttl: Math.round(((minTTL ?? 100) + (maxTTL ?? 300)) / 2)
        }),
      }
    }

    set({
      ...(sceneData.backgroundType && { backgroundType: sceneData.backgroundType }),
      ...(sceneData.gradientConfig && { gradientConfig: sceneData.gradientConfig }),
      ...(auroraConfig && { auroraConfig }),
      ...(sceneData.blobConfig && { blobConfig: sceneData.blobConfig }),
      ...(sceneData.fluidConfig && { fluidConfig: sceneData.fluidConfig }),
      ...(sceneData.wavesConfig && { wavesConfig: sceneData.wavesConfig }),
      ...(sceneData.ribbonConfig && { ribbonConfig: sceneData.ribbonConfig }),
      ...(sceneData.dandelionConfig && { dandelionConfig: sceneData.dandelionConfig }),
      ...(sceneData.particleRingConfig && { particleRingConfig: sceneData.particleRingConfig }),
      ...(sceneData.shapeTrailConfig && { shapeTrailConfig: sceneData.shapeTrailConfig }),
      ...(sceneData.tessellationConfig && { tessellationConfig: sceneData.tessellationConfig }),
      ...(sceneData.effectsConfig && { effectsConfig: sceneData.effectsConfig }),
      ...(sceneData.textSections && { textSections: sceneData.textSections }),
      ...(sceneData.textGap !== undefined && { textGap: sceneData.textGap }),
      ...(sceneData.textConfig && { textConfig: sceneData.textConfig }),
      ...(sceneData.colorPalette !== undefined && { colorPalette: sceneData.colorPalette }),
      ...(sceneData.selectedProjectIds && { selectedProjectIds: sceneData.selectedProjectIds }),
      ...(sceneData.audioConfig && { audioConfig: { ...sceneData.audioConfig, enabled: false, fileName: null } }),
      ...(sceneData.mouseConfig && { mouseConfig: sceneData.mouseConfig }),
      ...(sceneData.inputEnabled !== undefined && { inputEnabled: sceneData.inputEnabled }),
      ...(sceneData.themeOverrides && { themeOverrides: sceneData.themeOverrides }),
    })
  },
}))

export default useStore
