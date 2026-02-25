import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { CircleNotch } from '@phosphor-icons/react'
import { getSceneBySlug } from '@/lib/scenesApi'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { audioData } from '@/audio/audioData'
import '../App.css'
import GradientLayer from './GradientLayer'
import SimpleGradientLayer from './SimpleGradientLayer'
import AuroraLayer from './AuroraLayer'
import FluidGradientLayer from './FluidGradientLayer'
import WavesLayer from './WavesLayer'
import RibbonLayer from './RibbonLayer'
import DandelionLayer from './DandelionLayer'
import ParticleRingLayer from './ParticleRingLayer'
import ShapeTrailLayer from './ShapeTrailLayer'
import TessellationLayer from './TessellationLayer'
import EffectsLayer from './EffectsLayer'
import TextLayer from './TextLayer'

function SceneEmbedPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()

  // Parse query parameters for hiding elements and input mode
  const hideText = searchParams.get('hideText') === 'true'
  const hideIcons = searchParams.get('hideIcons') === 'true'
  const inputMode = searchParams.get('input') || 'mouse' // 'off' | 'mouse' | 'mic'

  const [scene, setScene] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })

  // Update document meta tags with scene data
  useDocumentMeta({
    title: scene ? `${scene.title} - Aura` : null,
    description: scene?.short_description || scene?.long_description,
    image: scene?.thumbnail?.large || scene?.thumbnail?.small,
    url: scene ? `https://aura.promad.design/embed/${slug}` : null,
  })

  // Ref to track if RAF is pending for mouse throttling
  const rafPendingRef = useRef(false)
  const pendingMouseRef = useRef({ x: 0.5, y: 0.5 })

  // Throttled mouse move handler
  const handleMouseMove = useCallback((e) => {
    pendingMouseRef.current.x = e.clientX / window.innerWidth
    pendingMouseRef.current.y = e.clientY / window.innerHeight

    if (rafPendingRef.current) return

    rafPendingRef.current = true
    requestAnimationFrame(() => {
      setMousePos({
        x: pendingMouseRef.current.x,
        y: pendingMouseRef.current.y
      })
      rafPendingRef.current = false
    })
  }, [])

  // Mic audio analyser for embed
  useEffect(() => {
    if (inputMode !== 'mic') return

    let audioContext, analyser, dataArray, stream, rafId
    const smoothed = { bass: 0, mid: 0, treble: 0, amplitude: 0 }

    const BAND_RANGES = {
      bass:   { start: 0,   end: 12  },
      mid:    { start: 12,  end: 186 },
      treble: { start: 186, end: 744 },
    }

    const computeBand = (data, start, end) => {
      let sum = 0
      const len = Math.min(end, data.length)
      for (let i = start; i < len; i++) sum += data[i]
      return sum / ((len - start) * 255)
    }

    const analyse = () => {
      analyser.getByteFrequencyData(dataArray)
      const rawBass = computeBand(dataArray, BAND_RANGES.bass.start, BAND_RANGES.bass.end)
      const rawMid = computeBand(dataArray, BAND_RANGES.mid.start, BAND_RANGES.mid.end)
      const rawTreble = computeBand(dataArray, BAND_RANGES.treble.start, BAND_RANGES.treble.end)
      const rawAmplitude = rawBass * 0.5 + rawMid * 0.35 + rawTreble * 0.15
      const smoothing = 0.8

      smoothed.bass = smoothed.bass * smoothing + rawBass * (1 - smoothing)
      smoothed.mid = smoothed.mid * smoothing + rawMid * (1 - smoothing)
      smoothed.treble = smoothed.treble * smoothing + rawTreble * (1 - smoothing)
      smoothed.amplitude = smoothed.amplitude * smoothing + rawAmplitude * (1 - smoothing)

      audioData.bass = Math.min(1, smoothed.bass)
      audioData.mid = Math.min(1, smoothed.mid)
      audioData.treble = Math.min(1, smoothed.treble)
      audioData.amplitude = Math.min(1, smoothed.amplitude)
      audioData.frequencyData = dataArray
      audioData.isActive = true

      rafId = requestAnimationFrame(analyse)
    }

    const startMic = async () => {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)()
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.3
        dataArray = new Uint8Array(analyser.frequencyBinCount)

        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)

        rafId = requestAnimationFrame(analyse)
      } catch (err) {
        console.error('Microphone access denied:', err)
      }
    }

    startMic()

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (stream) stream.getTracks().forEach(t => t.stop())
      if (audioContext) audioContext.close()
      audioData.bass = 0
      audioData.mid = 0
      audioData.treble = 0
      audioData.amplitude = 0
      audioData.frequencyData = null
      audioData.isActive = false
    }
  }, [inputMode])

  useEffect(() => {
    const fetchScene = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const sceneData = await getSceneBySlug(slug)
        setScene(sceneData)
      } catch (err) {
        console.error('Failed to fetch scene:', err)
        setError('Scene not found')
      } finally {
        setIsLoading(false)
      }
    }

    if (slug) {
      fetchScene()
    }
  }, [slug])

  // Build the gradient filter string
  const getGradientFilter = () => {
    if (!scene?.scene_data) return 'none'
    const effectsConfig = scene.scene_data.effectsConfig || {}
    const backgroundType = scene.scene_data.backgroundType || 'liquid'

    if (backgroundType === 'liquid') {
      return effectsConfig.blur > 0 ? `blur(${effectsConfig.blur}px)` : 'none'
    }

    const filters = [
      effectsConfig.blur > 0 ? `blur(${effectsConfig.blur}px)` : '',
      `saturate(${effectsConfig.saturation || 100}%)`,
      `contrast(${effectsConfig.contrast || 100}%)`,
      `brightness(${effectsConfig.brightness || 100}%)`,
    ]

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

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-background flex items-center justify-center">
        <CircleNotch size={32} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !scene) {
    return (
      <div className="w-full h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{error || 'Scene not found'}</p>
      </div>
    )
  }

  const sceneData = scene.scene_data || {}
  const backgroundType = sceneData.backgroundType || 'liquid'
  const gradientConfig = sceneData.gradientConfig || {}
  const tessellationConfig = sceneData.tessellationConfig || {}
  const effectsConfig = sceneData.effectsConfig || {}
  const textSections = sceneData.textSections || []
  const textGap = sceneData.textGap || 0
  const textConfig = sceneData.textConfig || {}
  const mouseConfig = sceneData.mouseConfig || { enabled: true, intensity: 0.5 }
  const inputEnabled = inputMode !== 'off' && (sceneData.inputEnabled !== undefined ? sceneData.inputEnabled : true)
  const effectiveMouseIntensity = inputEnabled && inputMode !== 'mic' ? mouseConfig.intensity : 0
  const effectiveMouseEnabled = inputEnabled && inputMode !== 'mic' && mouseConfig.enabled

  const auroraConfig = sceneData.auroraConfig || {}
  const fluidConfig = sceneData.fluidConfig || {}
  const wavesConfig = sceneData.wavesConfig || {}
  const ribbonConfig = sceneData.ribbonConfig || {}
  const dandelionConfig = sceneData.dandelionConfig || {}
  const particleRingConfig = sceneData.particleRingConfig || {}
  const shapeTrailConfig = sceneData.shapeTrailConfig || {}

  return (
    <div className="w-full h-screen overflow-hidden" onMouseMove={effectiveMouseEnabled ? handleMouseMove : undefined}>
      {/* Full-screen scene - no UI overlay */}
      <div className="absolute inset-0">
        <div className="layers-container" style={{ position: 'absolute', inset: 0 }}>
          {/* Background layer */}
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
              <GradientLayer config={gradientConfig} effectsConfig={effectsConfig} mousePos={mousePos} isPaused={false} mouseIntensity={effectiveMouseIntensity} />
            )}
            {backgroundType === 'aurora' && (
              <AuroraLayer config={auroraConfig} mousePos={mousePos} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} />
            )}
            {backgroundType === 'fluid' && (
              <FluidGradientLayer config={fluidConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} />
            )}
            {backgroundType === 'waves' && (
              <WavesLayer config={wavesConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} />
            )}
            {backgroundType === 'ribbon' && (
              <RibbonLayer config={ribbonConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} />
            )}
            {backgroundType === 'dandelion' && (
              <DandelionLayer config={dandelionConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} mouseEnabled={effectiveMouseEnabled} mouseIntensity={effectiveMouseIntensity} />
            )}
            {backgroundType === 'particleRing' && (
              <ParticleRingLayer config={particleRingConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} />
            )}
            {backgroundType === 'shapeTrail' && (
              <ShapeTrailLayer config={shapeTrailConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} />
            )}
          </div>

          {/* Tessellation layer */}
          {tessellationConfig.enabled && !hideIcons && (
            <TessellationLayer config={tessellationConfig} mousePos={mousePos} isPaused={false} mouseIntensity={effectiveMouseIntensity} />
          )}

          {/* Effects layer */}
          <EffectsLayer config={effectsConfig} />

          {/* Text layer */}
          {textConfig.enabled && !hideText && (
            <TextLayer
              sections={textSections}
              gap={textGap}
              color={textConfig.color}
              opacity={textConfig.opacity}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default SceneEmbedPage
