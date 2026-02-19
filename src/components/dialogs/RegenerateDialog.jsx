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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

function RegenerateDialog({ open, onOpenChange, onSubmit }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setPassword('')
      setError('')
    }
  }, [open])

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError('Password is required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await onSubmit(password)
      onOpenChange(false)
      setPassword('')
    } catch (err) {
      setError(err.message || 'Failed to regenerate. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Regenerate AI Descriptions</DialogTitle>
          <DialogDescription>
            This will regenerate the title, short description, and long description using AI.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-8">
              <CircleNotch size={24} className="animate-spin text-primary" />
              <span className="text-muted-foreground">Generating new descriptions...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="regenerate-password">Password</Label>
              <Input
                id="regenerate-password"
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
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Regenerate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RegenerateDialog
