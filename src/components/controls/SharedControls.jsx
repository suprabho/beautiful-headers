import { useState, memo, useCallback, useRef } from 'react'
import { Plus, Minus, Eyedropper } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { checkContrastAgainstGradient, filterPaletteByContrast } from '@/lib/colorConversion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

// Control group component for consistent styling
export const ControlGroup = memo(({ label, children, className }) => (
  <div className={cn(className, "flex flex-row items-center justify-between")}>
    <Label className="text-xs font-semibold tracking-wide">{label}</Label>
    <div className="py-0.5 flex items-center gap-1">
      {children}
    </div>
  </div>
))

ControlGroup.displayName = 'ControlGroup'

// Number input component
export const NumberInput = memo(({ value, onValueChange, min = 0, max = 100, step = 1, className, showButtons = false }) => {
  const currentValue = value[0]
  const [localValue, setLocalValue] = useState(String(currentValue))
  const [isFocused, setIsFocused] = useState(false)

  // Sync local value when parent value changes and input is not focused
  const displayValue = isFocused ? localValue : String(currentValue)

  const handleChange = useCallback((e) => {
    const raw = e.target.value
    setLocalValue(raw)
    const val = parseFloat(raw)
    if (!isNaN(val)) {
      onValueChange([Math.max(min, Math.min(max, val))])
    }
  }, [min, max, onValueChange])

  const handleFocus = useCallback((e) => {
    setIsFocused(true)
    setLocalValue(String(currentValue))
  }, [currentValue])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    const val = parseFloat(localValue)
    if (isNaN(val) || localValue.trim() === '') {
      onValueChange([Math.max(min, Math.min(max, currentValue))])
    }
  }, [localValue, currentValue, min, max, onValueChange])

  const handleDecrement = useCallback(() => {
    const newVal = Math.max(min, currentValue - step)
    const rounded = Math.round(newVal * 1000) / 1000
    onValueChange([rounded])
  }, [min, currentValue, step, onValueChange])

  const handleIncrement = useCallback(() => {
    const newVal = Math.min(max, currentValue + step)
    const rounded = Math.round(newVal * 1000) / 1000
    onValueChange([rounded])
  }, [max, currentValue, step, onValueChange])

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
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          className={cn("h-10 w-20 text-center", className)}
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
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      min={min}
      max={max}
      step={step}
      className={cn("h-9 w-20", className)}
    />
  )
})

NumberInput.displayName = 'NumberInput'

// Subsection button for mobile
export const SubsectionButton = memo(({ title, onClick }) => (
  <Button
    variant="outline"
    className="w-fit h-11 px-3"
    onClick={onClick}
  >
    <span className="text-sm">{title}</span>
  </Button>
))

SubsectionButton.displayName = 'SubsectionButton'

// Palette Color Picker component - shows palette swatches when palette is uploaded
export const PaletteColorPicker = memo(({ value, onChange, palette, className }) => {
  const [open, setOpen] = useState(false)
  
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
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-8 h-8 rounded-md border border-border cursor-pointer flex items-center justify-center",
            className
          )}
          style={{ backgroundColor: value }}
        >
          <Eyedropper size={14} className="text-white mix-blend-difference" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0 flex flex-col max-h-[50vh] bg-popover">
        <div 
          className="flex-1 min-h-0 overflow-y-auto overscroll-touch touch-pan-y p-3 pointer-events-auto bg-popover" 
          style={{ transform: 'translateZ(0)', willChange: 'scroll-position' }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
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
                        setOpen(false)
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
        </div>
        
        {/* Still allow custom color input */}
        <div className="p-3 pt-0 border-t border-border mt-auto shrink-0">
          <div className="flex items-center gap-2 pt-3">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-md border border-border cursor-pointer bg-transparent"
            />
            <span className="text-xs text-muted-foreground">Custom color</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
})

PaletteColorPicker.displayName = 'PaletteColorPicker'

// Contrast-aware Palette Color Picker - filters colors by AA contrast against gradient
export const ContrastAwarePaletteColorPicker = memo(({ value, onChange, palette, gradientColors, className }) => {
  const [open, setOpen] = useState(false)
  
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
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-8 h-8 rounded-md border cursor-pointer flex items-center justify-center",
              currentContrast.passes ? "border-border" : "border-amber-500",
              className
            )}
            style={{ backgroundColor: value }}
          >
            <Eyedropper size={14} className="text-white mix-blend-difference" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 flex flex-col max-h-[50vh] bg-popover">
          {/* Header with info */}
          <div className="p-3 pb-2 border-b border-border shrink-0 bg-popover">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-green-500/30 border border-green-500/50" />
              <span>Colors with AA contrast (≥3:1)</span>
            </div>
          </div>
          
          <div 
            className="flex-1 min-h-0 overflow-y-auto overscroll-touch touch-pan-y p-3 pointer-events-auto bg-popover" 
            style={{ transform: 'translateZ(0)', willChange: 'scroll-position' }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
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
                              setOpen(false)
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
          </div>
          
          {/* Custom color input with contrast check */}
          <div className="p-3 pt-0 border-t border-border shrink-0">
            <div className="flex items-center gap-2 pt-3">
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
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
        </PopoverContent>
      </Popover>
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
  )
})

ContrastAwarePaletteColorPicker.displayName = 'ContrastAwarePaletteColorPicker'



const decimalsFor = (step) => {
  const str = String(step)
  return str.includes('.') ? str.split('.')[1].length : 0
}

// Filled pill track with a label and value, dragged like a slider. Tap the
// value to type an exact number. `inline` puts the label inside the track.
export const PillSlider = memo(({ label, value, min = 0, max = 1, step = 0.01, onChange, format, unit = '', inline = false }) => {
  const trackRef = useRef(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const safe = Number.isFinite(value) ? value : min
  const pct = Math.max(0, Math.min(1, (safe - min) / (max - min)))
  const decimals = decimalsFor(step)
  const clamp = (v) => Math.max(min, Math.min(max, v))
  const round = (v) => Number(v.toFixed(Math.max(decimals, 0)))

  const setFromClientX = useCallback((clientX) => {
    const rect = trackRef.current.getBoundingClientRect()
    const r = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const raw = min + r * (max - min)
    const snapped = min + Math.round((raw - min) / step) * step
    onChange(Number(Math.max(min, Math.min(max, snapped)).toFixed(decimals)))
  }, [min, max, step, decimals, onChange])

  const onPointerDown = (e) => {
    if (editing) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setFromClientX(e.clientX)
  }
  const onPointerMove = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) setFromClientX(e.clientX)
  }
  const onKeyDown = (e) => {
    if (editing) return
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    onChange(round(clamp(safe + dir * step)))
  }
  const commit = () => {
    const v = parseFloat(draft)
    if (!Number.isNaN(v)) onChange(round(clamp(v)))
    setEditing(false)
  }

  const display = format ? format(safe) : `${safe.toFixed(decimals)}${unit}`

  return (
    <div className="flex min-w-0 items-center gap-3">
      {!inline && (
        <span className="w-16 shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/80">{label}</span>
      )}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={safe}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        className="relative h-8 min-w-0 flex-1 cursor-ew-resize touch-none select-none overflow-hidden rounded-full bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="absolute inset-y-0 left-0 rounded-full bg-foreground/25" style={{ width: `${pct * 100}%` }} />
        {inline && (
          <span className="pointer-events-none absolute inset-y-0 left-3 right-16 flex items-center truncate text-[12px] font-medium">
            {label}
          </span>
        )}
        {editing ? (
          <input
            autoFocus
            type="number"
            value={draft}
            step={step}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') setEditing(false)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute inset-y-1 right-1 w-16 rounded-full bg-background px-2 text-right text-xs font-semibold tabular-nums outline-none ring-1 ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
        ) : (
          <button
            type="button"
            title="Type a value"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => { setDraft(String(safe)); setEditing(true) }}
            className="absolute inset-y-0 right-0 flex cursor-text items-center rounded-full px-3 text-xs font-semibold tabular-nums hover:bg-foreground/10"
          >
            {display}
          </button>
        )}
      </div>
    </div>
  )
})
PillSlider.displayName = 'PillSlider'

// Drop-in replacement for <ControlGroup><NumberInput/></ControlGroup>: same
// value/onValueChange array API, label inside the pill, unit parsed from a
// trailing "(in px)" / "(°)" in the label.
export const SliderInput = memo(({ label, value, onValueChange, min = 0, max = 100, step = 1, className }) => {
  const match = String(label).match(/^(.*?)\s*\((?:in\s+)?([^)]+)\)\s*$/)
  const text = match ? match[1] : label
  const rawUnit = match ? match[2] : ''
  const unit = rawUnit === 'degrees' ? '°' : rawUnit === 'em' ? 'em' : rawUnit
  const handle = useCallback((v) => onValueChange([v]), [onValueChange])
  return (
    <div className={className}>
      <PillSlider inline label={text} value={value[0]} min={min} max={max} step={step} unit={unit} onChange={handle} />
    </div>
  )
})
SliderInput.displayName = 'SliderInput'
