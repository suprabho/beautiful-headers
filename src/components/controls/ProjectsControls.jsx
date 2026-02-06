import { useState, useEffect } from 'react'
import { Plus, Trash, CaretRight, PencilSimple } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { getProjects, createProject, updateProject, deleteProject } from '@/lib/scenesApi'

export const ProjectsPanel = ({
  selectedProjectIds,
  setSelectedProjectIds,
  addProjectToScene,
  removeProjectFromScene,
}) => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [deletingProject, setDeletingProject] = useState(null)

  // Form states
  const [formName, setFormName] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Collapsed sections
  const [collapsedSections, setCollapsedSections] = useState({})

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getProjects()
      setProjects(data)
    } catch (err) {
      setError('Failed to load projects')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!formName.trim()) {
      setFormError('Name is required')
      return
    }
    if (!formUrl.trim()) {
      setFormError('URL is required')
      return
    }
    if (!formPassword.trim()) {
      setFormError('Password is required')
      return
    }

    try {
      setIsSaving(true)
      setFormError('')
      const newProject = await createProject(formName.trim(), formUrl.trim(), formPassword)
      setProjects([newProject, ...projects])
      setShowCreateDialog(false)
      resetForm()
    } catch (err) {
      setFormError(err.message === 'Invalid password' ? 'Incorrect password' : 'Failed to create project')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditProject = async () => {
    if (!formName.trim()) {
      setFormError('Name is required')
      return
    }
    if (!formUrl.trim()) {
      setFormError('URL is required')
      return
    }
    if (!formPassword.trim()) {
      setFormError('Password is required')
      return
    }

    try {
      setIsSaving(true)
      setFormError('')
      const updated = await updateProject(editingProject.id, { name: formName.trim(), url: formUrl.trim() }, formPassword)
      setProjects(projects.map(p => p.id === updated.id ? updated : p))
      setShowEditDialog(false)
      resetForm()
    } catch (err) {
      setFormError(err.message === 'Invalid password' ? 'Incorrect password' : 'Failed to update project')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!formPassword.trim()) {
      setFormError('Password is required')
      return
    }

    try {
      setIsSaving(true)
      setFormError('')
      await deleteProject(deletingProject.id, formPassword)
      setProjects(projects.filter(p => p.id !== deletingProject.id))
      // Also remove from selected if it was selected
      if (selectedProjectIds.includes(deletingProject.id)) {
        removeProjectFromScene(deletingProject.id)
      }
      setShowDeleteDialog(false)
      resetForm()
    } catch (err) {
      setFormError(err.message === 'Invalid password' ? 'Incorrect password' : 'Failed to delete project')
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormUrl('')
    setFormPassword('')
    setFormError('')
    setEditingProject(null)
    setDeletingProject(null)
  }

  const openEditDialog = (project) => {
    setEditingProject(project)
    setFormName(project.name)
    setFormUrl(project.url)
    setFormPassword('')
    setFormError('')
    setShowEditDialog(true)
  }

  const openDeleteDialog = (project) => {
    setDeletingProject(project)
    setFormPassword('')
    setFormError('')
    setShowDeleteDialog(true)
  }

  const toggleProjectSelection = (projectId) => {
    if (selectedProjectIds.includes(projectId)) {
      removeProjectFromScene(projectId)
    } else {
      addProjectToScene(projectId)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-sm text-muted-foreground">Loading projects...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={loadProjects}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground mb-3">
        Select projects to link to this scene, or create new ones.
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          No projects yet. Create your first project below.
        </div>
      ) : (
        projects.map((project) => (
          <div key={project.id} className="rounded-lg bg-muted/50 overflow-hidden">
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => setCollapsedSections(prev => ({ ...prev, [project.id]: !prev[project.id] }))}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Switch
                  checked={selectedProjectIds.includes(project.id)}
                  onCheckedChange={() => toggleProjectSelection(project.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="scale-75"
                />
                <CaretRight
                  size={12}
                  className={cn(
                    "transition-transform duration-200 shrink-0",
                    !collapsedSections[project.id] && "rotate-90"
                  )}
                />
                <span className="text-sm font-medium truncate">{project.name}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    openEditDialog(project)
                  }}
                >
                  <PencilSimple size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    openDeleteDialog(project)
                  }}
                >
                  <Trash size={12} />
                </Button>
              </div>
            </div>

            <div
              className={cn(
                "grid transition-all duration-200 ease-in-out",
                collapsedSections[project.id] ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="p-3 pt-0 space-y-2">
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:underline truncate block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {project.url}
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      <div className="flex items-center justify-center pt-2">
        <Label className="text-xs uppercase tracking-wide font-semibold">Projects</Label>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => {
            resetForm()
            setShowCreateDialog(true)
          }}
        >
          <Plus size={14} />
        </Button>
      </div>

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Name</Label>
              <Input
                id="project-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="My Project"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-url">URL</Label>
              <Input
                id="project-url"
                type="url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-password">Password</Label>
              <Input
                id="project-password"
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Enter admin password"
              />
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={isSaving}>
              {isSaving ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-project-name">Name</Label>
              <Input
                id="edit-project-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="My Project"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project-url">URL</Label>
              <Input
                id="edit-project-url"
                type="url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project-password">Password</Label>
              <Input
                id="edit-project-password"
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Enter admin password"
              />
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleEditProject} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete "{deletingProject?.name}"? This action cannot be undone.
            </p>
            <div className="space-y-2">
              <Label htmlFor="delete-project-password">Password</Label>
              <Input
                id="delete-project-password"
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Enter admin password"
              />
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button className="ml-2" variant="destructive" onClick={handleDeleteProject} disabled={isSaving}>
              {isSaving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
