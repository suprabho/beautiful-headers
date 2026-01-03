import { useState, useRef, useEffect } from 'react'
import { Plus, Minus, Eyedropper } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { checkContrastAgainstGradient, filterPaletteByContrast } from '@/lib/colorConversion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Control group component for consistent styling
export const ControlGroup = ({ label, children, className }) => (
  <div className={cn(className, "flex flex-row items-center justify-between")}>
    <Label className="text-xs font-semibold tracking-wide">{label}</Label>
    <div className="py-2 flex items-center gap-1">
      {children}
    </div>
  </div>
)

// Number input component
export const NumberInput = ({ value, onValueChange, min = 0, max = 100, step = 1, className, showButtons = false }) => {
  const currentValue = value[0]
  
  const handleDecrement = () => {
    const newVal = Math.max(min, currentValue - step)
    const rounded = Math.round(newVal * 1000) / 1000
    onValueChange([rounded])
  }
  
  const handleIncrement = () => {
    const newVal = Math.min(max, currentValue + step)
    const rounded = Math.round(newVal * 1000) / 1000
    onValueChange([rounded])
  }

  if (showButtons) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 touch-manipulation"
          onClick={handleDecrement}
          disabled={currentValue <= min}
        >
          <Minus size={18} weight="bold" />
        </Button>
        <Input
          type="number"
          value={currentValue}
          onChange={(e) => {
            const val = parseFloat(e.target.value)
            if (!isNaN(val)) {
              onValueChange([Math.max(min, Math.min(max, val))])
            }
          }}
          min={min}
          max={max}
          step={step}
          className={cn("h-10 text-center", className)}
        />
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 touch-manipulation"
          onClick={handleIncrement}
          disabled={currentValue >= max}
        >
          <Plus size={18} weight="bold" />
        </Button>
      </div>
    )
  }

  return (
    <Input
      type="number"
      value={currentValue}
      onChange={(e) => {
        const val = parseFloat(e.target.value)
        if (!isNaN(val)) {
          onValueChange([Math.max(min, Math.min(max, val))])
        }
      }}
      min={min}
      max={max}
      step={step}
      className={cn("h-9", className)}
    />
  )
}

// Subsection button for mobile
export const SubsectionButton = ({ title, onClick }) => (
  <Button 
    variant="outline" 
    className="w-fit h-11 px-3"
    onClick={onClick}
  >
    <span className="text-sm">{title}</span>
  </Button>
)

// Palette Color Picker component - shows palette swatches when palette is uploaded
export const PaletteColorPicker = ({ value, onChange, palette, className }) => {
  const [showPalette, setShowPalette] = useState(false)
  const containerRef = useRef(null)
  
  // Close palette when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowPalette(false)
      }
    }
    if (showPalette) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPalette])
  
  // If no palette, show native color picker
  if (!palette) {
    return (
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("w-8 h-8 rounded-md border border-border cursor-pointer bg-transparent", className)}
      />
    )
  }
  
  const { colorsByName } = palette
  
  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setShowPalette(!showPalette)}
        className={cn(
          "w-8 h-8 rounded-md border border-border cursor-pointer flex items-center justify-center",
          className
        )}
        style={{ backgroundColor: value }}
      >
        <Eyedropper size={14} className="text-white mix-blend-difference" />
      </button>
      
      {showPalette && (
        <div className="absolute z-50 top-full left-0 mt-2 p-3 bg-popover border border-border rounded-lg shadow-xl max-h-[300px] overflow-auto w-[280px]">
          <div className="space-y-3">
            {Object.entries(colorsByName).map(([name, shades]) => (
              <div key={name}>
                <div className="text-xs font-medium text-muted-foreground mb-1.5 capitalize">{name}</div>
                <div className="flex flex-wrap gap-1">
                  {shades.map((shade, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onChange(shade.hex)
                        setShowPalette(false)
                      }}
                      className={cn(
                        "w-6 h-6 rounded border border-border/50 hover:scale-110 transition-transform",
                        value === shade.hex && "ring-2 ring-primary ring-offset-1"
                      )}
                      style={{ backgroundColor: shade.hex }}
                      title={shade.shade ? `${name}-${shade.shade}` : name}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Still allow custom color input */}
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value}
                onChange={(e) => {
                  onChange(e.target.value)
                  setShowPalette(false)
                }}
                className="w-8 h-8 rounded-md border border-border cursor-pointer bg-transparent"
              />
              <span className="text-xs text-muted-foreground">Custom color</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Contrast-aware Palette Color Picker - filters colors by AA contrast against gradient
export const ContrastAwarePaletteColorPicker = ({ value, onChange, palette, gradientColors, className }) => {
  const [showPalette, setShowPalette] = useState(false)
  const containerRef = useRef(null)
  
  // Close palette when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowPalette(false)
      }
    }
    if (showPalette) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPalette])
  
  // Filter palette colors by contrast with gradient colors
  const filteredPalette = palette && gradientColors?.length > 0
    ? filterPaletteByContrast(palette, gradientColors, 'AA', true)
    : palette
  
  // Check current value's contrast
  const currentContrast = gradientColors?.length > 0
    ? checkContrastAgainstGradient(value, gradientColors, 'AA', true)
    : { passes: true, minRatio: Infinity }
  
  // If no palette, show native color picker with contrast indicator
  if (!palette) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn("w-8 h-8 rounded-md border border-border cursor-pointer bg-transparent", className)}
        />
        {gradientColors?.length > 0 && (
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded font-medium",
            currentContrast.passes 
              ? "bg-green-500/20 text-green-600 dark:text-green-400" 
              : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
          )}>
            {currentContrast.minRatio.toFixed(1)}:1
          </span>
        )}
      </div>
    )
  }
  
  const { colorsByName } = filteredPalette
  const hasAccessibleColors = Object.keys(colorsByName).length > 0
  
  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowPalette(!showPalette)}
          className={cn(
            "w-8 h-8 rounded-md border cursor-pointer flex items-center justify-center",
            currentContrast.passes ? "border-border" : "border-amber-500",
            className
          )}
          style={{ backgroundColor: value }}
        >
          <Eyedropper size={14} className="text-white mix-blend-difference" />
        </button>
        {gradientColors?.length > 0 && (
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded font-medium",
            currentContrast.passes 
              ? "bg-green-500/20 text-green-600 dark:text-green-400" 
              : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
          )}>
            {currentContrast.minRatio === Infinity ? "—" : `${currentContrast.minRatio.toFixed(1)}:1`}
          </span>
        )}
      </div>
      
      {showPalette && (
        <div className="absolute z-50 top-full left-0 mt-2 p-3 bg-popover border border-border rounded-lg shadow-xl max-h-[300px] overflow-auto w-[280px]">
          {/* Header with info */}
          <div className="mb-3 pb-2 border-b border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-green-500/30 border border-green-500/50" />
              <span>Colors with AA contrast (≥3:1)</span>
            </div>
          </div>
          
          {hasAccessibleColors ? (
            <div className="space-y-3">
              {Object.entries(colorsByName).map(([name, shades]) => (
                <div key={name}>
                  <div className="text-xs font-medium text-muted-foreground mb-1.5 capitalize">{name}</div>
                  <div className="flex flex-wrap gap-1">
                    {shades.map((shade, idx) => {
                      const contrast = checkContrastAgainstGradient(shade.hex, gradientColors, 'AA', true)
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            onChange(shade.hex)
                            setShowPalette(false)
                          }}
                          className={cn(
                            "w-6 h-6 rounded border hover:scale-110 transition-transform relative group",
                            value === shade.hex && "ring-2 ring-primary ring-offset-1",
                            "border-green-500/50"
                          )}
                          style={{ backgroundColor: shade.hex }}
                          title={`${shade.shade ? `${name}-${shade.shade}` : name} (${contrast.minRatio.toFixed(1)}:1)`}
                        >
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-1 py-0.5 bg-popover text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap border border-border shadow-sm pointer-events-none">
                            {contrast.minRatio.toFixed(1)}:1
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-muted-foreground">
              <p>No colors in your palette meet AA contrast requirements with the current gradient.</p>
              <p className="mt-2 text-xs">Try adjusting your gradient colors or use a custom color below.</p>
            </div>
          )}
          
          {/* Custom color input with contrast check */}
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value}
                onChange={(e) => {
                  onChange(e.target.value)
                }}
                className="w-8 h-8 rounded-md border border-border cursor-pointer bg-transparent"
              />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Custom color</span>
                {!currentContrast.passes && (
                  <span className="text-[10px] text-amber-500">Low contrast ({currentContrast.minRatio.toFixed(1)}:1)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

