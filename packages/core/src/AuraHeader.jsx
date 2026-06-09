import { useState, useEffect, useCallback, useRef } from 'react'
import { getBackground } from './registry'
import { resolveThemedConfigs } from './lib/themeUtils'
import { useColorModeValue } from './useColorMode'
import { audioData } from './audio/audioData'
import ColorPlaceholder from './components/ColorPlaceholder'
import EffectsLayer from './components/EffectsLayer'
import TextLayer from './components/TextLayer'
import TessellationLayer from './components/TessellationLayer'

/**
 * Build the CSS `filter` string applied to the background wrapper. Mirrors the
 * app's embed renderer: liquid only honours blur (its shader does the rest),
 * every other background gets the full saturate/contrast/brightness + colorMap.
 */
function getGradientFilter(effectsConfig = {}, backgroundType) {
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
    default: break
  }
  return filters.filter(Boolean).join(' ') || 'none'
}

/**
 * AuraHeader — renders an animated header background from a `scene_data`
 * config object. Which backgrounds are available depends on which package you
 * import (see the registry): any `backgroundType` with no registered renderer
 * falls back to the SVG `ColorPlaceholder` (this is the whole `lite` story).
 *
 * Props:
 *   config      scene_data object (the shape produced by the Aura editor)
 *   input       'off' | 'mouse' | 'mic'  — interaction source (default 'mouse')
 *   colorMode   'auto' | 'dark' | 'light' | 'default' (default 'auto')
 *   hideText    hide the text layer (default false)
 *   hideIcons   hide the tessellation/icon layer (default false)
 *   paused      freeze animation (default false)
 *   fallback    component used for unregistered backgrounds (default ColorPlaceholder)
 *   className / style  applied to the root element (set height via style)
 */
export default function AuraHeader({
  config,
  input = 'mouse',
  colorMode = 'auto',
  hideText = false,
  hideIcons = false,
  paused = false,
  fallback: Fallback = ColorPlaceholder,
  className,
  style,
}) {
  const mode = useColorModeValue(colorMode)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })

  // Throttle mouse updates to one per animation frame.
  const rafPendingRef = useRef(false)
  const pendingMouseRef = useRef({ x: 0.5, y: 0.5 })
  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    pendingMouseRef.current.x = (e.clientX - rect.left) / rect.width
    pendingMouseRef.current.y = (e.clientY - rect.top) / rect.height
    if (rafPendingRef.current) return
    rafPendingRef.current = true
    requestAnimationFrame(() => {
      setMousePos({ x: pendingMouseRef.current.x, y: pendingMouseRef.current.y })
      rafPendingRef.current = false
    })
  }, [])

  // Microphone analyser — feeds the shared audioData the layers read from.
  useEffect(() => {
    if (input !== 'mic') return
    let audioContext, analyser, dataArray, stream, rafId
    const smoothed = { bass: 0, mid: 0, treble: 0, amplitude: 0 }
    const BAND_RANGES = {
      bass: { start: 0, end: 12 },
      mid: { start: 12, end: 186 },
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
        audioContext.createMediaStreamSource(stream).connect(analyser)
        rafId = requestAnimationFrame(analyse)
      } catch (err) {
        console.error('AuraHeader: microphone access denied:', err)
      }
    }
    startMic()
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (stream) stream.getTracks().forEach((t) => t.stop())
      if (audioContext) audioContext.close()
      Object.assign(audioData, {
        bass: 0, mid: 0, treble: 0, amplitude: 0, frequencyData: null, isActive: false,
      })
    }
  }, [input])

  const sceneData = resolveThemedConfigs(config || {}, mode)
  const backgroundType = sceneData.backgroundType || 'liquid'
  const gradientConfig = sceneData.gradientConfig || {}
  const tessellationConfig = sceneData.tessellationConfig || {}
  const effectsConfig = sceneData.effectsConfig || {}
  const textSections = sceneData.textSections || []
  const textGap = sceneData.textGap || 0
  const textConfig = sceneData.textConfig || {}
  const mouseConfig = sceneData.mouseConfig || { enabled: true, intensity: 0.5 }

  const inputEnabled = input !== 'off' && (sceneData.inputEnabled !== undefined ? sceneData.inputEnabled : true)
  const mouseIntensity = inputEnabled && input !== 'mic' ? mouseConfig.intensity : 0
  const mouseEnabled = inputEnabled && input !== 'mic' && mouseConfig.enabled

  const renderBackground = getBackground(backgroundType)
  const backgroundCtx = {
    scene: sceneData,
    effectsConfig,
    paletteColors: gradientConfig.colors,
    mousePos,
    mouseIntensity,
    mouseEnabled,
    isPaused: paused,
  }

  const rootStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    ...style,
  }

  return (
    <div
      className={['aura-header', className].filter(Boolean).join(' ')}
      style={rootStyle}
      onMouseMove={mouseEnabled ? handleMouseMove : undefined}
    >
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
          {renderBackground ? (
            renderBackground(backgroundCtx)
          ) : (
            <Fallback
              colors={gradientConfig.colors}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            />
          )}
        </div>

        {/* Tessellation / icon layer */}
        {tessellationConfig.enabled && !hideIcons && (
          <TessellationLayer
            config={tessellationConfig}
            mousePos={mousePos}
            isPaused={paused}
            mouseIntensity={mouseIntensity}
          />
        )}

        {/* Effects layer (grain / dots / grid / vignette) */}
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
  )
}
