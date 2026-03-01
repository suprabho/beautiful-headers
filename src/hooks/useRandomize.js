import { useCallback } from 'react'
import { AVAILABLE_ICONS } from '../components/TessellationLayer'
import { parsePaletteJson } from '@/lib/colorConversion'
import useStore from '../store/useStore'

export function useRandomize() {
  const colorPalette = useStore((state) => state.colorPalette)
  const gradientConfig = useStore((state) => state.gradientConfig)
  const setGradientConfig = useStore((state) => state.setGradientConfig)
  const setBackgroundType = useStore((state) => state.setBackgroundType)
  const tessellationConfig = useStore((state) => state.tessellationConfig)
  const setTessellationConfig = useStore((state) => state.setTessellationConfig)
  const effectsConfig = useStore((state) => state.effectsConfig)
  const setEffectsConfig = useStore((state) => state.setEffectsConfig)
  const textConfig = useStore((state) => state.textConfig)
  const setTextConfig = useStore((state) => state.setTextConfig)
  const textSections = useStore((state) => state.textSections)
  const setTextSections = useStore((state) => state.setTextSections)
  const setTextGap = useStore((state) => state.setTextGap)
  const ribbonConfig = useStore((state) => state.ribbonConfig)
  const setRibbonConfig = useStore((state) => state.setRibbonConfig)
  const dandelionConfig = useStore((state) => state.dandelionConfig)
  const setDandelionConfig = useStore((state) => state.setDandelionConfig)
  const particleRingConfig = useStore((state) => state.particleRingConfig)
  const setParticleRingConfig = useStore((state) => state.setParticleRingConfig)
  const auroraConfig = useStore((state) => state.auroraConfig)
  const setAuroraConfig = useStore((state) => state.setAuroraConfig)
  const fluidConfig = useStore((state) => state.fluidConfig)
  const setFluidConfig = useStore((state) => state.setFluidConfig)

  const randomize = useCallback(() => {
    const randomHex = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    const randomInRange = (min, max) => Math.random() * (max - min) + min
    const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)]

    // Randomize background type
    const backgroundTypes = ['simple', 'liquid', 'aurora', 'fluid', 'waves', 'ribbon', 'dandelion', 'particleRing']
    setBackgroundType(pickOne(backgroundTypes))

    let colors
    let numColors

    // Check if a palette is uploaded and use its colors
    if (colorPalette) {
      const parsedPalette = parsePaletteJson(colorPalette)
      const paletteColors = parsedPalette.colors.map(c => c.hex)

      if (paletteColors.length >= 2) {
        numColors = Math.min(Math.floor(Math.random() * 4) + 2, paletteColors.length)
        const shuffled = [...paletteColors].sort(() => Math.random() - 0.5)
        colors = shuffled.slice(0, numColors)
      } else {
        numColors = Math.floor(Math.random() * 4) + 2
        colors = Array.from({ length: numColors }, randomHex)
      }
    } else {
      numColors = Math.floor(Math.random() * 4) + 2
      colors = Array.from({ length: numColors }, randomHex)
    }

    const colorStops = colors.map((_, i) => Math.round((i / (numColors - 1)) * 100))

    setGradientConfig({
      ...gradientConfig,
      colors,
      numColors,
      type: ['linear', 'radial', 'conic'][Math.floor(Math.random() * 3)],
      startPos: { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 },
      endPos: { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 },
      colorStops,
      waveIntensity: Math.random() * 0.5 + 0.1,
      mouseInfluence: Math.random() * 0.8 + 0.2,
      wave1Speed: Math.random() * 0.4 + 0.05,
      wave1Direction: Math.random() > 0.5 ? 1 : -1,
      wave2Speed: Math.random() * 0.4 + 0.05,
      wave2Direction: Math.random() > 0.5 ? 1 : -1,
    })

    // Also randomize related layer styling
    setTessellationConfig({
      ...tessellationConfig,
      icon: pickOne(AVAILABLE_ICONS),
      color: pickOne([...colors, '#ffffff', '#000000']),
      opacity: randomInRange(0.05, 0.35),
    })

    setEffectsConfig({
      ...effectsConfig,
      textureOpacity: randomInRange(0.1, 0.9),
    })

    // Randomize text config
    setTextConfig({
      ...textConfig,
      enabled: true,
      color: pickOne([...colors, '#ffffff', '#000000']),
      opacity: randomInRange(0.7, 1),
    })

    // Randomize text sections
    const fonts = ['sans-serif', 'serif', 'mono']
    const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900]
    const randomizedSections = textSections.map(section => ({
      ...section,
      size: Math.floor(randomInRange(section.id === 1 ? 60 : 16, section.id === 1 ? 180 : 40)),
      weight: pickOne(weights),
      spacing: randomInRange(-0.1, 0.3),
      font: pickOne(fonts),
      italic: Math.random() > 0.7,
    }))
    setTextSections(randomizedSections)

    // Randomize text gap
    setTextGap(Math.floor(randomInRange(1, 10)))

    // Randomize effects
    const textures = ['none', 'grain', 'scanlines', 'dots', 'grid', 'diagonal']
    const textureBlendModes = ['overlay', 'multiply', 'screen', 'soft-light', 'hard-light']

    setEffectsConfig({
      ...effectsConfig,
      blur: Math.floor(randomInRange(0, 15)),
      texture: pickOne(textures),
      textureSize: Math.floor(randomInRange(10, 60)),
      textureOpacity: Math.floor(randomInRange(0.1, 0.9)),
      vignetteIntensity: Math.floor(randomInRange(0, 0.6)),
      flutedGlass: {
        enabled: Math.random() > 0.8,
        segments: Math.floor(randomInRange(20, 200)),
        rotation: Math.floor(randomInRange(0, 180)),
        motionValue: Math.floor(randomInRange(0, 1)),
        motionSpeed: Math.floor(randomInRange(0, 2)),
        overlayOpacity: Math.floor(randomInRange(0, 50)),
        distortionStrength: randomInRange(0.005, 0.08),
        waveFrequency: Math.floor(randomInRange(0.5, 4)),
      },
    })

    // Randomize ribbon config
    setRibbonConfig({
      ...ribbonConfig,
      ribbonCount: Math.floor(randomInRange(2, 10)),
      speed: Math.round(randomInRange(0.1, 2) * 10) / 10,
      amplitude: Math.round(randomInRange(0.1, 3) * 10) / 10,
      spread: Math.round(randomInRange(0.5, 3) * 10) / 10,
      rotation: Math.floor(randomInRange(-90, 90) / 5) * 5,
      thickness: Math.round(randomInRange(0.1, 1) * 20) / 20,
      taper: Math.round(randomInRange(-1, 1) * 10) / 10,
      noise: Math.round(randomInRange(0, 2) * 10) / 10,
      opacity: Math.round(randomInRange(0.1, 1) * 20) / 20,
    })

    // Randomize dandelion config
    const dandelionRadialCount = Math.floor(randomInRange(2, 4))
    const dandelionRadialColors = Array.from({ length: dandelionRadialCount }, () => pickOne(colors))
    const dandelionRadialStops = dandelionRadialColors.map((_, i) => Math.round((i / (dandelionRadialCount - 1)) * 100))
    setDandelionConfig({
      ...dandelionConfig,
      lineCount: Math.floor(randomInRange(60, 200)),
      radialGradientColors: dandelionRadialColors,
      radialGradientStops: dandelionRadialStops,
      gradientEndX: Math.floor(randomInRange(-200, 200)),
      gradientEndY: Math.floor(randomInRange(-200, 200)),
      radiusMin: Math.round(randomInRange(0.05, 0.2) * 100) / 100,
      radiusMax: Math.round(randomInRange(0.3, 0.6) * 100) / 100,
      speed: Math.round(randomInRange(0.1, 1) * 10) / 10,
      thickness: Math.round(randomInRange(0.5, 3) * 10) / 10,
      dotSize: Math.round(randomInRange(1, 6) * 10) / 10,
      spread: Math.round(randomInRange(0.1, 0.5) * 100) / 100,
      centerY: Math.round(randomInRange(0.7, 0.95) * 100) / 100,
    })

    // Randomize particleRing config
    const ringRadialCount = Math.floor(randomInRange(2, 4))
    const ringRadialColors = Array.from({ length: ringRadialCount }, () => pickOne(colors))
    const ringRadialStops = ringRadialColors.map((_, i) => Math.round((i / (ringRadialCount - 1)) * 100))
    setParticleRingConfig({
      ...particleRingConfig,
      particleCount: Math.floor(randomInRange(300, 1500)),
      radialGradientColors: ringRadialColors,
      radialGradientStops: ringRadialStops,
      gradientEndX: Math.floor(randomInRange(-200, 200)),
      gradientEndY: Math.floor(randomInRange(-200, 200)),
      ringRadius: Math.round(randomInRange(0.2, 0.5) * 100) / 100,
      ringWidth: Math.round(randomInRange(0.05, 0.3) * 100) / 100,
      speed: Math.round(randomInRange(0.1, 1) * 10) / 10,
      particleSize: Math.round(randomInRange(1, 6) * 10) / 10,
      dispersion: Math.round(randomInRange(0.1, 0.5) * 100) / 100,
      rotationSpeed: Math.round(randomInRange(0.05, 0.5) * 100) / 100,
      tiltX: Math.round(randomInRange(-45, 45)),
      tiltZ: Math.round(randomInRange(-45, 45)),
    })

    // Randomize aurora config
    setAuroraConfig({
      ...auroraConfig,
      width: Math.floor(randomInRange(1, 100) / 5) * 5,
      minHeight: Math.floor(randomInRange(50, 1000) / 50) * 50,
      maxHeight: Math.floor(randomInRange(50, 1000) / 50) * 50,
      ttl: Math.floor(randomInRange(10, 500) / 10) * 10,
      blurAmount: Math.floor(randomInRange(0, 50)),
      lineCount: Math.floor(randomInRange(0, 500) / 10) * 10,
    })

    // Randomize fluid/mesh config
    setFluidConfig({
      ...fluidConfig,
      speed: Math.round(randomInRange(0.1, 3) * 10) / 10,
      intensity: Math.round(randomInRange(0.1, 10) * 10) / 10,
      blurAmount: Math.floor(randomInRange(0, 100)),
    })
  }, [colorPalette, gradientConfig, tessellationConfig, effectsConfig, textConfig, textSections, ribbonConfig, auroraConfig, fluidConfig, dandelionConfig, particleRingConfig, setBackgroundType, setGradientConfig, setTessellationConfig, setEffectsConfig, setTextConfig, setTextSections, setTextGap, setRibbonConfig, setAuroraConfig, setFluidConfig, setDandelionConfig, setParticleRingConfig])

  return { randomize }
}
