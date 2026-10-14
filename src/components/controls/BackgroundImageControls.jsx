import { useRef, useState, useCallback } from 'react'
import { UploadSimple, Link, X, CircleNotch } from '@phosphor-icons/react'
import { SliderInput } from './SharedControls'
import { SectionLabel, Segmented } from './StudioControls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useStore from '../../store/useStore'
import { useBackgroundImage } from '../../hooks/useBackgroundImage'
import { BLEND_MODES, isFullFieldType } from '../../lib/backgroundImage'

const SOURCE_OPTIONS = [
  { value: 'upload', label: 'Upload' },
  { value: 'url', label: 'URL' },
]

const FIT_OPTIONS = [
  { value: 'cover', label: 'Cover' },
  { value: 'contain', label: 'Contain' },
]

const hostOf = (url) => {
  try {
    return new URL(url).host || url
  } catch {
    return url
  }
}

/**
 * Base image: an uploaded file or a URL drawn by the active background type
 * in place of its base colour. Full-field types (simple, liquid, prism) lay
 * their gradient over the image instead, with an opacity and blend mode.
 */
export const BackgroundImageControls = () => {
  const config = useStore((state) => state.backgroundImageConfig)
  const updateConfig = useStore((state) => state.updateBackgroundImageConfig)
  const backgroundType = useStore((state) => state.backgroundType)
  const { status, error } = useBackgroundImage()

  const fileInputRef = useRef(null)
  const [mode, setMode] = useState(config.sourceKind || 'upload')
  const [urlDraft, setUrlDraft] = useState(config.sourceKind === 'url' ? config.src : '')

  const fullField = isFullFieldType(backgroundType)

  // Uploaded files live as object URLs; release the old one when replaced
  const setSource = useCallback((next) => {
    const { src, sourceKind } = useStore.getState().backgroundImageConfig
    if (sourceKind === 'upload' && src && src !== next.src) URL.revokeObjectURL(src)
    updateConfig({ enabled: true, ...next })
  }, [updateConfig])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    setSource({ src: URL.createObjectURL(file), sourceKind: 'upload', name: file.name })
  }

  const applyUrl = () => {
    const url = urlDraft.trim()
    if (!url) return
    setSource({ src: url, sourceKind: 'url', name: hostOf(url) })
  }

  const removeImage = () => {
    setSource({ src: null, sourceKind: null, name: null })
    setUrlDraft('')
  }

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel
        hint="under the background"
        action={
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => updateConfig({ enabled: checked })}
            aria-label="Use a base image"
          />
        }
      >
        Base image
      </SectionLabel>

      {config.enabled && (
        <>
          <Segmented options={SOURCE_OPTIONS} value={mode} onChange={setMode} />

          {mode === 'upload' ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadSimple size={14} />
                {config.sourceKind === 'upload' ? 'Replace image' : 'Choose image'}
              </Button>
            </>
          ) : (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                applyUrl()
              }}
            >
              <Input
                type="url"
                inputMode="url"
                placeholder="https://…/photo.jpg"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                className="h-9 min-w-0 flex-1"
              />
              <Button type="submit" variant="outline" size="sm" className="h-9 shrink-0 gap-1.5" disabled={!urlDraft.trim()}>
                <Link size={14} />
                Load
              </Button>
            </form>
          )}

          {config.src && (
            <div className="flex items-center gap-2.5 rounded-lg border border-border p-1.5">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                {status === 'ready' && (
                  <img src={config.src} alt="" crossOrigin="anonymous" className="size-full object-cover" />
                )}
                {status === 'loading' && (
                  <CircleNotch size={16} className="absolute inset-0 m-auto animate-spin text-muted-foreground" />
                )}
              </div>
              <span className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground" title={config.name || ''}>
                {config.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={removeImage}
                aria-label="Remove image"
              >
                <X size={14} />
              </Button>
            </div>
          )}

          {error && <p className="text-[12px] text-destructive">{error}</p>}

          {config.src && (
            <>
              <Segmented options={FIT_OPTIONS} value={config.fit} onChange={(fit) => updateConfig({ fit })} />

              {fullField ? (
                <>
                  <SliderInput
                    label="Gradient opacity (%)"
                    value={[Math.round(config.gradientOpacity * 100)]}
                    onValueChange={([v]) => updateConfig({ gradientOpacity: v / 100 })}
                    min={0}
                    max={100}
                    step={1}
                  />
                  <Select value={config.blendMode} onValueChange={(blendMode) => updateConfig({ blendMode })}>
                    <SelectTrigger className="h-9" aria-label="Gradient blend mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BLEND_MODES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <SliderInput
                  label="Image opacity (%)"
                  value={[Math.round(config.imageOpacity * 100)]}
                  onValueChange={([v]) => updateConfig({ imageOpacity: v / 100 })}
                  min={0}
                  max={100}
                  step={1}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
