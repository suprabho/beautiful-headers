import { Plus, Trash, ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { ControlGroup, NumberInput, PaletteColorPicker } from './SharedControls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ============================================
// COLORS SECTION - Shared by all background types
// ============================================
import { useRef, useState, useCallback } from 'react'

export const ColorsSection = ({
  gradientConfig,
  setGradientConfig,
  parsedPalette,
}) => {
  const sliderRef = useRef(null)
  const [draggingIndex, setDraggingIndex] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)

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
      if (selectedIndex === index) {
        setSelectedIndex(null)
      } else if (selectedIndex > index) {
        setSelectedIndex(selectedIndex - 1)
      }
    }
  }

  const updateColorStop = (index, value) => {
    const newStops = [...gradientConfig.colorStops]
    newStops[index] = Math.max(0, Math.min(100, parseInt(value) || 0))
    setGradientConfig({ ...gradientConfig, colorStops: newStops })
  }

  const handleDragStart = useCallback((e, index) => {
    e.preventDefault()
    setDraggingIndex(index)
    setSelectedIndex(index)
  }, [])

  const handleDragMove = useCallback((clientX) => {
    if (draggingIndex === null || !sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)))

    const newStops = [...gradientConfig.colorStops]
    newStops[draggingIndex] = percentage
    setGradientConfig({ ...gradientConfig, colorStops: newStops })
  }, [draggingIndex, gradientConfig, setGradientConfig])

  const handleMouseMove = useCallback((e) => {
    handleDragMove(e.clientX)
  }, [handleDragMove])

  const handleTouchMove = useCallback((e) => {
    if (draggingIndex !== null && e.touches.length > 0) {
      e.preventDefault()
      handleDragMove(e.touches[0].clientX)
    }
  }, [draggingIndex, handleDragMove])

  const handleDragEnd = useCallback(() => {
    setDraggingIndex(null)
  }, [])

  // Build gradient string for the track (sorted by stop position)
  const sortedColorStops = gradientConfig.colors
    .map((color, i) => ({ color, stop: gradientConfig.colorStops[i] }))
    .sort((a, b) => a.stop - b.stop)
  const gradientString = sortedColorStops
    .map(({ color, stop }) => `${color} ${stop}%`)
    .join(', ')

  return (
    <div
      className="flex flex-col gap-3"
      onMouseMove={handleMouseMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleDragEnd}
      onTouchCancel={handleDragEnd}
    >
      <Label className="text-xs uppercase tracking-wide font-semibold">Background Colors</Label>

      {/* Horizontal slider track with color stops */}
      <div
        ref={sliderRef}
        className="relative h-8 rounded-md cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${gradientString})`,
          border: '1px solid hsl(var(--border))',
        }}
      >
        {/* Color stop handles */}
        {gradientConfig.colors.map((color, index) => (
          <div
            key={index}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing transition-transform ${
              selectedIndex === index ? 'scale-125 z-10' : 'z-0'
            }`}
            style={{
              left: `${gradientConfig.colorStops[index]}%`,
            }}
            onMouseDown={(e) => handleDragStart(e, index)}
            onTouchStart={(e) => handleDragStart(e, index)}
            onClick={() => setSelectedIndex(index)}
          >
            <div
              className={`w-4 h-6 rounded-sm border-2 shadow-md ${
                selectedIndex === index ? 'border-white ring-2 ring-primary' : 'border-white'
              }`}
              style={{
                backgroundColor: color,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Selected color controls */}
      {selectedIndex !== null && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
          <PaletteColorPicker
            value={gradientConfig.colors[selectedIndex]}
            onChange={(newColor) => updateGradientColor(selectedIndex, newColor)}
            palette={parsedPalette}
          />
          <Input
            type="number"
            min="0"
            max="100"
            value={gradientConfig.colorStops[selectedIndex] || 0}
            onChange={(e) => updateColorStop(selectedIndex, e.target.value)}
            className="w-16 h-8 text-xs"
          />
          <span className="text-xs text-muted-foreground">%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 ml-auto"
            onClick={() => removeGradientColor(selectedIndex)}
            disabled={gradientConfig.colors.length <= 2}
          >
            <Trash size={12} />
          </Button>
        </div>
      )}

      {/* Add color button */}
      {gradientConfig.colors.length < 8 && (
        <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addGradientColor}>
          <Plus size={12} className="mr-1" /> Add Color
        </Button>
      )}
    </div>
  )
}

// ============================================
// SIMPLE GRADIENT SETTINGS (without colors)
// ============================================
export const SimpleControls = ({
  gradientConfig,
  setGradientConfig,
}) => {
  return (
    <>
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
            min={-100}
            max={200}
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
            min={-100}
            max={200}
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
            min={-100}
            max={200}
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
            min={-100}
            max={200}
            step={10}
          />
        </ControlGroup>
      </div>
    </>
  )
}

// ============================================
// FOG/LIQUID SETTINGS (without colors)
// ============================================
export const LiquidControls = ({
  gradientConfig,
  setGradientConfig,
}) => {
  return (
    <>
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
            min={-100}
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
            min={-100}
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
            min={-100}
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
            min={-100}
            max={100}
            step={10}
          />
        </ControlGroup>
      </div>

      {/* Wave Intensity */}
      <ControlGroup label={`Wave Intensity`}>
        <NumberInput
          value={[Math.round(gradientConfig.waveIntensity * 100) / 100]}
          onValueChange={([val]) => setGradientConfig({
            ...gradientConfig,
            waveIntensity: val
          })}
          max={1}
          step={0.01}
        />
      </ControlGroup>

      {/* Wave 1 Settings */}
      <div className="grid grid-cols-2 gap-4">
        <ControlGroup label={`Wave 1`}>
          <NumberInput
            value={[Math.round(gradientConfig.wave1Speed * 100) / 100]}
            onValueChange={([val]) => setGradientConfig({
              ...gradientConfig,
              wave1Speed: val
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

// ============================================
// AURORA SETTINGS (without colors toggle)
// ============================================
export const AuroraControls = ({
  auroraConfig,
  setAuroraConfig,
  parsedPalette,
}) => {
  return (
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

// ============================================
// FLUID/MESH SETTINGS (without colors toggle)
// ============================================
export const FluidControls = ({
  fluidConfig,
  setFluidConfig,
  parsedPalette,
}) => {
  return (
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
          min={0.5}
          max={2}
          step={0.1}
        />
      </ControlGroup>

      {/* Scale */}
      <ControlGroup label={`Scale`}>
        <NumberInput
          value={[fluidConfig.scale]}
          onValueChange={([val]) => setFluidConfig({
            ...fluidConfig,
            scale: val
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

// ============================================
// BLOB SETTINGS (without colors toggle)
// ============================================
export const BlobControls = ({
  blobConfig,
  setBlobConfig,
  parsedPalette,
}) => {
  return (
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

// ============================================
// WAVES SETTINGS (without colors toggle)
// ============================================
export const WavesControls = ({
  wavesConfig,
  setWavesConfig,
}) => {
  return (
    <>
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

// ============================================
// RIBBON CONTROLS
// ============================================
const RibbonControls = ({ ribbonConfig, setRibbonConfig, parsedPalette }) => {
  return (
    <>
      {/* Background Color */}
      <ControlGroup label="Background Color">
        <div className="flex items-center gap-2">
          <PaletteColorPicker
            value={ribbonConfig.backgroundColor}
            onChange={(newColor) => setRibbonConfig({ ...ribbonConfig, backgroundColor: newColor })}
            palette={parsedPalette}
            className="w-10 h-9"
          />
          <Input
            value={ribbonConfig.backgroundColor}
            onChange={(e) => setRibbonConfig({ ...ribbonConfig, backgroundColor: e.target.value })}
            className="h-9 font-mono text-xs flex-1"
          />
        </div>
      </ControlGroup>

      {/* Ribbon Count */}
      <ControlGroup label="Ribbon Count">
        <NumberInput
          value={[ribbonConfig.ribbonCount]}
          onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, ribbonCount: val })}
          min={2}
          max={10}
          step={1}
        />
      </ControlGroup>

      {/* Speed */}
      <ControlGroup label="Speed">
        <NumberInput
          value={[ribbonConfig.speed]}
          onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, speed: val })}
          min={0.1}
          max={2}
          step={0.1}
        />
      </ControlGroup>

      {/* Amplitude */}
      <ControlGroup label="Amplitude">
        <NumberInput
          value={[ribbonConfig.amplitude]}
          onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, amplitude: val })}
          min={0.1}
          max={3}
          step={0.1}
        />
      </ControlGroup>

      {/* Spread */}
      <ControlGroup label="Spread">
        <NumberInput
          value={[ribbonConfig.spread]}
          onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, spread: val })}
          min={0.5}
          max={3}
          step={0.1}
        />
      </ControlGroup>

      {/* Rotation */}
      <ControlGroup label={`Rotation (\u00B0)`}>
        <NumberInput
          value={[ribbonConfig.rotation]}
          onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, rotation: val })}
          min={-90}
          max={90}
          step={5}
        />
      </ControlGroup>

      {/* Thickness */}
      <ControlGroup label="Thickness">
        <NumberInput
          value={[ribbonConfig.thickness]}
          onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, thickness: val })}
          min={0.1}
          max={1}
          step={0.05}
        />
      </ControlGroup>

      {/* Taper */}
      <ControlGroup label="Taper">
        <NumberInput
          value={[ribbonConfig.taper]}
          onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, taper: val })}
          min={-1}
          max={1}
          step={0.1}
        />
      </ControlGroup>

      {/* Noise */}
      <ControlGroup label="Noise">
        <NumberInput
          value={[ribbonConfig.noise]}
          onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, noise: val })}
          min={0}
          max={2}
          step={0.1}
        />
      </ControlGroup>

      {/* Opacity */}
      <ControlGroup label="Opacity">
        <NumberInput
          value={[ribbonConfig.opacity]}
          onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, opacity: val })}
          min={0.1}
          max={1}
          step={0.05}
        />
      </ControlGroup>
    </>
  )
}

// ============================================
// MAIN GRADIENT PANEL - Restructured
// ============================================
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
  ribbonConfig,
  setRibbonConfig,
  parsedPalette,
}) => {
  return (
    <div className="space-y-0">
      {/* SECTION 1: Background Colors - Always visible */}
      <ColorsSection
        gradientConfig={gradientConfig}
        setGradientConfig={setGradientConfig}
        parsedPalette={parsedPalette}
      />

      <div className="h-px bg-border my-2" />

      {/* SECTION 2: Background Type Selector */}
      <ControlGroup label="Background Type">
        <Select
          value={backgroundType}
          onValueChange={(value) => setBackgroundType(value)}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="simple">Simple</SelectItem>
            <SelectItem value="liquid">Fog</SelectItem>
            <SelectItem value="aurora">Aurora</SelectItem>
            <SelectItem value="fluid">Mesh</SelectItem>
            <SelectItem value="waves">Waves</SelectItem>
            <SelectItem value="ribbon">Ribbon</SelectItem>
          </SelectContent>
        </Select>
      </ControlGroup>

      {/* SECTION 3: Type-specific controls */}
      {backgroundType === 'simple' && (
        <SimpleControls
          gradientConfig={gradientConfig}
          setGradientConfig={setGradientConfig}
        />
      )}
      {backgroundType === 'liquid' && (
        <LiquidControls
          gradientConfig={gradientConfig}
          setGradientConfig={setGradientConfig}
        />
      )}
      {backgroundType === 'aurora' && (
        <AuroraControls
          auroraConfig={auroraConfig}
          setAuroraConfig={setAuroraConfig}
          parsedPalette={parsedPalette}
        />
      )}
      {backgroundType === 'fluid' && (
        <FluidControls
          fluidConfig={fluidConfig}
          setFluidConfig={setFluidConfig}
          parsedPalette={parsedPalette}
        />
      )}
      {backgroundType === 'waves' && (
        <WavesControls
          wavesConfig={wavesConfig}
          setWavesConfig={setWavesConfig}
        />
      )}
      {backgroundType === 'ribbon' && (
        <RibbonControls
          ribbonConfig={ribbonConfig}
          setRibbonConfig={setRibbonConfig}
          parsedPalette={parsedPalette}
        />
      )}
    </div>
  )
}
