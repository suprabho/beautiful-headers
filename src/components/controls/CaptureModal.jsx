import { CircleNotch, Image, Stack } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export const CaptureModal = ({ open, onOpenChange, isCapturing, onCapture }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isCapturing ? 'Exporting...' : 'Export Image'}</DialogTitle>
        <DialogDescription>
          {isCapturing ? 'Please wait while we generate your image.' : 'Choose how you want to capture your scene.'}
        </DialogDescription>
      </DialogHeader>
      {isCapturing ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <CircleNotch size={48} weight="bold" className="animate-spin text-primary" />
          <span className="text-muted-foreground">Preparing your image...</span>
        </div>
      ) : (
        <div className="space-y-3 py-4">
          <Button variant="outline" className="w-full h-auto p-4 justify-start gap-4" onClick={() => onCapture('background')}>
            <div className="p-2 rounded-lg bg-primary/10"><Image size={24} weight="duotone" className="text-primary" /></div>
            <div className="text-left">
              <div className="font-medium">Background Only</div>
              <div className="text-sm text-muted-foreground">Gradient + Effects (no pattern/text)</div>
            </div>
          </Button>
          <Button variant="outline" className="w-full h-auto p-4 justify-start gap-4" onClick={() => onCapture('all')}>
            <div className="p-2 rounded-lg bg-primary/10"><Stack size={24} weight="duotone" className="text-primary" /></div>
            <div className="text-left">
              <div className="font-medium">Everything</div>
              <div className="text-sm text-muted-foreground">All layers including pattern & text</div>
            </div>
          </Button>
        </div>
      )}
    </DialogContent>
  </Dialog>
)
