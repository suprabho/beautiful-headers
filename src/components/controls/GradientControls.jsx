import { useRef, useState, useCallback, useEffect } from 'react'
import { Plus, Trash, ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { ControlGroup, NumberInput, PaletteColorPicker } from './SharedControls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ============================================
// COLORS SECTION - Shared by all background types
// ============================================
export const ColorsSection = ({
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

  return (
    <div className="flex flex-col gap-3 pb-2 border-b border-border/50">
      <Label className="text-sm md:text-xs md:uppercase tracking-wide font-medium md:font-semibold">Background Colors</Label>

      {/* Color grid */}
      <div className="flex flex-wrap w-full flex-1 gap-2 px-1">
        {gradientConfig.colors.map((color, index) => (
          <div key={index} className="group relative flex w-full min-w-10 flex-1">
            <PaletteColorPicker
              value={color}
              onChange={(newColor) => updateGradientColor(index, newColor)}
              palette={parsedPalette}
              className="w-full h-10"
            />
            {gradientConfig.colors.length > 2 && (
              <button
                className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center"
                onClick={() => removeGradientColor(index)}
              >
                <Trash size={10} />
              </button>
            )}
          </div>
        ))}
        {gradientConfig.colors.length < 8 && (
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10"
            onClick={addGradientColor}
          >
            <Plus size={16} />
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================
// RADIAL GRADIENT SECTION - For Dandelion/ParticleRing
// ============================================
export const RadialGradientSection = ({
  colors,
  colorStops,
  endX,
  endY,
  onColorsChange,
  onColorStopsChange,
  onBothChange,
  onEndXChange,
  onEndYChange,
  parsedPalette,
}) => {
  const sliderRef = useRef(null)
  const [draggingIndex, setDraggingIndex] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)

  const updateColor = (index, color) => {
    const newColors = [...colors]
    newColors[index] = color
    onColorsChange(newColors)
  }

  const addColor = () => {
    if (colors.length < 8) {
      const newColors = [...colors, '#ffffff']
      const newStops = newColors.map((_, i) => Math.round((i / (newColors.length - 1)) * 100))
      if (onBothChange) {
        onBothChange(newColors, newStops)
      } else {
        onColorsChange(newColors)
        onColorStopsChange(newStops)
      }
    }
  }

  const removeColor = (index) => {
    if (colors.length > 2) {
      const newColors = colors.filter((_, i) => i !== index)
      const newStops = newColors.map((_, i) => Math.round((i / (newColors.length - 1)) * 100))
      if (onBothChange) {
        onBothChange(newColors, newStops)
      } else {
        onColorsChange(newColors)
        onColorStopsChange(newStops)
      }
      if (selectedIndex === index) {
        setSelectedIndex(null)
      } else if (selectedIndex > index) {
        setSelectedIndex(selectedIndex - 1)
      }
    }
  }

  const updateColorStop = (index, value) => {
    const newStops = [...colorStops]
    newStops[index] = Math.max(0, Math.min(100, parseInt(value) || 0))
    onColorStopsChange(newStops)
  }

  const handleDragStart = useCallback((e, index) => {
    e.preventDefault()
    setDraggingIndex(index)
    setSelectedIndex(index)
  }, [])

  const handleDragMove = useCallback((clientX) => {
    if (draggingIndex === null || !sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const handleOffset = 10 // half of w-5 (20px)
    const x = clientX - rect.left - handleOffset
    const usableWidth = rect.width - handleOffset * 2
    const percentage = Math.max(0, Math.min(100, Math.round((x / usableWidth) * 100)))

    const newStops = [...colorStops]
    newStops[draggingIndex] = percentage
    onColorStopsChange(newStops)
  }, [draggingIndex, colorStops, onColorStopsChange])

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
  const sortedColorStops = colors
    .map((color, i) => ({ color, stop: colorStops[i] }))
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
        className="relative h-10 rounded-md cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${gradientString})`,
          border: '1px solid hsl(var(--border))',
          touchAction: 'none',
        }}
      >
        {/* Color stop handles */}
        {colors.map((color, index) => (
          <div
            key={index}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing transition-transform ${selectedIndex === index ? 'scale-110 z-10' : 'z-0'
              }`}
            style={{
              left: `calc(10px + ${colorStops[index]} * (100% - 20px) / 100)`,
              touchAction: 'none',
            }}
            onMouseDown={(e) => handleDragStart(e, index)}
            onTouchStart={(e) => handleDragStart(e, index)}
            onClick={() => setSelectedIndex(index)}
          >
            {/* Larger invisible touch target */}
            <div className="absolute inset-0 -m-3" />
            <div
              className={`w-5 h-8 rounded-sm border-2 shadow-md ${selectedIndex === index ? 'border-white ring-2 ring-primary' : 'border-white'
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
        <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
          <PaletteColorPicker
            value={colors[selectedIndex]}
            onChange={(newColor) => updateColor(selectedIndex, newColor)}
            palette={parsedPalette}
            className="w-10 h-10"
          />
          <Input
            type="number"
            min="0"
            max="100"
            value={colorStops[selectedIndex] || 0}
            onChange={(e) => updateColorStop(selectedIndex, e.target.value)}
            className="w-20 h-10 text-sm"
          />
          <span className="text-sm text-muted-foreground">%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 ml-auto"
            onClick={() => removeColor(selectedIndex)}
            disabled={colors.length <= 2}
          >
            <Trash size={16} />
          </Button>
        </div>
      )}

      {/* Add color button */}
      {colors.length < 8 && (
        <Button variant="outline" size="sm" className="w-full h-10 text-sm" onClick={addColor}>
          <Plus size={16} className="mr-1" /> Add Color
        </Button>
      )}

      {/* End X / End Y position controls */}
      <div className="grid grid-cols-2 gap-4">
        <ControlGroup label="End X (in %)">
          <NumberInput
            value={[endX]}
            onValueChange={([val]) => onEndXChange(val)}
            min={0}
            max={200}
            step={10}
          />
        </ControlGroup>
        <ControlGroup label="End Y (in %)">
          <NumberInput
            value={[endY]}
            onValueChange={([val]) => onEndYChange(val)}
            min={0}
            max={200}
            step={10}
          />
        </ControlGroup>
      </div>
    </div>
  )
}

// ============================================
// LOCKED GRADIENT SLIDER - Colors synced with background, only stops editable
// ============================================
export const LockedGradientSection = ({
  colors,
  colorStops,
  onColorStopsChange,
}) => {
  const sliderRef = useRef(null)
  const [draggingIndex, setDraggingIndex] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)

  const updateColorStop = (index, value) => {
    const newStops = [...colorStops]
    newStops[index] = Math.max(0, Math.min(100, parseInt(value) || 0))
    onColorStopsChange(newStops)
  }

  const handleDragStart = useCallback((e, index) => {
    e.preventDefault()
    setDraggingIndex(index)
    setSelectedIndex(index)
  }, [])

  const handleDragMove = useCallback((clientX) => {
    if (draggingIndex === null || !sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const handleOffset = 8 // half of w-4 (16px)
    const x = clientX - rect.left - handleOffset
    const usableWidth = rect.width - handleOffset * 2
    const percentage = Math.max(0, Math.min(100, Math.round((x / usableWidth) * 100)))

    const newStops = [...colorStops]
    newStops[draggingIndex] = percentage
    onColorStopsChange(newStops)
  }, [draggingIndex, colorStops, onColorStopsChange])

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
  const sortedColorStops = colors
    .map((color, i) => ({ color, stop: colorStops[i] ?? Math.round((i / (colors.length - 1)) * 100) }))
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
        {colors.map((color, index) => {
          const stop = colorStops[index] ?? Math.round((index / (colors.length - 1)) * 100)
          return (
          <div
            key={index}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing transition-transform ${selectedIndex === index ? 'scale-125 z-10' : 'z-0'
              }`}
            style={{
              left: `calc(8px + ${stop} * (100% - 16px) / 100)`,
            }}
            onMouseDown={(e) => handleDragStart(e, index)}
            onTouchStart={(e) => handleDragStart(e, index)}
            onClick={() => setSelectedIndex(index)}
          >
            <div
              className={`w-4 h-6 rounded-sm border-2 shadow-md ${selectedIndex === index ? 'border-white ring-2 ring-primary' : 'border-white'
                }`}
              style={{
                backgroundColor: color,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            />
          </div>
        )})}
      </div>

      {/* Selected stop controls - position only, no color editing */}
      {selectedIndex !== null && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
          <div
            className="w-8 h-8 rounded border border-border"
            style={{ backgroundColor: colors[selectedIndex] }}
          />
          <Input
            type="number"
            min="0"
            max="100"
            value={colorStops[selectedIndex] ?? Math.round((selectedIndex / (colors.length - 1)) * 100)}
            onChange={(e) => updateColorStop(selectedIndex, e.target.value)}
            className="w-16 h-8 text-xs"
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
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
      {/* Locked Gradient Slider */}
      <LockedGradientSection
        colors={gradientConfig.colors}
        colorStops={gradientConfig.colorStops}
        onColorStopsChange={(newStops) => setGradientConfig({ ...gradientConfig, colorStops: newStops })}
      />

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
      {/* Locked Gradient Slider */}
      <LockedGradientSection
        colors={gradientConfig.colors}
        colorStops={gradientConfig.colorStops}
        onColorStopsChange={(newStops) => setGradientConfig({ ...gradientConfig, colorStops: newStops })}
      />

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
            className="h-9 w-24 font-mono text-xs"
          />
        </div>
      </ControlGroup>

      {/* Line Width */}
      <ControlGroup label={`Width`}>
        <NumberInput
          value={[auroraConfig.width]}
          onValueChange={([val]) => setAuroraConfig({
            ...auroraConfig,
            width: val
          })}
          min={1}
          max={100}
          step={5}
        />
      </ControlGroup>

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
      <ControlGroup label={`TTL`}>
        <NumberInput
          value={[auroraConfig.ttl]}
          onValueChange={([val]) => setAuroraConfig({
            ...auroraConfig,
            ttl: val
          })}
          min={10}
          max={500}
          step={10}
        />
      </ControlGroup>

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
            className="h-9 w-24 font-mono text-xs"
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
            className="h-9 w-24 font-mono text-xs"
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
            className="h-9 w-24 font-mono text-xs"
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
// DANDELION CONTROLS
// ============================================
export const DandelionControls = ({ dandelionConfig, setDandelionConfig, parsedPalette }) => {
  // Fallback for legacy configs without array format
  const colors = dandelionConfig.radialGradientColors || [
    dandelionConfig.radialGradientCenter || dandelionConfig.backgroundColor || '#e8f4fc',
    dandelionConfig.radialGradientOuter || '#fef3c7'
  ]
  const colorStops = dandelionConfig.radialGradientStops || [0, 100]

  return (
    <>
      {/* Radial Gradient Section */}
      <RadialGradientSection
        colors={colors}
        colorStops={colorStops}
        endX={dandelionConfig.gradientEndX ?? 200}
        endY={dandelionConfig.gradientEndY ?? 200}
        onColorsChange={(newColors) => setDandelionConfig({ ...dandelionConfig, radialGradientColors: newColors })}
        onColorStopsChange={(newStops) => setDandelionConfig({ ...dandelionConfig, radialGradientStops: newStops })}
        onBothChange={(newColors, newStops) => setDandelionConfig({ ...dandelionConfig, radialGradientColors: newColors, radialGradientStops: newStops })}
        onEndXChange={(val) => setDandelionConfig({ ...dandelionConfig, gradientEndX: val })}
        onEndYChange={(val) => setDandelionConfig({ ...dandelionConfig, gradientEndY: val })}
        parsedPalette={parsedPalette}
      />

      {/* Line Count */}
      <ControlGroup label="Line Count">
        <NumberInput
          value={[dandelionConfig.lineCount]}
          onValueChange={([val]) => setDandelionConfig({ ...dandelionConfig, lineCount: val })}
          min={20}
          max={3000}
          step={50}
        />
      </ControlGroup>

      {/* Radius Range */}
      <div className="grid grid-cols-2 gap-4">
        <ControlGroup label="Min Radius">
          <NumberInput
            value={[dandelionConfig.radiusMin]}
            onValueChange={([val]) => setDandelionConfig({ ...dandelionConfig, radiusMin: val })}
            min={0.05}
            max={0.5}
            step={0.05}
          />
        </ControlGroup>
        <ControlGroup label="Max Radius">
          <NumberInput
            value={[dandelionConfig.radiusMax]}
            onValueChange={([val]) => setDandelionConfig({ ...dandelionConfig, radiusMax: val })}
            min={0.2}
            max={0.8}
            step={0.05}
          />
        </ControlGroup>
      </div>

      {/* Speed */}
      <ControlGroup label="Sway Speed">
        <NumberInput
          value={[dandelionConfig.speed]}
          onValueChange={([val]) => setDandelionConfig({ ...dandelionConfig, speed: val })}
          min={0}
          max={2}
          step={0.1}
        />
      </ControlGroup>

      {/* Thickness */}
      <ControlGroup label="Line Thickness">
        <NumberInput
          value={[dandelionConfig.thickness]}
          onValueChange={([val]) => setDandelionConfig({ ...dandelionConfig, thickness: val })}
          min={0.5}
          max={5}
          step={0.5}
        />
      </ControlGroup>

      {/* Dot Size */}
      <ControlGroup label="Dot Size">
        <NumberInput
          value={[dandelionConfig.dotSize]}
          onValueChange={([val]) => setDandelionConfig({ ...dandelionConfig, dotSize: val })}
          min={1}
          max={8}
          step={0.5}
        />
      </ControlGroup>

      {/* Spread */}
      <ControlGroup label="Spread Angle">
        <NumberInput
          value={[dandelionConfig.spread]}
          onValueChange={([val]) => setDandelionConfig({ ...dandelionConfig, spread: val })}
          min={0.1}
          max={1}
          step={0.1}
        />
      </ControlGroup>

      {/* Center Y Position */}
      <ControlGroup label="Center Y Position">
        <NumberInput
          value={[dandelionConfig.centerY]}
          onValueChange={([val]) => setDandelionConfig({ ...dandelionConfig, centerY: val })}
          min={0.5}
          max={1.2}
          step={0.05}
        />
      </ControlGroup>
    </>
  )
}

// ============================================
// PARTICLE RING CONTROLS
// ============================================
export const ParticleRingControls = ({ particleRingConfig, setParticleRingConfig, parsedPalette }) => {
  // Fallback for legacy configs without array format
  const colors = particleRingConfig.radialGradientColors || [
    particleRingConfig.radialGradientCenter || particleRingConfig.backgroundColor || '#fef6f9',
    particleRingConfig.radialGradientOuter || '#fef3c7'
  ]
  const colorStops = particleRingConfig.radialGradientStops || [0, 100]

  return (
    <>
      {/* Radial Gradient Section */}
      <RadialGradientSection
        colors={colors}
        colorStops={colorStops}
        endX={particleRingConfig.gradientEndX ?? 100}
        endY={particleRingConfig.gradientEndY ?? 100}
        onColorsChange={(newColors) => setParticleRingConfig({ ...particleRingConfig, radialGradientColors: newColors })}
        onColorStopsChange={(newStops) => setParticleRingConfig({ ...particleRingConfig, radialGradientStops: newStops })}
        onBothChange={(newColors, newStops) => setParticleRingConfig({ ...particleRingConfig, radialGradientColors: newColors, radialGradientStops: newStops })}
        onEndXChange={(val) => setParticleRingConfig({ ...particleRingConfig, gradientEndX: val })}
        onEndYChange={(val) => setParticleRingConfig({ ...particleRingConfig, gradientEndY: val })}
        parsedPalette={parsedPalette}
      />

      {/* Particle Count */}
      <ControlGroup label="Particle Count">
        <NumberInput
          value={[particleRingConfig.particleCount]}
          onValueChange={([val]) => setParticleRingConfig({ ...particleRingConfig, particleCount: val })}
          min={100}
          max={2000}
          step={50}
        />
      </ControlGroup>

      {/* Ring Radius */}
      <ControlGroup label="Ring Radius">
        <NumberInput
          value={[particleRingConfig.ringRadius]}
          onValueChange={([val]) => setParticleRingConfig({ ...particleRingConfig, ringRadius: val })}
          min={0.1}
          max={0.8}
          step={0.05}
        />
      </ControlGroup>

      {/* Ring Width */}
      <ControlGroup label="Ring Width">
        <NumberInput
          value={[particleRingConfig.ringWidth]}
          onValueChange={([val]) => setParticleRingConfig({ ...particleRingConfig, ringWidth: val })}
          min={0.05}
          max={0.4}
          step={0.05}
        />
      </ControlGroup>

      {/* Animation Speed */}
      <ControlGroup label="Pulse Speed">
        <NumberInput
          value={[particleRingConfig.speed]}
          onValueChange={([val]) => setParticleRingConfig({ ...particleRingConfig, speed: val })}
          min={0}
          max={2}
          step={0.1}
        />
      </ControlGroup>

      {/* Particle Size */}
      <ControlGroup label="Particle Size">
        <NumberInput
          value={[particleRingConfig.particleSize]}
          onValueChange={([val]) => setParticleRingConfig({ ...particleRingConfig, particleSize: val })}
          min={1}
          max={8}
          step={0.5}
        />
      </ControlGroup>

      {/* Dispersion */}
      <ControlGroup label="Dispersion">
        <NumberInput
          value={[particleRingConfig.dispersion]}
          onValueChange={([val]) => setParticleRingConfig({ ...particleRingConfig, dispersion: val })}
          min={0}
          max={0.5}
          step={0.05}
        />
      </ControlGroup>

      {/* Rotation Speed */}
      <ControlGroup label="Rotation Speed">
        <NumberInput
          value={[particleRingConfig.rotationSpeed]}
          onValueChange={([val]) => setParticleRingConfig({ ...particleRingConfig, rotationSpeed: val })}
          min={0}
          max={1}
          step={0.05}
        />
      </ControlGroup>

      {/* Tilt X */}
      <ControlGroup label="Tilt X">
        <NumberInput
          value={[particleRingConfig.tiltX ?? 0]}
          onValueChange={([val]) => setParticleRingConfig({ ...particleRingConfig, tiltX: val })}
          min={-90}
          max={90}
          step={5}
        />
      </ControlGroup>

      {/* Tilt Z */}
      <ControlGroup label="Tilt Z">
        <NumberInput
          value={[particleRingConfig.tiltZ ?? 0]}
          onValueChange={([val]) => setParticleRingConfig({ ...particleRingConfig, tiltZ: val })}
          min={-90}
          max={90}
          step={5}
        />
      </ControlGroup>
    </>
  )
}

// ============================================
// SHAPE TRAIL CONTROLS
// ============================================
export const ShapeTrailControls = ({ shapeTrailConfig, setShapeTrailConfig, parsedPalette, gradientColors = [] }) => {
  const sliderRef = useRef(null)
  const [draggingIndex, setDraggingIndex] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)

  // Derive color stops - use saved stops or default to evenly distributed
  const colorStops = shapeTrailConfig.trailColorStops && shapeTrailConfig.trailColorStops.length === gradientColors.length
    ? shapeTrailConfig.trailColorStops
    : gradientColors.map((_, i) => Math.round((i / Math.max(1, gradientColors.length - 1)) * 100))

  const updateColorStops = useCallback((newStops) => {
    setShapeTrailConfig({ ...shapeTrailConfig, trailColorStops: newStops })
  }, [shapeTrailConfig, setShapeTrailConfig])

  const handleDragStart = useCallback((e, index) => {
    e.preventDefault()
    setDraggingIndex(index)
    setSelectedIndex(index)
  }, [])

  const handleDragMove = useCallback((clientX) => {
    if (draggingIndex === null || !sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    const handleOffset = 10 // half of w-5 (20px)
    const x = clientX - rect.left - handleOffset
    const usableWidth = rect.width - handleOffset * 2
    const percentage = Math.max(0, Math.min(100, Math.round((x / usableWidth) * 100)))
    const newStops = [...colorStops]
    newStops[draggingIndex] = percentage
    updateColorStops(newStops)
  }, [draggingIndex, colorStops, updateColorStops])

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

  const updateStopPosition = (index, value) => {
    const newStops = [...colorStops]
    newStops[index] = Math.max(0, Math.min(100, parseInt(value) || 0))
    updateColorStops(newStops)
  }

  // Build gradient string sorted by stop position
  const sortedColorStops = gradientColors
    .map((color, i) => ({ color, stop: colorStops[i] ?? Math.round((i / Math.max(1, gradientColors.length - 1)) * 100) }))
    .sort((a, b) => a.stop - b.stop)
  const gradientString = sortedColorStops.length >= 2
    ? sortedColorStops.map(({ color, stop }) => `${color} ${stop}%`).join(', ')
    : '#888 0%, #888 100%'

  return (
    <>
      {/* Trail Gradient Slider */}
      <div
        className="flex flex-col gap-2"
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
        onTouchCancel={handleDragEnd}
      >
        <Label className="text-xs uppercase tracking-wide font-semibold">Trail Gradient</Label>
        <div
          ref={sliderRef}
          className="relative h-10 rounded-md cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${gradientString})`,
            border: '1px solid hsl(var(--border))',
            touchAction: 'none',
          }}
        >
          {gradientColors.map((color, index) => {
            const stop = colorStops[index] ?? Math.round((index / Math.max(1, gradientColors.length - 1)) * 100)
            return (
            <div
              key={index}
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing transition-transform ${selectedIndex === index ? 'scale-110 z-10' : 'z-0'}`}
              style={{
                left: `calc(10px + ${stop} * (100% - 20px) / 100)`,
                touchAction: 'none',
              }}
              onMouseDown={(e) => handleDragStart(e, index)}
              onTouchStart={(e) => handleDragStart(e, index)}
              onClick={() => setSelectedIndex(index)}
            >
              <div className="absolute inset-0 -m-3" />
              <div
                className={`w-5 h-8 rounded-sm border-2 shadow-md ${selectedIndex === index ? 'border-white ring-2 ring-primary' : 'border-white'}`}
                style={{
                  backgroundColor: color,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              />
            </div>
          )})}
        </div>
        {selectedIndex !== null && selectedIndex < gradientColors.length && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
            <div
              className="w-8 h-8 rounded-sm border"
              style={{ backgroundColor: gradientColors[selectedIndex] }}
            />
            <Input
              type="number"
              min="0"
              max="100"
              value={colorStops[selectedIndex] ?? 0}
              onChange={(e) => updateStopPosition(selectedIndex, e.target.value)}
              className="w-20 h-8 text-sm"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        )}
        <span className="text-[10px] text-muted-foreground">Drag handles to adjust color positions along the trail</span>
      </div>

      {/* Background Color */}
      <ControlGroup label="Background Color">
        <div className="flex items-center gap-2">
          <PaletteColorPicker
            value={shapeTrailConfig.backgroundColor}
            onChange={(newColor) => setShapeTrailConfig({ ...shapeTrailConfig, backgroundColor: newColor })}
            palette={parsedPalette}
            className="w-10 h-9"
          />
          <Input
            value={shapeTrailConfig.backgroundColor}
            onChange={(e) => setShapeTrailConfig({ ...shapeTrailConfig, backgroundColor: e.target.value })}
            className="h-9 w-24 font-mono text-xs"
          />
        </div>
      </ControlGroup>

      {/* Shape Type */}
      <ControlGroup label="Shape">
        <Select
          value={shapeTrailConfig.shape}
          onValueChange={(value) => setShapeTrailConfig({ ...shapeTrailConfig, shape: value })}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="circle">Circle</SelectItem>
            <SelectItem value="square">Square</SelectItem>
            <SelectItem value="triangle">Triangle</SelectItem>
          </SelectContent>
        </Select>
      </ControlGroup>

      {/* Scale Range */}
      <div className="grid grid-cols-2 gap-4">
        <ControlGroup label="Start Scale">
          <NumberInput
            value={[shapeTrailConfig.startScale]}
            onValueChange={([val]) => setShapeTrailConfig({ ...shapeTrailConfig, startScale: val })}
            min={100}
            max={1000}
            step={100}
          />
        </ControlGroup>
        <ControlGroup label="End Scale">
          <NumberInput
            value={[shapeTrailConfig.endScale]}
            onValueChange={([val]) => setShapeTrailConfig({ ...shapeTrailConfig, endScale: val })}
            min={100}
            max={2000}
            step={100}
          />
        </ControlGroup>
      </div>

      {/* Size Cycles */}
      <ControlGroup label="Size Cycles">
        <NumberInput
          value={[shapeTrailConfig.sizeCycles ?? 1]}
          onValueChange={([val]) => setShapeTrailConfig({ ...shapeTrailConfig, sizeCycles: val })}
          min={1}
          max={100}
          step={1}
        />
      </ControlGroup>

      {/* Gap */}
      <ControlGroup label="Gap">
        <NumberInput
          value={[shapeTrailConfig.gap]}
          onValueChange={([val]) => setShapeTrailConfig({ ...shapeTrailConfig, gap: val })}
          min={5}
          max={100}
          step={5}
        />
      </ControlGroup>

      {/* Rotation Offset */}
      <ControlGroup label={`Rotation Offset (\u00B0)`}>
        <NumberInput
          value={[shapeTrailConfig.rotationOffset]}
          onValueChange={([val]) => setShapeTrailConfig({ ...shapeTrailConfig, rotationOffset: val })}
          min={0}
          max={180}
          step={5}
        />
      </ControlGroup>

      {/* Trail Count */}
      <ControlGroup label="Trail Count">
        <NumberInput
          value={[shapeTrailConfig.trailCount]}
          onValueChange={([val]) => setShapeTrailConfig({ ...shapeTrailConfig, trailCount: val })}
          min={1}
          max={8}
          step={1}
        />
      </ControlGroup>

      {/* Path Complexity */}
      <ControlGroup label="Path Complexity">
        <NumberInput
          value={[shapeTrailConfig.pathComplexity]}
          onValueChange={([val]) => setShapeTrailConfig({ ...shapeTrailConfig, pathComplexity: val })}
          min={3}
          max={8}
          step={1}
        />
      </ControlGroup>

      {/* Speed */}
      <ControlGroup label="Speed">
        <NumberInput
          value={[shapeTrailConfig.speed]}
          onValueChange={([val]) => setShapeTrailConfig({ ...shapeTrailConfig, speed: val })}
          min={0}
          max={2}
          step={0.1}
        />
      </ControlGroup>

      {/* Opacity */}
      <ControlGroup label="Opacity">
        <NumberInput
          value={[shapeTrailConfig.opacity]}
          onValueChange={([val]) => setShapeTrailConfig({ ...shapeTrailConfig, opacity: val })}
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
  dandelionConfig,
  setDandelionConfig,
  particleRingConfig,
  setParticleRingConfig,
  shapeTrailConfig,
  setShapeTrailConfig,
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
            <SelectItem value="dandelion">Dandelion</SelectItem>
            <SelectItem value="particleRing">Particle Ring</SelectItem>
            <SelectItem value="shapeTrail">Shape Trail</SelectItem>
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
      {backgroundType === 'dandelion' && (
        <DandelionControls
          dandelionConfig={dandelionConfig}
          setDandelionConfig={setDandelionConfig}
          parsedPalette={parsedPalette}
        />
      )}
      {backgroundType === 'particleRing' && (
        <ParticleRingControls
          particleRingConfig={particleRingConfig}
          setParticleRingConfig={setParticleRingConfig}
          parsedPalette={parsedPalette}
        />
      )}
      {backgroundType === 'shapeTrail' && (
        <ShapeTrailControls
          shapeTrailConfig={shapeTrailConfig}
          setShapeTrailConfig={setShapeTrailConfig}
          parsedPalette={parsedPalette}
          gradientColors={gradientConfig.colors}
        />
      )}
    </div>
  )
}
