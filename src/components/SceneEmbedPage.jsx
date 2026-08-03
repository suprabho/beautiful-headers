import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getSceneBySlug } from '@/lib/scenesApi'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useColorMode } from '@/hooks/useColorMode'
import { resolveThemedConfigs } from '@/lib/themeUtils'
import { captureLayersToCanvas } from '@/lib/canvasCapture'
import { prepareForCapture } from '@/lib/colorConversion'
import { audioData } from '@/audio/audioData'
import ColorPlaceholder from './ColorPlaceholder'
import '../App.css'
import GradientLayer from './GradientLayer'
import SimpleGradientLayer from './SimpleGradientLayer'
import AuroraLayer from './AuroraLayer'
import FluidGradientLayer from './FluidGradientLayer'
import WavesLayer from './WavesLayer'
import RibbonLayer from './RibbonLayer'
import DandelionLayer from './DandelionLayer'
import ParticleRingLayer from './ParticleRingLayer'
import GuillocheLayer from './GuillocheLayer'
import TessellationLayer from './TessellationLayer'
import EffectsLayer from './EffectsLayer'
import TextLayer from './TextLayer'

function SceneEmbedPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()

  // Capture mode: a headless browser loads /embed/:slug?capture=1, waits for
  // window.__auraCaptureReady, then calls window.__auraCapture() to get a PNG.
  // It disables the loading overlay + live input so the snapshot is a clean,
  // settled frame of the scene itself.
  const captureMode = searchParams.get('capture') === '1'

  // Parse query parameters for hiding elements and input mode
  const hideText = searchParams.get('hideText') === 'true'
  const hideIcons = searchParams.get('hideIcons') === 'true'
  // Force input off in capture mode — no mouse/mic, so the frame is deterministic.
  const inputMode = captureMode ? 'off' : (searchParams.get('input') || 'mouse') // 'off' | 'mouse' | 'mic'
  const colorMode = useColorMode(searchParams)

  const [scene, setScene] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })

  // Progressive loading overlay: instant color SVG -> live scene crossfade.
  const [overlayVisible, setOverlayVisible] = useState(true)
  const [overlayMounted, setOverlayMounted] = useState(true)

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

  // Latest resolved capture inputs, written during render (see below) so the
  // capture bridges can read them without re-subscribing on every change.
  const captureInputsRef = useRef(null)

  // Composite the live scene layers (WebGL background + tessellation + text) into
  // a PNG data URL, using the same pipeline as the in-app capture button. Shared
  // by both capture bridges below. Waits briefly for the layers to mount, since a
  // caller may ask before React has painted the first frame.
  const captureToDataUrl = useCallback(async (scale = 2) => {
    let container = document.querySelector('.layers-container')
    for (let i = 0; i < 30 && !container; i++) {
      await new Promise((r) => setTimeout(r, 100))
      container = document.querySelector('.layers-container')
    }
    if (!container) throw new Error('layers-container not found')
    const inputs = captureInputsRef.current || {}
    // Same guard as the in-app capture button: html2canvas (tessellation/text
    // layers) can't parse oklch() colors, so swap them for rgb during capture.
    const restoreColors = prepareForCapture(document.body)
    try {
      await new Promise((resolve) => requestAnimationFrame(resolve))
      const canvas = await captureLayersToCanvas(container, inputs.effectsConfig || {}, {
        scale,
        mode: 'all',
        textData: inputs.textData || null,
        hideIcons: inputs.hideIcons,
        hideText: inputs.hideText,
      })
      return canvas.toDataURL('image/png')
    } finally {
      restoreColors()
    }
  }, [])

  // Same-origin capture bridge: a headless renderer loads /embed/:slug?capture=1,
  // waits for window.__auraCaptureReady, then calls window.__auraCapture().
  useEffect(() => {
    if (!captureMode) return
    window.__auraCapture = ({ scale = 2 } = {}) => captureToDataUrl(scale)
    return () => { delete window.__auraCapture }
  }, [captureMode, captureToDataUrl])

  // Cross-origin capture bridge (postMessage): the Deconflict studio embeds this
  // scene in a cross-origin iframe, so it can't reach window.__auraCapture. It
  // asks for a snapshot by message and we reply with a PNG data URL. Always on
  // (NOT gated on ?capture=1) because the studio loads the embed with its normal
  // background params (input=off, hideText, hideIcons). Contract:
  //   parent → { type: 'promad-aura:capture', requestId, width, height, pixelRatio }
  //   reply  → { type: 'promad-aura:capture-result', requestId, dataUrl }  (or { error })
  useEffect(() => {
    const onMessage = async (e) => {
      if (e.data?.type !== 'promad-aura:capture') return
      const { requestId, pixelRatio = 2 } = e.data
      const reply = (payload) =>
        e.source?.postMessage({ type: 'promad-aura:capture-result', requestId, ...payload }, e.origin)
      try {
        reply({ dataUrl: await captureToDataUrl(pixelRatio) })
      } catch (err) {
        reply({ error: err?.message || 'capture failed' })
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [captureToDataUrl])

  // Signal readiness once the scene has mounted, fonts have loaded, and the
  // WebGL/canvas layers have had a moment to render their first frames.
  useEffect(() => {
    if (!captureMode || !scene) return
    let cancelled = false
    window.__auraCaptureReady = false
    const run = async () => {
      try { if (document.fonts?.ready) await document.fonts.ready } catch { /* ignore */ }
      await new Promise((r) => setTimeout(r, 1200)) // WebGL warm-up / settle
      if (!cancelled) window.__auraCaptureReady = true
    }
    run()
    return () => { cancelled = true; window.__auraCaptureReady = false }
  }, [captureMode, scene])

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
        // Reset the progressive overlay for the new scene
        setOverlayVisible(true)
        setOverlayMounted(true)
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

  // Once the scene data is in, give the live (WebGL/canvas) layers a short
  // warm-up to render their first frames, then crossfade the overlay out.
  useEffect(() => {
    if (!scene) return
    const t = setTimeout(() => setOverlayVisible(false), 800)
    return () => clearTimeout(t)
  }, [scene])

  // Unmount the overlay after the fade completes to free its memory.
  useEffect(() => {
    if (overlayVisible) return
    const t = setTimeout(() => setOverlayMounted(false), 700)
    return () => clearTimeout(t)
  }, [overlayVisible])

  // Build the gradient filter string (uses resolved sceneData below)
  const getGradientFilter = (resolvedEffects, resolvedBgType) => {
    if (!scene?.scene_data) return 'none'
    const effectsConfig = resolvedEffects
    const backgroundType = resolvedBgType

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

  // While the scene data loads, show the instant color SVG (neutral fallback
  // palette) instead of a spinner — it crossfades straight into the live scene.
  if (isLoading) {
    return (
      <div className="w-full h-screen overflow-hidden bg-background">
        <ColorPlaceholder
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
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

  const sceneData = resolveThemedConfigs(scene.scene_data || {}, colorMode)
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

  // Stash the resolved capture inputs so the capture bridges can read the latest
  // config without threading it through window globals on every render. Populated
  // in all modes — the cross-origin postMessage bridge runs without ?capture=1.
  captureInputsRef.current = {
    effectsConfig,
    hideIcons,
    hideText,
    textData: (textConfig.enabled && !hideText && textSections.length)
      ? { sections: textSections, gap: textGap, color: textConfig.color, opacity: textConfig.opacity }
      : null,
  }

  const auroraConfig = sceneData.auroraConfig || {}
  const fluidConfig = sceneData.fluidConfig || {}
  const wavesConfig = sceneData.wavesConfig || {}
  const ribbonConfig = sceneData.ribbonConfig || {}
  const dandelionConfig = sceneData.dandelionConfig || {}
  const particleRingConfig = sceneData.particleRingConfig || {}
  const guillocheConfig = sceneData.guillocheConfig || {}

  // Thumbnail sources for the progressive overlay (prefer WebP, fall back to JPEG).
  // Use `large` (1200px) — a sharp-enough preview that loads fast since it is
  // covered by the live scene shortly after.
  const thumb = scene.thumbnail || {}
  const thumbSizeKey = thumb.large ? 'large' : thumb.medium ? 'medium' : thumb.small ? 'small' : thumb.full ? 'full' : null
  const thumbJpg = thumbSizeKey ? thumb[thumbSizeKey] : null
  const thumbWebp = thumbSizeKey ? thumb.webp?.[thumbSizeKey] : null

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
              filter: getGradientFilter(effectsConfig, backgroundType),
            }}
          >
            {backgroundType === 'simple' && (
              <SimpleGradientLayer config={gradientConfig} gradientColors={gradientConfig.colors} effectsConfig={effectsConfig} />
            )}
            {backgroundType === 'liquid' && (
              <GradientLayer config={gradientConfig} effectsConfig={effectsConfig} mousePos={mousePos} isPaused={false} mouseIntensity={effectiveMouseIntensity} />
            )}
            {backgroundType === 'aurora' && (
              <AuroraLayer config={auroraConfig} mousePos={mousePos} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} mouseIntensity={effectiveMouseIntensity} />
            )}
            {backgroundType === 'fluid' && (
              <FluidGradientLayer config={fluidConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} mousePos={mousePos} mouseIntensity={effectiveMouseIntensity} />
            )}
            {backgroundType === 'waves' && (
              <WavesLayer config={wavesConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} mousePos={mousePos} mouseIntensity={effectiveMouseIntensity} />
            )}
            {backgroundType === 'ribbon' && (
              <RibbonLayer config={ribbonConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} mousePos={mousePos} mouseIntensity={effectiveMouseIntensity} />
            )}
            {backgroundType === 'dandelion' && (
              <DandelionLayer config={dandelionConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} mouseEnabled={effectiveMouseEnabled} mouseIntensity={effectiveMouseIntensity} />
            )}
            {backgroundType === 'particleRing' && (
              <ParticleRingLayer config={particleRingConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} mousePos={mousePos} mouseIntensity={effectiveMouseIntensity} />
            )}
            {backgroundType === 'guilloche' && (
              <GuillocheLayer config={guillocheConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} mousePos={mousePos} mouseIntensity={effectiveMouseIntensity} />
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

      {/* Progressive loading overlay: instant color SVG, crossfading out once
          the live scene has warmed up. Skipped entirely in capture mode so the
          snapshot is never of the placeholder. */}
      {overlayMounted && !captureMode && (
        <div
          className="embed-loading-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 40,
            pointerEvents: 'none',
            opacity: overlayVisible ? 1 : 0,
            transition: 'opacity 600ms ease',
          }}
        >
          <ColorPlaceholder
            colors={gradientConfig.colors}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />
        </div>
      )}
    </div>
  )
}

export default SceneEmbedPage
