import { AVAILABLE_ICONS, ICON_PATHS } from '../TessellationLayer'
import { ControlGroup, NumberInput, PaletteColorPicker } from './SharedControls'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CaretDown } from '@phosphor-icons/react'
import { useState } from 'react'

// Small SVG icon component for the grid
const IconPreview = ({ name, className }) => {
  const path = ICON_PATHS[name]
  if (!path) return null

  return (
    <svg
      viewBox="0 0 256 256"
      className={className}
      fill="currentColor"
    >
      <path d={path} />
    </svg>
  )
}

// Dropdown with icon grid
export const IconGridDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-9 justify-between px-3"
        >
          <div className="flex items-center gap-2">
            <IconPreview name={value} className="w-5 h-5" />
            <span className="text-sm">{value}</span>
          </div>
          <CaretDown className="w-4 h-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="grid grid-cols-8 gap-1 max-h-64 overflow-y-auto">
          {AVAILABLE_ICONS.map(icon => (
            <button
              key={icon}
              type="button"
              title={icon}
              onClick={() => {
                onChange(icon)
                setOpen(false)
              }}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors",
                value === icon && "bg-accent ring-2 ring-primary"
              )}
            >
              <IconPreview name={icon} className="w-4 h-4" />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export const PatternPanel = ({
  tessellationConfig,
  setTessellationConfig,
  parsedPalette,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Enable Pattern</Label>
        <Switch
          checked={tessellationConfig.enabled}
          onCheckedChange={(checked) => setTessellationConfig({
            ...tessellationConfig,
            enabled: checked
          })}
        />
      </div>

      <ControlGroup label="Icon">
        <IconGridDropdown
          value={tessellationConfig.icon}
          onChange={(icon) => setTessellationConfig({
            ...tessellationConfig,
            icon
          })}
        />
      </ControlGroup>

      <div className="grid grid-cols-2 gap-4">
        <ControlGroup label={`Row Gap (in px)`}>
          <NumberInput
            value={[tessellationConfig.rowGap]}
            onValueChange={([val]) => setTessellationConfig({
              ...tessellationConfig,
              rowGap: val
            })}
            min={20}
            max={200}
            step={10}
          />
        </ControlGroup>
        <ControlGroup label={`Col Gap (in px)`}>
          <NumberInput
            value={[tessellationConfig.colGap]}
            onValueChange={([val]) => setTessellationConfig({
              ...tessellationConfig,
              colGap: val
            })}
            min={20}
            max={200}
            step={10}
          />
        </ControlGroup>
      </div>

      <ControlGroup label={`Icon Size (in px)`}>
        <NumberInput
          value={[tessellationConfig.size]}
          onValueChange={([val]) => setTessellationConfig({
            ...tessellationConfig,
            size: val
          })}
          min={8}
          max={100}
          step={4}
        />
      </ControlGroup>

      <ControlGroup label={`Opacity`}>
        <NumberInput
          value={[Math.round(tessellationConfig.opacity * 100) / 100]}
          onValueChange={([val]) => setTessellationConfig({
            ...tessellationConfig,
            opacity: val
          })}
          max={1}
          step={0.01}
        />
      </ControlGroup>

      <ControlGroup label={`Rotation (in degrees)`}>
        <NumberInput
          value={[tessellationConfig.rotation]}
          onValueChange={([val]) => setTessellationConfig({
            ...tessellationConfig,
            rotation: val
          })}
          max={360}
          step={1}
        />
      </ControlGroup>

      <ControlGroup label="Color">
        <div className="flex items-center gap-2">
          <PaletteColorPicker
            value={tessellationConfig.color}
            onChange={(newColor) => setTessellationConfig({
              ...tessellationConfig,
              color: newColor
            })}
            palette={parsedPalette}
            className="w-10 h-9"
          />
          <Input 
            value={tessellationConfig.color}
            onChange={(e) => setTessellationConfig({
              ...tessellationConfig,
              color: e.target.value
            })}
            className="h-9 font-mono text-xs flex-1"
          />
        </div>
      </ControlGroup>

    </div>
  )
}





