import { ControlGroup, NumberInput } from './SharedControls'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const EffectsPanel = ({
  effectsConfig,
  setEffectsConfig,
}) => {
  return (
    <div className="space-y-2">
      <ControlGroup label={`Background Blur (in px)`}>
        <NumberInput
          value={[effectsConfig.blur]}
          onValueChange={([val]) => setEffectsConfig({
            ...effectsConfig,
            blur: val
          })}
          max={30}
          step={1}
        />
      </ControlGroup>

      <div className="flex items-center justify-between">
        <Label className="text-sm">Enable Noise</Label>
        <Switch
          checked={effectsConfig.noiseEnabled}
          onCheckedChange={(checked) => setEffectsConfig({
            ...effectsConfig,
            noiseEnabled: checked
          })}
        />
      </div>

      {effectsConfig.noiseEnabled && (
        <>
          <ControlGroup label={`Amount`}>
            <NumberInput
              value={[effectsConfig.noise]}
              onValueChange={([val]) => setEffectsConfig({
                ...effectsConfig,
                noise: val
              })}
              max={0.5}
              step={0.1}
            />
          </ControlGroup>
          <ControlGroup label={`Scale`}>
            <NumberInput
              value={[effectsConfig.noiseScale]}
              onValueChange={([val]) => setEffectsConfig({
                ...effectsConfig,
                noiseScale: val
              })}
              min={0.5}
              max={5}
              step={0.25}
              showButtons={true}
            />
          </ControlGroup>
        </>
      )}

      <ControlGroup label="Texture">
        <Select
          value={effectsConfig.texture}
          onValueChange={(value) => setEffectsConfig({
            ...effectsConfig,
            texture: value
          })}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="grain">Grain</SelectItem>
            <SelectItem value="scanlines">Scanlines</SelectItem>
            <SelectItem value="dots">Dots</SelectItem>
            <SelectItem value="grid">Grid</SelectItem>
            <SelectItem value="diagonal">Diagonal Lines</SelectItem>
          </SelectContent>
        </Select>
      </ControlGroup>

      {effectsConfig.texture !== 'none' && (
        <>
          <ControlGroup label={`Size: `}>
            <NumberInput
              value={[effectsConfig.textureSize]}
              onValueChange={([val]) => setEffectsConfig({
                ...effectsConfig,
                textureSize: val
              })}
              min={4}
              max={100}
              step={1}
            />
          </ControlGroup>
          <ControlGroup label={`Opacity: `}>
            <NumberInput
              value={[effectsConfig.textureOpacity]}
              onValueChange={([val]) => setEffectsConfig({
                ...effectsConfig,
                textureOpacity: val
              })}
              max={1}
              step={0.1}
            />
          </ControlGroup>
          <ControlGroup label="Blend Mode">
            <Select
              value={effectsConfig.textureBlendMode}
              onValueChange={(value) => setEffectsConfig({
                ...effectsConfig,
                textureBlendMode: value
              })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="multiply">Multiply</SelectItem>
                <SelectItem value="screen">Screen</SelectItem>
                <SelectItem value="overlay">Overlay</SelectItem>
                <SelectItem value="darken">Darken</SelectItem>
                <SelectItem value="lighten">Lighten</SelectItem>
                <SelectItem value="color-dodge">Color Dodge</SelectItem>
                <SelectItem value="color-burn">Color Burn</SelectItem>
                <SelectItem value="hard-light">Hard Light</SelectItem>
                <SelectItem value="soft-light">Soft Light</SelectItem>
                <SelectItem value="difference">Difference</SelectItem>
                <SelectItem value="exclusion">Exclusion</SelectItem>
              </SelectContent>
            </Select>
          </ControlGroup>
        </>
      )}

      <ControlGroup label="Color Map">
        <Select
          value={effectsConfig.colorMap}
          onValueChange={(value) => setEffectsConfig({
            ...effectsConfig,
            colorMap: value
          })}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="sepia">Sepia</SelectItem>
            <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
            <SelectItem value="sunset">Sunset</SelectItem>
            <SelectItem value="matrix">Matrix</SelectItem>
            <SelectItem value="noir">Noir</SelectItem>
            <SelectItem value="vintage">Vintage</SelectItem>
          </SelectContent>
        </Select>
      </ControlGroup>

      <ControlGroup label={`Vignette`}> 
        <NumberInput
          value={[effectsConfig.vignetteIntensity]}
          onValueChange={([val]) => setEffectsConfig({
            ...effectsConfig,
            vignetteIntensity: val
          })}
          max={0.8}
          step={0.01}
        />
      </ControlGroup>

      <ControlGroup label={`Saturation`}>
        <NumberInput
          value={[effectsConfig.saturation]}
          onValueChange={([val]) => setEffectsConfig({
            ...effectsConfig,
            saturation: val
          })}
          max={200}
          step={1}
        />
      </ControlGroup>

      <ControlGroup label={`Contrast`}>
        <NumberInput
          value={[effectsConfig.contrast]}
          onValueChange={([val]) => setEffectsConfig({
            ...effectsConfig,
            contrast: val
          })}
          min={50}
          max={150}
          step={1}
        />
      </ControlGroup>

      <ControlGroup label={`Brightness`}>
        <NumberInput
          value={[effectsConfig.brightness]}
          onValueChange={([val]) => setEffectsConfig({
            ...effectsConfig,
            brightness: val
          })}
          min={50}
          max={150}
          step={10}
        />
      </ControlGroup>
    </div>
  )
}

