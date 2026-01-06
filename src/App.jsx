import { useState, useCallback, useRef } from 'react'
import GradientLayer from './components/GradientLayer'
import AuroraLayer from './components/AuroraLayer'
import BlobLayer from './components/BlobLayer'
import FluidGradientLayer from './components/FluidGradientLayer'
import TessellationLayer, { AVAILABLE_ICONS } from './components/TessellationLayer'
import EffectsLayer from './components/EffectsLayer'
import TextLayer from './components/TextLayer'
import ControlPanel from './components/ControlPanel'
import { parsePaletteJson } from '@/lib/colorConversion'
import './App.css'

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

function App() {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const [activePanel, setActivePanel] = useState('gradient')
  const layersContainerRef = useRef(null)

  // Background Type State
  const [backgroundType, setBackgroundType] = useState('liquid') // 'liquid', 'aurora', or 'blob'

  // Gradient Layer State (Liquid effect)
  const [gradientConfig, setGradientConfig] = useState({
    colors: ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0'],
    numColors: 4,
    type: 'radial', // linear, radial, conic
    startPos: { x: 0, y: 0 },
    endPos: { x: 100, y: 100 },
    colorStops: [0, 33, 66, 100],
    waveIntensity: 0.3,
    mouseInfluence: 0.5,
    decaySpeed: 0.95,
    wave1Speed: 0.2,
    wave1Direction: 1,  // 1 = forward, -1 = backward
    wave2Speed: 0.15,
    wave2Direction: -1,
  })

  // Aurora Layer State
  const [auroraConfig, setAuroraConfig] = useState({
    minWidth: 10,
    maxWidth: 30,
    minHeight: 200,
    maxHeight: 600,
    minTTL: 100,
    maxTTL: 300,
    blurAmount: 13,
    hueStart: 120,
    hueEnd: 180,
    backgroundColor: '#000000',
    lineCount: 0, // 0 = auto-calculate
    decaySpeed: 0.95,
    useGradientColors: true, // Use colors from gradient palette
  })

  // Blob Layer State (Gooey metaball effect)
  const [blobConfig, setBlobConfig] = useState({
    blobCount: 5,
    minRadius: 40,
    maxRadius: 120,
    speed: 0.5,
    orbitRadius: 150,
    blurAmount: 12,
    threshold: 180,
    mouseInfluence: 0.3,
    decaySpeed: 0.95,
    useGradientColors: true, // Use colors from gradient palette
    colors: ['#40204c', '#a3225c', '#e24926'], // Fallback colors
    backgroundColor: '#152a8e',
  })

  // Fluid Gradient Layer State (animated SVG gradients)
  const [fluidConfig, setFluidConfig] = useState({
    useGradientColors: true,
    backgroundColor: '#1C89FF',
    colors: ['#71ECFF', '#39F58A', '#71ECFF', '#F0CBA8'],
    speed: 1,
    intensity: 0.5,
    blurAmount: 0,
  })

  // Tessellation Layer State
  const [tessellationConfig, setTessellationConfig] = useState({
    enabled: true,
    icon: 'Star',
    rowGap: 60,
    colGap: 60,
    size: 24,
    opacity: 0.15,
    rotation: 0,
    color: '#ffffff',
    mouseRotationInfluence: 0.5,
  })

  // Effects Layer State
  const [effectsConfig, setEffectsConfig] = useState({
    blur: 0,
    noiseEnabled: false,
    noise: 0.1,
    noiseScale: 1,
    texture: 'none', // none, grain, scanlines, dots
    textureSize: 20, // texture pattern size in pixels
    textureOpacity: 0.5, // texture layer opacity
    textureBlendMode: 'overlay', // CSS blend mode for texture
    colorMap: 'none', // none, sepia, cyberpunk, sunset, matrix
    vignetteIntensity: 0.3,
    saturation: 100,
    contrast: 100,
    brightness: 100,
    // Fluted glass effect settings
    flutedGlass: {
      enabled: false,
      segments: 80,           // Number of glass ridges/segments
      rotation: 0,            // Rotation angle in degrees
      motionValue: 0.5,       // Base motion offset value
      motionSpeed: 0.5,       // Animation speed
      overlayOpacity: 0,      // 3D overlay effect intensity (0-100)
      distortionStrength: 0.02, // How much the glass bends light
      waveFrequency: 1,       // Frequency of the sine wave distortion
    },
  })

  // Text Layer State
  const [textSections, setTextSections] = useState([
    { id: 1, text: 'Aura', size: 120, weight: 900, spacing: -0.1, font: 'mono' },
    { id: 2, text: 'BY PROMAD', size: 20, weight: 300, spacing: 0.2, font: 'sans-serif' },
  ])
  const [textGap, setTextGap] = useState(20)
  const [textConfig, setTextConfig] = useState({
    enabled: true,
    color: '#ffffff',
    opacity: 1,
  })

  // Custom color palette state (uploaded by user) - initialized with Tailwind OKLCH palette
  const [colorPalette, setColorPalette] = useState(DEFAULT_PALETTE)

  const handleMouseMove = useCallback((e) => {
    const x = e.clientX / window.innerWidth
    const y = e.clientY / window.innerHeight
    setMousePos({ x, y })
  }, [])

  const randomizeGradient = () => {
    const randomHex = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    const randomInRange = (min, max) => Math.random() * (max - min) + min
    const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)]

    let colors
    let numColors

    // Check if a palette is uploaded and use its colors
    if (colorPalette) {
      const parsedPalette = parsePaletteJson(colorPalette)
      const paletteColors = parsedPalette.colors.map(c => c.hex)
      
      if (paletteColors.length >= 2) {
        // Pick 2-5 random colors from the palette (or max available)
        numColors = Math.min(Math.floor(Math.random() * 4) + 2, paletteColors.length)
        const shuffled = [...paletteColors].sort(() => Math.random() - 0.5)
        colors = shuffled.slice(0, numColors)
      } else {
        // Fallback if palette has fewer than 2 colors
        numColors = Math.floor(Math.random() * 4) + 2
        colors = Array.from({ length: numColors }, randomHex)
      }
    } else {
      // No palette uploaded - use random colors
      numColors = Math.floor(Math.random() * 4) + 2
      colors = Array.from({ length: numColors }, randomHex)
    }

    const colorStops = colors.map((_, i) => Math.round((i / (numColors - 1)) * 100))

    setGradientConfig((prev) => ({
      ...prev,
      colors,
      numColors,
      type: ['linear', 'radial', 'conic'][Math.floor(Math.random() * 3)],
      startPos: { x: Math.random() * 100, y: Math.random() * 100 },
      endPos: { x: Math.random() * 100, y: Math.random() * 100 },
      colorStops,
      waveIntensity: Math.random() * 0.5 + 0.1,
      mouseInfluence: Math.random() * 0.8 + 0.2,
      wave1Speed: Math.random() * 0.4 + 0.05,
      wave1Direction: Math.random() > 0.5 ? 1 : -1,
      wave2Speed: Math.random() * 0.4 + 0.05,
      wave2Direction: Math.random() > 0.5 ? 1 : -1,
    }))

    // Also randomize related layer styling
    setTessellationConfig((prev) => ({
      ...prev,
      icon: pickOne(AVAILABLE_ICONS),
      color: pickOne([...colors, '#ffffff', '#000000']),
      opacity: randomInRange(0.05, 0.35),
    }))

    setEffectsConfig((prev) => ({
      ...prev,
      textureOpacity: randomInRange(0.1, 0.9),
    }))

    setTextConfig((prev) => ({
      ...prev,
      color: pickOne([...colors, '#ffffff', '#000000']),
    }))
  }

  // Build the gradient filter string
  const getGradientFilter = () => {
    const filters = [
      effectsConfig.blur > 0 ? `blur(${effectsConfig.blur}px)` : '',
      `saturate(${effectsConfig.saturation}%)`,
      `contrast(${effectsConfig.contrast}%)`,
      `brightness(${effectsConfig.brightness}%)`,
    ]
    
    // Add color map filter
    switch (effectsConfig.colorMap) {
      case 'sepia': filters.push('sepia(0.8)'); break
      case 'cyberpunk': filters.push('hue-rotate(280deg) saturate(1.5)'); break
      case 'sunset': filters.push('hue-rotate(30deg) saturate(1.3)'); break
      case 'matrix': filters.push('hue-rotate(90deg) saturate(2) brightness(0.9)'); break
      case 'noir': filters.push('grayscale(1) contrast(1.2)'); break
      case 'vintage': filters.push('sepia(0.3) saturate(1.5) hue-rotate(-10deg)'); break
    }
    
    return filters.filter(Boolean).join(' ') || 'none'
  }

  return (
    <div className="app" onMouseMove={handleMouseMove}>
      <div className="layers-container" ref={layersContainerRef}>
        {/* Layer 1: Background with effects (blur, saturation, contrast, brightness, colorMap) */}
        <div 
          className="gradient-effects-wrapper"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            filter: getGradientFilter(),
          }}
        >
          {backgroundType === 'liquid' && (
            <GradientLayer config={gradientConfig} effectsConfig={effectsConfig} mousePos={mousePos} />
          )}
          {backgroundType === 'aurora' && (
            <AuroraLayer config={auroraConfig} mousePos={mousePos} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} />
          )}
          {backgroundType === 'blob' && (
            <BlobLayer config={blobConfig} mousePos={mousePos} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} />
          )}
          {backgroundType === 'fluid' && (
            <FluidGradientLayer config={fluidConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} />
          )}
        </div>
        
        {/* Layer 2: Tessellation (no filter effects) */}
        {tessellationConfig.enabled && (
          <TessellationLayer config={tessellationConfig} mousePos={mousePos} />
        )}
        
        {/* Layer 3: Overlay effects (noise, texture, vignette) */}
        <EffectsLayer config={effectsConfig} />
        
        {/* Layer 4: Text */}
        {textConfig.enabled && (
          <TextLayer
            sections={textSections}
            gap={textGap}
            color={textConfig.color}
            opacity={textConfig.opacity}
          />
        )}
      </div>

      <ControlPanel
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        backgroundType={backgroundType}
        setBackgroundType={setBackgroundType}
        gradientConfig={gradientConfig}
        setGradientConfig={setGradientConfig}
        auroraConfig={auroraConfig}
        setAuroraConfig={setAuroraConfig}
        blobConfig={blobConfig}
        setBlobConfig={setBlobConfig}
        fluidConfig={fluidConfig}
        setFluidConfig={setFluidConfig}
        randomizeGradient={randomizeGradient}
        tessellationConfig={tessellationConfig}
        setTessellationConfig={setTessellationConfig}
        effectsConfig={effectsConfig}
        setEffectsConfig={setEffectsConfig}
        textSections={textSections}
        setTextSections={setTextSections}
        textGap={textGap}
        setTextGap={setTextGap}
        textConfig={textConfig}
        setTextConfig={setTextConfig}
        layersContainerRef={layersContainerRef}
        colorPalette={colorPalette}
        setColorPalette={setColorPalette}
      />
    </div>
  )
}

export default App
