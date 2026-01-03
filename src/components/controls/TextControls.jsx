import { useState } from 'react'
import { Plus, Trash, CaretRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { ControlGroup, NumberInput, ContrastAwarePaletteColorPicker } from './SharedControls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const TextPanel = ({
  textSections,
  setTextSections,
  textGap,
  setTextGap,
  textConfig,
  setTextConfig,
  parsedPalette,
  gradientColors,
}) => {
  const [collapsedSections, setCollapsedSections] = useState({})

  const addTextSection = () => {
    const newId = Math.max(...textSections.map(s => s.id), 0) + 1
    setTextSections([
      ...textSections,
      { id: newId, text: 'New Text', size: 60, weight: 400, spacing: 0.1, font: 'sans-serif' }
    ])
  }

  const updateTextSection = (id, field, value) => {
    setTextSections(textSections.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ))
  }

  const removeTextSection = (id) => {
    if (textSections.length > 1) {
      setTextSections(textSections.filter(s => s.id !== id))
    }
  }

  return (
    <div className="space-y-2">
      <ControlGroup label="Enable Text">
        <Switch
          checked={textConfig.enabled}
          onCheckedChange={(checked) => setTextConfig({ ...textConfig, enabled: checked })}
        />
      </ControlGroup>

      <ControlGroup label="Text Color">
        <ContrastAwarePaletteColorPicker
          value={textConfig.color}
          onChange={(newColor) => setTextConfig({ ...textConfig, color: newColor })}
          palette={parsedPalette}
          gradientColors={gradientColors}
          className="w-16 h-8 r"
        />
      </ControlGroup>

      <ControlGroup label="Text Opacity">
        <NumberInput
          value={[textConfig.opacity]}
          onValueChange={([val]) => setTextConfig({ ...textConfig, opacity: val })}
          min={0}
          max={1}
          step={0.05}
          showButtons={true}
        />
      </ControlGroup>

      <ControlGroup label="Section Gap">
        <NumberInput
          value={[textGap]}
          onValueChange={([val]) => setTextGap(val)}
          max={100}
          step={4}  
        />
      </ControlGroup>

      {textSections.map((section, index) => (
        <div key={section.id} className="rounded-lg bg-muted/50 overflow-hidden">
          <div 
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={() => setCollapsedSections(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
          >
            <div className="flex items-center gap-2">
              <CaretRight 
                size={12} 
                className={cn(
                  "transition-transform duration-200",
                  !collapsedSections[section.id] && "rotate-90"
                )}
              />
              <Label className="text-xs font-semibold cursor-pointer">Section {index + 1}</Label>
              <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                {section.text || "Empty"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                removeTextSection(section.id)
              }}
              disabled={textSections.length <= 1}
            >
              <Trash size={12} />
            </Button>
          </div>

          <div 
            className={cn(
              "grid transition-all duration-200 ease-in-out",
              collapsedSections[section.id] ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
            )}
          >
            <div className="overflow-hidden">
              <div className="p-2 pt-0 space-y-1">
                <Input
                  value={section.text}
                  onChange={(e) => updateTextSection(section.id, 'text', e.target.value)}
                  className="h-9 text-sm"
                  placeholder="Enter text..."
                />

                <ControlGroup label="Size (in px)">
                  <NumberInput
                    value={[section.size]}
                    onValueChange={([val]) => updateTextSection(section.id, 'size', val)}
                    min={12}
                    max={200}
                    step={4}
                    showButtons={true}
                  />
                </ControlGroup>

                <ControlGroup label="Font">
                  <Select
                    value={section.font || 'sans-serif'}
                    onValueChange={(value) => updateTextSection(section.id, 'font', value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans-serif">Manrope</SelectItem>
                      <SelectItem value="serif">Playfair Display</SelectItem>
                      <SelectItem value="mono">Space Grotesk</SelectItem>
                      <SelectItem value="scribble">Pacifico</SelectItem>
                    </SelectContent>
                  </Select>
                </ControlGroup>

                <ControlGroup label="Weight">
                  <Select
                    value={String(section.weight)}
                    onValueChange={(value) => updateTextSection(section.id, 'weight', parseInt(value))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">Thin</SelectItem>
                      <SelectItem value="200">Extra Light</SelectItem>
                      <SelectItem value="300">Light</SelectItem>
                      <SelectItem value="400">Regular</SelectItem>
                      <SelectItem value="500">Medium</SelectItem>
                      <SelectItem value="600">Semi Bold</SelectItem>
                      <SelectItem value="700">Bold</SelectItem>
                      <SelectItem value="800">Extra Bold</SelectItem>
                      <SelectItem value="900">Black</SelectItem>
                    </SelectContent>
                  </Select>
                </ControlGroup>

                <ControlGroup label="Spacing (in em)">
                  <NumberInput
                    value={[section.spacing]}
                    onValueChange={([val]) => updateTextSection(section.id, 'spacing', val)}
                    min={-0.1}
                    max={0.5}
                    step={0.01}
                    showButtons={true}
                  />
                </ControlGroup>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      <div className="flex items-center justify-center">
        <Label className="text-xs uppercase tracking-wide font-semibold">Text Sections</Label>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addTextSection}>
          <Plus size={14} />
        </Button>
      </div>
    </div>
  )
}

