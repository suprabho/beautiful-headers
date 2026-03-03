import { useState } from 'react'
import { Check, Copy } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export function EmbedDialogContent({ slug, sceneTitle, className = '' }) {
  const [copied, setCopied] = useState(false)
  const [embedOptions, setEmbedOptions] = useState({ hideText: false, hideIcons: false, input: 'mouse', theme: 'auto', height: 600 })

  const getEmbedCode = () => {
    const params = new URLSearchParams()
    if (embedOptions.hideText) params.set('hideText', 'true')
    if (embedOptions.hideIcons) params.set('hideIcons', 'true')
    if (embedOptions.input !== 'mouse') params.set('input', embedOptions.input)
    if (embedOptions.theme !== 'auto') params.set('theme', embedOptions.theme)
    const queryString = params.toString()
    const embedUrl = `${window.location.origin}/embed/${slug}${queryString ? `?${queryString}` : ''}`
    return `<iframe src="${embedUrl}" width="100%" height="${embedOptions.height}" frameborder="0" style="border:0;border-radius:8px;" allowfullscreen></iframe>`
  }

  const getGenerationEmbedCode = () => {
    const title = sceneTitle || slug
    const params = new URLSearchParams()
    if (embedOptions.hideText) params.set('hideText', 'true')
    if (embedOptions.hideIcons) params.set('hideIcons', 'true')
    if (embedOptions.input !== 'mouse') params.set('input', embedOptions.input)
    if (embedOptions.theme !== 'auto') params.set('theme', embedOptions.theme)
    const queryString = params.toString()
    return `<iframe title="${title}" src="https://aura.promad.design/embed/${slug}${queryString ? `?${queryString}` : ''}" style={{width:"100%", height:"${embedOptions.height}px"}} allowFullScreen></iframe>`
  }

  const handleCopyEmbed = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className={className}>
      <div className="space-y-1 mb-3">
        <h3 className="text-sm font-semibold">Embed this scene</h3>
        <p className="text-xs text-muted-foreground">
          Copy the code below to embed this scene on your website.
        </p>
      </div>
      {/* Embed Options */}
      <div className="flex flex-col gap-3 p-3 bg-muted/50 rounded-lg">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">Options</span>
        <div className="flex items-center justify-between">
          <Label htmlFor="hide-text" className="text-sm cursor-pointer">Hide text</Label>
          <Switch
            id="hide-text"
            checked={embedOptions.hideText}
            onCheckedChange={(checked) => setEmbedOptions(prev => ({ ...prev, hideText: checked }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="hide-icons" className="text-sm cursor-pointer">Hide icons</Label>
          <Switch
            id="hide-icons"
            checked={embedOptions.hideIcons}
            onCheckedChange={(checked) => setEmbedOptions(prev => ({ ...prev, hideIcons: checked }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="embed-height" className="text-sm cursor-pointer">Height</Label>
          <div className="flex items-center gap-1.5">
            <Input
              id="embed-height"
              type="number"
              min={100}
              value={embedOptions.height}
              onChange={(e) => setEmbedOptions(prev => ({ ...prev, height: Number(e.target.value) || 100 }))}
              className="h-7 w-20 text-xs"
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm">Input</Label>
          <div className="flex gap-1">
            {['off', 'mouse', 'mic'].map((mode) => (
              <Button
                key={mode}
                size="sm"
                variant={embedOptions.input === mode ? 'default' : 'outline'}
                className="h-7 text-xs capitalize px-3"
                onClick={() => setEmbedOptions(prev => ({ ...prev, input: mode }))}
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm">Theme</Label>
          <div className="flex gap-1">
            {['auto', 'dark', 'light', 'default'].map((mode) => (
              <Button
                key={mode}
                size="sm"
                variant={embedOptions.theme === mode ? 'default' : 'outline'}
                className="h-7 text-xs capitalize px-3"
                onClick={() => setEmbedOptions(prev => ({ ...prev, theme: mode }))}
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="scene" className="mt-3" onValueChange={() => setCopied(false)}>
        <TabsList className="w-full">
          <TabsTrigger value="scene" className="flex-1">HTML Embed</TabsTrigger>
          <TabsTrigger value="generation" className="flex-1">NextJS Embed</TabsTrigger>
        </TabsList>

        <TabsContent value="scene" className="space-y-4 mt-4">
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all">
            {getEmbedCode()}
          </pre>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleCopyEmbed(getEmbedCode())}
          >
            {copied ? (
              <>
                <Check size={16} className="mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} className="mr-2" />
                Copy Code
              </>
            )}
          </Button>
          <div className="text-sm text-muted-foreground">
            <p>Preview URL: <a href={`/embed/${slug}`} target="_blank" rel="noopener noreferrer" className="text-primary underline">{window.location.origin}/embed/{slug}</a></p>
          </div>
        </TabsContent>

        <TabsContent value="generation" className="space-y-4 mt-4">
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all">
            {getGenerationEmbedCode()}
          </pre>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleCopyEmbed(getGenerationEmbedCode())}
          >
            {copied ? (
              <>
                <Check size={16} className="mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} className="mr-2" />
                Copy Code
              </>
            )}
          </Button>
          <div className="text-sm text-muted-foreground">
            <p>Production URL: <a href={`https://aura.promad.design/embed/${slug}`} target="_blank" rel="noopener noreferrer" className="text-primary underline">https://aura.promad.design/embed/{slug}</a></p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmbedDialog({ open, onOpenChange, slug, sceneTitle }) {
  const handleOpenChange = (open) => {
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <EmbedDialogContent slug={slug} sceneTitle={sceneTitle} />
      </DialogContent>
    </Dialog>
  )
}

export default EmbedDialog
