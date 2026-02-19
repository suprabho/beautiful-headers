import { useState } from 'react'
import { CircleNotch, Download } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const downloadSizes = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
  { label: 'Full (2x)', value: 'full' },
]

function DownloadDialog({ open, onOpenChange, onDownload }) {
  const [options, setOptions] = useState({
    size: 'full',
    hideText: false,
    hideIcons: false,
  })
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      await onDownload(options)
      onOpenChange(false)
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download Image</DialogTitle>
          <DialogDescription>
            Choose the size and options for your download.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Size Selection */}
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Size</span>
            <div className="grid grid-cols-2 gap-2">
              {downloadSizes.map((size) => (
                <Button
                  key={size.value}
                  variant={options.size === size.value ? 'default' : 'outline'}
                  size="sm"
                  className="justify-start text-xs"
                  onClick={() => setOptions(prev => ({ ...prev, size: size.value }))}
                >
                  {size.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3 p-3 bg-muted/50 rounded-lg">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Options</span>
            <div className="flex items-center justify-between">
              <Label htmlFor="download-hide-text" className="text-sm cursor-pointer">Hide text</Label>
              <Switch
                id="download-hide-text"
                checked={options.hideText}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, hideText: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="download-hide-icons" className="text-sm cursor-pointer">Hide icons</Label>
              <Switch
                id="download-hide-icons"
                checked={options.hideIcons}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, hideIcons: checked }))}
              />
            </div>
          </div>

          {/* Download Button */}
          <Button
            className="w-full"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <CircleNotch size={16} className="mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download size={16} className="mr-2" />
                Download PNG
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DownloadDialog
