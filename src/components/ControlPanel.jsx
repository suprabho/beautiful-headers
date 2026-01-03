import { useState, useRef, useEffect, useCallback } from 'react'
import html2canvas from 'html2canvas'
import { AVAILABLE_ICONS } from './TessellationLayer'
import { 
  Sliders, Palette, GridFour, Sparkle, TextT, 
  Shuffle, Plus, Minus, Trash, CaretDown, CaretUp, CaretRight, DotsSixVertical, Camera,
  X, Image, Stack, CircleNotch, ArrowLeft, ArrowRight, Check, ArrowCounterClockwise, Upload, Eyedropper
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { prepareForCapture, validatePaletteJson, parsePaletteJson, filterPaletteByContrast, checkContrastAgainstGradient } from '@/lib/colorConversion'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

// Control group component for consistent styling - MUST be defined outside ControlPanel to prevent re-renders
const ControlGroup = ({ label, children, className }) => (
  <div className={cn(className, "flex flex-row items-center justify-between")}>
    <Label className="text-xs font-semibold tracking-wide">{label}</Label>
    <div className="py-2 flex items-center gap-1">
      {children}
    </div>
  </div>
)

// Number input component - MUST be defined outside ControlPanel to prevent focus loss
const NumberInput = ({ value, onValueChange, min = 0, max = 100, step = 1, className, showButtons = false }) => {
  const currentValue = value[0]
  
  const handleDecrement = () => {
    const newVal = Math.max(min, currentValue - step)
    // Round to avoid floating point precision issues
    const rounded = Math.round(newVal * 1000) / 1000
    onValueChange([rounded])
  }
  
  const handleIncrement = () => {
    const newVal = Math.min(max, currentValue + step)
    // Round to avoid floating point precision issues
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

// Subsection button for mobile - MUST be defined outside ControlPanel
const SubsectionButton = ({ title, onClick }) => (
  <Button 
    variant="outline" 
    className="w-fit h-11 px-3"
    onClick={onClick}
  >
    <span className="text-sm">{title}</span>
  </Button>
)

// Palette Color Picker component - shows palette swatches when palette is uploaded
const PaletteColorPicker = ({ value, onChange, palette, className }) => {
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
const ContrastAwarePaletteColorPicker = ({ value, onChange, palette, gradientColors, className }) => {
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

const ControlPanel = ({
  activePanel,
  setActivePanel,
  backgroundType,
  setBackgroundType,
  gradientConfig,
  setGradientConfig,
  auroraConfig,
  setAuroraConfig,
  blobConfig,
  setBlobConfig,
  randomizeGradient,
  tessellationConfig,
  setTessellationConfig,
  effectsConfig,
  setEffectsConfig,
  textSections,
  setTextSections,
  textGap,
  setTextGap,
  textConfig,
  setTextConfig,
  layersContainerRef,
  colorPalette,
  setColorPalette,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(true)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [activeDialog, setActiveDialog] = useState(null)
  const [originalValues, setOriginalValues] = useState(null)
  const [collapsedSections, setCollapsedSections] = useState({})
  const [showPaletteDialog, setShowPaletteDialog] = useState(false)
  const [paletteJson, setPaletteJson] = useState('')
  const [paletteError, setPaletteError] = useState('')
  const dragOffset = useRef({ x: 0, y: 0 })
  const panelRef = useRef(null)
  
  // Parse the palette for the color picker
  const parsedPalette = colorPalette ? parsePaletteJson(colorPalette) : null
  
  // Handle palette upload
  const handlePaletteUpload = () => {
    if (!paletteJson.trim()) {
      setPaletteError('Please paste a JSON palette')
      return
    }
    
    const result = validatePaletteJson(paletteJson)
    if (!result.valid) {
      setPaletteError(result.error)
      return
    }
    
    setColorPalette(result.palette)
    setPaletteError('')
    setShowPaletteDialog(false)
    setPaletteJson('')
    
    // Shuffle gradient colors using the new palette
    const paletteColors = result.colors.map(c => c.hex)
    if (paletteColors.length >= 2) {
      // Pick 2-4 random colors from the palette
      const numColors = Math.min(Math.floor(Math.random() * 3) + 2, paletteColors.length)
      const shuffled = [...paletteColors].sort(() => Math.random() - 0.5)
      const selectedColors = shuffled.slice(0, numColors)
      const colorStops = selectedColors.map((_, i) => Math.round((i / (selectedColors.length - 1)) * 100))
      
      setGradientConfig(prev => ({
        ...prev,
        colors: selectedColors,
        colorStops,
        numColors: selectedColors.length,
      }))
    }
  }
  
  // Clear palette
  const handleClearPalette = () => {
    setColorPalette(null)
    setPaletteJson('')
    setPaletteError('')
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const openDialog = (dialogKey) => {
    setActiveDialog(dialogKey)
    if (dialogKey.startsWith('gradient-')) {
      setOriginalValues({ type: 'gradient', data: { ...gradientConfig } })
    } else if (dialogKey.startsWith('pattern-')) {
      setOriginalValues({ type: 'pattern', data: { ...tessellationConfig } })
    } else if (dialogKey.startsWith('effects-')) {
      setOriginalValues({ type: 'effects', data: { ...effectsConfig } })
    } else if (dialogKey.startsWith('text-')) {
      setOriginalValues({ type: 'text', data: { sections: [...textSections], gap: textGap, config: { ...textConfig } } })
    }
  }

  const applyDialog = () => {
    setActiveDialog(null)
    setOriginalValues(null)
  }

  const backDialog = () => {
    if (originalValues) {
      if (originalValues.type === 'gradient') {
        setGradientConfig(originalValues.data)
      } else if (originalValues.type === 'pattern') {
        setTessellationConfig(originalValues.data)
      } else if (originalValues.type === 'effects') {
        setEffectsConfig(originalValues.data)
      } else if (originalValues.type === 'text') {
        setTextSections(originalValues.data.sections)
        setTextGap(originalValues.data.gap)
        setTextConfig(originalValues.data.config)
      }
    }
    setActiveDialog(null)
    setOriginalValues(null)
  }

  const resetDialog = () => {
    if (originalValues) {
      if (originalValues.type === 'gradient') {
        setGradientConfig(originalValues.data)
      } else if (originalValues.type === 'pattern') {
        setTessellationConfig(originalValues.data)
      } else if (originalValues.type === 'effects') {
        setEffectsConfig(originalValues.data)
      } else if (originalValues.type === 'text') {
        setTextSections(originalValues.data.sections)
        setTextGap(originalValues.data.gap)
        setTextConfig(originalValues.data.config)
      }
    }
  }

  const handleMouseDown = useCallback((e) => {
    if (isMobile) return
    if (e.target.closest('.panel-content') || e.target.closest('[data-slot="tabs"]')) return
    
    setIsDragging(true)
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
    e.preventDefault()
  }, [position, isMobile])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return
    
    const newX = e.clientX - dragOffset.current.x
    const newY = e.clientY - dragOffset.current.y
    
    const panel = panelRef.current
    if (panel) {
      const maxX = window.innerWidth - panel.offsetWidth
      const maxY = window.innerHeight - panel.offsetHeight
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      })
    }
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const [isCapturing, setIsCapturing] = useState(false)
  const [showCaptureModal, setShowCaptureModal] = useState(false)

  // Helper function to draw texture patterns directly to canvas
  // (html2canvas doesn't properly capture CSS gradient patterns)
  const drawTextureToCanvas = (ctx, width, height, textureType, textureSize, textureOpacity, blendMode) => {
    if (textureType === 'none') return
    
    // Create a temporary canvas for the texture
    const textureCanvas = document.createElement('canvas')
    textureCanvas.width = width
    textureCanvas.height = height
    const textureCtx = textureCanvas.getContext('2d')
    
    const lineWidth = Math.max(1, textureSize * 0.1)
    const dotSize = Math.max(1, textureSize * 0.15)
    
    switch (textureType) {
      case 'grain': {
        // Generate grain/noise pattern
        const imageData = textureCtx.createImageData(width, height)
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
          const value = Math.random() * 255
          data[i] = value
          data[i + 1] = value
          data[i + 2] = value
          data[i + 3] = 255
        }
        textureCtx.putImageData(imageData, 0, 0)
        break
      }
      case 'scanlines': {
        // Horizontal scanlines
        textureCtx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        for (let y = 0; y < height; y += textureSize) {
          textureCtx.fillRect(0, y + textureSize - lineWidth, width, lineWidth)
        }
        break
      }
      case 'dots': {
        // Dot pattern
        textureCtx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        for (let y = dotSize; y < height; y += textureSize) {
          for (let x = dotSize; x < width; x += textureSize) {
            textureCtx.beginPath()
            textureCtx.arc(x, y, dotSize, 0, Math.PI * 2)
            textureCtx.fill()
          }
        }
        break
      }
      case 'grid': {
        // Grid pattern - horizontal and vertical lines
        textureCtx.fillStyle = 'rgba(255, 255, 255, 0.15)'
        // Horizontal lines
        for (let y = 0; y < height; y += textureSize) {
          textureCtx.fillRect(0, y, width, lineWidth)
        }
        // Vertical lines
        for (let x = 0; x < width; x += textureSize) {
          textureCtx.fillRect(x, 0, lineWidth, height)
        }
        break
      }
      case 'diagonal': {
        // Diagonal lines at 45 degrees
        textureCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        textureCtx.lineWidth = lineWidth
        // Draw diagonal lines from bottom-left to top-right direction
        const spacing = textureSize + lineWidth
        const totalDiagonals = Math.ceil((width + height) / spacing)
        for (let i = -Math.ceil(height / spacing); i < totalDiagonals; i++) {
          const startX = i * spacing
          textureCtx.beginPath()
          textureCtx.moveTo(startX, height)
          textureCtx.lineTo(startX + height, 0)
          textureCtx.stroke()
        }
        break
      }
    }
    
    // Apply blend mode and opacity
    ctx.save()
    ctx.globalAlpha = textureOpacity
    ctx.globalCompositeOperation = blendMode
    ctx.drawImage(textureCanvas, 0, 0)
    ctx.restore()
  }

  // Helper function to draw vignette to canvas
  const drawVignetteToCanvas = (ctx, width, height, intensity) => {
    if (intensity <= 0) return
    
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) * 0.7
    )
    gradient.addColorStop(0, 'transparent')
    gradient.addColorStop(0.3, 'transparent')
    gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity})`)
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  const captureSnapshot = async (mode = 'all') => {
    if (!layersContainerRef?.current || isCapturing) return
    
    setIsCapturing(true)
    
    // Convert oklch colors to RGB for html2canvas compatibility
    const restoreColors = prepareForCapture(document.body)
    
    try {
      // Wait a frame for styles to apply after color conversion
      await new Promise(resolve => requestAnimationFrame(resolve))
      
      const container = layersContainerRef.current
      const width = container.offsetWidth
      const height = container.offsetHeight
      const scale = 2
      
      const outputCanvas = document.createElement('canvas')
      outputCanvas.width = width * scale
      outputCanvas.height = height * scale
      const ctx = outputCanvas.getContext('2d')
      
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height)
      
      const webglCanvas = container.querySelector('.gradient-layer')
      if (webglCanvas) {
        const wrapper = container.querySelector('.gradient-effects-wrapper')
        const filterStyle = wrapper ? getComputedStyle(wrapper).filter : 'none'
        ctx.filter = filterStyle !== 'none' ? filterStyle : 'none'
        ctx.drawImage(webglCanvas, 0, 0, outputCanvas.width, outputCanvas.height)
        ctx.filter = 'none'
      }
      
      // Draw texture patterns manually (html2canvas doesn't capture CSS gradients properly)
      drawTextureToCanvas(
        ctx,
        outputCanvas.width,
        outputCanvas.height,
        effectsConfig.texture,
        effectsConfig.textureSize * scale,
        effectsConfig.textureOpacity,
        effectsConfig.textureBlendMode
      )
      
      // Draw noise canvas if enabled
      if (effectsConfig.noiseEnabled && effectsConfig.noise > 0) {
        const noiseCanvas = container.querySelector('.effects-layer canvas')
        if (noiseCanvas) {
          ctx.save()
          ctx.globalAlpha = effectsConfig.noise
          ctx.globalCompositeOperation = 'overlay'
          // Draw the noise canvas tiled/scaled to cover the output
          ctx.drawImage(noiseCanvas, 0, 0, outputCanvas.width, outputCanvas.height)
          ctx.restore()
        }
      }
      
      // Draw vignette manually
      drawVignetteToCanvas(ctx, outputCanvas.width, outputCanvas.height, effectsConfig.vignetteIntensity)
      
      if (mode === 'all') {
        const tessellationLayer = container.querySelector('.tessellation-layer')
        if (tessellationLayer) {
          const tessCanvas = await html2canvas(tessellationLayer, {
            useCORS: true,
            allowTaint: true,
            scale: scale,
            backgroundColor: null,
            logging: false,
          })
          ctx.drawImage(tessCanvas, 0, 0, outputCanvas.width, outputCanvas.height)
        }
        
        const textLayer = container.querySelector('.text-layer')
        if (textLayer) {
          const textCanvas = await html2canvas(textLayer, {
            useCORS: true,
            allowTaint: true,
            scale: scale,
            backgroundColor: null,
            logging: false,
          })
          ctx.drawImage(textCanvas, 0, 0, outputCanvas.width, outputCanvas.height)
        }
      }
      
      const filename = mode === 'background' 
        ? `background-${Date.now()}.png` 
        : `header-capture-${Date.now()}.png`
      
      outputCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = filename
          link.href = url
          link.click()
          URL.revokeObjectURL(url)
        }
        // Restore colors after capture is complete
        restoreColors()
        setShowCaptureModal(false)
        setIsCapturing(false)
      }, 'image/png')
    } catch (error) {
      console.error('Failed to capture snapshot:', error)
      // Always restore colors even on error
      restoreColors()
      setShowCaptureModal(false)
      setIsCapturing(false)
    }
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const tabs = [
    { id: 'gradient', label: 'Gradient', icon: Palette },
    { id: 'tessellation', label: 'Pattern', icon: GridFour },
    { id: 'effects', label: 'Effects', icon: Sparkle },
    { id: 'text', label: 'Text', icon: TextT },
  ]

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

  const addTextSection = () => {
    const newId = Math.max(...textSections.map(s => s.id), 0) + 1
    setTextSections([
      ...textSections,
      { id: newId, text: 'NEW TEXT', size: 60, weight: 400, spacing: 0.1 }
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


  const getDialogTitle = (key) => {
    const titles = {
      'gradient-colors': 'Colors',
      'gradient-type': 'Gradient Type',
      'gradient-stops': 'Position Stops',
      'gradient-wave': 'Wave Settings',
      'gradient-mouse': 'Mouse Influence',
      'aurora-background': 'Background Color',
      'aurora-hue': 'Hue Range',
      'aurora-lines': 'Line Settings',
      'aurora-animation': 'Animation',
      'blob-colors': 'Blob Colors',
      'blob-size': 'Blob Size & Count',
      'blob-animation': 'Blob Animation',
      'blob-effect': 'Gooey Effect',
      'pattern-icon': 'Icon Settings',
      'pattern-spacing': 'Spacing',
      'pattern-mouse': 'Mouse Influence',
      'effects-blur': 'Background Blur',
      'effects-noise': 'Noise',
      'effects-texture': 'Texture',
      'effects-colormap': 'Color Map',
      'effects-vignette': 'Vignette',
      'effects-color': 'Color Correction',
    }
    return titles[key] || 'Settings'
  }

  // Render Liquid controls
  const renderLiquidControls = () => (
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

  // Render Aurora controls
  const renderAuroraControls = () => (
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

  // Render Blob controls
  const renderBlobControls = () => (
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

  // Render Gradient Panel Content
  const renderGradientPanel = () => (
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
          </SelectContent>
        </Select>
      </ControlGroup>

      <div className="h-px bg-border my-3" />

      {/* Conditional controls based on background type */}
      {backgroundType === 'liquid' && renderLiquidControls()}
      {backgroundType === 'aurora' && renderAuroraControls()}
      {backgroundType === 'blob' && renderBlobControls()}
    </div>
  )

  // Render Tessellation/Pattern Panel Content
  const renderPatternPanel = () => (
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

  // Render Effects Panel Content
  const renderEffectsPanel = () => (
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

  // Render Text Panel Content
  const renderTextPanel = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wide font-semibold">Text</Label>
      </div>

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
          gradientColors={gradientConfig.colors}
          className="w-10 h-10"
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

      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wide font-semibold">Text Sections</Label>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addTextSection}>
          <Plus size={14} />
        </Button>
      </div>

      <ControlGroup label={`Section Gap:`}>
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

                <ControlGroup label={`Size (in px)`}>
                  <NumberInput
                    value={[section.size]}
                    onValueChange={([val]) => updateTextSection(section.id, 'size', val)}
                    min={12}
                    max={200}
                    step={4}
                    showButtons={true}
                  />
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

                <ControlGroup label={`Spacing (in em)`}>
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
    </div>
  )

  // Render dialog content
  const renderDialogContent = () => {
    switch (activeDialog) {
      case 'gradient-colors':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Gradient Colors</Label>
            </div>
            <div className="flex flex-row gap-1 w-[calc(100vw-2rem)] overflow-x-auto">
            {gradientConfig.colors.map((color, index) => (
              <div key={index} className="flex flex-col max-w-full items-center gap-2">
                <PaletteColorPicker
                  value={color}
                  onChange={(newColor) => updateGradientColor(index, newColor)}
                  palette={parsedPalette}
                  className="w-full h-10"
                />
                <div className="flex flex-row gap-1 w-full items-center">
                  <Input
                    type="number"
                    min="0"
                    max="200"
                    value={gradientConfig.colorStops[index] || 0}
                    onChange={(e) => updateColorStop(index, e.target.value)}
                    className="w-full min-w-12 h-9"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeGradientColor(index)}
                  disabled={gradientConfig.colors.length <= 2}
                >
                  <Trash size={14} />
                </Button>
              </div>
            ))}
            
            </div>
            {gradientConfig.colors.length < 8 && (
              <Button variant="outline" className="w-full" onClick={addGradientColor}>
                <Plus size={14} className="mr-2" /> Add Color
              </Button>
            )}
          </div>
        )
      case 'gradient-type':
        return (
          <ControlGroup label="Gradient Type">
            <Select
              value={gradientConfig.type}
              onValueChange={(value) => setGradientConfig({ ...gradientConfig, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="radial">Radial</SelectItem>
                <SelectItem value="conic">Conic</SelectItem>
              </SelectContent>
            </Select>
          </ControlGroup>
        )
      case 'gradient-stops':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Start X: `}>
              <NumberInput value={[gradientConfig.startPos.x]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, startPos: { ...gradientConfig.startPos, x: val } })} max={100} step={5} showButtons />
            </ControlGroup>
            <ControlGroup label={`Start Y: `}>
              <NumberInput value={[gradientConfig.startPos.y]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, startPos: { ...gradientConfig.startPos, y: val } })} max={100} step={5} showButtons />
            </ControlGroup>
            <ControlGroup label={`End X: `}>
              <NumberInput value={[gradientConfig.endPos.x]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, endPos: { ...gradientConfig.endPos, x: val } })} max={100} step={5} showButtons />
            </ControlGroup>
            <ControlGroup label={`End Y: `}>
              <NumberInput value={[gradientConfig.endPos.y]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, endPos: { ...gradientConfig.endPos, y: val } })} max={100} step={5} showButtons />
            </ControlGroup>
          </div>
        )
      case 'gradient-wave':
        return (
          <div className="space-y-2 ">
            <ControlGroup label={`Wave Intensity`}>
              <NumberInput value={[gradientConfig.waveIntensity]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, waveIntensity: val })} max={1} step={0.05} showButtons />
            </ControlGroup>
            <ControlGroup label={`Wave 1 Speed`}>
              <NumberInput value={[gradientConfig.wave1Speed]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, wave1Speed: val })} max={0.5} step={0.05} showButtons />
            </ControlGroup>
            <ControlGroup label="Wave 1 Direction">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setGradientConfig({ ...gradientConfig, wave1Direction: gradientConfig.wave1Direction === 1 ? -1 : 1 })}>
                {gradientConfig.wave1Direction === 1 ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              </Button>
            </ControlGroup>
            <ControlGroup label={`Wave 2 Speed`}>
              <NumberInput value={[gradientConfig.wave2Speed]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, wave2Speed: val })} max={0.5} step={0.05} showButtons />
            </ControlGroup>
            <ControlGroup label="Wave 2 Direction">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setGradientConfig({ ...gradientConfig, wave2Direction: gradientConfig.wave2Direction === 1 ? -1 : 1 })}>
                {gradientConfig.wave2Direction === 1 ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              </Button>
            </ControlGroup>
          </div>
        )
      case 'gradient-mouse':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Mouse Influence`}>
              <NumberInput value={[gradientConfig.mouseInfluence]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, mouseInfluence: val })} max={1} step={0.05} showButtons />
            </ControlGroup>
            <ControlGroup label={`Decay Speed`}>
              <NumberInput value={[gradientConfig.decaySpeed]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, decaySpeed: val })} min={0.8} max={0.99} step={0.01} showButtons />
            </ControlGroup>
          </div>
        )
      case 'pattern-icon':
        return (
          <div className="space-y-2">
            <ControlGroup label="Icon">
              <Select value={tessellationConfig.icon} onValueChange={(v) => setTessellationConfig({ ...tessellationConfig, icon: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{AVAILABLE_ICONS.map(icon => <SelectItem key={icon} value={icon}>{icon}</SelectItem>)}</SelectContent>
              </Select>
            </ControlGroup>
            <ControlGroup label={`Size`}>
              <NumberInput value={[tessellationConfig.size]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, size: val })} min={8} max={100} step={4} showButtons />
            </ControlGroup>
            <ControlGroup label="Color">
              <PaletteColorPicker value={tessellationConfig.color} onChange={(newColor) => setTessellationConfig({ ...tessellationConfig, color: newColor })} palette={parsedPalette} className="w-10 h-10" />
            </ControlGroup>
            <ControlGroup label={`Opacity`}>
              <NumberInput value={[tessellationConfig.opacity]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, opacity: val })} max={1} step={0.05} showButtons />
            </ControlGroup>
            <ControlGroup label={`Rotation`}>
              <NumberInput value={[tessellationConfig.rotation]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, rotation: val })} max={360} step={15} showButtons />
            </ControlGroup>
          </div>
        )
      case 'pattern-spacing':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Row Gap`}>
              <NumberInput value={[tessellationConfig.rowGap]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, rowGap: val })} min={20} max={200} step={10} showButtons />
            </ControlGroup>
            <ControlGroup label={`Col Gap`}>
              <NumberInput value={[tessellationConfig.colGap]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, colGap: val })} min={20} max={200} step={10} showButtons />
            </ControlGroup>
          </div>
        )
      case 'pattern-mouse':
        return (
          <ControlGroup label={`Mouse Rotation`}>
            <NumberInput value={[tessellationConfig.mouseRotationInfluence || 0]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, mouseRotationInfluence: val })} max={1} step={0.05} showButtons />
          </ControlGroup>
        )
      case 'effects-blur':
        return (
            <ControlGroup label={`Blur`}>
            <NumberInput value={[effectsConfig.blur]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, blur: val })} max={30} step={2} showButtons />
          </ControlGroup>
        )
      case 'effects-noise':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Enable Noise</Label>
              <Switch checked={effectsConfig.noiseEnabled} onCheckedChange={(c) => setEffectsConfig({ ...effectsConfig, noiseEnabled: c })} />
            </div>
            {effectsConfig.noiseEnabled && (
              <>
                <ControlGroup label={`Amount`}>
                  <NumberInput value={[effectsConfig.noise]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, noise: val })} max={0.5} step={0.05} showButtons />
                </ControlGroup>
                <ControlGroup label={`Scale`}>
                  <NumberInput value={[effectsConfig.noiseScale]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, noiseScale: val })} min={0.5} max={3} step={0.25} showButtons />
                </ControlGroup>
              </>
            )}
          </div>
        )
      case 'effects-texture':
        return (
          <div className="space-y-2">
            <ControlGroup label="Texture Type">
              <Select value={effectsConfig.texture} onValueChange={(v) => setEffectsConfig({ ...effectsConfig, texture: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <NumberInput value={[effectsConfig.textureSize]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, textureSize: val })} min={4} max={100} step={4} showButtons />
                </ControlGroup>
                <ControlGroup label={`Opacity`}>
                  <NumberInput value={[effectsConfig.textureOpacity]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, textureOpacity: val })} max={1} step={0.05} showButtons />
                </ControlGroup>
              </>
            )}
          </div>
        )
      case 'effects-colormap':
        return (
          <ControlGroup label="Color Map:">
            <Select value={effectsConfig.colorMap} onValueChange={(v) => setEffectsConfig({ ...effectsConfig, colorMap: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
        )
      case 'effects-vignette':
        return (
          <ControlGroup label={`Intensity`}>
            <NumberInput value={[effectsConfig.vignetteIntensity]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, vignetteIntensity: val })} max={0.8} step={0.05} showButtons />
          </ControlGroup>
        )
      case 'effects-color':
        return (
            <div className="space-y-2">
            <ControlGroup label={`Saturation`}>
              <NumberInput value={[effectsConfig.saturation]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, saturation: val })} max={200} step={10} showButtons />
            </ControlGroup>
              <ControlGroup label={`Contrast`}>
              <NumberInput value={[effectsConfig.contrast]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, contrast: val })} min={50} max={150} step={5} showButtons />
            </ControlGroup>
            <ControlGroup label={`Brightness`}>
              <NumberInput value={[effectsConfig.brightness]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, brightness: val })} min={50} max={150} step={5} showButtons />
            </ControlGroup>
          </div>
        )
      case 'aurora-background':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Use Gradient Colors</Label>
              <Switch 
                checked={auroraConfig.useGradientColors} 
                onCheckedChange={(c) => setAuroraConfig({ ...auroraConfig, useGradientColors: c })} 
              />
            </div>
            {auroraConfig.useGradientColors ? (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <Label className="text-xs text-muted-foreground mb-2 block">Colors from Gradient</Label>
                <div className="flex gap-1 flex-wrap">
                  {gradientConfig.colors.map((color, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-md border border-border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <ControlGroup label="Background Color">
                <div className="flex items-center gap-2">
                  <PaletteColorPicker
                    value={auroraConfig.backgroundColor}
                    onChange={(newColor) => setAuroraConfig({ ...auroraConfig, backgroundColor: newColor })}
                    palette={parsedPalette}
                    className="w-10 h-10"
                  />
                  <Input 
                    value={auroraConfig.backgroundColor}
                    onChange={(e) => setAuroraConfig({ ...auroraConfig, backgroundColor: e.target.value })}
                    className="h-9 font-mono text-xs flex-1"
                  />
                </div>
              </ControlGroup>
            )}
          </div>
        )
      case 'aurora-hue':
        return (
          <div className="space-y-2">
            {auroraConfig.useGradientColors ? (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <Label className="text-xs text-muted-foreground mb-2 block">Using hues from Gradient Colors</Label>
                <div className="flex gap-1 flex-wrap">
                  {gradientConfig.colors.map((color, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-md border border-border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Disable "Use Gradient Colors" to set custom hue range.</p>
              </div>
            ) : (
              <>
                <ControlGroup label={`Hue Start`}>
                  <NumberInput value={[auroraConfig.hueStart]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, hueStart: val })} max={360} step={10} showButtons />
                </ControlGroup>
                <ControlGroup label={`Hue End`}>
                  <NumberInput value={[auroraConfig.hueEnd]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, hueEnd: val })} max={360} step={10} showButtons />
                </ControlGroup>
                <div 
                  className="h-6 rounded-md border border-border mt-2"
                  style={{
                    background: `linear-gradient(to right, hsl(${auroraConfig.hueStart}, 100%, 65%), hsl(${auroraConfig.hueEnd}, 100%, 65%))`
                  }}
                />
              </>
            )}
          </div>
        )
      case 'aurora-lines':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Min Width`}>
              <NumberInput value={[auroraConfig.minWidth]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, minWidth: val })} min={1} max={100} step={5} showButtons />
            </ControlGroup>
            <ControlGroup label={`Max Width`}>
              <NumberInput value={[auroraConfig.maxWidth]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, maxWidth: val })} min={1} max={100} step={5} showButtons />
            </ControlGroup>
            <ControlGroup label={`Min Height`}>
              <NumberInput value={[auroraConfig.minHeight]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, minHeight: val })} min={50} max={1000} step={50} showButtons />
            </ControlGroup>
            <ControlGroup label={`Max Height`}>
              <NumberInput value={[auroraConfig.maxHeight]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, maxHeight: val })} min={50} max={1000} step={50} showButtons />
            </ControlGroup>
            <ControlGroup label={`Line Count (0 = auto)`}>
              <NumberInput value={[auroraConfig.lineCount]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, lineCount: val })} min={0} max={500} step={10} showButtons />
            </ControlGroup>
          </div>
        )
      case 'aurora-animation':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Min TTL`}>
              <NumberInput value={[auroraConfig.minTTL]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, minTTL: val })} min={10} max={500} step={10} showButtons />
            </ControlGroup>
            <ControlGroup label={`Max TTL`}>
              <NumberInput value={[auroraConfig.maxTTL]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, maxTTL: val })} min={10} max={500} step={10} showButtons />
            </ControlGroup>
            <ControlGroup label={`Blur Amount`}>
              <NumberInput value={[auroraConfig.blurAmount]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, blurAmount: val })} min={0} max={50} step={1} showButtons />
            </ControlGroup>
          </div>
        )
      case 'blob-colors':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Use Gradient Colors</Label>
              <Switch
                checked={blobConfig.useGradientColors}
                onCheckedChange={(checked) => setBlobConfig({ ...blobConfig, useGradientColors: checked })}
              />
            </div>
            {blobConfig.useGradientColors ? (
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
              <ControlGroup label="Background">
                <div className="flex items-center gap-2">
                  <PaletteColorPicker
                    value={blobConfig.backgroundColor}
                    onChange={(newColor) => setBlobConfig({ ...blobConfig, backgroundColor: newColor })}
                    palette={parsedPalette}
                    className="w-10 h-9"
                  />
                  <Input 
                    value={blobConfig.backgroundColor}
                    onChange={(e) => setBlobConfig({ ...blobConfig, backgroundColor: e.target.value })}
                    className="h-9 font-mono text-xs flex-1"
                  />
                </div>
              </ControlGroup>
            )}
          </div>
        )
      case 'blob-size':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Blob Count`}>
              <NumberInput value={[blobConfig.blobCount]} onValueChange={([val]) => setBlobConfig({ ...blobConfig, blobCount: val })} min={2} max={20} step={1} showButtons />
            </ControlGroup>
            <ControlGroup label={`Min Radius`}>
              <NumberInput value={[blobConfig.minRadius]} onValueChange={([val]) => setBlobConfig({ ...blobConfig, minRadius: val })} min={10} max={200} step={10} showButtons />
            </ControlGroup>
            <ControlGroup label={`Max Radius`}>
              <NumberInput value={[blobConfig.maxRadius]} onValueChange={([val]) => setBlobConfig({ ...blobConfig, maxRadius: val })} min={10} max={300} step={10} showButtons />
            </ControlGroup>
            <ControlGroup label={`Orbit Radius`}>
              <NumberInput value={[blobConfig.orbitRadius]} onValueChange={([val]) => setBlobConfig({ ...blobConfig, orbitRadius: val })} min={50} max={500} step={25} showButtons />
            </ControlGroup>
          </div>
        )
      case 'blob-animation':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Speed`}>
              <NumberInput value={[blobConfig.speed]} onValueChange={([val]) => setBlobConfig({ ...blobConfig, speed: val })} min={0.1} max={2} step={0.1} showButtons />
            </ControlGroup>
            <ControlGroup label={`Mouse Influence`}>
              <NumberInput value={[blobConfig.mouseInfluence]} onValueChange={([val]) => setBlobConfig({ ...blobConfig, mouseInfluence: val })} min={0} max={1} step={0.1} showButtons />
            </ControlGroup>
          </div>
        )
      case 'blob-effect':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Blur Amount`}>
              <NumberInput value={[blobConfig.blurAmount]} onValueChange={([val]) => setBlobConfig({ ...blobConfig, blurAmount: val })} min={5} max={50} step={1} showButtons />
            </ControlGroup>
            <ControlGroup label={`Gooey Threshold`}>
              <NumberInput value={[blobConfig.threshold]} onValueChange={([val]) => setBlobConfig({ ...blobConfig, threshold: val })} min={100} max={250} step={10} showButtons />
            </ControlGroup>
          </div>
        )
      default:
        return null
    }
  }

  // Mobile Panel
  if (isMobile) {
    return (
      <>
      <div 
        ref={panelRef}
          className={cn(
            "fixed left-0 right-0 bottom-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border",
            "transition-transform duration-300 ease-out"
          )}
      >
          {/* Mobile tabs */}
          <div className="flex items-center gap-1 p-1 border-b border-border/50 pb-env-safe(4px)">
          {tabs.map(tab => (
              <Button
              key={tab.id}
                variant={activePanel === tab.id && !isMobileCollapsed ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 flex flex-col gap-1 h-auto p-1"
              onClick={() => {
                if (activePanel === tab.id && !isMobileCollapsed) {
                  setIsMobileCollapsed(true)
                } else {
                  setActivePanel(tab.id)
                  setIsMobileCollapsed(false)
                }
              }}
            >
                <tab.icon size={18} weight={activePanel === tab.id && !isMobileCollapsed ? 'fill' : 'regular'} />
                <span className="text-[10px] uppercase tracking-wide">{tab.label}</span>
              </Button>
          ))}
            <div className="w-px h-8 bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col gap-1 h-auto p-1"
              onClick={() => setShowPaletteDialog(true)}
              title={colorPalette ? "Edit Palette" : "Upload Palette"}
            >
              <Upload size={18} weight={colorPalette ? 'fill' : 'regular'} />
              <span className="text-[10px] uppercase tracking-wide">Palette</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col gap-1 h-auto p-1"
              onClick={randomizeGradient}
              title="Shuffle Gradient"
            >
              <Shuffle size={18} />
              <span className="text-[10px] uppercase tracking-wide">Shuffle</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col gap-1 h-auto p-1"
            onClick={() => setShowCaptureModal(true)}
          >
              <Camera size={18} />
              <span className="text-[10px] uppercase tracking-wide">Capture</span>
            </Button>
            
        </div>

          {/* Mobile content */}
        {!isMobileCollapsed && (
            <ScrollArea className="max-h-[50vh] p-1 gap-2">
            {activePanel === 'gradient' && (
              <div className="space-y-2">
                {/* Background Type Selector */}
                <div className="flex items-center justify-between px-3 py-2">
                  <Label className="text-sm">Background</Label>
                  <Select
                    value={backgroundType}
                    onValueChange={(value) => setBackgroundType(value)}
                  >
                    <SelectTrigger className="w-[120px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="liquid">Liquid</SelectItem>
                      <SelectItem value="aurora">Aurora</SelectItem>
                      <SelectItem value="blob">Blob</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Subsection buttons based on background type */}
                <div className="space-y-1 flex flex-row flex-wrap gap-1 px-1">
                  {backgroundType === 'liquid' && (
                    <>
                      <SubsectionButton title="Colors" onClick={() => openDialog('gradient-colors')} />
                      <SubsectionButton title="Type" onClick={() => openDialog('gradient-type')} />
                      <SubsectionButton title="Stops" onClick={() => openDialog('gradient-stops')} />
                      <SubsectionButton title="Wave" onClick={() => openDialog('gradient-wave')} />
                      <SubsectionButton title="Mouse" onClick={() => openDialog('gradient-mouse')} />
                    </>
                  )}
                  {backgroundType === 'aurora' && (
                    <>
                      <SubsectionButton title="Background" onClick={() => openDialog('aurora-background')} />
                      <SubsectionButton title="Hue" onClick={() => openDialog('aurora-hue')} />
                      <SubsectionButton title="Lines" onClick={() => openDialog('aurora-lines')} />
                      <SubsectionButton title="Animation" onClick={() => openDialog('aurora-animation')} />
                    </>
                  )}
                  {backgroundType === 'blob' && (
                    <>
                      <SubsectionButton title="Colors" onClick={() => openDialog('blob-colors')} />
                      <SubsectionButton title="Size" onClick={() => openDialog('blob-size')} />
                      <SubsectionButton title="Animation" onClick={() => openDialog('blob-animation')} />
                      <SubsectionButton title="Effect" onClick={() => openDialog('blob-effect')} />
                    </>
                  )}
                </div>
              </div>
            )}
            {activePanel === 'tessellation' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-2">
                    <Label>Enable Pattern</Label>
                    <Switch
                      checked={tessellationConfig.enabled}
                      onCheckedChange={(c) => setTessellationConfig({ ...tessellationConfig, enabled: c })}
                    />
                </div>
                <div className="space-y-1 flex flex-row gap-1">
                  <SubsectionButton title="Icon" onClick={() => openDialog('pattern-icon')} />
                  <SubsectionButton title="Spacing (in em)" onClick={() => openDialog('pattern-spacing')} />
                  <SubsectionButton title="Mouse Influence" onClick={() => openDialog('pattern-mouse')} />
                </div>
              </div>
            )}
            {activePanel === 'effects' && (
                <div className="space-y-1 flex flex-row flex-wrap gap-1">
                <SubsectionButton title="Background Blur" onClick={() => openDialog('effects-blur')} />
                <SubsectionButton title="Noise" onClick={() => openDialog('effects-noise')} />
                <SubsectionButton title="Texture" onClick={() => openDialog('effects-texture')} />
                <SubsectionButton title="Color Map" onClick={() => openDialog('effects-colormap')} />
                <SubsectionButton title="Vignette" onClick={() => openDialog('effects-vignette')} />
                <SubsectionButton title="Color Correction" onClick={() => openDialog('effects-color')} />
              </div>
            )}
              {activePanel === 'text' && renderTextPanel()}
            </ScrollArea>
            )}
          </div>

        {/* Mobile Dialog */}
        <Dialog open={!!activeDialog} onOpenChange={(open) => !open && backDialog()}>
          <DialogContent className="max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{getDialogTitle(activeDialog)}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] py-4">
                {renderDialogContent()}
            </ScrollArea>
            <DialogFooter className="flex-row gap-2">
              <Button variant="outline" className="flex-1" onClick={resetDialog}>
                <ArrowCounterClockwise size={16} className="mr-2" />
                Reset
              </Button>
              <Button className="flex-1" onClick={applyDialog}>
                <Check size={16} className="mr-2" />
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Capture Modal */}
        <Dialog open={showCaptureModal} onOpenChange={setShowCaptureModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isCapturing ? 'Exporting...' : 'Export Image'}</DialogTitle>
            </DialogHeader>
                {isCapturing ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <CircleNotch size={48} weight="bold" className="animate-spin text-primary" />
                <span className="text-muted-foreground">Preparing your image...</span>
                  </div>
                ) : (
              <div className="space-y-3 py-4">
                <Button 
                  variant="outline" 
                  className="w-full h-auto p-4 justify-start gap-4"
                      onClick={() => captureSnapshot('background')}
                    >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Image size={24} weight="duotone" className="text-primary" />
                      </div>
                  <div className="text-left">
                    <div className="font-medium">Background Only</div>
                    <div className="text-sm text-muted-foreground">Gradient + Effects (no pattern/text)</div>
                      </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-auto p-4 justify-start gap-4"
                      onClick={() => captureSnapshot('all')}
                    >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Stack size={24} weight="duotone" className="text-primary" />
                      </div>
                  <div className="text-left">
                    <div className="font-medium">Everything</div>
                    <div className="text-sm text-muted-foreground">All layers including pattern & text</div>
                      </div>
                </Button>
          </div>
        )}
          </DialogContent>
        </Dialog>

        {/* Palette Upload Dialog */}
        <Dialog open={showPaletteDialog} onOpenChange={(open) => {
          setShowPaletteDialog(open)
          if (!open) {
            setPaletteError('')
          }
        }}>
          <DialogContent className="max-w-lg max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center gap-2">
                  <Palette size={20} weight="duotone" />
                  Upload Color Palette
                </div>
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-2 pr-4">
                {/* File Upload Option */}
                <div className="space-y-2">
                  <Label>Upload a JSON file</Label>
                  <p className="text-xs text-muted-foreground">
                    <a className="text-blue-500 hover:underline" href="https://colors.promad.design/" target="_blank" rel="noopener noreferrer">
                      Use to generate compatible color JSON.
                    </a>
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            const content = event.target?.result
                            if (typeof content === 'string') {
                              setPaletteJson(content)
                              setPaletteError('')
                            }
                          }
                          reader.onerror = () => {
                            setPaletteError('Failed to read file')
                          }
                          reader.readAsText(file)
                        }
                        // Reset the input so the same file can be selected again
                        e.target.value = ''
                      }}
                      className="hidden"
                      id="palette-file-input-mobile"
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => document.getElementById('palette-file-input-mobile')?.click()}
                    >
                      <Upload size={16} className="mr-2" />
                      Choose .json file
                    </Button>
                  </div>
                </div>
                
                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground uppercase">or paste JSON</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                
                {/* Paste JSON Option */}
                <div className="space-y-2">
                  <Label>Paste your JSON color palette</Label>
                  <textarea
                    value={paletteJson}
                    onChange={(e) => {
                      setPaletteJson(e.target.value)
                      setPaletteError('')
                    }}
                    placeholder={`{
  "blue": {
    "500": "#3b82f6",
    "600": "#2563eb"
  },
  "green": {
    "500": "#22c55e"
  }
}`}
                    className="w-full h-36 p-3 text-sm font-mono bg-muted border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {paletteError && (
                    <p className="text-sm text-destructive">{paletteError}</p>
                  )}
                </div>
                
                {colorPalette && (
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Current Palette</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={handleClearPalette}
                      >
                        <Trash size={12} className="mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {parsedPalette?.colors.slice(0, 30).map((color, idx) => (
                        <div
                          key={idx}
                          className="w-5 h-5 rounded border border-border/50"
                          style={{ backgroundColor: color.hex }}
                          title={color.shade ? `${color.name}-${color.shade}` : color.name}
                        />
                      ))}
                      {parsedPalette?.colors.length > 30 && (
                        <span className="text-xs text-muted-foreground self-center ml-1">
                          +{parsedPalette.colors.length - 30} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="flex-row gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowPaletteDialog(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handlePaletteUpload}>
                <Upload size={16} className="mr-2" />
                {colorPalette ? 'Update Palette' : 'Upload Palette'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Desktop Panel
  return (
    <>
    <div 
      ref={panelRef}
        className={cn(
          "fixed z-50 bg-card/95 backdrop-blur-xl border border-border rounded-2xl w-[340px] max-h-[85vh]",
          "shadow-2xl shadow-black/50 transition-shadow duration-200",
          "font-[Geist,system-ui,sans-serif] text-foreground",
          isDragging && "shadow-3xl shadow-black/60",
          isCollapsed && "w-auto max-h-none overflow-hidden",
          !isCollapsed && "flex flex-col overflow-hidden"
        )}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        {/* Header */}
      <div 
          className="flex items-center justify-between p-2 border-b border-border select-none"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
          <div className="text-muted-foreground">
          <DotsSixVertical size={16} weight="bold" />
        </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowPaletteDialog(true)}
              title={colorPalette ? "Edit Palette" : "Upload Palette"}
            >
              <Upload size={16} weight={colorPalette ? 'fill' : 'regular'} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={randomizeGradient}
              disabled={isCapturing}
              title="Shuffle Gradient"
            >
              <Shuffle size={16} weight="regular" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            onClick={() => setShowCaptureModal(true)}
            disabled={isCapturing}
          >
              <Camera size={16} weight={isCapturing ? 'fill' : 'regular'} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
              <Sliders size={16} />
              {isCollapsed ? <CaretUp size={12} /> : <CaretDown size={12} />}
            </Button>
        </div>
      </div>

      {!isCollapsed && (
          <Tabs value={activePanel} onValueChange={setActivePanel} className="flex flex-col flex-1 min-h-0">
            <TabsList className="w-full rounded-none border-b border-border bg-transparent p-1 gap-1 shrink-0">
            {tabs.map(tab => (
                <TabsTrigger
                key={tab.id}
                  value={tab.id}
                  className="flex-1 flex flex-col gap-1 py-2 data-[state=active]:bg-muted rounded-md"
              >
                  <tab.icon size={14} weight={activePanel === tab.id ? 'fill' : 'regular'} />
                  <span className="text-[10px] uppercase tracking-wide">{tab.label}</span>
                </TabsTrigger>
            ))}
            </TabsList>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 min-h-0 p-5">
                <TabsContent value="gradient" className="m-0">
                  {renderGradientPanel()}
                </TabsContent>
                <TabsContent value="tessellation" className="m-0">
                  {renderPatternPanel()}
                </TabsContent>
                <TabsContent value="effects" className="m-0">
                  {renderEffectsPanel()}
                </TabsContent>
                <TabsContent value="text" className="m-0">
                  {renderTextPanel()}
                </TabsContent>
              </ScrollArea>
            </div>
          </Tabs>
                  )}
                </div>

      {/* Capture Modal */}
      <Dialog open={showCaptureModal} onOpenChange={setShowCaptureModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isCapturing ? 'Exporting...' : 'Export Image'}</DialogTitle>
          </DialogHeader>
              {isCapturing ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <CircleNotch size={48} weight="bold" className="animate-spin text-primary" />
              <span className="text-muted-foreground">Preparing your image...</span>
                </div>
              ) : (
            <div className="space-y-3 py-4">
              <Button 
                variant="outline" 
                className="w-full h-auto p-4 justify-start gap-4"
                    onClick={() => captureSnapshot('background')}
                  >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Image size={24} weight="duotone" className="text-primary" />
                    </div>
                <div className="text-left">
                  <div className="font-medium">Background Only</div>
                  <div className="text-sm text-muted-foreground">Gradient + Effects (no pattern/text)</div>
                    </div>
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-auto p-4 justify-start gap-4"
                    onClick={() => captureSnapshot('all')}
                  >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Stack size={24} weight="duotone" className="text-primary" />
                    </div>
                <div className="text-left">
                  <div className="font-medium">Everything</div>
                  <div className="text-sm text-muted-foreground">All layers including pattern & text</div>
                    </div>
              </Button>
        </div>
      )}
        </DialogContent>
      </Dialog>

      {/* Palette Upload Dialog */}
      <Dialog open={showPaletteDialog} onOpenChange={(open) => {
        setShowPaletteDialog(open)
        if (!open) {
          setPaletteError('')
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <Palette size={20} weight="duotone" />
                Upload Color Palette
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {/* File Upload Option */}
            <div className="space-y-2">
              <Label>Upload a JSON file</Label>
              <p className="text-xs text-muted-foreground">
                <a className="text-blue-500 hover:underline" href="https://colors.promad.design/" target="_blank" rel="noopener noreferrer">
                  Use to generate compatible color JSON.
                </a>
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        const content = event.target?.result
                        if (typeof content === 'string') {
                          setPaletteJson(content)
                          setPaletteError('')
                        }
                      }
                      reader.onerror = () => {
                        setPaletteError('Failed to read file')
                      }
                      reader.readAsText(file)
                    }
                    // Reset the input so the same file can be selected again
                    e.target.value = ''
                  }}
                  className="hidden"
                  id="palette-file-input"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('palette-file-input')?.click()}
                >
                  <Upload size={16} className="mr-2" />
                  Choose .json file
                </Button>
              </div>
            </div>
            
            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase">or paste JSON</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            
            {/* Paste JSON Option */}
            <div className="space-y-2">
              <Label>Paste your JSON color palette</Label>
              <textarea
                value={paletteJson}
                onChange={(e) => {
                  setPaletteJson(e.target.value)
                  setPaletteError('')
                }}
                placeholder={`{
                  "blue": {
                    "500": "#3b82f6",
                    "600": "#2563eb"
                  },
                  "green": {
                    "500": "#22c55e"
                  }
                }`}
                className="w-full h-36 p-3 text-sm font-mono bg-muted border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {paletteError && (
                <p className="text-sm text-destructive">{paletteError}</p>
              )}
            </div>
            
            {colorPalette && (
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Current Palette</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={handleClearPalette}
                  >
                    <Trash size={12} className="mr-1" />
                    Remove
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {parsedPalette?.colors.slice(0, 30).map((color, idx) => (
                    <div
                      key={idx}
                      className="w-5 h-5 rounded border border-border/50"
                      style={{ backgroundColor: color.hex }}
                      title={color.shade ? `${color.name}-${color.shade}` : color.name}
                    />
                  ))}
                  {parsedPalette?.colors.length > 30 && (
                    <span className="text-xs text-muted-foreground self-center ml-1">
                      +{parsedPalette.colors.length - 30} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowPaletteDialog(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handlePaletteUpload}>
              <Upload size={16} className="mr-2" />
              {colorPalette ? 'Update Palette' : 'Upload Palette'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ControlPanel
