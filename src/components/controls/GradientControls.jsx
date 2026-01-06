import { Plus, Trash, ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { ControlGroup, NumberInput, PaletteColorPicker } from './SharedControls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Liquid gradient controls
export const LiquidControls = ({
  gradientConfig,
  setGradientConfig,
  parsedPalette,
}) => {
  const updateGradientColor = (index, color) => {
    const newColors = [...gradientConfig.colors]
    newColors[index] = color
    setGradientConfig({ ...gradientConfig, colors: newColors })
  }

  const addGradientColor = () => {
    if (gradientConfig.colors.length < 8) {
      const newColors = [...gradientConfig.colors, '#ffffff']
      const newStops = newColors.map((_, i) => Math.round((i / (newColors.length - 1)) * 100))
      setGradientConfig({
        ...gradientConfig,
        colors: newColors,
        colorStops: newStops,
        numColors: newColors.length,
      })
    }
  }

  const removeGradientColor = (index) => {
    if (gradientConfig.colors.length > 2) {
      const newColors = gradientConfig.colors.filter((_, i) => i !== index)
      const newStops = newColors.map((_, i) => Math.round((i / (newColors.length - 1)) * 100))
      setGradientConfig({
        ...gradientConfig,
        colors: newColors,
        colorStops: newStops,
        numColors: newColors.length,
      })
    }
  }

  const updateColorStop = (index, value) => {
    const newStops = [...gradientConfig.colorStops]
    newStops[index] = parseInt(value)
    setGradientConfig({ ...gradientConfig, colorStops: newStops })
  }

  return (
    <>
      {/* Colors Section */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wide font-semibold">Gradient Colors</Label>
        </div>
        
        <div className="space-y-2">
          {gradientConfig.colors.map((color, index) => (
            <div key={index} className="flex items-center gap-2">
              <PaletteColorPicker
                value={color}
                onChange={(newColor) => updateGradientColor(index, newColor)}
                palette={parsedPalette}
              />
              <Input
                type="number"
                min="0"
                max="100"
                value={gradientConfig.colorStops[index] || 0}
                onChange={(e) => updateColorStop(index, e.target.value)}
                className="w-16 h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">%</span>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7 ml-auto"
                onClick={() => removeGradientColor(index)}
                disabled={gradientConfig.colors.length <= 2}
              >
                <Trash size={12} />
              </Button>
            </div>
          ))}
          {gradientConfig.colors.length < 8 && (
            <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addGradientColor}>
              <Plus size={12} className="mr-1" /> Add Color
            </Button>
          )}
        </div>
      </div>

      {/* Gradient Type */}
      <ControlGroup label="Gradient Type">
        <Select
          value={gradientConfig.type}
          onValueChange={(value) => setGradientConfig({ ...gradientConfig, type: value })}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="linear">Linear</SelectItem>
            <SelectItem value="radial">Radial</SelectItem>
            <SelectItem value="conic">Conic</SelectItem>
          </SelectContent>
        </Select>
      </ControlGroup>

      {/* Position Controls */}
      <div className="grid grid-cols-2 gap-4">
        <ControlGroup label={`Start X (in %)`}>
          <NumberInput
            value={[gradientConfig.startPos.x]}
            onValueChange={([val]) => setGradientConfig({
              ...gradientConfig,
              startPos: { ...gradientConfig.startPos, x: val }
            })}
            max={100}
            step={10}
          />
        </ControlGroup>
        <ControlGroup label={`Start Y (in %)`}>
          <NumberInput
            value={[gradientConfig.startPos.y]}
            onValueChange={([val]) => setGradientConfig({
              ...gradientConfig,
              startPos: { ...gradientConfig.startPos, y: val }
            })}
            max={100}
            step={10}
          />
        </ControlGroup>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ControlGroup label={`End X (in %)`}>
          <NumberInput
            value={[gradientConfig.endPos.x]}
            onValueChange={([val]) => setGradientConfig({
              ...gradientConfig,
              endPos: { ...gradientConfig.endPos, x: val }
            })}
            max={100}
            step={10}
          />
        </ControlGroup>
        <ControlGroup label={`End Y (in %)`}>
          <NumberInput
            value={[gradientConfig.endPos.y]}
            onValueChange={([val]) => setGradientConfig({
              ...gradientConfig,
              endPos: { ...gradientConfig.endPos, y: val }
            })}
            max={100}
            step={10}
          />
        </ControlGroup>
      </div>

      {/* Wave Settings */}
      <ControlGroup label={`Wave Intensity`}>
        <NumberInput
          value={[Math.round(gradientConfig.waveIntensity * 100) / 100]}
          onValueChange={([val]) => setGradientConfig({
            ...gradientConfig,
            waveIntensity: val
          })}
          max={1}
          step={0.05}
        />
      </ControlGroup>

      <div className="grid grid-cols-2 gap-4">
        <ControlGroup label={`Wave 1`}>
          <NumberInput
            value={[Math.round(gradientConfig.wave1Speed * 100) / 100]}
            onValueChange={([val]) => setGradientConfig({
              ...gradientConfig,
              wave1Speed: val
            })}
            max={0.5}
            step={0.05}
          />
        </ControlGroup>
        <ControlGroup label="Direction">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setGradientConfig({
              ...gradientConfig,
              wave1Direction: gradientConfig.wave1Direction === 1 ? -1 : 1
            })}
          >
            {gradientConfig.wave1Direction === 1 ? (
              <ArrowRight className="h-4 w-4" />
            ) : (
              <ArrowLeft className="h-4 w-4" />
            )}
          </Button>
        </ControlGroup>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ControlGroup label={`Wave 2`}>
          <NumberInput
            value={[Math.round(gradientConfig.wave2Speed * 100) / 100]}
            onValueChange={([val]) => setGradientConfig({
              ...gradientConfig,
              wave2Speed: val
            })}
            max={0.5}
            step={0.01}
          />
        </ControlGroup>
        <ControlGroup label="Direction">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setGradientConfig({
              ...gradientConfig,
              wave2Direction: gradientConfig.wave2Direction === 1 ? -1 : 1
            })}
          >
            {gradientConfig.wave2Direction === 1 ? (
              <ArrowRight className="h-4 w-4" />
            ) : (
              <ArrowLeft className="h-4 w-4" />
            )}
          </Button>
        </ControlGroup>
      </div>

      {/* Mouse Influence */}
      <ControlGroup label={`Mouse Influence`}>
        <NumberInput
          value={[Math.round(gradientConfig.mouseInfluence * 100) / 100]}
          onValueChange={([val]) => setGradientConfig({
            ...gradientConfig,
            mouseInfluence: val
          })}
          max={1}
          step={0.01}
        />
      </ControlGroup>

      <ControlGroup label={`Decay Speed`}>
        <NumberInput
          value={[Math.round(gradientConfig.decaySpeed * 100) / 100]}
          onValueChange={([val]) => setGradientConfig({
            ...gradientConfig,
            decaySpeed: val
          })}
          min={0.8}
          max={0.99}
          step={0.01}
        />
      </ControlGroup>
    </>
  )
}

// Aurora controls
export const AuroraControls = ({
  auroraConfig,
  setAuroraConfig,
  gradientConfig,
  parsedPalette,
}) => {
  return (
    <>
      {/* Use Gradient Colors Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-sm">Use Gradient Colors</Label>
        <Switch
          checked={auroraConfig.useGradientColors}
          onCheckedChange={(checked) => setAuroraConfig({
            ...auroraConfig,
            useGradientColors: checked
          })}
        />
      </div>

      {auroraConfig.useGradientColors ? (
        /* Show color palette preview when using gradient colors */
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <Label className="text-xs text-muted-foreground mb-2 block">Colors from Gradient Palette</Label>
          <div className="flex gap-1 flex-wrap">
            {gradientConfig.colors.map((color, idx) => (
              <div
                key={idx}
                className="w-8 h-8 rounded-md border border-border"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Aurora will use hues from these colors. Edit them in Liquid mode.
          </p>
        </div>
      ) : (
        <>
          {/* Background Color */}
          <ControlGroup label="Background">
            <div className="flex items-center gap-2">
              <PaletteColorPicker
                value={auroraConfig.backgroundColor}
                onChange={(newColor) => setAuroraConfig({
                  ...auroraConfig,
                  backgroundColor: newColor
                })}
                palette={parsedPalette}
                className="w-10 h-9"
              />
              <Input 
                value={auroraConfig.backgroundColor}
                onChange={(e) => setAuroraConfig({
                  ...auroraConfig,
                  backgroundColor: e.target.value
                })}
                className="h-9 font-mono text-xs flex-1"
              />
            </div>
          </ControlGroup>

          {/* Hue Range */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wide font-semibold">Hue Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <ControlGroup label={`Start`}>
                <NumberInput
                  value={[auroraConfig.hueStart]}
                  onValueChange={([val]) => setAuroraConfig({
                    ...auroraConfig,
                    hueStart: val
                  })}
                  max={360}
                  step={10}
                />
              </ControlGroup>
              <ControlGroup label={`End`}>
                <NumberInput
                  value={[auroraConfig.hueEnd]}
                  onValueChange={([val]) => setAuroraConfig({
                    ...auroraConfig,
                    hueEnd: val
                  })}
                  max={360}
                  step={10}
                />
              </ControlGroup>
            </div>
            {/* Hue preview bar */}
            <div 
              className="h-4 rounded-md border border-border"
              style={{
                background: `linear-gradient(to right, hsl(${auroraConfig.hueStart}, 100%, 65%), hsl(${auroraConfig.hueEnd}, 100%, 65%))`
              }}
            />
          </div>
        </>
      )}

      {/* Line Width */}
      <div className="grid grid-cols-2 gap-4">
        <ControlGroup label={`Min Width`}>
          <NumberInput
            value={[auroraConfig.minWidth]}
            onValueChange={([val]) => setAuroraConfig({
              ...auroraConfig,
              minWidth: val
            })}
            min={1}
            max={100}
            step={5}
          />
        </ControlGroup>
        <ControlGroup label={`Max Width`}>
          <NumberInput
            value={[auroraConfig.maxWidth]}
            onValueChange={([val]) => setAuroraConfig({
              ...auroraConfig,
              maxWidth: val
            })}
            min={1}
            max={100}
            step={5}
          />
        </ControlGroup>
      </div>

      {/* Line Height */}
      <div className="grid grid-cols-2 gap-4">
        <ControlGroup label={`Min Height`}>
          <NumberInput
            value={[auroraConfig.minHeight]}
            onValueChange={([val]) => setAuroraConfig({
              ...auroraConfig,
              minHeight: val
            })}
            min={50}
            max={1000}
            step={50}
          />
        </ControlGroup>
        <ControlGroup label={`Max Height`}>
          <NumberInput
            value={[auroraConfig.maxHeight]}
            onValueChange={([val]) => setAuroraConfig({
              ...auroraConfig,
              maxHeight: val
            })}
            min={50}
            max={1000}
            step={50}
          />
        </ControlGroup>
      </div>

      {/* Animation Speed (TTL) */}
      <div className="grid grid-cols-2 gap-4">
        <ControlGroup label={`Min TTL`}>
          <NumberInput
            value={[auroraConfig.minTTL]}
            onValueChange={([val]) => setAuroraConfig({
              ...auroraConfig,
              minTTL: val
            })}
            min={10}
            max={500}
            step={10}
          />
        </ControlGroup>
        <ControlGroup label={`Max TTL`}>
          <NumberInput
            value={[auroraConfig.maxTTL]}
            onValueChange={([val]) => setAuroraConfig({
              ...auroraConfig,
              maxTTL: val
            })}
            min={10}
            max={500}
            step={10}
          />
        </ControlGroup>
      </div>

      {/* Blur Amount */}
      <ControlGroup label={`Blur Amount`}>
        <NumberInput
          value={[auroraConfig.blurAmount]}
          onValueChange={([val]) => setAuroraConfig({
            ...auroraConfig,
            blurAmount: val
          })}
          min={0}
          max={50}
          step={1}
        />
      </ControlGroup>

      {/* Line Count */}
      <ControlGroup label={`Line Count (0 = auto)`}>
        <NumberInput
          value={[auroraConfig.lineCount]}
          onValueChange={([val]) => setAuroraConfig({
            ...auroraConfig,
            lineCount: val
          })}
          min={0}
          max={500}
          step={10}
        />
      </ControlGroup>
    </>
  )
}

// Fluid gradient controls (animated SVG radial gradients)
export const FluidControls = ({
  fluidConfig,
  setFluidConfig,
  gradientConfig,
  parsedPalette,
}) => {
  const updateFluidColor = (index, color) => {
    const newColors = [...(fluidConfig.colors || ['#71ECFF', '#39F58A', '#71ECFF', '#F0CBA8'])]
    newColors[index] = color
    setFluidConfig({ ...fluidConfig, colors: newColors })
  }

  return (
    <>
      {/* Use Gradient Colors Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-sm">Use Gradient Colors</Label>
        <Switch
          checked={fluidConfig.useGradientColors}
          onCheckedChange={(checked) => setFluidConfig({
            ...fluidConfig,
            useGradientColors: checked
          })}
        />
      </div>

      {fluidConfig.useGradientColors ? (
        /* Show color palette preview when using gradient colors */
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <Label className="text-xs text-muted-foreground mb-2 block">Colors from Gradient Palette</Label>
          <div className="flex gap-1 flex-wrap">
            {gradientConfig.colors.slice(0, 4).map((color, idx) => (
              <div
                key={idx}
                className="w-8 h-8 rounded-md border border-border"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            First 4 colors will be used. Edit them in Liquid mode.
          </p>
        </div>
      ) : (
        <>
          {/* Background Color */}
          <ControlGroup label="Background">
            <div className="flex items-center gap-2">
              <PaletteColorPicker
                value={fluidConfig.backgroundColor}
                onChange={(newColor) => setFluidConfig({
                  ...fluidConfig,
                  backgroundColor: newColor
                })}
                palette={parsedPalette}
                className="w-10 h-9"
              />
              <Input 
                value={fluidConfig.backgroundColor}
                onChange={(e) => setFluidConfig({
                  ...fluidConfig,
                  backgroundColor: e.target.value
                })}
                className="h-9 font-mono text-xs flex-1"
              />
            </div>
          </ControlGroup>

          {/* Fluid Colors */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide font-semibold">Fluid Colors (4 colors)</Label>
            {(fluidConfig.colors || ['#71ECFF', '#39F58A', '#71ECFF', '#F0CBA8']).map((color, index) => (
              <div key={index} className="flex items-center gap-2">
                <PaletteColorPicker
                  value={color}
                  onChange={(newColor) => updateFluidColor(index, newColor)}
                  palette={parsedPalette}
                  className="w-10 h-9"
                />
                <Input 
                  value={color}
                  onChange={(e) => updateFluidColor(index, e.target.value)}
                  className="h-9 font-mono text-xs flex-1"
                />
                <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Animation Speed */}
      <ControlGroup label={`Animation Speed`}>
        <NumberInput
          value={[fluidConfig.speed]}
          onValueChange={([val]) => setFluidConfig({
            ...fluidConfig,
            speed: val
          })}
          min={0.1}
          max={3}
          step={0.1}
        />
      </ControlGroup>

      {/* Gradient Intensity */}
      <ControlGroup label={`Gradient Intensity`}>
        <NumberInput
          value={[fluidConfig.intensity]}
          onValueChange={([val]) => setFluidConfig({
            ...fluidConfig,
            intensity: val
          })}
          min={0.1}
          max={10}
          step={0.1}
        />
      </ControlGroup>

      {/* Blur Amount */}
      <ControlGroup label={`Blur Amount`}>
        <NumberInput
          value={[fluidConfig.blurAmount]}
          onValueChange={([val]) => setFluidConfig({
            ...fluidConfig,
            blurAmount: val
          })}
          min={0}
          max={100}
          step={1}
        />
      </ControlGroup>
    </>
  )
}

// Blob controls
export const BlobControls = ({
  blobConfig,
  setBlobConfig,
  gradientConfig,
  parsedPalette,
}) => {
  const updateBlobColor = (index, color) => {
    const newColors = [...(blobConfig.colors || ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0'])]
    newColors[index] = color
    setBlobConfig({ ...blobConfig, colors: newColors })
  }

  const addBlobColor = () => {
    const currentColors = blobConfig.colors || ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0']
    if (currentColors.length < 8) {
      setBlobConfig({ ...blobConfig, colors: [...currentColors, '#ffffff'] })
    }
  }

  const removeBlobColor = (index) => {
    const currentColors = blobConfig.colors || ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0']
    if (currentColors.length > 2) {
      setBlobConfig({ ...blobConfig, colors: currentColors.filter((_, i) => i !== index) })
    }
  }

  return (
    <>
      {/* Use Gradient Colors Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-sm">Use Gradient Colors</Label>
        <Switch
          checked={blobConfig.useGradientColors}
          onCheckedChange={(checked) => setBlobConfig({
            ...blobConfig,
            useGradientColors: checked
          })}
        />
      </div>

      {blobConfig.useGradientColors ? (
        /* Show color palette preview when using gradient colors */
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <Label className="text-xs text-muted-foreground mb-2 block">Colors from Gradient Palette</Label>
          <div className="flex gap-1 flex-wrap">
            {gradientConfig.colors.map((color, idx) => (
              <div
                key={idx}
                className="w-8 h-8 rounded-md border border-border"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Blobs will use these colors. Edit them in Liquid mode.
          </p>
        </div>
      ) : (
        <>
          {/* Background Color */}
          <ControlGroup label="Background">
            <div className="flex items-center gap-2">
              <PaletteColorPicker
                value={blobConfig.backgroundColor}
                onChange={(newColor) => setBlobConfig({
                  ...blobConfig,
                  backgroundColor: newColor
                })}
                palette={parsedPalette}
                className="w-10 h-9"
              />
              <Input 
                value={blobConfig.backgroundColor}
                onChange={(e) => setBlobConfig({
                  ...blobConfig,
                  backgroundColor: e.target.value
                })}
                className="h-9 font-mono text-xs flex-1"
              />
            </div>
          </ControlGroup>

          {/* Blob Colors */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide font-semibold">Blob Colors</Label>
            {(blobConfig.colors || ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0']).map((color, index) => (
              <div key={index} className="flex items-center gap-2">
                <PaletteColorPicker
                  value={color}
                  onChange={(newColor) => updateBlobColor(index, newColor)}
                  palette={parsedPalette}
                  className="w-10 h-9"
                />
                <Input 
                  value={color}
                  onChange={(e) => updateBlobColor(index, e.target.value)}
                  className="h-9 font-mono text-xs flex-1"
                />
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-7 w-7 ml-auto"
                  onClick={() => removeBlobColor(index)}
                  disabled={(blobConfig.colors || []).length <= 2}
                >
                  <Trash size={12} />
                </Button>
              </div>
            ))}
            {(blobConfig.colors || []).length < 8 && (
              <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addBlobColor}>
                <Plus size={12} className="mr-1" /> Add Color
              </Button>
            )}
          </div>
        </>
      )}

      {/* Blob Count */}
      <ControlGroup label={`Blob Count`}>
        <NumberInput
          value={[blobConfig.blobCount]}
          onValueChange={([val]) => setBlobConfig({
            ...blobConfig,
            blobCount: val
          })}
          min={2}
          max={20}
          step={1}
        />
      </ControlGroup>

      {/* Blob Size Range */}
      <div className="grid grid-cols-2 gap-4">
        <ControlGroup label={`Min Radius`}>
          <NumberInput
            value={[blobConfig.minRadius]}
            onValueChange={([val]) => setBlobConfig({
              ...blobConfig,
              minRadius: val
            })}
            min={10}
            max={200}
            step={10}
          />
        </ControlGroup>
        <ControlGroup label={`Max Radius`}>
          <NumberInput
            value={[blobConfig.maxRadius]}
            onValueChange={([val]) => setBlobConfig({
              ...blobConfig,
              maxRadius: val
            })}
            min={10}
            max={300}
            step={10}
          />
        </ControlGroup>
      </div>

      {/* Orbit Radius (position spread) */}
      <ControlGroup label={`Orbit Radius`}>
        <NumberInput
          value={[blobConfig.orbitRadius]}
          onValueChange={([val]) => setBlobConfig({
            ...blobConfig,
            orbitRadius: val
          })}
          min={50}
          max={500}
          step={25}
        />
      </ControlGroup>

      {/* Animation Speed */}
      <ControlGroup label={`Speed`}>
        <NumberInput
          value={[blobConfig.speed]}
          onValueChange={([val]) => setBlobConfig({
            ...blobConfig,
            speed: val
          })}
          min={0.1}
          max={2}
          step={0.1}
        />
      </ControlGroup>

      {/* Blur Amount */}
      <ControlGroup label={`Blur Amount`}>
        <NumberInput
          value={[blobConfig.blurAmount]}
          onValueChange={([val]) => setBlobConfig({
            ...blobConfig,
            blurAmount: val
          })}
          min={5}
          max={50}
          step={1}
        />
      </ControlGroup>

      {/* Threshold (gooey strength) */}
      <ControlGroup label={`Gooey Threshold`}>
        <NumberInput
          value={[blobConfig.threshold]}
          onValueChange={([val]) => setBlobConfig({
            ...blobConfig,
            threshold: val
          })}
          min={100}
          max={250}
          step={10}
        />
      </ControlGroup>

      {/* Mouse Influence */}
      <ControlGroup label={`Mouse Influence`}>
        <NumberInput
          value={[blobConfig.mouseInfluence]}
          onValueChange={([val]) => setBlobConfig({
            ...blobConfig,
            mouseInfluence: val
          })}
          min={0}
          max={1}
          step={0.1}
        />
      </ControlGroup>
    </>
  )
}

// Waves controls (animated gradient waves)
export const WavesControls = ({
  wavesConfig,
  setWavesConfig,
  gradientConfig,
  parsedPalette,
}) => {
  const updateWavesColor = (index, color) => {
    const newColors = [...(wavesConfig.colors || ['#06b6d4', '#a855f7', '#ec4899', '#3b82f6'])]
    newColors[index] = color
    setWavesConfig({ ...wavesConfig, colors: newColors })
  }

  const addWavesColor = () => {
    const currentColors = wavesConfig.colors || ['#06b6d4', '#a855f7', '#ec4899', '#3b82f6']
    if (currentColors.length < 8) {
      setWavesConfig({ ...wavesConfig, colors: [...currentColors, '#ffffff'] })
    }
  }

  const removeWavesColor = (index) => {
    const currentColors = wavesConfig.colors || ['#06b6d4', '#a855f7', '#ec4899', '#3b82f6']
    if (currentColors.length > 2) {
      setWavesConfig({ ...wavesConfig, colors: currentColors.filter((_, i) => i !== index) })
    }
  }

  return (
    <>
      {/* Use Gradient Colors Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-sm">Use Gradient Colors</Label>
        <Switch
          checked={wavesConfig.useGradientColors}
          onCheckedChange={(checked) => setWavesConfig({
            ...wavesConfig,
            useGradientColors: checked
          })}
        />
      </div>

      {wavesConfig.useGradientColors ? (
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <Label className="text-xs text-muted-foreground mb-2 block">Colors from Gradient Palette</Label>
          <div className="flex gap-1 flex-wrap">
            {gradientConfig.colors.map((color, idx) => (
              <div
                key={idx}
                className="w-8 h-8 rounded-md border border-border"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Waves will use these colors. Edit them in Liquid mode.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide font-semibold">Wave Colors</Label>
          {(wavesConfig.colors || ['#06b6d4', '#a855f7', '#ec4899', '#3b82f6']).map((color, index) => (
            <div key={index} className="flex items-center gap-2">
              <PaletteColorPicker
                value={color}
                onChange={(newColor) => updateWavesColor(index, newColor)}
                palette={parsedPalette}
                className="w-10 h-9"
              />
              <Input 
                value={color}
                onChange={(e) => updateWavesColor(index, e.target.value)}
                className="h-9 font-mono text-xs flex-1"
              />
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7 ml-auto"
                onClick={() => removeWavesColor(index)}
                disabled={(wavesConfig.colors || []).length <= 2}
              >
                <Trash size={12} />
              </Button>
            </div>
          ))}
          {(wavesConfig.colors || []).length < 8 && (
            <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addWavesColor}>
              <Plus size={12} className="mr-1" /> Add Color
            </Button>
          )}
        </div>
      )}

      {/* Wave Height */}
      <ControlGroup label={`Wave Height`}>
        <NumberInput
          value={[wavesConfig.waveHeight]}
          onValueChange={([val]) => setWavesConfig({
            ...wavesConfig,
            waveHeight: val
          })}
          min={0.05}
          max={0.5}
          step={0.05}
        />
      </ControlGroup>

      {/* Wave Frequency */}
      <ControlGroup label={`Wave Frequency`}>
        <NumberInput
          value={[wavesConfig.waveFrequency]}
          onValueChange={([val]) => setWavesConfig({
            ...wavesConfig,
            waveFrequency: val
          })}
          min={1}
          max={10}
          step={0.5}
        />
      </ControlGroup>

      {/* Rotation */}
      <ControlGroup label={`Rotation (°)`}>
        <NumberInput
          value={[wavesConfig.rotation]}
          onValueChange={([val]) => setWavesConfig({
            ...wavesConfig,
            rotation: val
          })}
          min={-180}
          max={180}
          step={15}
        />
      </ControlGroup>

      {/* Animation Speed */}
      <ControlGroup label={`Speed`}>
        <NumberInput
          value={[wavesConfig.speed]}
          onValueChange={([val]) => setWavesConfig({
            ...wavesConfig,
            speed: val
          })}
          min={0}
          max={2}
          step={0.1}
        />
      </ControlGroup>

      {/* Wave Layers */}
      <ControlGroup label={`Layers`}>
        <NumberInput
          value={[wavesConfig.layers]}
          onValueChange={([val]) => setWavesConfig({
            ...wavesConfig,
            layers: val
          })}
          min={2}
          max={8}
          step={1}
        />
      </ControlGroup>

      {/* Blur Amount */}
      <ControlGroup label={`Blur`}>
        <NumberInput
          value={[wavesConfig.blur]}
          onValueChange={([val]) => setWavesConfig({
            ...wavesConfig,
            blur: val
          })}
          min={0}
          max={100}
          step={5}
        />
      </ControlGroup>

      {/* Phase Offset */}
      <ControlGroup label={`Phase Offset`}>
        <NumberInput
          value={[wavesConfig.phaseOffset ?? 0]}
          onValueChange={([val]) => setWavesConfig({
            ...wavesConfig,
            phaseOffset: val
          })}
          min={0}
          max={2}
          step={0.1}
        />
      </ControlGroup>
    </>
  )
}

// Main Gradient Panel that combines all five background types
export const GradientPanel = ({
  backgroundType,
  setBackgroundType,
  gradientConfig,
  setGradientConfig,
  auroraConfig,
  setAuroraConfig,
  blobConfig,
  setBlobConfig,
  fluidConfig,
  setFluidConfig,
  wavesConfig,
  setWavesConfig,
  parsedPalette,
}) => {
  return (
    <div className="space-y-2">
      {/* Background Type Selector */}
      <ControlGroup label="Background Type">
        <Select
          value={backgroundType}
          onValueChange={(value) => setBackgroundType(value)}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="liquid">Liquid</SelectItem>
            <SelectItem value="aurora">Aurora</SelectItem>
            <SelectItem value="blob">Blob</SelectItem>
            <SelectItem value="fluid">Fluid</SelectItem>
            <SelectItem value="waves">Waves</SelectItem>
          </SelectContent>
        </Select>
      </ControlGroup>

      <div className="h-px bg-border my-3" />

      {/* Conditional controls based on background type */}
      {backgroundType === 'liquid' && (
        <LiquidControls
          gradientConfig={gradientConfig}
          setGradientConfig={setGradientConfig}
          parsedPalette={parsedPalette}
        />
      )}
      {backgroundType === 'aurora' && (
        <AuroraControls
          auroraConfig={auroraConfig}
          setAuroraConfig={setAuroraConfig}
          gradientConfig={gradientConfig}
          parsedPalette={parsedPalette}
        />
      )}
      {backgroundType === 'blob' && (
        <BlobControls
          blobConfig={blobConfig}
          setBlobConfig={setBlobConfig}
          gradientConfig={gradientConfig}
          parsedPalette={parsedPalette}
        />
      )}
      {backgroundType === 'fluid' && (
        <FluidControls
          fluidConfig={fluidConfig}
          setFluidConfig={setFluidConfig}
          gradientConfig={gradientConfig}
          parsedPalette={parsedPalette}
        />
      )}
      {backgroundType === 'waves' && (
        <WavesControls
          wavesConfig={wavesConfig}
          setWavesConfig={setWavesConfig}
          gradientConfig={gradientConfig}
          parsedPalette={parsedPalette}
        />
      )}
    </div>
  )
}

