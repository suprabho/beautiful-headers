import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash, CircleNotch, Warning, ImageBroken } from '@phosphor-icons/react'
import { getScenes, deleteScene, checkCmsHealth, titleToSlug } from '@/lib/scenesApi'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import '../App.css'

function SceneCard({ scene, onNavigate, onDelete }) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Supabase returns full URLs, no need to prepend base
  const thumbnailUrl = scene.thumbnail?.small || null

  // Use long description for alt text, fallback to short description or title
  const altText = scene.long_description || scene.short_description || scene.title

  return (
    <div
      className="group relative rounded-xl overflow-hidden bg-card border border-border transition-all hover:border-primary/50 hover:shadow-lg cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onNavigate(scene)}
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
          <span className="text-white font-medium">View Scene</span>
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
  const navigate = useNavigate()

  const [scenes, setScenes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cmsAvailable, setCmsAvailable] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, scene: null })
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleNavigateToScene = (scene) => {
    const slug = titleToSlug(scene.title)
    navigate(`/scenes/${slug}`)
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
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={20} weight="bold" />
          </Button>
          <h1 className="text-lg font-semibold">Saved Scenes</h1>
          <span className="text-sm text-muted-foreground">
            {scenes.length} {scenes.length === 1 ? 'scene' : 'scenes'}
          </span>
        </div>
      </header>

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
              onClick={() => navigate('/')}
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
                onNavigate={handleNavigateToScene}
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
    </div>
  )
}

export default SavedScenesPage
