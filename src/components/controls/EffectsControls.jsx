import { ControlGroup, NumberInput } from './SharedControls'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { Rows, CaretRight, ArrowCounterClockwise } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export const DEFAULT_EFFECTS_CONFIG = {
  blur: 0,
  texture: 'none',
  textureSize: 20,
  textureOpacity: 0.5,
  textureBlendMode: 'overlay',
  colorMap: 'none',
  vignetteIntensity: 0.3,
  saturation: 100,
  contrast: 100,
  brightness: 100,
  flutedGlass: {
    enabled: false,
    segments: 80,
    rotation: 0,
    motionValue: 0.5,
    motionSpeed: 0.5,
    overlayOpacity: 0,
    distortionStrength: 0.02,
    waveFrequency: 1,
  },
}

export const EffectsPanel = ({
  effectsConfig,
  setEffectsConfig,
}) => {
  const handleReset = () => {
    setEffectsConfig(DEFAULT_EFFECTS_CONFIG)
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowCounterClockwise size={14} className="mr-1" />
          Reset
        </Button>
      </div>
      <ControlGroup label={`Background Blur`}>
        <NumberInput
          value={[effectsConfig.blur]}
          onValueChange={([val]) => setEffectsConfig({
            ...effectsConfig,
            blur: val
          })}
          min={0}
          max={50}
          step={2}
        />
      </ControlGroup>

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
          <ControlGroup label={`Size`}>
            <NumberInput
              value={[effectsConfig.textureSize]}
              onValueChange={([val]) => setEffectsConfig({
                ...effectsConfig,
                textureSize: val
              })}
              min={4}
              max={100}
              step={2}
            />
          </ControlGroup>
          <ControlGroup label={`Opacity`}>
            <NumberInput
              value={[effectsConfig.textureOpacity]}
              onValueChange={([val]) => setEffectsConfig({
                ...effectsConfig,
                textureOpacity: val
              })}
              min={0}
              max={1}
              step={0.05}
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
          min={0}
          max={1}
          step={0.05}
        />
      </ControlGroup>

      <ControlGroup label={`Saturation`}>
        <NumberInput
          value={[effectsConfig.saturation]}
          onValueChange={([val]) => setEffectsConfig({
            ...effectsConfig,
            saturation: val
          })}
          min={0}
          max={200}
          step={5}
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
          step={5}
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
          step={5}
        />
      </ControlGroup>

      {/* Fluted Glass Section */}
      <div className="h-px bg-border my-4" />

      <Collapsible defaultOpen={effectsConfig.flutedGlass?.enabled}>
        <div className="flex items-center justify-between mb-3">
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide hover:text-primary transition-colors group">
            <CaretRight size={14} weight="bold" className="group-data-[state=open]:rotate-90 transition-transform" />
            <Rows size={16} weight="bold" />
            Fluted Glass
          </CollapsibleTrigger>
          <Switch
            checked={effectsConfig.flutedGlass?.enabled ?? false}
            onCheckedChange={(checked) => setEffectsConfig({
              ...effectsConfig,
              flutedGlass: {
                ...effectsConfig.flutedGlass,
                enabled: checked
              }
            })}
          />
        </div>

        <CollapsibleContent className="space-y-3">
          {effectsConfig.flutedGlass?.enabled && (
            <>
              <ControlGroup label={`Ridges / Segments`}>
                <NumberInput
                  value={[effectsConfig.flutedGlass?.segments ?? 80]}
                  onValueChange={([val]) => setEffectsConfig({
                    ...effectsConfig,
                    flutedGlass: {
                      ...effectsConfig.flutedGlass,
                      segments: val
                    }
                  })}
                  min={5}
                  max={300}
                  step={5}
                />
              </ControlGroup>

              <ControlGroup label={`Distortion`}>
                <NumberInput
                  value={[effectsConfig.flutedGlass?.distortionStrength ?? 0.02]}
                  onValueChange={([val]) => setEffectsConfig({
                    ...effectsConfig,
                    flutedGlass: {
                      ...effectsConfig.flutedGlass,
                      distortionStrength: val
                    }
                  })}
                  min={0}
                  max={0.1}
                  step={0.01}
                />
              </ControlGroup>

              <ControlGroup label={`Wave Frequency`}>
                <NumberInput
                  value={[effectsConfig.flutedGlass?.waveFrequency ?? 1]}
                  onValueChange={([val]) => setEffectsConfig({
                    ...effectsConfig,
                    flutedGlass: {
                      ...effectsConfig.flutedGlass,
                      waveFrequency: val
                    }
                  })}
                  min={0.5}
                  max={5}
                  step={0.5}
                />
              </ControlGroup>

              <ControlGroup label={`Rotation (°)`}>
                <NumberInput
                  value={[effectsConfig.flutedGlass?.rotation ?? 0]}
                  onValueChange={([val]) => setEffectsConfig({
                    ...effectsConfig,
                    flutedGlass: {
                      ...effectsConfig.flutedGlass,
                      rotation: val
                    }
                  })}
                  min={0}
                  max={180}
                  step={5}
                />
              </ControlGroup>

              <ControlGroup label={`Motion Value`}>
                <NumberInput
                  value={[effectsConfig.flutedGlass?.motionValue ?? 0.5]}
                  onValueChange={([val]) => setEffectsConfig({
                    ...effectsConfig,
                    flutedGlass: {
                      ...effectsConfig.flutedGlass,
                      motionValue: val
                    }
                  })}
                  min={0}
                  max={2}
                  step={0.1}
                />
              </ControlGroup>

              <ControlGroup label={`Motion Speed`}>
                <NumberInput
                  value={[effectsConfig.flutedGlass?.motionSpeed ?? 0.5]}
                  onValueChange={([val]) => setEffectsConfig({
                    ...effectsConfig,
                    flutedGlass: {
                      ...effectsConfig.flutedGlass,
                      motionSpeed: val
                    }
                  })}
                  min={0}
                  max={3}
                  step={0.1}
                />
              </ControlGroup>

              <ControlGroup label={`3D Overlay`}>
                <NumberInput
                  value={[effectsConfig.flutedGlass?.overlayOpacity ?? 0]}
                  onValueChange={([val]) => setEffectsConfig({
                    ...effectsConfig,
                    flutedGlass: {
                      ...effectsConfig.flutedGlass,
                      overlayOpacity: val
                    }
                  })}
                  min={0}
                  max={100}
                  step={5}
                />
              </ControlGroup>
            </>
          )}
        </CollapsibleContent>
      </Collapsible>

    </div>
  )
}

