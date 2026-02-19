import { useState, useEffect } from 'react'
import { CircleNotch } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

function ProjectsDialog({ open, onOpenChange, allProjects, loadingAllProjects, initialSelectedIds, onSave }) {
  const [selectedProjectIds, setSelectedProjectIds] = useState([])
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedProjectIds(initialSelectedIds || [])
      setPassword('')
      setError('')
    }
  }, [open, initialSelectedIds])

  const toggleProjectSelection = (projectId) => {
    setSelectedProjectIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const handleSave = async () => {
    if (!password.trim()) {
      setError('Password is required')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await onSave(selectedProjectIds, password)
      onOpenChange(false)
      setPassword('')
    } catch (err) {
      setError(err.message || 'Failed to save projects')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Projects</DialogTitle>
          <DialogDescription>
            Select which projects to link to this scene.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {loadingAllProjects ? (
            <div className="flex items-center justify-center py-8">
              <CircleNotch size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : allProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No projects available. Create projects first.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{project.url}</p>
                  </div>
                  <Switch
                    checked={selectedProjectIds.includes(project.id)}
                    onCheckedChange={() => toggleProjectSelection(project.id)}
                  />
                </div>
              ))}
            </div>
          )}

          {allProjects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="projects-password">Password</Label>
              <Input
                id="projects-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || allProjects.length === 0}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ProjectsDialog
