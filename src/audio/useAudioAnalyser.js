import { useRef, useEffect, useCallback } from 'react'
import useStore from '../store/useStore'
import { audioData } from './audioData'

// Frequency band ranges (for fftSize 2048, sampleRate ~44100):
// Each bin ≈ sampleRate / fftSize ≈ 21.5 Hz
const BAND_RANGES = {
  bass:   { start: 0,   end: 12  },  // ~0-250 Hz
  mid:    { start: 12,  end: 186 },  // ~250-4000 Hz
  treble: { start: 186, end: 744 },  // ~4000-16000 Hz
}

function resetAudioData() {
  audioData.bass = 0
  audioData.mid = 0
  audioData.treble = 0
  audioData.amplitude = 0
  audioData.frequencyData = null
  audioData.isActive = false
}

export function useAudioAnalyser() {
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const dataArrayRef = useRef(null)
  const smoothedRef = useRef({ bass: 0, mid: 0, treble: 0, amplitude: 0 })

  // Audio element for file playback
  const audioElementRef = useRef(null)
  const mediaSourceRef = useRef(null)

  const audioConfig = useStore((s) => s.audioConfig)
  const updateAudioConfig = useStore((s) => s.updateAudioConfig)
  const inputEnabled = useStore((s) => s.inputEnabled)

  // Keep a ref to latest config for the RAF loop
  const configRef = useRef(audioConfig)
  useEffect(() => { configRef.current = audioConfig }, [audioConfig])

  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioContextRef.current.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.3
      analyserRef.current = analyser
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)
    }
    // Resume if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }
    return { audioContext: audioContextRef.current, analyser: analyserRef.current }
  }, [])

  const computeBand = useCallback((dataArray, start, end) => {
    let sum = 0
    const len = Math.min(end, dataArray.length)
    for (let i = start; i < len; i++) {
      sum += dataArray[i]
    }
    return sum / ((len - start) * 255)
  }, [])

  const startAnalysisLoop = useCallback(() => {
    if (rafRef.current) return // already running

    const analyse = () => {
      const analyser = analyserRef.current
      const dataArray = dataArrayRef.current
      if (!analyser || !dataArray) return

      analyser.getByteFrequencyData(dataArray)

      const rawBass = computeBand(dataArray, BAND_RANGES.bass.start, BAND_RANGES.bass.end)
      const rawMid = computeBand(dataArray, BAND_RANGES.mid.start, BAND_RANGES.mid.end)
      const rawTreble = computeBand(dataArray, BAND_RANGES.treble.start, BAND_RANGES.treble.end)
      const rawAmplitude = rawBass * 0.5 + rawMid * 0.35 + rawTreble * 0.15

      const cfg = configRef.current
      const smoothing = cfg.smoothing ?? 0.8
      const sensitivity = cfg.sensitivity ?? 1

      // Exponential smoothing
      const s = smoothedRef.current
      s.bass = s.bass * smoothing + rawBass * (1 - smoothing)
      s.mid = s.mid * smoothing + rawMid * (1 - smoothing)
      s.treble = s.treble * smoothing + rawTreble * (1 - smoothing)
      s.amplitude = s.amplitude * smoothing + rawAmplitude * (1 - smoothing)

      // Write to shared singleton
      audioData.bass = Math.min(1, s.bass * sensitivity)
      audioData.mid = Math.min(1, s.mid * sensitivity)
      audioData.treble = Math.min(1, s.treble * sensitivity)
      audioData.amplitude = Math.min(1, s.amplitude * sensitivity)
      audioData.frequencyData = dataArray
      audioData.isActive = true

      rafRef.current = requestAnimationFrame(analyse)
    }

    rafRef.current = requestAnimationFrame(analyse)
  }, [computeBand])

  const stopAnalysisLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const disconnectSource = useCallback(() => {
    if (sourceRef.current) {
      try { sourceRef.current.disconnect() } catch {}
      sourceRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    // Don't disconnect mediaSource — it can't be reconnected once disconnected
  }, [])

  const startMic = useCallback(async () => {
    try {
      const { analyser, audioContext } = ensureAudioContext()
      disconnectSource()

      // Pause audio element if playing
      if (audioElementRef.current) {
        audioElementRef.current.pause()
      }

      // Disconnect analyser from speakers so mic input isn't played back
      try { analyser.disconnect(audioContext.destination) } catch {}

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyser)
      sourceRef.current = source

      startAnalysisLoop()
    } catch (err) {
      console.error('Microphone access denied:', err)
      updateAudioConfig({ enabled: false })
      resetAudioData()
    }
  }, [ensureAudioContext, disconnectSource, startAnalysisLoop, updateAudioConfig])

  const loadAudioFile = useCallback((file) => {
    const { audioContext, analyser } = ensureAudioContext()
    disconnectSource()

    // Create or reuse audio element
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio()
      audioElementRef.current.crossOrigin = 'anonymous'
    }
    const audio = audioElementRef.current

    // Revoke any previous object URL
    if (audio.src && audio.src.startsWith('blob:')) {
      URL.revokeObjectURL(audio.src)
    }

    audio.src = URL.createObjectURL(file)
    audio.load()

    // Create MediaElementSource only once per element
    if (!mediaSourceRef.current) {
      const mediaSource = audioContext.createMediaElementSource(audio)
      mediaSource.connect(analyser)
      mediaSourceRef.current = mediaSource
    }
    // Ensure analyser is connected to speakers so the file audio is heard
    try { analyser.connect(audioContext.destination) } catch {}

    updateAudioConfig({ fileName: file.name })
    startAnalysisLoop()
  }, [ensureAudioContext, disconnectSource, startAnalysisLoop, updateAudioConfig])

  const playAudio = useCallback(() => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume()
    }
    audioElementRef.current?.play()
  }, [])

  const pauseAudio = useCallback(() => {
    audioElementRef.current?.pause()
  }, [])

  const stopAll = useCallback(() => {
    stopAnalysisLoop()
    disconnectSource()
    if (audioElementRef.current) {
      audioElementRef.current.pause()
    }
    resetAudioData()
    smoothedRef.current = { bass: 0, mid: 0, treble: 0, amplitude: 0 }
  }, [stopAnalysisLoop, disconnectSource])

  // React to config changes
  useEffect(() => {
    if (!audioConfig.enabled || !inputEnabled) {
      stopAll()
      return
    }

    if (audioConfig.source === 'mic') {
      startMic()
    }
    // File source is handled via loadAudioFile called from InputControls

    return () => {
      // Only clean up if disabling — not on every config change
    }
  }, [audioConfig.enabled, audioConfig.source, inputEnabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll()
      if (audioElementRef.current?.src?.startsWith('blob:')) {
        URL.revokeObjectURL(audioElementRef.current.src)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [])

  return { loadAudioFile, playAudio, pauseAudio, audioElement: audioElementRef }
}
