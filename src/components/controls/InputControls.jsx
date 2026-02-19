import { useEffect, useRef, useCallback } from 'react'
import { ControlGroup, NumberInput } from './SharedControls'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CursorClick, Microphone, MusicNote, Play, Pause, Upload } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import useStore from '../../store/useStore'
import { audioData } from '../../audio/audioData'

// Small real-time level meter
const LevelMeter = () => {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)

    const w = canvas.offsetWidth
    const h = canvas.offsetHeight

    const draw = () => {
      ctx.clearRect(0, 0, w, h)

      const bands = [
        { label: 'B', value: audioData.bass, color: '#ef4444' },
        { label: 'M', value: audioData.mid, color: '#eab308' },
        { label: 'T', value: audioData.treble, color: '#22c55e' },
      ]

      const barWidth = (w - 16) / 3
      const gap = 4

      bands.forEach((band, i) => {
        const x = i * (barWidth + gap) + 4
        const barHeight = band.value * (h - 4)

        // Background track
        ctx.fillStyle = 'rgba(255,255,255,0.08)'
        ctx.fillRect(x, 2, barWidth, h - 4)

        // Active bar
        ctx.fillStyle = band.color
        ctx.globalAlpha = 0.8
        ctx.fillRect(x, h - 2 - barHeight, barWidth, barHeight)
        ctx.globalAlpha = 1
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-8 rounded"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

export const InputPanel = ({ loadAudioFile, playAudio, pauseAudio, audioElement }) => {
  const audioConfig = useStore((s) => s.audioConfig)
  const updateAudioConfig = useStore((s) => s.updateAudioConfig)
  const mouseConfig = useStore((s) => s.mouseConfig)
  const setMouseConfig = useStore((s) => s.setMouseConfig)
  const inputEnabled = useStore((s) => s.inputEnabled)
  const setInputEnabled = useStore((s) => s.setInputEnabled)
  const fileInputRef = useRef(null)
  const isPlayingRef = useRef(false)

  // Derive the active input mode from audioConfig
  const inputMode = audioConfig.enabled ? audioConfig.source : 'mouse'

  const handleInputChange = useCallback((value) => {
    if (value === 'mouse') {
      updateAudioConfig({ enabled: false })
    } else {
      updateAudioConfig({ enabled: true, source: value })
    }
  }, [updateAudioConfig])

  // Track play state of audio element
  useEffect(() => {
    const el = audioElement?.current
    if (!el) return
    const onPlay = () => { isPlayingRef.current = true }
    const onPause = () => { isPlayingRef.current = false }
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    return () => {
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
    }
  }, [audioElement])

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file && loadAudioFile) {
      updateAudioConfig({ source: 'file', enabled: true })
      loadAudioFile(file)
    }
  }, [loadAudioFile, updateAudioConfig])

  const handleTogglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      pauseAudio?.()
    } else {
      playAudio?.()
    }
  }, [playAudio, pauseAudio])

  const isAudio = inputMode === 'mic' || inputMode === 'file'

  return (
    <div className="space-y-3">
      {/* Master input toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Enable Input</Label>
        <Switch checked={inputEnabled} onCheckedChange={setInputEnabled} />
      </div>

      {/* Input source selector */}
      <div className={!inputEnabled ? 'opacity-50 pointer-events-none' : undefined}>
        <ControlGroup label="Input Source">
          <Select value={inputMode} onValueChange={handleInputChange}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mouse">
                <span className="flex items-center gap-1.5">
                  <CursorClick size={14} />
                  Mouse
                </span>
              </SelectItem>
              <SelectItem value="mic">
                <span className="flex items-center gap-1.5">
                  <Microphone size={14} />
                  Microphone
                </span>
              </SelectItem>
              <SelectItem value="file">
                <span className="flex items-center gap-1.5">
                  <MusicNote size={14} />
                  Audio File
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </ControlGroup>

        {/* Mouse mode controls */}
        {inputMode === 'mouse' && (
          <>
            <p className="text-xs text-muted-foreground mt-3">
              Move your cursor to influence the background effects.
            </p>
            <ControlGroup label="Intensity">
              <NumberInput
                value={[mouseConfig.intensity]}
                onValueChange={([val]) => setMouseConfig({ ...mouseConfig, intensity: val })}
                max={1}
                step={0.05}
                showButtons
              />
            </ControlGroup>
          </>
        )}

        {/* Audio controls (mic or file) */}
        {isAudio && (
          <>
            {/* Level meter */}
            <LevelMeter />

            {/* File upload (when source is file) */}
            {inputMode === 'file' && (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.wav,.ogg,.m4a,.aac,.flac"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 flex-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} />
                    {audioConfig.fileName || 'Choose File'}
                  </Button>
                  {audioConfig.fileName && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={handleTogglePlay}
                    >
                      {isPlayingRef.current ? <Pause size={14} /> : <Play size={14} weight="fill" />}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Sensitivity */}
            <ControlGroup label="Sensitivity">
              <NumberInput
                value={[audioConfig.sensitivity]}
                onValueChange={([val]) => updateAudioConfig({ sensitivity: val })}
                min={0.1}
                max={3}
                step={0.1}
              />
            </ControlGroup>

            {/* Smoothing */}
            <ControlGroup label="Smoothing">
              <NumberInput
                value={[audioConfig.smoothing]}
                onValueChange={([val]) => updateAudioConfig({ smoothing: val })}
                min={0}
                max={0.95}
                step={0.05}
              />
            </ControlGroup>
          </>
        )}
      </div>
    </div>
  )
}
