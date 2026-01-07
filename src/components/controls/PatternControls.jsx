import { AVAILABLE_ICONS } from '../TessellationLayer'
import { ControlGroup, NumberInput, PaletteColorPicker } from './SharedControls'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
        <Select
          value={tessellationConfig.icon}
          onValueChange={(value) => setTessellationConfig({
            ...tessellationConfig,
            icon: value
          })}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_ICONS.map(icon => (
              <SelectItem key={icon} value={icon}>{icon}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <ControlGroup label={`Mouse Rotation: ${(tessellationConfig.mouseRotationInfluence || 0).toFixed(2)}`}>
        <NumberInput
          value={[tessellationConfig.mouseRotationInfluence || 0]}
          onValueChange={([val]) => setTessellationConfig({
            ...tessellationConfig,
            mouseRotationInfluence: val
          })}
          max={1}
          step={0.01}
        />
      </ControlGroup>
    </div>
  )
}





