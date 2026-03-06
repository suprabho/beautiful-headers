import { useRef, useEffect } from 'react'
import { audioData } from './audioData'

// Frequency band ranges (fftSize 2048, sampleRate ~44100)
const BANDS = {
  bass:   [0, 12],   // ~0-250 Hz
  mid:    [12, 186],  // ~250-4000 Hz
  treble: [186, 744], // ~4000-16000 Hz
}

function bandAvg(data, start, end) {
  const len = Math.min(end, data.length)
  let sum = 0
  for (let i = start; i < len; i++) sum += data[i]
  return sum / ((len - start) * 255)
}

/**
 * Lightweight mic hook for mini scene previews.
 * Writes directly to the audioData singleton so layers pick it up automatically.
 * Independent of the Zustand store — won't interfere with the main app's audio state.
 */
export function useMiniMic(enabled) {
  const ctxRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const dataRef = useRef(null)
  const smoothRef = useRef({ bass: 0, mid: 0, treble: 0, amplitude: 0 })

  useEffect(() => {
    if (!enabled) {
      // Tear down
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      if (sourceRef.current) try { sourceRef.current.disconnect() } catch {}
      sourceRef.current = null
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
      // Reset shared audio data
      audioData.bass = 0
      audioData.mid = 0
      audioData.treble = 0
      audioData.amplitude = 0
      audioData.frequencyData = null
      audioData.isActive = false
      smoothRef.current = { bass: 0, mid: 0, treble: 0, amplitude: 0 }
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        // Create audio context + analyser if needed
        if (!ctxRef.current) {
          ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
          const a = ctxRef.current.createAnalyser()
          a.fftSize = 2048
          a.smoothingTimeConstant = 0.3
          analyserRef.current = a
          dataRef.current = new Uint8Array(a.frequencyBinCount)
        }
        if (ctxRef.current.state === 'suspended') await ctxRef.current.resume()

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream

        const source = ctxRef.current.createMediaStreamSource(stream)
        source.connect(analyserRef.current)
        sourceRef.current = source

        // Analysis loop
        const analyse = () => {
          if (cancelled) return
          const data = dataRef.current
          analyserRef.current.getByteFrequencyData(data)

          const rawBass = bandAvg(data, ...BANDS.bass)
          const rawMid = bandAvg(data, ...BANDS.mid)
          const rawTreble = bandAvg(data, ...BANDS.treble)
          const rawAmp = rawBass * 0.5 + rawMid * 0.35 + rawTreble * 0.15

          const s = smoothRef.current
          const sm = 0.8
          s.bass = s.bass * sm + rawBass * (1 - sm)
          s.mid = s.mid * sm + rawMid * (1 - sm)
          s.treble = s.treble * sm + rawTreble * (1 - sm)
          s.amplitude = s.amplitude * sm + rawAmp * (1 - sm)

          audioData.bass = Math.min(1, s.bass)
          audioData.mid = Math.min(1, s.mid)
          audioData.treble = Math.min(1, s.treble)
          audioData.amplitude = Math.min(1, s.amplitude)
          audioData.frequencyData = data
          audioData.isActive = true

          rafRef.current = requestAnimationFrame(analyse)
        }
        rafRef.current = requestAnimationFrame(analyse)
      } catch (err) {
        console.error('Mini mic access denied:', err)
      }
    })()

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      if (sourceRef.current) try { sourceRef.current.disconnect() } catch {}
      sourceRef.current = null
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
      audioData.bass = 0
      audioData.mid = 0
      audioData.treble = 0
      audioData.amplitude = 0
      audioData.frequencyData = null
      audioData.isActive = false
      smoothRef.current = { bass: 0, mid: 0, treble: 0, amplitude: 0 }
    }
  }, [enabled])

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      if (ctxRef.current) {
        ctxRef.current.close()
        ctxRef.current = null
      }
    }
  }, [])
}
