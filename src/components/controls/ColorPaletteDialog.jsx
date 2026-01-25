import { useState, useEffect, memo } from 'react'
import {
  Palette, Upload, CircleNotch, Trash, FloppyDisk, Check, ArrowRight
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { validatePaletteJson, parsePaletteJson } from '@/lib/colorConversion'
import { getProjects, updateProject } from '@/lib/scenesApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ColorPalettePreview } from './ColorPalettePreview'

// Current Palette Tab Content
const CurrentPaletteTab = memo(({
  colorPalette,
  parsedPalette,
  onClearPalette,
  onChangePalette,
  cmsAvailable,
  allProjects,
  selectedProjectForSave,
  setSelectedProjectForSave,
  savePalettePassword,
  setSavePalettePassword,
  isSavingPalette,
  savePaletteError,
  onSavePaletteToProject
}) => {
  if (!colorPalette) {
    return (
      <div className="flex flex-col h-full items-center justify-center py-8 text-center">
        <Palette size={48} weight="duotone" className="text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">No color palette loaded</p>
        <Button onClick={onChangePalette}>
          <Upload size={16} className="mr-2" />
          Add Palette
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 h-full flex flex-col h-full justify-between">
      {/* Current palette colors */}
      <ColorPalettePreview
        palette={parsedPalette}
        maxColors={300}
        action={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onChangePalette}
          >
            <ArrowRight size={12} className="mr-1" />Change Palette
          </Button>
        }
      />

      {/* Save to Project Section */}
      {cmsAvailable && allProjects.length > 0 && (
        <div className="flex flex-col md:flex-row gap-3 pt-2 items-center border-t border-border">
          <Label className="text-sm font-medium w-40">Save to Project</Label>
          <Select value={selectedProjectForSave} onValueChange={setSelectedProjectForSave}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
              {allProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name} {project.palette_data ? '(has palette)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Password"
              value={savePalettePassword}
              onChange={(e) => setSavePalettePassword(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={onSavePaletteToProject}
              disabled={isSavingPalette || !selectedProjectForSave || !savePalettePassword}
            >
              {isSavingPalette ? <CircleNotch size={16} className="animate-spin" /> : <FloppyDisk size={16} />}
            </Button>
          </div>
          {savePaletteError && <p className="text-sm text-destructive">{savePaletteError}</p>}
        </div>
      )}
    </div>
  )
})

CurrentPaletteTab.displayName = 'CurrentPaletteTab'

// Upload JSON Tab Content
const UploadJsonTab = memo(({ onFileLoaded, paletteJson, setPaletteJson, paletteError }) => {
  return (
    <div className="flex flex-col space-y-4 w-full h-full">
      <div className="flex flex-row justify-between">
        <div className="flex flex-col">
          <Label>Upload a JSON file</Label>
          <p className="text-xs text-muted-foreground">
            <a
              className="text-blue-500 hover:underline"
              href="https://colors.promad.design/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Use to generate compatible color JSON.
            </a>
          </p>
        </div>


        <Button
          variant="outline"
          className="w-auto"
          onClick={() => document.getElementById('palette-file-input-dialog')?.click()}
        >
          <Upload size={16} className="mr-2" />Choose .json file
        </Button>
      </div>
      <div className="flex flex-col grow-1 h-full w-full">
        <input
          type="file"
          accept=".json,application/json"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              const reader = new FileReader()
              reader.onload = (event) => {
                const content = event.target?.result
                if (typeof content === 'string') {
                  onFileLoaded(content)
                }
              }
              reader.onerror = () => onFileLoaded('', 'Failed to read file')
              reader.readAsText(file)
            }
            e.target.value = ''
          }}
          className="hidden h-full"
          id="palette-file-input-dialog"
        />
        {paletteJson && (
          <div className="p-3 bg-muted/30 rounded-lg border border-border h-full">
            <p className="text-xs text-muted-foreground mb-2">File loaded. Click "Parse" to preview.</p>
            <pre className="text-xs font-mono overflow-x-auto max-h-20 text-muted-foreground">
              {paletteJson.substring(0, 200)}...
            </pre>
          </div>
        )}

        {paletteError && <p className="text-sm text-destructive">{paletteError}</p>}
      </div>
    </div>
  )
})

UploadJsonTab.displayName = 'UploadJsonTab'

// Paste JSON Tab Content
const PasteJsonTab = memo(({ paletteJson, setPaletteJson, paletteError }) => {
  return (
    <div className="flex flex-col space-y-4 w-full">
      <div className="flex flex-col flex-1 h-full gap-2">
        <Label>Paste your JSON color palette</Label>
        <textarea
          value={paletteJson}
          onChange={(e) => setPaletteJson(e.target.value)}
          placeholder={`{\n  "blue": {\n    "500": "#3b82f6",\n    "600": "#2563eb"\n  }\n}`}
          className="w-full h-full p-3 text-sm font-mono bg-muted border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {paletteError && <p className="text-sm text-destructive">{paletteError}</p>}
      </div>
    </div>
  )
})

PasteJsonTab.displayName = 'PasteJsonTab'

// New Palette Tab Content (combines Upload and Paste)
const NewPaletteTab = memo(({
  paletteJson,
  setPaletteJson,
  paletteError,
  setPaletteError,
  previewPalette,
  onParse,
  onApply
}) => {
  const [inputMethod, setInputMethod] = useState('upload')

  const handleFileLoaded = (content, error) => {
    if (error) {
      setPaletteError(error)
    } else {
      setPaletteJson(content)
      setPaletteError('')
    }
  }

  return (
    <div className="space-y-4 h-full flex flex-col h-full justify-between">
      <Tabs value={inputMethod} onValueChange={setInputMethod} className="flex flex-col gap-2 items-center h-full w-full">
        <TabsList className="flex flex-row">
          <TabsTrigger value="upload" className="flex w-24">Upload .json</TabsTrigger>
          <TabsTrigger value="paste" className="flex w-24">Paste JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="flex flex-row gap-4 w-full h-full">
          <UploadJsonTab
            onFileLoaded={handleFileLoaded}
            paletteJson={paletteJson}
            setPaletteJson={setPaletteJson}
            paletteError={paletteError}
          />

          <div className='pl-4 border-l border-border flex flex-col gap-2 w-full'>
            {/* Parse Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={onParse}
              disabled={!paletteJson.trim()}
            >
              Parse & Preview
            </Button>
            {/* Preview Section */}
            {previewPalette && (
              <div className="space-y-3 flex flex-col justify-between h-full">
                <ColorPalettePreview palette={previewPalette} maxColors={300} />
                <Button className="w-full" onClick={onApply}>
                  <Check size={16} className="mr-2" />
                  Apply Palette
                </Button>
              </div>
            )}
          </div>

        </TabsContent>

        <TabsContent value="paste" className="flex h-full w-full flex-row gap-4">
          <PasteJsonTab
            paletteJson={paletteJson}
            setPaletteJson={setPaletteJson}
            paletteError={paletteError}
          />

          <div className='pl-4 border-l border-border flex flex-col gap-2 w-full'>
            {/* Parse Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={onParse}
              disabled={!paletteJson.trim()}
            >
              Parse & Preview
            </Button>
            {/* Preview Section */}
            {previewPalette && (
              <div className="space-y-3 flex flex-col justify-between h-full">
                <ColorPalettePreview palette={previewPalette} maxColors={300} />
                <Button className="w-full" onClick={onApply}>
                  <Check size={16} className="mr-2" />
                  Apply Palette
                </Button>
              </div>
            )}
          </div>

        </TabsContent>

      </Tabs>


    </div>
  )
})

NewPaletteTab.displayName = 'NewPaletteTab'

// Project Palettes Tab Content
const ProjectPalettesTab = memo(({
  isLoading,
  savedPalettes,
  selectedProject,
  setSelectedProject,
  previewPalette,
  onApply,
  onRemove
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <CircleNotch size={24} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (savedPalettes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Palette size={48} weight="duotone" className="text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No projects with palettes yet</p>
      </div>
    )
  }

  return (
    <div className="flex gap-4 h-full">
      <div className="flex flex-col w-full max-w-[50%] space-y-2">
        <Label className="text-sm font-medium">Select a Project</Label>
        <ScrollArea className="w-full" orientation="horizontal">
          <div className="flex flex-col gap-2 pb-2">
            {savedPalettes.map((project) => {
              const projectPalette = parsePaletteJson(project.palette_data)
              const previewColors = projectPalette?.colors.filter((_, idx) => idx >= 5 && (idx - 6) % 10 === 0) || []
              const isSelected = selectedProject?.id === project.id

              return (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={cn(
                    "flex-shrink-0 p-3 rounded-lg border transition-all min-w-[140px]",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/30 hover:bg-muted/50"
                  )}
                >
                  <p className="text-sm font-medium truncate mb-2 text-left">{project.name}</p>
                  <div className="flex gap-0.5">
                    {previewColors.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-full h-4 border border-border/50"
                        style={{ backgroundColor: color.hex }}
                      />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Preview and Apply section */}
      {selectedProject && previewPalette && (
        <div className="space-y-3 flex flex-col w-full h-full pl-4 border-l border-border justify-between">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{selectedProject.name}</Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={() => {
                const password = prompt('Enter password to remove palette:')
                if (password) onRemove(selectedProject.id, password)
              }}
            >
              <Trash size={12} className="mr-1" />Remove
            </Button>
          </div>
          <ColorPalettePreview className="" palette={previewPalette} maxColors={300} />
          <Button className="w-full" onClick={onApply}>
            <Check size={16} className="mr-2" />
            Apply Palette
          </Button>
        </div>
      )}
    </div>
  )
})

ProjectPalettesTab.displayName = 'ProjectPalettesTab'

// Main Color Palette Dialog Component
export const ColorPaletteDialog = memo(({
  open,
  onOpenChange,
  colorPalette,
  setColorPalette,
  gradientConfig,
  setGradientConfig,
  cmsAvailable = false
}) => {
  const [activeTab, setActiveTab] = useState('current')
  const [paletteJson, setPaletteJson] = useState('')
  const [paletteError, setPaletteError] = useState('')
  const [previewPalette, setPreviewPalette] = useState(null)
  const [allProjects, setAllProjects] = useState([])
  const [savedPalettes, setSavedPalettes] = useState([])
  const [isLoadingPalettes, setIsLoadingPalettes] = useState(false)
  const [selectedProjectForSave, setSelectedProjectForSave] = useState('')
  const [savePalettePassword, setSavePalettePassword] = useState('')
  const [isSavingPalette, setIsSavingPalette] = useState(false)
  const [savePaletteError, setSavePaletteError] = useState('')
  const [selectedProjectPalette, setSelectedProjectPalette] = useState(null)

  const parsedPalette = colorPalette ? parsePaletteJson(colorPalette) : null

  // Fetch projects when dialog opens
  useEffect(() => {
    if (open && cmsAvailable) {
      setIsLoadingPalettes(true)
      getProjects()
        .then((projects) => {
          setAllProjects(projects)
          setSavedPalettes(projects.filter(p => p.palette_data))
        })
        .catch(() => {
          setAllProjects([])
          setSavedPalettes([])
        })
        .finally(() => setIsLoadingPalettes(false))
    }
  }, [open, cmsAvailable])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setPaletteJson('')
      setPaletteError('')
      setPreviewPalette(null)
      setSelectedProjectPalette(null)
      setSavePaletteError('')
    }
  }, [open])

  // Handle clearing palette
  const handleClearPalette = () => {
    setColorPalette(null)
    setPaletteJson('')
    setPaletteError('')
    setPreviewPalette(null)
  }

  // Handle parsing JSON
  const handleParse = () => {
    if (!paletteJson.trim()) {
      setPaletteError('Please paste or upload a JSON palette')
      return
    }

    const result = validatePaletteJson(paletteJson)
    if (!result.valid) {
      setPaletteError(result.error)
      setPreviewPalette(null)
      return
    }

    setPaletteError('')
    setPreviewPalette(parsePaletteJson(result.palette))
  }

  // Handle applying palette (from new palette tab)
  const handleApplyNewPalette = () => {
    if (!paletteJson.trim()) return

    const result = validatePaletteJson(paletteJson)
    if (!result.valid) {
      setPaletteError(result.error)
      return
    }

    setColorPalette(result.palette)
    applyPaletteToGradient(result.colors)
    setActiveTab('current')
    setPaletteJson('')
    setPreviewPalette(null)
  }

  // Handle applying palette from project
  const handleApplyProjectPalette = () => {
    if (!selectedProjectPalette?.palette_data) return

    setColorPalette(selectedProjectPalette.palette_data)
    const parsed = parsePaletteJson(selectedProjectPalette.palette_data)
    if (parsed?.colors) {
      applyPaletteToGradient(parsed.colors)
    }
    setActiveTab('current')
    setSelectedProjectPalette(null)
  }

  // Apply palette colors to gradient
  const applyPaletteToGradient = (colors) => {
    const paletteColors = colors.map(c => c.hex)
    if (paletteColors.length >= 2) {
      const numColors = Math.min(Math.floor(Math.random() * 3) + 2, paletteColors.length)
      const shuffled = [...paletteColors].sort(() => Math.random() - 0.5)
      const selectedColors = shuffled.slice(0, numColors)
      const colorStops = selectedColors.map((_, i) => Math.round((i / (selectedColors.length - 1)) * 100))

      setGradientConfig({
        ...gradientConfig,
        colors: selectedColors,
        colorStops,
        numColors: selectedColors.length,
      })
    }
  }

  // Handle saving palette to project
  const handleSavePaletteToProject = async () => {
    if (!colorPalette || !selectedProjectForSave || !savePalettePassword) {
      setSavePaletteError('Select a project and enter password')
      return
    }
    setIsSavingPalette(true)
    setSavePaletteError('')
    try {
      await updateProject(selectedProjectForSave, { paletteData: colorPalette }, savePalettePassword)
      setSavePalettePassword('')
      setSelectedProjectForSave('')
      // Refresh the list
      const projects = await getProjects()
      setAllProjects(projects)
      setSavedPalettes(projects.filter(p => p.palette_data))
    } catch (err) {
      setSavePaletteError(err.message || 'Failed to save palette to project')
    } finally {
      setIsSavingPalette(false)
    }
  }

  // Handle removing palette from project
  const handleRemovePaletteFromProject = async (projectId, password) => {
    try {
      await updateProject(projectId, { paletteData: null }, password)
      const projects = await getProjects()
      setSavedPalettes(projects.filter(p => p.palette_data))
      setSelectedProjectPalette(null)
    } catch (err) {
      setSavePaletteError(err.message || 'Failed to remove palette')
    }
  }

  // Get preview palette for selected project
  const projectPreviewPalette = selectedProjectPalette
    ? parsePaletteJson(selectedProjectPalette.palette_data)
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[672px] h-[520px] max-w-[90vw] max-h-[85vh] flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Palette size={20} weight="duotone" />
              Color Palette
            </div>
          </DialogTitle>
          <DialogDescription>
            Manage your color palette for the gradient.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 gap-2 flex flex-col min-h-0">
          <TabsList className="w-full flex-shrink-0">
            <TabsTrigger value="current" className="flex-1">Current Palette</TabsTrigger>
            <TabsTrigger value="new" className="flex-1">New Palette</TabsTrigger>
            {cmsAvailable && (
              <TabsTrigger value="projects" className="flex-1">Project Palettes</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="current" className="flex flex-col h-full min-h-0 data-[state=inactive]:hidden">
            <ScrollArea className="flex-1 [&>[data-radix-scroll-area-viewport]]:h-full">
              <CurrentPaletteTab
                colorPalette={colorPalette}
                parsedPalette={parsedPalette}
                onClearPalette={handleClearPalette}
                onChangePalette={() => setActiveTab('new')}
                cmsAvailable={cmsAvailable}
                allProjects={allProjects}
                selectedProjectForSave={selectedProjectForSave}
                setSelectedProjectForSave={setSelectedProjectForSave}
                savePalettePassword={savePalettePassword}
                setSavePalettePassword={setSavePalettePassword}
                isSavingPalette={isSavingPalette}
                savePaletteError={savePaletteError}
                onSavePaletteToProject={handleSavePaletteToProject}
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="new" className="flex flex-col h-full min-h-0 data-[state=inactive]:hidden">
            <ScrollArea className="flex-1">
              <NewPaletteTab
                paletteJson={paletteJson}
                setPaletteJson={setPaletteJson}
                paletteError={paletteError}
                setPaletteError={setPaletteError}
                previewPalette={previewPalette}
                onParse={handleParse}
                onApply={handleApplyNewPalette}
              />
            </ScrollArea>
          </TabsContent>

          {cmsAvailable && (
            <TabsContent value="projects" className="flex flex-col h-full min-h-0 data-[state=inactive]:hidden">
              <ScrollArea className="flex-1">
                <ProjectPalettesTab
                  isLoading={isLoadingPalettes}
                  savedPalettes={savedPalettes}
                  selectedProject={selectedProjectPalette}
                  setSelectedProject={setSelectedProjectPalette}
                  previewPalette={projectPreviewPalette}
                  onApply={handleApplyProjectPalette}
                  onRemove={handleRemovePaletteFromProject}
                />
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
})

ColorPaletteDialog.displayName = 'ColorPaletteDialog'

export default ColorPaletteDialog
