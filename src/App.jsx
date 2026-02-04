import { useCallback, useRef } from 'react'
import GradientLayer from './components/GradientLayer'
import SimpleGradientLayer from './components/SimpleGradientLayer'
import AuroraLayer from './components/AuroraLayer'
import FluidGradientLayer from './components/FluidGradientLayer'
import WavesLayer from './components/WavesLayer'
import RibbonLayer from './components/RibbonLayer'
import TessellationLayer from './components/TessellationLayer'
import EffectsLayer from './components/EffectsLayer'
import TextLayer from './components/TextLayer'
import ControlPanel from './components/ControlPanel'
import useStore from './store/useStore'
import './App.css'

function App() {
  // Subscribe to Zustand store slices
  const mousePos = useStore((state) => state.mousePos)
  const setMousePos = useStore((state) => state.setMousePos)
  const backgroundType = useStore((state) => state.backgroundType)
  const gradientConfig = useStore((state) => state.gradientConfig)
  const auroraConfig = useStore((state) => state.auroraConfig)
  const fluidConfig = useStore((state) => state.fluidConfig)
  const wavesConfig = useStore((state) => state.wavesConfig)
  const ribbonConfig = useStore((state) => state.ribbonConfig)
  const tessellationConfig = useStore((state) => state.tessellationConfig)
  const effectsConfig = useStore((state) => state.effectsConfig)
  const textSections = useStore((state) => state.textSections)
  const textGap = useStore((state) => state.textGap)
  const textConfig = useStore((state) => state.textConfig)
  const isPaused = useStore((state) => state.isPaused)

  const layersContainerRef = useRef(null)

  // Ref to track if RAF is pending for mouse throttling (PERFORMANCE OPTIMIZATION)
  const rafPendingRef = useRef(false)
  const pendingMouseRef = useRef({ x: 0, y: 0 })

  // Throttled mouse move handler using requestAnimationFrame (PERFORMANCE OPTIMIZATION)
  const handleMouseMove = useCallback((e) => {
    // Store the latest position
    pendingMouseRef.current.x = e.clientX / window.innerWidth
    pendingMouseRef.current.y = e.clientY / window.innerHeight

    // Skip if RAF is already pending
    if (rafPendingRef.current) return

    rafPendingRef.current = true
    requestAnimationFrame(() => {
      setMousePos({
        x: pendingMouseRef.current.x,
        y: pendingMouseRef.current.y
      })
      rafPendingRef.current = false
    })
  }, [setMousePos])

  // Build the gradient filter string
  // Note: For 'liquid' background type, post-processing is handled in WebGL via Three.js EffectComposer
  // This CSS filter is only used for non-liquid background types (aurora, fluid, waves)
  const getGradientFilter = () => {
    // Skip CSS filters for liquid background - handled by WebGL post-processing
    if (backgroundType === 'liquid') {
      // Only apply blur via CSS since WebGL blur is complex to implement
      return effectsConfig.blur > 0 ? `blur(${effectsConfig.blur}px)` : 'none'
    }

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
          {backgroundType === 'simple' && (
            <SimpleGradientLayer config={gradientConfig} gradientColors={gradientConfig.colors} effectsConfig={effectsConfig} />
          )}
          {backgroundType === 'liquid' && (
            <GradientLayer config={gradientConfig} effectsConfig={effectsConfig} mousePos={mousePos} isPaused={isPaused} />
          )}
          {backgroundType === 'aurora' && (
            <AuroraLayer config={auroraConfig} mousePos={mousePos} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={isPaused} />
          )}
          {backgroundType === 'fluid' && (
            <FluidGradientLayer config={fluidConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={isPaused} />
          )}
          {backgroundType === 'waves' && (
            <WavesLayer config={wavesConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={isPaused} />
          )}
          {backgroundType === 'ribbon' && (
            <RibbonLayer config={ribbonConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={isPaused} />
          )}
        </div>

        {/* Layer 2: Tessellation (no filter effects) */}
        {tessellationConfig.enabled && (
          <TessellationLayer config={tessellationConfig} mousePos={mousePos} isPaused={isPaused} />
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

      <ControlPanel layersContainerRef={layersContainerRef} />
    </div>
  )
}

export default App
