import { useCallback, useRef, useEffect } from 'react'
import { useAudioAnalyser } from './audio/useAudioAnalyser'
import GradientLayer from './components/GradientLayer'
import SimpleGradientLayer from './components/SimpleGradientLayer'
import AuroraLayer from './components/AuroraLayer'
import FluidGradientLayer from './components/FluidGradientLayer'
import WavesLayer from './components/WavesLayer'
import RibbonLayer from './components/RibbonLayer'
import DandelionLayer from './components/DandelionLayer'
import ParticleRingLayer from './components/ParticleRingLayer'
import GuillocheLayer from './components/GuillocheLayer'
import TessellationLayer from './components/TessellationLayer'
import EffectsLayer from './components/EffectsLayer'
import TextLayer from './components/TextLayer'
import ControlPanel from './components/ControlPanel'
import useStore from './store/useStore'
import { useThemedConfig } from './hooks/useThemedConfig'
import { getScenes, getScene } from './lib/scenesApi'
import { fetchTextPairs } from './lib/gemini'
import './App.css'

function App() {
  // Subscribe to Zustand store slices
  const mousePos = useStore((state) => state.mousePos)
  const setMousePos = useStore((state) => state.setMousePos)
  const mouseConfig = useStore((state) => state.mouseConfig)
  const backgroundType = useStore((state) => state.backgroundType)
  const [gradientConfig] = useThemedConfig('gradientConfig')
  const [auroraConfig] = useThemedConfig('auroraConfig')
  const [fluidConfig] = useThemedConfig('fluidConfig')
  const [wavesConfig] = useThemedConfig('wavesConfig')
  const [ribbonConfig] = useThemedConfig('ribbonConfig')
  const [dandelionConfig] = useThemedConfig('dandelionConfig')
  const [particleRingConfig] = useThemedConfig('particleRingConfig')
  const [guillocheConfig] = useThemedConfig('guillocheConfig')
  const [tessellationConfig] = useThemedConfig('tessellationConfig')
  const [effectsConfig] = useThemedConfig('effectsConfig')
  const textSections = useStore((state) => state.textSections)
  const textGap = useStore((state) => state.textGap)
  const [textConfig] = useThemedConfig('textConfig')
  const isPaused = useStore((state) => state.isPaused)
  const loadSceneData = useStore((state) => state.loadSceneData)
  const currentSceneId = useStore((state) => state.currentSceneId)
  const sceneLoaded = useStore((state) => state.sceneLoaded)
  const audioEnabled = useStore((state) => state.audioConfig.enabled)
  const inputEnabled = useStore((state) => state.inputEnabled)
  const setTextPairs = useStore((state) => state.setTextPairs)

  const layersContainerRef = useRef(null)

  // Audio analyser — writes to audioData singleton, read by layers
  const audioAnalyser = useAudioAnalyser()

  // Load a random saved scene on initial mount (only if no scene already loaded)
  useEffect(() => {
    // Skip if a scene was already loaded — either via "Edit Scene" (sets
    // currentSceneId) or via "Remix" (calls loadSceneData with no id, setting
    // sceneLoaded). Without this second check, remixing would be clobbered by
    // a random scene on App mount.
    if (currentSceneId || sceneLoaded) return

    const loadRandomScene = async () => {
      try {
        const { docs } = await getScenes({ limit: 50 })
        if (docs.length > 0) {
          const randomIndex = Math.floor(Math.random() * docs.length)
          const scene = await getScene(docs[randomIndex].id)
          if (scene?.scene_data) {
            loadSceneData(scene.scene_data)
          }
        }
      } catch (err) {
        console.warn('Failed to load random scene:', err)
      }
    }
    loadRandomScene()
  }, [loadSceneData, currentSceneId, sceneLoaded])

  // Fetch AI-generated text pairs on initial mount
  useEffect(() => {
    const loadTextPairs = async () => {
      try {
        const pairs = await fetchTextPairs()
        if (pairs && pairs.length > 0) {
          setTextPairs(pairs)
        }
      } catch (err) {
        console.warn('Failed to fetch text pairs:', err)
      }
    }
    loadTextPairs()
  }, [setTextPairs])

  // Ref to track if RAF is pending for mouse throttling (PERFORMANCE OPTIMIZATION)
  const rafPendingRef = useRef(false)
  const pendingMouseRef = useRef({ x: 0, y: 0 })

  // Throttled mouse move handler using requestAnimationFrame (PERFORMANCE OPTIMIZATION)
  // Disabled when audio reactivity is active (mouse and audio are mutually exclusive)
  const handleMouseMove = useCallback((e) => {
    // Skip mouse tracking when input is globally disabled
    if (!inputEnabled) return
    // Skip mouse tracking when audio is driving the effects
    if (audioEnabled) return
    // Skip mouse tracking when mouse effects are disabled
    if (!mouseConfig.enabled) return

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
  }, [setMousePos, audioEnabled, mouseConfig.enabled, inputEnabled])

  // Reset mouse to neutral center when audio becomes active or input is disabled
  useEffect(() => {
    if (audioEnabled || !inputEnabled) {
      setMousePos({ x: 0.5, y: 0.5 })
    }
  }, [audioEnabled, inputEnabled, setMousePos])

  // Effective input values — zeroed when input is globally disabled
  const effectiveMouseIntensity = inputEnabled ? mouseConfig.intensity : 0
  const effectiveMouseEnabled = inputEnabled && mouseConfig.enabled

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
            <GradientLayer config={gradientConfig} effectsConfig={effectsConfig} mousePos={mousePos} isPaused={isPaused} mouseIntensity={effectiveMouseIntensity} />
          )}
          {backgroundType === 'aurora' && (
            <AuroraLayer config={auroraConfig} mousePos={mousePos} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={isPaused} mouseIntensity={effectiveMouseIntensity} />
          )}
          {backgroundType === 'fluid' && (
            <FluidGradientLayer config={fluidConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={isPaused} mousePos={mousePos} mouseIntensity={effectiveMouseIntensity} />
          )}
          {backgroundType === 'waves' && (
            <WavesLayer config={wavesConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={isPaused} mousePos={mousePos} mouseIntensity={effectiveMouseIntensity} />
          )}
          {backgroundType === 'ribbon' && (
            <RibbonLayer config={ribbonConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={isPaused} mousePos={mousePos} mouseIntensity={effectiveMouseIntensity} />
          )}
          {backgroundType === 'dandelion' && (
            <DandelionLayer config={dandelionConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={isPaused} mouseEnabled={effectiveMouseEnabled} mouseIntensity={effectiveMouseIntensity} />
          )}
          {backgroundType === 'particleRing' && (
            <ParticleRingLayer config={particleRingConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={isPaused} mousePos={mousePos} mouseIntensity={effectiveMouseIntensity} />
          )}
          {backgroundType === 'guilloche' && (
            <GuillocheLayer config={guillocheConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={isPaused} mousePos={mousePos} mouseIntensity={effectiveMouseIntensity} />
          )}
        </div>

        {/* Layer 2: Tessellation (no filter effects) */}
        {tessellationConfig.enabled && (
          <TessellationLayer config={tessellationConfig} mousePos={mousePos} isPaused={isPaused} mouseIntensity={effectiveMouseIntensity} />
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

      <ControlPanel layersContainerRef={layersContainerRef} audioAnalyser={audioAnalyser} />
    </div>
  )
}

export default App
