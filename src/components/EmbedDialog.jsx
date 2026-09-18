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
import {
  PRODUCTION_ORIGIN,
  buildEmbedUrl,
  iframeSnippet,
  facadeSnippet,
  nextSnippet,
} from '@/lib/embedSnippets'

function CopyButton({ code, copied, onCopy }) {
  return (
    <Button variant="secondary" className="w-full" onClick={() => onCopy(code)}>
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
  )
}

export function EmbedDialogContent({ slug, sceneTitle, colors, className = '' }) {
  const [copied, setCopied] = useState(false)
  const [embedOptions, setEmbedOptions] = useState({ hideText: false, hideIcons: false, input: 'mouse', theme: 'auto', height: 600 })

  const title = sceneTitle || slug
  const localUrl = buildEmbedUrl({ origin: window.location.origin, slug, ...embedOptions })
  const productionUrl = buildEmbedUrl({ origin: PRODUCTION_ORIGIN, slug, ...embedOptions })
  const snippetProps = { title, height: embedOptions.height, input: embedOptions.input }

  const htmlCode = iframeSnippet({ url: localUrl, ...snippetProps })
  const lazyCode = facadeSnippet({ url: localUrl, slug, colors, ...snippetProps })
  const nextCode = nextSnippet({ url: productionUrl, ...snippetProps })

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

      <Tabs defaultValue="lazy" className="mt-3" onValueChange={() => setCopied(false)}>
        <TabsList className="w-full">
          <TabsTrigger value="lazy" className="flex-1">Lazy (poster)</TabsTrigger>
          <TabsTrigger value="scene" className="flex-1">HTML Embed</TabsTrigger>
          <TabsTrigger value="generation" className="flex-1">NextJS Embed</TabsTrigger>
        </TabsList>

        <TabsContent value="lazy" className="space-y-4 mt-4">
          <p className="text-xs text-muted-foreground">
            Recommended for hero backgrounds. Paints the scene&apos;s palette instantly and loads the live
            scene only after your page has rendered, so it stays out of your Lighthouse critical path.
            Set <code className="font-mono">trigger</code> to <code className="font-mono">&apos;interaction&apos;</code> to
            wait for the first scroll or pointer move instead.
          </p>
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all max-h-64 overflow-y-auto">
            {lazyCode}
          </pre>
          <CopyButton code={lazyCode} copied={copied} onCopy={handleCopyEmbed} />
        </TabsContent>

        <TabsContent value="scene" className="space-y-4 mt-4">
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all">
            {htmlCode}
          </pre>
          <CopyButton code={htmlCode} copied={copied} onCopy={handleCopyEmbed} />
          <div className="text-sm text-muted-foreground">
            <p>Preview URL: <a href={`/embed/${slug}`} target="_blank" rel="noopener noreferrer" className="text-primary underline">{window.location.origin}/embed/{slug}</a></p>
          </div>
        </TabsContent>

        <TabsContent value="generation" className="space-y-4 mt-4">
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all">
            {nextCode}
          </pre>
          <CopyButton code={nextCode} copied={copied} onCopy={handleCopyEmbed} />
          <div className="text-sm text-muted-foreground">
            <p>Production URL: <a href={productionUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">{PRODUCTION_ORIGIN}/embed/{slug}</a></p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmbedDialog({ open, onOpenChange, slug, sceneTitle, colors }) {
  const handleOpenChange = (open) => {
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <EmbedDialogContent slug={slug} sceneTitle={sceneTitle} colors={colors} />
      </DialogContent>
    </Dialog>
  )
}

export default EmbedDialog
