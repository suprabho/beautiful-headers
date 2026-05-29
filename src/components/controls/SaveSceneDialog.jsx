import { CircleNotch, Check, FloppyDisk } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'

export const SaveSceneDialog = ({
  open, onOpenChange,
  isSaving, saveError, saveSuccess,
  isGenerating, saveThumbnail, generatedContent,
  cmsAvailable, gradientColors,
  isEditing, sceneName,
  onSave, onSaveAsNew,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>
          <div className="flex items-center gap-2">
            <FloppyDisk size={20} weight="duotone" />
            {isEditing ? `Update “${sceneName}”` : 'Save Scene'}
          </div>
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? 'Overwrite the saved scene with your current changes, or save a copy as a new scene.'
            : 'Save your current scene configuration to your library.'}
        </DialogDescription>
      </DialogHeader>

      {/* Show thumbnail and color stops while saving/generating */}
      {(isSaving || saveSuccess) && saveThumbnail && (
        <div className="space-y-4">
          {/* Thumbnail preview */}
          <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
            <img src={saveThumbnail} alt="Scene preview" className="w-full h-full object-cover" />
          </div>

          {/* Color stops */}
          <div className="flex gap-1 h-6 rounded-md overflow-hidden">
            {gradientColors.map((color, index) => (
              <div
                key={index}
                className="flex-1 transition-all"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {saveSuccess ? (
        <div className="space-y-4">
          {/* Show generated content on success */}
          {generatedContent && (
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Title</span>
                <p className="font-medium">{generatedContent.title}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Description</span>
                <p className="text-sm text-muted-foreground">{generatedContent.shortDescription}</p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check size={16} weight="bold" className="text-green-500" />
            </div>
            <span className="text-muted-foreground">Scene saved successfully!</span>
          </div>
        </div>
      ) : isSaving ? (
        <div className="flex items-center justify-center gap-3 py-4">
          <CircleNotch size={24} className="animate-spin text-primary" />
          <span className="text-muted-foreground">
            {isGenerating ? 'Generating AI descriptions...' : 'Saving scene...'}
          </span>
        </div>
      ) : (
        <div className="space-y-4 py-4">
          {!cmsAvailable && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-600 dark:text-yellow-400">
              Unable to connect to database. Check your internet connection.
            </div>
          )}
          {saveError ? (
            <div className="text-center py-4">
              <p className="text-sm text-destructive">{saveError}</p>
            </div>
          ) : isEditing ? (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-600 dark:text-yellow-400">
              This will overwrite the saved scene <span className="font-semibold">“{sceneName}”</span>. Choose <span className="font-semibold">Save as new</span> to keep the original and create a copy instead.
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Save this scene to your collection. AI will generate a title and description automatically.
            </div>
          )}
        </div>
      )}
      {!saveSuccess && !isSaving && (
        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {isEditing && (
            <Button variant="outline" className="flex-1" onClick={onSaveAsNew} disabled={!cmsAvailable}>
              Save as new
            </Button>
          )}
          <Button className="flex-1" onClick={() => onSave()} disabled={!cmsAvailable}>
            <FloppyDisk size={16} className="mr-2" />
            {isEditing ? 'Update scene' : 'Save Scene'}
          </Button>
        </DialogFooter>
      )}
    </DialogContent>
  </Dialog>
)
