import { useState, useRef, useEffect, useCallback } from 'react'
import html2canvas from 'html2canvas'
import { AVAILABLE_ICONS } from './TessellationLayer'
import { 
  Sliders, Palette, GridFour, Sparkle, TextT, 
  Shuffle, Plus, Trash, CaretDown, CaretUp, CaretRight, DotsSixVertical, Camera,
  X, Image, Stack, CircleNotch, ArrowLeft, Check, ArrowCounterClockwise
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

const ControlPanel = ({
  activePanel,
  setActivePanel,
  gradientConfig,
  setGradientConfig,
  randomizeGradient,
  tessellationConfig,
  setTessellationConfig,
  effectsConfig,
  setEffectsConfig,
  textSections,
  setTextSections,
  textGap,
  setTextGap,
  layersContainerRef,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(true)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [activeDialog, setActiveDialog] = useState(null)
  const [originalValues, setOriginalValues] = useState(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const panelRef = useRef(null)

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
      setOriginalValues({ type: 'text', data: { sections: [...textSections], gap: textGap } })
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

  const captureSnapshot = async (mode = 'all') => {
    if (!layersContainerRef?.current || isCapturing) return
    
    setIsCapturing(true)
    
    try {
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
      
      const effectsLayer = container.querySelector('.effects-layer')
      if (effectsLayer) {
        const effectsCanvas = await html2canvas(effectsLayer, {
          useCORS: true,
          allowTaint: true,
          scale: scale,
          backgroundColor: null,
          logging: false,
        })
        ctx.drawImage(effectsCanvas, 0, 0)
      }
      
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
          ctx.drawImage(tessCanvas, 0, 0)
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
          ctx.drawImage(textCanvas, 0, 0)
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
        setShowCaptureModal(false)
        setIsCapturing(false)
      }, 'image/png')
    } catch (error) {
      console.error('Failed to capture snapshot:', error)
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

  // Control group component for consistent styling
  const ControlGroup = ({ label, children, className }) => (
    <div className={cn (className)}>
      <Label className="text-xs font-semibold tracking-wide">{label}</Label>
      <div className="py-2">
        {children}
      </div>
    </div>
  )

  // Subsection button for mobile
  const SubsectionButton = ({ title, sectionKey }) => (
    <Button 
      variant="outline" 
      className="w-fit h-11 px-3"
        onClick={() => openDialog(sectionKey)}
      >
      <span className="text-sm">{title}</span>
    </Button>
    )

  const getDialogTitle = (key) => {
    const titles = {
      'gradient-colors': 'Colors',
      'gradient-type': 'Gradient Type',
      'gradient-stops': 'Position Stops',
      'gradient-wave': 'Wave Settings',
      'gradient-mouse': 'Mouse Influence',
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

  // Render Gradient Panel Content
  const renderGradientPanel = () => (
    <div className="space-y-2">
      {/* Colors Section */}
      <div className="space-y-1 ">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wide font-semibold">Gradient Colors</Label>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={randomizeGradient}>
            <Shuffle size={14} />
          </Button>
            </div>
        
        <div className="space-y-2">
              {gradientConfig.colors.map((color, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="relative">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => updateGradientColor(index, e.target.value)}
                  className="w-8 h-8 rounded-md border border-border cursor-pointer bg-transparent"
                  />
              </div>
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
        <ControlGroup label={`Start X: ${gradientConfig.startPos.x}%`}>
          <Slider
            value={[gradientConfig.startPos.x]}
            onValueChange={([val]) => setGradientConfig({
                  ...gradientConfig,
              startPos: { ...gradientConfig.startPos, x: val }
                })}
            max={100}
            step={1}
          />
        </ControlGroup>
        <ControlGroup label={`Start Y: ${gradientConfig.startPos.y}%`}>
          <Slider
            value={[gradientConfig.startPos.y]}
            onValueChange={([val]) => setGradientConfig({
                  ...gradientConfig,
              startPos: { ...gradientConfig.startPos, y: val }
                })}
            max={100}
            step={1}
              />
        </ControlGroup>
            </div>

      <div className="grid grid-cols-2 gap-4">
        <ControlGroup label={`End X: ${gradientConfig.endPos.x}%`}>
          <Slider
            value={[gradientConfig.endPos.x]}
            onValueChange={([val]) => setGradientConfig({
                  ...gradientConfig,
              endPos: { ...gradientConfig.endPos, x: val }
                })}
            max={100}
            step={1}
          />
        </ControlGroup>
        <ControlGroup label={`End Y: ${gradientConfig.endPos.y}%`}>
          <Slider
            value={[gradientConfig.endPos.y]}
            onValueChange={([val]) => setGradientConfig({
                  ...gradientConfig,
              endPos: { ...gradientConfig.endPos, y: val }
                })}
            max={100}
            step={1}
              />
        </ControlGroup>
            </div>

      {/* Wave Settings */}
      <ControlGroup label={`Wave Intensity: ${gradientConfig.waveIntensity.toFixed(2)}`}>
        <Slider
          value={[gradientConfig.waveIntensity]}
          onValueChange={([val]) => setGradientConfig({
                  ...gradientConfig,
            waveIntensity: val
                })}
          max={1}
          step={0.01}
              />
      </ControlGroup>

      <div className="grid grid-cols-2 gap-4">
        <ControlGroup label={`Wave 1: ${gradientConfig.wave1Speed.toFixed(2)}`}>
          <Slider
            value={[gradientConfig.wave1Speed]}
            onValueChange={([val]) => setGradientConfig({
                  ...gradientConfig,
              wave1Speed: val
                })}
            max={0.5}
            step={0.01}
              />
        </ControlGroup>
        <ControlGroup label="Direction">
          <Select
            value={String(gradientConfig.wave1Direction)}
            onValueChange={(value) => setGradientConfig({
                  ...gradientConfig,
              wave1Direction: parseInt(value)
                })}
              >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Forward</SelectItem>
              <SelectItem value="-1">Backward</SelectItem>
            </SelectContent>
          </Select>
        </ControlGroup>
            </div>

      <div className="grid grid-cols-2 gap-4">
        <ControlGroup label={`Wave 2: ${gradientConfig.wave2Speed.toFixed(2)}`}>
          <Slider
            value={[gradientConfig.wave2Speed]}
            onValueChange={([val]) => setGradientConfig({
                  ...gradientConfig,
              wave2Speed: val
                })}
            max={0.5}
            step={0.01}
              />
        </ControlGroup>
        <ControlGroup label="Direction">
          <Select
            value={String(gradientConfig.wave2Direction)}
            onValueChange={(value) => setGradientConfig({
                  ...gradientConfig,
              wave2Direction: parseInt(value)
                })}
              >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Forward</SelectItem>
              <SelectItem value="-1">Backward</SelectItem>
            </SelectContent>
          </Select>
        </ControlGroup>
            </div>

      {/* Mouse Influence */}
      <ControlGroup label={`Mouse Influence: ${gradientConfig.mouseInfluence.toFixed(2)}`}>
        <Slider
          value={[gradientConfig.mouseInfluence]}
          onValueChange={([val]) => setGradientConfig({
                  ...gradientConfig,
            mouseInfluence: val
                })}
          max={1}
          step={0.01}
        />
      </ControlGroup>

      <ControlGroup label={`Decay Speed: ${gradientConfig.decaySpeed.toFixed(2)}`}>
        <Slider
          value={[gradientConfig.decaySpeed]}
          onValueChange={([val]) => setGradientConfig({
                  ...gradientConfig,
            decaySpeed: val
                })}
          min={0.8}
          max={0.99}
          step={0.01}
              />
      </ControlGroup>
            </div>
  )

  // Render Tessellation/Pattern Panel Content
  const renderPatternPanel = () => (
    <div className="space-y-5">
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
        <ControlGroup label={`Row Gap: ${tessellationConfig.rowGap}px`}>
          <Slider
            value={[tessellationConfig.rowGap]}
            onValueChange={([val]) => setTessellationConfig({
                  ...tessellationConfig,
              rowGap: val
                })}
            min={20}
            max={200}
            step={1}
              />
        </ControlGroup>
        <ControlGroup label={`Col Gap: ${tessellationConfig.colGap}px`}>
          <Slider
            value={[tessellationConfig.colGap]}
            onValueChange={([val]) => setTessellationConfig({
                  ...tessellationConfig,
              colGap: val
                })}
            min={20}
            max={200}
            step={1}
              />
        </ControlGroup>
            </div>

      <ControlGroup label={`Icon Size: ${tessellationConfig.size}px`}>
        <Slider
          value={[tessellationConfig.size]}
          onValueChange={([val]) => setTessellationConfig({
                  ...tessellationConfig,
            size: val
                })}
          min={8}
          max={100}
          step={1}
              />
      </ControlGroup>

      <ControlGroup label={`Opacity: ${tessellationConfig.opacity.toFixed(2)}`}>
        <Slider
          value={[tessellationConfig.opacity]}
          onValueChange={([val]) => setTessellationConfig({
                  ...tessellationConfig,
            opacity: val
                })}
          max={1}
          step={0.01}
        />
      </ControlGroup>

      <ControlGroup label={`Rotation: ${tessellationConfig.rotation}°`}>
        <Slider
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
              <input
            type="color"
            value={tessellationConfig.color}
                onChange={(e) => setTessellationConfig({
                  ...tessellationConfig,
              color: e.target.value
            })}
            className="w-10 h-9 rounded-md border border-border cursor-pointer bg-transparent"
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
        <Slider
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
    <div className="space-y-5">
      <ControlGroup label={`Background Blur: ${effectsConfig.blur}px`}>
        <Slider
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
          <ControlGroup label={`Amount: ${effectsConfig.noise.toFixed(2)}`}>
            <Slider
              value={[effectsConfig.noise]}
              onValueChange={([val]) => setEffectsConfig({
                      ...effectsConfig,
                noise: val
                    })}
              max={0.5}
              step={0.01}
                  />
          </ControlGroup>
          <ControlGroup label={`Scale: ${effectsConfig.noiseScale.toFixed(1)}`}>
            <Slider
              value={[effectsConfig.noiseScale]}
              onValueChange={([val]) => setEffectsConfig({
                      ...effectsConfig,
                noiseScale: val
                    })}
              min={0.5}
              max={3}
              step={0.1}
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
          <ControlGroup label={`Size: ${effectsConfig.textureSize}px`}>
            <Slider
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
          <ControlGroup label={`Opacity: ${effectsConfig.textureOpacity.toFixed(2)}`}>
            <Slider
              value={[effectsConfig.textureOpacity]}
              onValueChange={([val]) => setEffectsConfig({
                      ...effectsConfig,
                textureOpacity: val
                    })}
              max={1}
              step={0.01}
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

      <ControlGroup label={`Vignette: ${effectsConfig.vignetteIntensity.toFixed(2)}`}>
        <Slider
          value={[effectsConfig.vignetteIntensity]}
          onValueChange={([val]) => setEffectsConfig({
                ...effectsConfig,
            vignetteIntensity: val
          })}
          max={0.8}
          step={0.01}
            />
      </ControlGroup>

      <ControlGroup label={`Saturation: ${effectsConfig.saturation}%`}>
        <Slider
          value={[effectsConfig.saturation]}
          onValueChange={([val]) => setEffectsConfig({
                  ...effectsConfig,
            saturation: val
                })}
          max={200}
          step={1}
              />
      </ControlGroup>

      <ControlGroup label={`Contrast: ${effectsConfig.contrast}%`}>
        <Slider
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

      <ControlGroup label={`Brightness: ${effectsConfig.brightness}%`}>
        <Slider
          value={[effectsConfig.brightness]}
          onValueChange={([val]) => setEffectsConfig({
                  ...effectsConfig,
            brightness: val
                })}
          min={50}
          max={150}
          step={1}
              />
      </ControlGroup>
            </div>
  )

  // Render Text Panel Content
  const renderTextPanel = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wide font-semibold">Text Sections</Label>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addTextSection}>
          <Plus size={14} />
        </Button>
      </div>

      <ControlGroup label={`Section Gap: ${textGap}px`}>
        <Slider
          value={[textGap]}
          onValueChange={([val]) => setTextGap(val)}
          max={100}
          step={1}
        />
      </ControlGroup>

      {textSections.map((section, index) => (
        <div key={section.id} className="p-4 rounded-lg bg-muted/50 space-y-3.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Section {index + 1}</Label>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => removeTextSection(section.id)}
              disabled={textSections.length <= 1}
            >
              <Trash size={12} />
            </Button>
          </div>

          <Input
            value={section.text}
            onChange={(e) => updateTextSection(section.id, 'text', e.target.value)}
            className="h-9 text-sm"
            placeholder="Enter text..."
          />

          <ControlGroup label={`Size: ${section.size}px`}>
            <Slider
              value={[section.size]}
              onValueChange={([val]) => updateTextSection(section.id, 'size', val)}
              min={12}
              max={200}
              step={1}
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

          <ControlGroup label={`Spacing: ${section.spacing.toFixed(2)}em`}>
            <Slider
              value={[section.spacing]}
              onValueChange={([val]) => updateTextSection(section.id, 'spacing', val)}
              min={-0.1}
              max={0.5}
              step={0.01}
            />
          </ControlGroup>
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
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={randomizeGradient}>
                <Shuffle size={16} />
              </Button>
            </div>
            <div className="flex flex-row gap-1 w-[calc(100vw-2rem)] overflow-x-auto">
            {gradientConfig.colors.map((color, index) => (
              <div key={index} className="flex flex-col max-w-full items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => updateGradientColor(index, e.target.value)}
                  className="w-full h-10 rounded-md border cursor-pointer"
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
          <div className="space-y-4">
            <ControlGroup label={`Start X: ${gradientConfig.startPos.x}%`}>
              <Slider value={[gradientConfig.startPos.x]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, startPos: { ...gradientConfig.startPos, x: val } })} max={100} />
            </ControlGroup>
            <ControlGroup label={`Start Y: ${gradientConfig.startPos.y}%`}>
              <Slider value={[gradientConfig.startPos.y]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, startPos: { ...gradientConfig.startPos, y: val } })} max={100} />
            </ControlGroup>
            <ControlGroup label={`End X: ${gradientConfig.endPos.x}%`}>
              <Slider value={[gradientConfig.endPos.x]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, endPos: { ...gradientConfig.endPos, x: val } })} max={100} />
            </ControlGroup>
            <ControlGroup label={`End Y: ${gradientConfig.endPos.y}%`}>
              <Slider value={[gradientConfig.endPos.y]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, endPos: { ...gradientConfig.endPos, y: val } })} max={100} />
            </ControlGroup>
          </div>
        )
      case 'gradient-wave':
        return (
          <div className="space-y-4">
            <ControlGroup label={`Wave Intensity: ${gradientConfig.waveIntensity.toFixed(2)}`}>
              <Slider value={[gradientConfig.waveIntensity]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, waveIntensity: val })} max={1} step={0.01} />
            </ControlGroup>
            <ControlGroup label={`Wave 1 Speed: ${gradientConfig.wave1Speed.toFixed(2)}`}>
              <Slider value={[gradientConfig.wave1Speed]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, wave1Speed: val })} max={0.5} step={0.01} />
            </ControlGroup>
            <ControlGroup label="Wave 1 Direction">
              <Select value={String(gradientConfig.wave1Direction)} onValueChange={(v) => setGradientConfig({ ...gradientConfig, wave1Direction: parseInt(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Forward</SelectItem>
                  <SelectItem value="-1">Backward</SelectItem>
                </SelectContent>
              </Select>
            </ControlGroup>
            <ControlGroup label={`Wave 2 Speed: ${gradientConfig.wave2Speed.toFixed(2)}`}>
              <Slider value={[gradientConfig.wave2Speed]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, wave2Speed: val })} max={0.5} step={0.01} />
            </ControlGroup>
            <ControlGroup label="Wave 2 Direction">
              <Select value={String(gradientConfig.wave2Direction)} onValueChange={(v) => setGradientConfig({ ...gradientConfig, wave2Direction: parseInt(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Forward</SelectItem>
                  <SelectItem value="-1">Backward</SelectItem>
                </SelectContent>
              </Select>
            </ControlGroup>
          </div>
        )
      case 'gradient-mouse':
        return (
          <div className="space-y-4">
            <ControlGroup label={`Mouse Influence: ${gradientConfig.mouseInfluence.toFixed(2)}`}>
              <Slider value={[gradientConfig.mouseInfluence]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, mouseInfluence: val })} max={1} step={0.01} />
            </ControlGroup>
            <ControlGroup label={`Decay Speed: ${gradientConfig.decaySpeed.toFixed(2)}`}>
              <Slider value={[gradientConfig.decaySpeed]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, decaySpeed: val })} min={0.8} max={0.99} step={0.01} />
            </ControlGroup>
          </div>
        )
      case 'pattern-icon':
        return (
          <div className="space-y-4">
            <ControlGroup label="Icon">
              <Select value={tessellationConfig.icon} onValueChange={(v) => setTessellationConfig({ ...tessellationConfig, icon: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{AVAILABLE_ICONS.map(icon => <SelectItem key={icon} value={icon}>{icon}</SelectItem>)}</SelectContent>
              </Select>
            </ControlGroup>
            <ControlGroup label={`Size: ${tessellationConfig.size}px`}>
              <Slider value={[tessellationConfig.size]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, size: val })} min={8} max={100} />
            </ControlGroup>
            <ControlGroup label="Color">
              <input type="color" value={tessellationConfig.color} onChange={(e) => setTessellationConfig({ ...tessellationConfig, color: e.target.value })} className="w-full h-10 rounded-md border border-border cursor-pointer" />
            </ControlGroup>
            <ControlGroup label={`Opacity: ${tessellationConfig.opacity.toFixed(2)}`}>
              <Slider value={[tessellationConfig.opacity]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, opacity: val })} max={1} step={0.01} />
            </ControlGroup>
            <ControlGroup label={`Rotation: ${tessellationConfig.rotation}°`}>
              <Slider value={[tessellationConfig.rotation]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, rotation: val })} max={360} />
            </ControlGroup>
          </div>
        )
      case 'pattern-spacing':
        return (
          <div className="space-y-4">
            <ControlGroup label={`Row Gap: ${tessellationConfig.rowGap}px`}>
              <Slider value={[tessellationConfig.rowGap]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, rowGap: val })} min={20} max={200} />
            </ControlGroup>
            <ControlGroup label={`Col Gap: ${tessellationConfig.colGap}px`}>
              <Slider value={[tessellationConfig.colGap]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, colGap: val })} min={20} max={200} />
            </ControlGroup>
          </div>
        )
      case 'pattern-mouse':
        return (
          <ControlGroup label={`Mouse Rotation: ${(tessellationConfig.mouseRotationInfluence || 0).toFixed(2)}`}>
            <Slider value={[tessellationConfig.mouseRotationInfluence || 0]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, mouseRotationInfluence: val })} max={1} step={0.01} />
          </ControlGroup>
        )
      case 'effects-blur':
        return (
          <ControlGroup label={`Blur: ${effectsConfig.blur}px`}>
            <Slider value={[effectsConfig.blur]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, blur: val })} max={30} />
          </ControlGroup>
        )
      case 'effects-noise':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Noise</Label>
              <Switch checked={effectsConfig.noiseEnabled} onCheckedChange={(c) => setEffectsConfig({ ...effectsConfig, noiseEnabled: c })} />
            </div>
            {effectsConfig.noiseEnabled && (
              <>
                <ControlGroup label={`Amount: ${effectsConfig.noise.toFixed(2)}`}>
                  <Slider value={[effectsConfig.noise]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, noise: val })} max={0.5} step={0.01} />
                </ControlGroup>
                <ControlGroup label={`Scale: ${effectsConfig.noiseScale.toFixed(1)}`}>
                  <Slider value={[effectsConfig.noiseScale]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, noiseScale: val })} min={0.5} max={3} step={0.1} />
                </ControlGroup>
              </>
            )}
          </div>
        )
      case 'effects-texture':
        return (
          <div className="space-y-4">
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
                <ControlGroup label={`Size: ${effectsConfig.textureSize}px`}>
                  <Slider value={[effectsConfig.textureSize]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, textureSize: val })} min={4} max={100} />
                </ControlGroup>
                <ControlGroup label={`Opacity: ${effectsConfig.textureOpacity.toFixed(2)}`}>
                  <Slider value={[effectsConfig.textureOpacity]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, textureOpacity: val })} max={1} step={0.01} />
                </ControlGroup>
              </>
            )}
          </div>
        )
      case 'effects-colormap':
        return (
          <ControlGroup label="Color Map">
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
          <ControlGroup label={`Intensity: ${effectsConfig.vignetteIntensity.toFixed(2)}`}>
            <Slider value={[effectsConfig.vignetteIntensity]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, vignetteIntensity: val })} max={0.8} step={0.01} />
          </ControlGroup>
        )
      case 'effects-color':
        return (
          <div className="space-y-4">
            <ControlGroup label={`Saturation: ${effectsConfig.saturation}%`}>
              <Slider value={[effectsConfig.saturation]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, saturation: val })} max={200} />
            </ControlGroup>
            <ControlGroup label={`Contrast: ${effectsConfig.contrast}%`}>
              <Slider value={[effectsConfig.contrast]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, contrast: val })} min={50} max={150} />
            </ControlGroup>
            <ControlGroup label={`Brightness: ${effectsConfig.brightness}%`}>
              <Slider value={[effectsConfig.brightness]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, brightness: val })} min={50} max={150} />
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
            "fixed left-0 right-0 bottom-0 z-[100] bg-card/95 backdrop-blur-xl border-t border-border",
            "transition-transform duration-300 ease-out",
            isMobileCollapsed ? "translate-y-[calc(100%-60px)]" : ""
          )}
      >
          {/* Mobile tabs */}
          <div className="flex items-center gap-1 px-2 py-2 border-b border-border/50">
          {tabs.map(tab => (
              <Button
              key={tab.id}
                variant={activePanel === tab.id && !isMobileCollapsed ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 flex flex-col gap-1 h-auto py-2"
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
              className="flex flex-col gap-1 h-auto py-2 px-3"
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
                <div className="space-y-1 flex flex-row gap-1">
                <SubsectionButton title="Colors" sectionKey="gradient-colors" />
                <SubsectionButton title="Type" sectionKey="gradient-type" />
                <SubsectionButton title="Stops" sectionKey="gradient-stops" />
                <SubsectionButton title="Wave" sectionKey="gradient-wave" />
                <SubsectionButton title="Mouse Influence" sectionKey="gradient-mouse" />
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
                <SubsectionButton title="Icon" sectionKey="pattern-icon" />
                <SubsectionButton title="Spacing" sectionKey="pattern-spacing" />
                <SubsectionButton title="Mouse Influence" sectionKey="pattern-mouse" />
              </div>
            )}
            {activePanel === 'effects' && (
                <div className="space-y-1">
                <SubsectionButton title="Background Blur" sectionKey="effects-blur" />
                <SubsectionButton title="Noise" sectionKey="effects-noise" />
                <SubsectionButton title="Texture" sectionKey="effects-texture" />
                <SubsectionButton title="Color Map" sectionKey="effects-colormap" />
                <SubsectionButton title="Vignette" sectionKey="effects-vignette" />
                <SubsectionButton title="Color Correction" sectionKey="effects-color" />
              </div>
            )}
              {activePanel === 'text' && renderTextPanel()}
            </ScrollArea>
            )}
          </div>

        {/* Mobile Dialog */}
        <Dialog open={!!activeDialog} onOpenChange={(open) => !open && backDialog()}>
          <DialogContent className="max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{getDialogTitle(activeDialog)}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                {renderDialogContent()}
              </div>
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
      </>
    )
  }

  // Desktop Panel
  return (
    <>
    <div 
      ref={panelRef}
        className={cn(
          "fixed z-[100] bg-card/95 backdrop-blur-xl border border-border rounded-2xl w-[340px] max-h-[85vh] overflow-hidden",
          "shadow-2xl shadow-black/50 transition-shadow duration-200",
          "font-[Geist,system-ui,sans-serif] text-foreground",
          isDragging && "shadow-3xl shadow-black/60",
          isCollapsed && "w-auto max-h-none"
        )}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        {/* Header */}
      <div 
          className="flex items-center justify-between px-4 py-3 border-b border-border select-none"
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
          <Tabs value={activePanel} onValueChange={setActivePanel}>
            <TabsList className="w-full rounded-none border-b border-border bg-transparent p-1 gap-1">
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

            <ScrollArea className="max-h-[calc(85vh-120px)] p-5">
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
    </>
  )
}

export default ControlPanel
