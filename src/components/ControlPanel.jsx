import { useState, useRef, useEffect, useCallback } from 'react'
import html2canvas from 'html2canvas'
import { AVAILABLE_ICONS } from './TessellationLayer'
import { 
  Sliders, Palette, GridFour, Sparkle, TextT, 
  Shuffle, Plus, Trash, CaretDown, CaretUp, CaretRight, DotsSixVertical, Camera,
  X, Image, Stack, CircleNotch, ArrowLeft, ArrowRight, Check, ArrowCounterClockwise, Upload, CaretCircleUp, CaretCircleDown
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { prepareForCapture, validatePaletteJson, parsePaletteJson } from '@/lib/colorConversion'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

// Import control panel components
import {
  ControlGroup,
  NumberInput,
  SubsectionButton,
  PaletteColorPicker,
  ContrastAwarePaletteColorPicker,
  GradientPanel,
  PatternPanel,
  EffectsPanel,
  TextPanel,
} from './controls'

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
  fluidConfig,
  setFluidConfig,
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
    if (dialogKey.startsWith('gradient-') || dialogKey.startsWith('aurora-') || dialogKey.startsWith('blob-') || dialogKey.startsWith('fluid-')) {
      setOriginalValues({ type: 'gradient', data: { gradientConfig: { ...gradientConfig }, auroraConfig: { ...auroraConfig }, blobConfig: { ...blobConfig }, fluidConfig: { ...fluidConfig } } })
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
        setGradientConfig(originalValues.data.gradientConfig)
        setAuroraConfig(originalValues.data.auroraConfig)
        setBlobConfig(originalValues.data.blobConfig)
        setFluidConfig(originalValues.data.fluidConfig)
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
        setGradientConfig(originalValues.data.gradientConfig)
        setAuroraConfig(originalValues.data.auroraConfig)
        setBlobConfig(originalValues.data.blobConfig)
        setFluidConfig(originalValues.data.fluidConfig)
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
  const drawTextureToCanvas = (ctx, width, height, textureType, textureSize, textureOpacity, blendMode) => {
    if (textureType === 'none') return
    
    const textureCanvas = document.createElement('canvas')
    textureCanvas.width = width
    textureCanvas.height = height
    const textureCtx = textureCanvas.getContext('2d')
    
    const lineWidth = Math.max(1, textureSize * 0.1)
    const dotSize = Math.max(1, textureSize * 0.15)
    
    switch (textureType) {
      case 'grain': {
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
        textureCtx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        for (let y = 0; y < height; y += textureSize) {
          textureCtx.fillRect(0, y + textureSize - lineWidth, width, lineWidth)
        }
        break
      }
      case 'dots': {
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
        textureCtx.fillStyle = 'rgba(255, 255, 255, 0.15)'
        for (let y = 0; y < height; y += textureSize) {
          textureCtx.fillRect(0, y, width, lineWidth)
        }
        for (let x = 0; x < width; x += textureSize) {
          textureCtx.fillRect(x, 0, lineWidth, height)
        }
        break
      }
      case 'diagonal': {
        textureCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        textureCtx.lineWidth = lineWidth
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
    
    const restoreColors = prepareForCapture(document.body)
    
    try {
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
      
      const backgroundCanvas = 
        container.querySelector('.gradient-layer canvas') ||
        container.querySelector('.fluid-gradient-layer canvas') ||
        container.querySelector('.aurora-layer canvas') ||
        container.querySelector('.blob-layer canvas')
      
      if (backgroundCanvas) {
        const wrapper = container.querySelector('.gradient-effects-wrapper')
        const filterStyle = wrapper ? getComputedStyle(wrapper).filter : 'none'
        ctx.filter = filterStyle !== 'none' ? filterStyle : 'none'
        ctx.drawImage(backgroundCanvas, 0, 0, outputCanvas.width, outputCanvas.height)
        ctx.filter = 'none'
      }
      
      drawTextureToCanvas(
        ctx,
        outputCanvas.width,
        outputCanvas.height,
        effectsConfig.texture,
        effectsConfig.textureSize * scale,
        effectsConfig.textureOpacity,
        effectsConfig.textureBlendMode
      )
      
      if (effectsConfig.noiseEnabled && effectsConfig.noise > 0) {
        const noiseCanvas = container.querySelector('.effects-layer canvas')
        if (noiseCanvas) {
          ctx.save()
          ctx.globalAlpha = effectsConfig.noise
          ctx.globalCompositeOperation = 'overlay'
          ctx.drawImage(noiseCanvas, 0, 0, outputCanvas.width, outputCanvas.height)
          ctx.restore()
        }
      }
      
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
        restoreColors()
        setShowCaptureModal(false)
        setIsCapturing(false)
      }, 'image/png')
    } catch (error) {
      console.error('Failed to capture snapshot:', error)
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

  // Helper functions for mobile dialogs
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

  const addTextSection = () => {
    const newId = Math.max(...textSections.map(s => s.id), 0) + 1
    setTextSections([
      ...textSections,
      { id: newId, text: 'New Text', size: 60, weight: 400, spacing: 0.1, font: 'sans-serif' }
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
      'fluid-colors': 'Fluid Colors',
      'fluid-animation': 'Animation Speed',
      'fluid-settings': 'Fluid Settings',
      'pattern-icon': 'Icon Settings',
      'pattern-spacing': 'Spacing',
      'pattern-mouse': 'Mouse Influence',
      'effects-blur': 'Background Blur',
      'effects-noise': 'Noise',
      'effects-texture': 'Texture',
      'effects-colormap': 'Color Map',
      'effects-vignette': 'Vignette',
      'effects-color': 'Color Correction',
      'effects-fluted': 'Fluted Glass',
      'text-settings': 'Text Settings',
    }
    if (key && key.startsWith('text-section-')) {
      const sectionId = parseInt(key.replace('text-section-', ''))
      const sectionIndex = textSections.findIndex(s => s.id === sectionId)
      const section = textSections.find(s => s.id === sectionId)
      return section ? `Section ${sectionIndex + 1}: ${section.text?.slice(0, 15) || 'Empty'}${section.text?.length > 15 ? '...' : ''}` : 'Text Section'
    }
    return titles[key] || 'Settings'
  }

  // Render dialog content for mobile
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
              <SelectTrigger><SelectValue /></SelectTrigger>
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
          <div className="space-y-2">
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
      case 'aurora-background':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Use Gradient Colors</Label>
              <Switch checked={auroraConfig.useGradientColors} onCheckedChange={(c) => setAuroraConfig({ ...auroraConfig, useGradientColors: c })} />
            </div>
            {auroraConfig.useGradientColors ? (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <Label className="text-xs text-muted-foreground mb-2 block">Colors from Gradient</Label>
                <div className="flex gap-1 flex-wrap">
                  {gradientConfig.colors.map((color, idx) => (
                    <div key={idx} className="w-8 h-8 rounded-md border border-border" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            ) : (
              <ControlGroup label="Background Color">
                <div className="flex items-center gap-2">
                  <PaletteColorPicker value={auroraConfig.backgroundColor} onChange={(newColor) => setAuroraConfig({ ...auroraConfig, backgroundColor: newColor })} palette={parsedPalette} className="w-10 h-10" />
                  <Input value={auroraConfig.backgroundColor} onChange={(e) => setAuroraConfig({ ...auroraConfig, backgroundColor: e.target.value })} className="h-9 font-mono text-xs flex-1" />
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
                    <div key={idx} className="w-8 h-8 rounded-md border border-border" style={{ backgroundColor: color }} />
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
                <div className="h-6 rounded-md border border-border mt-2" style={{ background: `linear-gradient(to right, hsl(${auroraConfig.hueStart}, 100%, 65%), hsl(${auroraConfig.hueEnd}, 100%, 65%))` }} />
              </>
            )}
          </div>
        )
      case 'aurora-lines':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Min Width`}><NumberInput value={[auroraConfig.minWidth]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, minWidth: val })} min={1} max={100} step={5} showButtons /></ControlGroup>
            <ControlGroup label={`Max Width`}><NumberInput value={[auroraConfig.maxWidth]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, maxWidth: val })} min={1} max={100} step={5} showButtons /></ControlGroup>
            <ControlGroup label={`Min Height`}><NumberInput value={[auroraConfig.minHeight]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, minHeight: val })} min={50} max={1000} step={50} showButtons /></ControlGroup>
            <ControlGroup label={`Max Height`}><NumberInput value={[auroraConfig.maxHeight]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, maxHeight: val })} min={50} max={1000} step={50} showButtons /></ControlGroup>
            <ControlGroup label={`Line Count (0 = auto)`}><NumberInput value={[auroraConfig.lineCount]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, lineCount: val })} min={0} max={500} step={10} showButtons /></ControlGroup>
          </div>
        )
      case 'aurora-animation':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Min TTL`}><NumberInput value={[auroraConfig.minTTL]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, minTTL: val })} min={10} max={500} step={10} showButtons /></ControlGroup>
            <ControlGroup label={`Max TTL`}><NumberInput value={[auroraConfig.maxTTL]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, maxTTL: val })} min={10} max={500} step={10} showButtons /></ControlGroup>
            <ControlGroup label={`Blur Amount`}><NumberInput value={[auroraConfig.blurAmount]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, blurAmount: val })} min={0} max={50} step={1} showButtons /></ControlGroup>
          </div>
        )
      case 'blob-colors':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Use Gradient Colors</Label>
              <Switch checked={blobConfig.useGradientColors} onCheckedChange={(checked) => setBlobConfig({ ...blobConfig, useGradientColors: checked })} />
            </div>
            {blobConfig.useGradientColors ? (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <Label className="text-xs text-muted-foreground mb-2 block">Colors from Gradient Palette</Label>
                <div className="flex gap-1 flex-wrap">
                  {gradientConfig.colors.map((color, idx) => (
                    <div key={idx} className="w-8 h-8 rounded-md border border-border" style={{ backgroundColor: color }} title={color} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Blobs will use these colors. Edit them in Liquid mode.</p>
              </div>
            ) : (
              <>
                <ControlGroup label="Background">
                  <div className="flex items-center gap-2">
                    <PaletteColorPicker value={blobConfig.backgroundColor} onChange={(newColor) => setBlobConfig({ ...blobConfig, backgroundColor: newColor })} palette={parsedPalette} className="w-10 h-9" />
                    <Input value={blobConfig.backgroundColor} onChange={(e) => setBlobConfig({ ...blobConfig, backgroundColor: e.target.value })} className="h-9 font-mono text-xs flex-1" />
                  </div>
                </ControlGroup>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide font-semibold">Blob Colors</Label>
                  {(blobConfig.colors || ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0']).map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <PaletteColorPicker value={color} onChange={(newColor) => updateBlobColor(index, newColor)} palette={parsedPalette} className="w-10 h-9" />
                      <Input value={color} onChange={(e) => updateBlobColor(index, e.target.value)} className="h-9 font-mono text-xs flex-1" />
                      <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => removeBlobColor(index)} disabled={(blobConfig.colors || []).length <= 2}><Trash size={12} /></Button>
                    </div>
                  ))}
                  {(blobConfig.colors || []).length < 8 && (
                    <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addBlobColor}><Plus size={12} className="mr-1" /> Add Color</Button>
                  )}
                </div>
              </>
            )}
          </div>
        )
      case 'blob-size':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Blob Count`}><NumberInput value={[blobConfig.blobCount]} onValueChange={([val]) => setBlobConfig({ ...blobConfig, blobCount: val })} min={2} max={20} step={1} showButtons /></ControlGroup>
            <ControlGroup label={`Min Radius`}><NumberInput value={[blobConfig.minRadius]} onValueChange={([val]) => setBlobConfig({ ...blobConfig, minRadius: val })} min={10} max={200} step={10} showButtons /></ControlGroup>
            <ControlGroup label={`Max Radius`}><NumberInput value={[blobConfig.maxRadius]} onValueChange={([val]) => setBlobConfig({ ...blobConfig, maxRadius: val })} min={10} max={300} step={10} showButtons /></ControlGroup>
            <ControlGroup label={`Orbit Radius`}><NumberInput value={[blobConfig.orbitRadius]} onValueChange={([val]) => setBlobConfig({ ...blobConfig, orbitRadius: val })} min={50} max={500} step={25} showButtons /></ControlGroup>
          </div>
        )
      case 'blob-animation':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Speed`}><NumberInput value={[blobConfig.speed]} onValueChange={([val]) => setBlobConfig({ ...blobConfig, speed: val })} min={0.1} max={2} step={0.1} showButtons /></ControlGroup>
            <ControlGroup label={`Mouse Influence`}><NumberInput value={[blobConfig.mouseInfluence]} onValueChange={([val]) => setBlobConfig({ ...blobConfig, mouseInfluence: val })} min={0} max={1} step={0.1} showButtons /></ControlGroup>
          </div>
        )
      case 'blob-effect':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Blur Amount`}><NumberInput value={[blobConfig.blurAmount]} onValueChange={([val]) => setBlobConfig({ ...blobConfig, blurAmount: val })} min={5} max={50} step={1} showButtons /></ControlGroup>
            <ControlGroup label={`Gooey Threshold`}><NumberInput value={[blobConfig.threshold]} onValueChange={([val]) => setBlobConfig({ ...blobConfig, threshold: val })} min={100} max={250} step={10} showButtons /></ControlGroup>
          </div>
        )
      case 'fluid-colors':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Use Gradient Colors</Label>
              <Switch checked={fluidConfig.useGradientColors} onCheckedChange={(checked) => setFluidConfig({ ...fluidConfig, useGradientColors: checked })} />
            </div>
            {fluidConfig.useGradientColors ? (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <Label className="text-xs text-muted-foreground mb-2 block">Colors from Gradient Palette</Label>
                <div className="flex gap-1 flex-wrap">
                  {gradientConfig.colors.slice(0, 4).map((color, idx) => (
                    <div key={idx} className="w-8 h-8 rounded-md border border-border" style={{ backgroundColor: color }} title={color} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">First 4 colors will be used. Edit them in Liquid mode.</p>
              </div>
            ) : (
              <>
                <ControlGroup label="Background">
                  <div className="flex items-center gap-2">
                    <PaletteColorPicker value={fluidConfig.backgroundColor} onChange={(newColor) => setFluidConfig({ ...fluidConfig, backgroundColor: newColor })} palette={parsedPalette} className="w-10 h-9" />
                    <Input value={fluidConfig.backgroundColor} onChange={(e) => setFluidConfig({ ...fluidConfig, backgroundColor: e.target.value })} className="h-9 font-mono text-xs flex-1" />
                  </div>
                </ControlGroup>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide font-semibold">Fluid Colors (4 colors)</Label>
                  {(fluidConfig.colors || ['#71ECFF', '#39F58A', '#71ECFF', '#F0CBA8']).map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <PaletteColorPicker value={color} onChange={(newColor) => {
                        const newColors = [...fluidConfig.colors]
                        newColors[index] = newColor
                        setFluidConfig({ ...fluidConfig, colors: newColors })
                      }} palette={parsedPalette} className="w-10 h-9" />
                      <Input value={color} onChange={(e) => {
                        const newColors = [...fluidConfig.colors]
                        newColors[index] = e.target.value
                        setFluidConfig({ ...fluidConfig, colors: newColors })
                      }} className="h-9 font-mono text-xs flex-1" />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )
      case 'fluid-animation':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Speed`}><NumberInput value={[fluidConfig.speed]} onValueChange={([val]) => setFluidConfig({ ...fluidConfig, speed: val })} min={0.1} max={3} step={0.1} showButtons /></ControlGroup>
          </div>
        )
      case 'fluid-settings':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Intensity`}><NumberInput value={[fluidConfig.intensity]} onValueChange={([val]) => setFluidConfig({ ...fluidConfig, intensity: val })} min={0.1} max={1} step={0.05} showButtons /></ControlGroup>
            <ControlGroup label={`Blur`}><NumberInput value={[fluidConfig.blurAmount]} onValueChange={([val]) => setFluidConfig({ ...fluidConfig, blurAmount: val })} min={0} max={20} step={1} showButtons /></ControlGroup>
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
            <ControlGroup label={`Size`}><NumberInput value={[tessellationConfig.size]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, size: val })} min={8} max={100} step={4} showButtons /></ControlGroup>
            <ControlGroup label="Color"><PaletteColorPicker value={tessellationConfig.color} onChange={(newColor) => setTessellationConfig({ ...tessellationConfig, color: newColor })} palette={parsedPalette} className="w-10 h-10" /></ControlGroup>
            <ControlGroup label={`Opacity`}><NumberInput value={[tessellationConfig.opacity]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, opacity: val })} max={1} step={0.05} showButtons /></ControlGroup>
            <ControlGroup label={`Rotation`}><NumberInput value={[tessellationConfig.rotation]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, rotation: val })} max={360} step={15} showButtons /></ControlGroup>
          </div>
        )
      case 'pattern-spacing':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Row Gap`}><NumberInput value={[tessellationConfig.rowGap]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, rowGap: val })} min={20} max={200} step={10} showButtons /></ControlGroup>
            <ControlGroup label={`Col Gap`}><NumberInput value={[tessellationConfig.colGap]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, colGap: val })} min={20} max={200} step={10} showButtons /></ControlGroup>
          </div>
        )
      case 'pattern-mouse':
        return (
          <ControlGroup label={`Mouse Rotation`}><NumberInput value={[tessellationConfig.mouseRotationInfluence || 0]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, mouseRotationInfluence: val })} max={1} step={0.05} showButtons /></ControlGroup>
        )
      case 'effects-blur':
        return <ControlGroup label={`Blur`}><NumberInput value={[effectsConfig.blur]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, blur: val })} max={30} step={2} showButtons /></ControlGroup>
      case 'effects-noise':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Enable Noise</Label>
              <Switch checked={effectsConfig.noiseEnabled} onCheckedChange={(c) => setEffectsConfig({ ...effectsConfig, noiseEnabled: c })} />
            </div>
            {effectsConfig.noiseEnabled && (
              <>
                <ControlGroup label={`Amount`}><NumberInput value={[effectsConfig.noise]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, noise: val })} max={0.5} step={0.05} showButtons /></ControlGroup>
                <ControlGroup label={`Scale`}><NumberInput value={[effectsConfig.noiseScale]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, noiseScale: val })} min={0.5} max={3} step={0.25} showButtons /></ControlGroup>
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
                <ControlGroup label={`Size`}><NumberInput value={[effectsConfig.textureSize]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, textureSize: val })} min={4} max={100} step={4} showButtons /></ControlGroup>
                <ControlGroup label={`Opacity`}><NumberInput value={[effectsConfig.textureOpacity]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, textureOpacity: val })} max={1} step={0.05} showButtons /></ControlGroup>
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
        return <ControlGroup label={`Intensity`}><NumberInput value={[effectsConfig.vignetteIntensity]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, vignetteIntensity: val })} max={0.8} step={0.05} showButtons /></ControlGroup>
      case 'effects-color':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Saturation`}><NumberInput value={[effectsConfig.saturation]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, saturation: val })} max={200} step={10} showButtons /></ControlGroup>
            <ControlGroup label={`Contrast`}><NumberInput value={[effectsConfig.contrast]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, contrast: val })} min={50} max={150} step={5} showButtons /></ControlGroup>
            <ControlGroup label={`Brightness`}><NumberInput value={[effectsConfig.brightness]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, brightness: val })} min={50} max={150} step={5} showButtons /></ControlGroup>
          </div>
        )
      case 'effects-fluted':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Enable Fluted Glass</Label>
              <Switch 
                checked={effectsConfig.flutedGlass?.enabled ?? false} 
                onCheckedChange={(checked) => setEffectsConfig({ 
                  ...effectsConfig, 
                  flutedGlass: { ...effectsConfig.flutedGlass, enabled: checked } 
                })} 
              />
            </div>
            {effectsConfig.flutedGlass?.enabled && (
              <>
                <ControlGroup label={`Ridges / Segments`}>
                  <NumberInput 
                    value={[effectsConfig.flutedGlass?.segments ?? 80]} 
                    onValueChange={([val]) => setEffectsConfig({ 
                      ...effectsConfig, 
                      flutedGlass: { ...effectsConfig.flutedGlass, segments: val } 
                    })} 
                    min={5} max={300} step={5} showButtons 
                  />
                </ControlGroup>
                <ControlGroup label={`Distortion`}>
                  <NumberInput 
                    value={[effectsConfig.flutedGlass?.distortionStrength ?? 0.02]} 
                    onValueChange={([val]) => setEffectsConfig({ 
                      ...effectsConfig, 
                      flutedGlass: { ...effectsConfig.flutedGlass, distortionStrength: val } 
                    })} 
                    min={0.005} max={0.1} step={0.005} showButtons 
                  />
                </ControlGroup>
                <ControlGroup label={`Wave Frequency`}>
                  <NumberInput 
                    value={[effectsConfig.flutedGlass?.waveFrequency ?? 1]} 
                    onValueChange={([val]) => setEffectsConfig({ 
                      ...effectsConfig, 
                      flutedGlass: { ...effectsConfig.flutedGlass, waveFrequency: val } 
                    })} 
                    min={0.5} max={5} step={0.5} showButtons 
                  />
                </ControlGroup>
                <ControlGroup label={`Rotation (°)`}>
                  <NumberInput 
                    value={[effectsConfig.flutedGlass?.rotation ?? 0]} 
                    onValueChange={([val]) => setEffectsConfig({ 
                      ...effectsConfig, 
                      flutedGlass: { ...effectsConfig.flutedGlass, rotation: val } 
                    })} 
                    min={0} max={180} step={5} showButtons 
                  />
                </ControlGroup>
                <ControlGroup label={`Motion Speed`}>
                  <NumberInput 
                    value={[effectsConfig.flutedGlass?.motionSpeed ?? 0.5]} 
                    onValueChange={([val]) => setEffectsConfig({ 
                      ...effectsConfig, 
                      flutedGlass: { ...effectsConfig.flutedGlass, motionSpeed: val } 
                    })} 
                    min={0} max={3} step={0.1} showButtons 
                  />
                </ControlGroup>
                <ControlGroup label={`3D Overlay`}>
                  <NumberInput 
                    value={[effectsConfig.flutedGlass?.overlayOpacity ?? 0]} 
                    onValueChange={([val]) => setEffectsConfig({ 
                      ...effectsConfig, 
                      flutedGlass: { ...effectsConfig.flutedGlass, overlayOpacity: val } 
                    })} 
                    min={0} max={100} step={5} showButtons 
                  />
                </ControlGroup>
              </>
            )}
          </div>
        )
      case 'text-settings':
        return (
          <div className="space-y-2">
            <ControlGroup label="Text Color">
              <ContrastAwarePaletteColorPicker value={textConfig.color} onChange={(newColor) => setTextConfig({ ...textConfig, color: newColor })} palette={parsedPalette} gradientColors={gradientConfig.colors} className="w-16 h-8" />
            </ControlGroup>
            <ControlGroup label="Text Opacity"><NumberInput value={[textConfig.opacity]} onValueChange={([val]) => setTextConfig({ ...textConfig, opacity: val })} min={0} max={1} step={0.05} showButtons={true} /></ControlGroup>
            <ControlGroup label="Section Gap"><NumberInput value={[textGap]} onValueChange={([val]) => setTextGap(val)} max={100} step={4} /></ControlGroup>
          </div>
        )
      default:
        // Handle dynamic text section dialogs
        if (activeDialog && activeDialog.startsWith('text-section-')) {
          const sectionId = parseInt(activeDialog.replace('text-section-', ''))
          const section = textSections.find(s => s.id === sectionId)
          if (section) {
            return (
              <div className="space-y-2">
                <Input value={section.text} onChange={(e) => updateTextSection(section.id, 'text', e.target.value)} className="h-11 text-base" placeholder="Enter text..." />
                <ControlGroup label="Size (in px)"><NumberInput value={[section.size]} onValueChange={([val]) => updateTextSection(section.id, 'size', val)} min={12} max={200} step={4} showButtons={true} /></ControlGroup>
                <ControlGroup label="Font">
                  <Select value={section.font || 'sans-serif'} onValueChange={(value) => updateTextSection(section.id, 'font', value)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans-serif">Manrope</SelectItem>
                      <SelectItem value="serif">Playfair Display</SelectItem>
                      <SelectItem value="mono">Space Grotesk</SelectItem>
                      <SelectItem value="scribble">Pacifico</SelectItem>
                    </SelectContent>
                  </Select>
                </ControlGroup>
                <ControlGroup label="Weight">
                  <Select value={String(section.weight)} onValueChange={(value) => updateTextSection(section.id, 'weight', parseInt(value))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
                <ControlGroup label="Spacing (in em)"><NumberInput value={[section.spacing]} onValueChange={([val]) => updateTextSection(section.id, 'spacing', val)} min={-0.1} max={0.5} step={0.01} showButtons={true} /></ControlGroup>
                <Button variant="destructive" className="w-full mt-4" onClick={() => { removeTextSection(section.id); setActiveDialog(null) }} disabled={textSections.length <= 1}>
                  <Trash size={16} className="mr-2" />Delete Section
                </Button>
              </div>
            )
          }
        }
        return null
    }
  }

  // Palette Dialog Component (shared between mobile and desktop)
  const PaletteDialog = () => (
    <Dialog open={showPaletteDialog} onOpenChange={(open) => {
      setShowPaletteDialog(open)
      if (!open) setPaletteError('')
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
                      reader.onerror = () => setPaletteError('Failed to read file')
                      reader.readAsText(file)
                    }
                    e.target.value = ''
                  }}
                  className="hidden"
                  id="palette-file-input"
                />
                <Button variant="outline" className="w-full" onClick={() => document.getElementById('palette-file-input')?.click()}>
                  <Upload size={16} className="mr-2" />Choose .json file
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase">or paste JSON</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            
            <div className="space-y-2">
              <Label>Paste your JSON color palette</Label>
              <textarea
                value={paletteJson}
                onChange={(e) => { setPaletteJson(e.target.value); setPaletteError('') }}
                placeholder={`{\n  "blue": {\n    "500": "#3b82f6",\n    "600": "#2563eb"\n  }\n}`}
                className="w-full h-36 p-3 text-sm font-mono bg-muted border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {paletteError && <p className="text-sm text-destructive">{paletteError}</p>}
            </div>
            
            {colorPalette && (
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Current Palette</span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={handleClearPalette}>
                    <Trash size={12} className="mr-1" />Remove
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {parsedPalette?.colors.slice(0, 30).map((color, idx) => (
                    <div key={idx} className="w-5 h-5 rounded border border-border/50" style={{ backgroundColor: color.hex }} title={color.shade ? `${color.name}-${color.shade}` : color.name} />
                  ))}
                  {parsedPalette?.colors.length > 30 && (
                    <span className="text-xs text-muted-foreground self-center ml-1">+{parsedPalette.colors.length - 30} more</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setShowPaletteDialog(false)}>Cancel</Button>
          <Button className="flex-1" onClick={handlePaletteUpload}>
            <Upload size={16} className="mr-2" />{colorPalette ? 'Update Palette' : 'Upload Palette'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Capture Modal Component (shared between mobile and desktop)
  const CaptureModal = () => (
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
            <Button variant="outline" className="w-full h-auto p-4 justify-start gap-4" onClick={() => captureSnapshot('background')}>
              <div className="p-2 rounded-lg bg-primary/10"><Image size={24} weight="duotone" className="text-primary" /></div>
              <div className="text-left">
                <div className="font-medium">Background Only</div>
                <div className="text-sm text-muted-foreground">Gradient + Effects (no pattern/text)</div>
              </div>
            </Button>
            <Button variant="outline" className="w-full h-auto p-4 justify-start gap-4" onClick={() => captureSnapshot('all')}>
              <div className="p-2 rounded-lg bg-primary/10"><Stack size={24} weight="duotone" className="text-primary" /></div>
              <div className="text-left">
                <div className="font-medium">Everything</div>
                <div className="text-sm text-muted-foreground">All layers including pattern & text</div>
              </div>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  // Mobile Panel
  if (isMobile) {
    return (
      <>
        {/* Mobile Top Bar */}
        <div className="fixed left-0 right-0 top-0 z-50 bg-card/5 backdrop-blur-4xl">
          <div className="flex items-center justify-between gap-2 p-2 safe-area-top">
            <Button variant="outline" size="sm" className="flex items-center gap-2 h-10 px-4 border-primary/50" onClick={() => setShowPaletteDialog(true)} title={colorPalette ? "Edit Palette" : "Upload Palette"}>
              <Upload size={18} weight={colorPalette ? 'fill' : 'regular'} />
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2 h-10 px-4 border-primary/50" onClick={randomizeGradient} title="Shuffle Gradient">
              <Shuffle size={18} />
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2 h-10 px-4 border-primary/50" onClick={() => setShowCaptureModal(true)}>
              <Camera size={18} />
            </Button>
          </div>
        </div>

        {/* Mobile Bottom Panel */}
        <div ref={panelRef} className={cn("fixed left-0 right-0 bottom-0 z-50 bg-card/50 backdrop-blur-xl border-t border-border", "transition-transform duration-300 ease-out")}>
          <div className="flex items-center gap-1 p-1 border-b border-border/50 safe-area-bottom">
            {tabs.map(tab => (
              <Button
                key={tab.id}
                variant={activePanel === tab.id && !isMobileCollapsed ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 flex flex-col gap-1 h-auto p-2"
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
            <Button variant="ghost" size="sm" className="flex flex-col gap-1 h-auto p-2 shrink-0 text-muted-foreground" onClick={() => setIsMobileCollapsed(!isMobileCollapsed)}>
              {isMobileCollapsed ? <CaretCircleUp size={18} weight="bold" /> : <CaretCircleDown size={18} weight="bold" />}
            </Button>
          </div>

          {!isMobileCollapsed && (
            <ScrollArea className="max-h-[50vh] p-1 gap-2">
              {activePanel === 'gradient' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-2">
                    <Label className="text-sm">Background</Label>
                    <Select value={backgroundType} onValueChange={(value) => setBackgroundType(value)}>
                      <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="liquid">Liquid</SelectItem>
                        <SelectItem value="aurora">Aurora</SelectItem>
                        <SelectItem value="blob">Blob</SelectItem>
                        <SelectItem value="fluid">Fluid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                    {backgroundType === 'fluid' && (
                      <>
                        <SubsectionButton title="Colors" onClick={() => openDialog('fluid-colors')} />
                        <SubsectionButton title="Animation" onClick={() => openDialog('fluid-animation')} />
                        <SubsectionButton title="Settings" onClick={() => openDialog('fluid-settings')} />
                      </>
                    )}
                  </div>
                </div>
              )}
              {activePanel === 'tessellation' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-2">
                    <Label>Enable Pattern</Label>
                    <Switch checked={tessellationConfig.enabled} onCheckedChange={(c) => setTessellationConfig({ ...tessellationConfig, enabled: c })} />
                  </div>
                  <div className="space-y-1 flex flex-row gap-1">
                    <SubsectionButton title="Icon" onClick={() => openDialog('pattern-icon')} />
                    <SubsectionButton title="Spacing" onClick={() => openDialog('pattern-spacing')} />
                    <SubsectionButton title="Mouse" onClick={() => openDialog('pattern-mouse')} />
                  </div>
                </div>
              )}
              {activePanel === 'effects' && (
                <div className="space-y-1 flex flex-row flex-wrap gap-1">
                  <SubsectionButton title="Blur" onClick={() => openDialog('effects-blur')} />
                  <SubsectionButton title="Noise" onClick={() => openDialog('effects-noise')} />
                  <SubsectionButton title="Texture" onClick={() => openDialog('effects-texture')} />
                  <SubsectionButton title="Color Map" onClick={() => openDialog('effects-colormap')} />
                  <SubsectionButton title="Vignette" onClick={() => openDialog('effects-vignette')} />
                  <SubsectionButton title="Color" onClick={() => openDialog('effects-color')} />
                  <SubsectionButton title="Fluted Glass" onClick={() => openDialog('effects-fluted')} />
                </div>
              )}
              {activePanel === 'text' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-2">
                    <Label>Enable Text</Label>
                    <Switch checked={textConfig.enabled} onCheckedChange={(checked) => setTextConfig({ ...textConfig, enabled: checked })} />
                  </div>
                  <div className="space-y-1 flex flex-row flex-wrap gap-1 px-1">
                    <SubsectionButton title="Settings" onClick={() => openDialog('text-settings')} />
                    {textSections.map((section, index) => (
                      <SubsectionButton key={section.id} title={`${index + 1}: ${section.text?.slice(0, 8) || 'Empty'}${section.text?.length > 8 ? '...' : ''}`} onClick={() => openDialog(`text-section-${section.id}`)} />
                    ))}
                    <Button variant="outline" className="w-fit h-11 px-3" onClick={addTextSection}>
                      <Plus size={14} className="mr-1" /><span className="text-sm">Add</span>
                    </Button>
                  </div>
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        {/* Mobile Dialog */}
        <Dialog open={!!activeDialog} onOpenChange={(open) => !open && backDialog()}>
          <DialogContent className="max-h-[80vh]">
            <DialogHeader><DialogTitle>{getDialogTitle(activeDialog)}</DialogTitle></DialogHeader>
            <ScrollArea className="max-h-[60vh] py-4">{renderDialogContent()}</ScrollArea>
            <DialogFooter className="flex-row gap-2">
              <Button variant="outline" className="flex-1" onClick={resetDialog}><ArrowCounterClockwise size={16} className="mr-2" />Reset</Button>
              <Button className="flex-1" onClick={applyDialog}><Check size={16} className="mr-2" />Apply</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <CaptureModal />
        <PaletteDialog />
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
          <div className="text-muted-foreground"><DotsSixVertical size={16} weight="bold" /></div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPaletteDialog(true)} title={colorPalette ? "Edit Palette" : "Upload Palette"}>
              <Upload size={16} weight={colorPalette ? 'fill' : 'regular'} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={randomizeGradient} disabled={isCapturing} title="Shuffle Gradient">
              <Shuffle size={16} weight="regular" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowCaptureModal(true)} disabled={isCapturing}>
              <Camera size={16} weight={isCapturing ? 'fill' : 'regular'} />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => setIsCollapsed(!isCollapsed)}>
              <Sliders size={16} />
              {isCollapsed ? <CaretUp size={12} /> : <CaretDown size={12} />}
            </Button>
          </div>
        </div>

        {!isCollapsed && (
          <Tabs value={activePanel} onValueChange={setActivePanel} className="flex flex-col flex-1 min-h-0">
            <TabsList className="w-full rounded-none border-b border-border bg-transparent p-1 gap-1 shrink-0">
              {tabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex-1 flex flex-col gap-1 py-2 data-[state=active]:bg-muted rounded-md">
                  <tab.icon size={14} weight={activePanel === tab.id ? 'fill' : 'regular'} />
                  <span className="text-[10px] uppercase tracking-wide">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 min-h-0 p-5">
                <TabsContent value="gradient" className="m-0">
                  <GradientPanel
                    backgroundType={backgroundType}
                    setBackgroundType={setBackgroundType}
                    gradientConfig={gradientConfig}
                    setGradientConfig={setGradientConfig}
                    auroraConfig={auroraConfig}
                    setAuroraConfig={setAuroraConfig}
                    blobConfig={blobConfig}
                    setBlobConfig={setBlobConfig}
                    fluidConfig={fluidConfig}
                    setFluidConfig={setFluidConfig}
                    parsedPalette={parsedPalette}
                  />
                </TabsContent>
                <TabsContent value="tessellation" className="m-0">
                  <PatternPanel
                    tessellationConfig={tessellationConfig}
                    setTessellationConfig={setTessellationConfig}
                    parsedPalette={parsedPalette}
                  />
                </TabsContent>
                <TabsContent value="effects" className="m-0">
                  <EffectsPanel
                    effectsConfig={effectsConfig}
                    setEffectsConfig={setEffectsConfig}
                  />
                </TabsContent>
                <TabsContent value="text" className="m-0">
                  <TextPanel
                    textSections={textSections}
                    setTextSections={setTextSections}
                    textGap={textGap}
                    setTextGap={setTextGap}
                    textConfig={textConfig}
                    setTextConfig={setTextConfig}
                    parsedPalette={parsedPalette}
                    gradientColors={gradientConfig.colors}
                  />
                </TabsContent>
              </ScrollArea>
            </div>
          </Tabs>
        )}
      </div>

      <CaptureModal />
      <PaletteDialog />
    </>
  )
}

export default ControlPanel
