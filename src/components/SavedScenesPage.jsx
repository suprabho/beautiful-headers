import { useState, useEffect } from 'react'
import { ArrowLeft, Trash, CircleNotch, Warning, ImageBroken, Play } from '@phosphor-icons/react'
import { getScenes, getScene, deleteScene, checkCmsHealth } from '@/lib/scenesApi'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import useStore from '../store/useStore'

function SceneCard({ scene, onClick, onDelete }) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Supabase returns full URLs, no need to prepend base
  const thumbnailUrl = scene.thumbnail?.medium || null

  // Use long description for alt text, fallback to short description or title
  const altText = scene.long_description || scene.short_description || scene.title

  return (
    <div
      className="group relative rounded-xl overflow-hidden bg-card border border-border transition-all hover:border-primary/50 hover:shadow-lg cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(scene)}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-muted relative">
        {thumbnailUrl && !imageError ? (
          <img
            src={thumbnailUrl}
            alt={altText}
            title={altText}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageBroken size={48} weight="light" />
          </div>
        )}

        {/* Hover overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <span className="text-white font-medium">View Details</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-sm truncate">{scene.title}</h3>
        {scene.short_description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {scene.short_description}
          </p>
        )}
      </div>

      {/* Delete button */}
      <button
        className={cn(
          "absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-destructive transition-all",
          isHovered ? "opacity-100" : "opacity-0"
        )}
        onClick={(e) => {
          e.stopPropagation()
          onDelete(scene)
        }}
      >
        <Trash size={16} weight="bold" />
      </button>
    </div>
  )
}

function SavedScenesPage() {
  const setCurrentPage = useStore((state) => state.setCurrentPage)
  const loadSceneData = useStore((state) => state.loadSceneData)
  const setCurrentSceneId = useStore((state) => state.setCurrentSceneId)

  const [scenes, setScenes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cmsAvailable, setCmsAvailable] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, scene: null })
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingScene, setIsLoadingScene] = useState(false)
  const [selectedScene, setSelectedScene] = useState(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // Check CMS and fetch scenes on mount
  useEffect(() => {
    const init = async () => {
      const isHealthy = await checkCmsHealth()
      setCmsAvailable(isHealthy)

      if (isHealthy) {
        fetchScenes()
      } else {
        setIsLoading(false)
        setError('Unable to connect to database. Check your internet connection.')
      }
    }
    init()
  }, [])

  const fetchScenes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getScenes()
      setScenes(response.docs || [])
    } catch (err) {
      console.error('Failed to fetch scenes:', err)
      setError('Failed to load scenes. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenSceneDetails = async (scene) => {
    // Set the scene immediately to show the dialog
    setSelectedScene(scene)
    setIsLoadingDetails(true)

    try {
      // Fetch full scene data including sceneData
      const fullScene = await getScene(scene.id)
      setSelectedScene(fullScene)
    } catch (err) {
      console.error('Failed to load scene details:', err)
      // Keep showing partial data if fetch fails
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleApplyScene = async (scene) => {
    try {
      setIsLoadingScene(true)
      // If we already have full scene data, use it directly
      if (scene.scene_data) {
        loadSceneData(scene.scene_data)
        setCurrentSceneId(scene.id)
        setSelectedScene(null)
        setCurrentPage('editor')
      } else {
        const fullScene = await getScene(scene.id)
        loadSceneData(fullScene.scene_data)
        setCurrentSceneId(scene.id)
        setSelectedScene(null)
        setCurrentPage('editor')
      }
    } catch (err) {
      console.error('Failed to load scene:', err)
      setError('Failed to load scene. Please try again.')
    } finally {
      setIsLoadingScene(false)
    }
  }

  const handleDeleteScene = async () => {
    if (!deleteDialog.scene) return

    try {
      setIsDeleting(true)
      await deleteScene(deleteDialog.scene.id)
      setScenes((prev) => prev.filter((s) => s.id !== deleteDialog.scene.id))
      setDeleteDialog({ open: false, scene: null })
    } catch (err) {
      console.error('Failed to delete scene:', err)
      setError('Failed to delete scene. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage('editor')}
          >
            <ArrowLeft size={20} weight="bold" />
          </Button>
          <h1 className="text-lg font-semibold">Saved Scenes</h1>
          <span className="text-sm text-muted-foreground">
            {scenes.length} {scenes.length === 1 ? 'scene' : 'scenes'}
          </span>
        </div>
      </header>

      {/* Loading overlay for scene loading */}
      {isLoadingScene && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <CircleNotch size={24} className="animate-spin" />
            <span>Loading scene...</span>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <CircleNotch size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Warning size={48} className="text-destructive mb-4" weight="light" />
            <p className="text-muted-foreground max-w-md">{error}</p>
            {cmsAvailable && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={fetchScenes}
              >
                Try Again
              </Button>
            )}
          </div>
        ) : scenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground mb-4">No saved scenes yet</p>
            <Button
              variant="outline"
              onClick={() => setCurrentPage('editor')}
            >
              Create your first scene
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {scenes.map((scene) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                onClick={handleOpenSceneDetails}
                onDelete={(s) => setDeleteDialog({ open: true, scene: s })}
              />
            ))}
          </div>
        )}
      </main>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => !isDeleting && setDeleteDialog({ open, scene: open ? deleteDialog.scene : null })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Scene</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.scene?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, scene: null })}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteScene}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <CircleNotch size={16} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scene detail sheet */}
      <Dialog
        open={!!selectedScene}
        onOpenChange={(open) => !isLoadingScene && !open && setSelectedScene(null)}
      >
        <DialogContent className="sm:max-w-lg">
          {selectedScene && (
            <>
              {/* Thumbnail */}
              <div className="aspect-video bg-muted rounded-lg overflow-hidden -mx-2 -mt-2">
                {selectedScene.thumbnail?.large ? (
                  <img
                    src={selectedScene.thumbnail.large}
                    alt={selectedScene.long_description || selectedScene.short_description || selectedScene.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageBroken size={64} weight="light" />
                  </div>
                )}
              </div>

              <DialogHeader className="pt-2">
                <DialogTitle className="text-xl">{selectedScene.title}</DialogTitle>
                {selectedScene.short_description && (
                  <DialogDescription className="text-base">
                    {selectedScene.short_description}
                  </DialogDescription>
                )}
              </DialogHeader>

              {/* Long description */}
              {selectedScene.long_description && (
                <ScrollArea className="max-h-32">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedScene.long_description}
                  </p>
                </ScrollArea>
              )}

              {/* Color stops */}
              {isLoadingDetails ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CircleNotch size={16} className="animate-spin" />
                  <span className="text-sm">Loading details...</span>
                </div>
              ) : selectedScene.scene_data?.gradientConfig?.colors && (
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Colors</span>
                  <div className="flex gap-1.5">
                    {selectedScene.scene_data.gradientConfig.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-md border border-border/50 shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={() => setSelectedScene(null)}
                  disabled={isLoadingScene}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 sm:flex-none"
                  onClick={() => handleApplyScene(selectedScene)}
                  disabled={isLoadingScene}
                >
                  {isLoadingScene ? (
                    <>
                      <CircleNotch size={16} className="animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Play size={16} weight="fill" />
                      Apply Scene
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SavedScenesPage
