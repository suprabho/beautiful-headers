import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { AVAILABLE_ICONS } from './TessellationLayer'
import {
  Sliders, Palette, GridFour, Sparkle, TextT,
  Shuffle, Plus, Trash, CaretDown, CaretUp, CaretRight, DotsSixVertical, Camera,
  X, Image, Stack, CircleNotch, ArrowLeft, ArrowRight, Check, ArrowCounterClockwise, Upload, CaretCircleUp, CaretCircleDown,
  Pause, Play, FloppyDisk, Images, PaintBrushBroad, ArrowsInSimple, CaretUpDown
} from '@phosphor-icons/react'
import { createScene, updateScene, checkCmsHealth, getProjects, updateProject } from '@/lib/scenesApi'
import { generateSceneDescriptions } from '@/lib/gemini'
import { cn } from '@/lib/utils'
import { prepareForCapture, validatePaletteJson, parsePaletteJson } from '@/lib/colorConversion'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import useStore from '../store/useStore'
import faviconImg from '@/assets/favicon.png'

// Import control panel components
import {
  ControlGroup,
  NumberInput,
  SubsectionButton,
  PaletteColorPicker,
  ContrastAwarePaletteColorPicker,
  GradientPanel,
  ColorsSection,
  PatternPanel,
  EffectsPanel,
  DEFAULT_EFFECTS_CONFIG,
  TextPanel,
  IconGridDropdown,
  ColorPaletteDialog,
} from './controls'

const ControlPanel = ({ layersContainerRef }) => {
  const navigate = useNavigate()

  // Subscribe to Zustand store
  const activePanel = useStore((state) => state.activePanel)
  const setActivePanel = useStore((state) => state.setActivePanel)
  const backgroundType = useStore((state) => state.backgroundType)
  const setBackgroundType = useStore((state) => state.setBackgroundType)
  const gradientConfig = useStore((state) => state.gradientConfig)
  const setGradientConfig = useStore((state) => state.setGradientConfig)
  const auroraConfig = useStore((state) => state.auroraConfig)
  const setAuroraConfig = useStore((state) => state.setAuroraConfig)
  const blobConfig = useStore((state) => state.blobConfig)
  const setBlobConfig = useStore((state) => state.setBlobConfig)
  const fluidConfig = useStore((state) => state.fluidConfig)
  const setFluidConfig = useStore((state) => state.setFluidConfig)
  const wavesConfig = useStore((state) => state.wavesConfig)
  const setWavesConfig = useStore((state) => state.setWavesConfig)
  const ribbonConfig = useStore((state) => state.ribbonConfig)
  const setRibbonConfig = useStore((state) => state.setRibbonConfig)
  const tessellationConfig = useStore((state) => state.tessellationConfig)
  const setTessellationConfig = useStore((state) => state.setTessellationConfig)
  const effectsConfig = useStore((state) => state.effectsConfig)
  const setEffectsConfig = useStore((state) => state.setEffectsConfig)
  const textSections = useStore((state) => state.textSections)
  const setTextSections = useStore((state) => state.setTextSections)
  const textGap = useStore((state) => state.textGap)
  const setTextGap = useStore((state) => state.setTextGap)
  const textConfig = useStore((state) => state.textConfig)
  const setTextConfig = useStore((state) => state.setTextConfig)
  const colorPalette = useStore((state) => state.colorPalette)
  const setColorPalette = useStore((state) => state.setColorPalette)
  const isPaused = useStore((state) => state.isPaused)
  const setIsPaused = useStore((state) => state.setIsPaused)
  const getSceneData = useStore((state) => state.getSceneData)

  // Local UI state (not in Zustand - panel-specific)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(true)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [activeDialog, setActiveDialog] = useState(null)
  const [originalValues, setOriginalValues] = useState(null)
  const [showPaletteDialog, setShowPaletteDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [cmsAvailable, setCmsAvailable] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [saveThumbnail, setSaveThumbnail] = useState(null)
  const [generatedContent, setGeneratedContent] = useState(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const panelRef = useRef(null)

  // Parse the palette for the color picker
  const parsedPalette = colorPalette ? parsePaletteJson(colorPalette) : null

  // Randomize gradient function (moved from App.jsx)
  const randomizeGradient = useCallback(() => {
    const randomHex = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    const randomInRange = (min, max) => Math.random() * (max - min) + min
    const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)]

    // Randomize background type
    const backgroundTypes = ['simple', 'liquid', 'aurora', 'fluid', 'waves', 'ribbon']
    setBackgroundType(pickOne(backgroundTypes))

    let colors
    let numColors

    // Check if a palette is uploaded and use its colors
    if (colorPalette) {
      const parsedPalette = parsePaletteJson(colorPalette)
      const paletteColors = parsedPalette.colors.map(c => c.hex)

      if (paletteColors.length >= 2) {
        // Pick 2-5 random colors from the palette (or max available)
        numColors = Math.min(Math.floor(Math.random() * 4) + 2, paletteColors.length)
        const shuffled = [...paletteColors].sort(() => Math.random() - 0.5)
        colors = shuffled.slice(0, numColors)
      } else {
        // Fallback if palette has fewer than 2 colors
        numColors = Math.floor(Math.random() * 4) + 2
        colors = Array.from({ length: numColors }, randomHex)
      }
    } else {
      // No palette uploaded - use random colors
      numColors = Math.floor(Math.random() * 4) + 2
      colors = Array.from({ length: numColors }, randomHex)
    }

    const colorStops = colors.map((_, i) => Math.round((i / (numColors - 1)) * 100))

    setGradientConfig({
      ...gradientConfig,
      colors,
      numColors,
      type: ['linear', 'radial', 'conic'][Math.floor(Math.random() * 3)],
      startPos: { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 },
      endPos: { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 },
      colorStops,
      waveIntensity: Math.random() * 0.5 + 0.1,
      mouseInfluence: Math.random() * 0.8 + 0.2,
      wave1Speed: Math.random() * 0.4 + 0.05,
      wave1Direction: Math.random() > 0.5 ? 1 : -1,
      wave2Speed: Math.random() * 0.4 + 0.05,
      wave2Direction: Math.random() > 0.5 ? 1 : -1,
    })

    // Also randomize related layer styling
    setTessellationConfig({
      ...tessellationConfig,
      icon: pickOne(AVAILABLE_ICONS),
      color: pickOne([...colors, '#ffffff', '#000000']),
      opacity: randomInRange(0.05, 0.35),
    })

    setEffectsConfig({
      ...effectsConfig,
      textureOpacity: randomInRange(0.1, 0.9),
    })

    // Randomize text config
    setTextConfig({
      ...textConfig,
      enabled: true,
      color: pickOne([...colors, '#ffffff', '#000000']),
      opacity: randomInRange(0.7, 1),
    })

    // Randomize text sections
    const fonts = ['sans-serif', 'serif', 'mono', 'scribble']
    const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900]
    const randomizedSections = textSections.map(section => ({
      ...section,
      size: Math.floor(randomInRange(section.id === 1 ? 60 : 16, section.id === 1 ? 180 : 40)),
      weight: pickOne(weights),
      spacing: randomInRange(-0.1, 0.3),
      font: pickOne(fonts),
      italic: Math.random() > 0.7, // 30% chance for italic
    }))
    setTextSections(randomizedSections)

    // Randomize text gap
    setTextGap(Math.floor(randomInRange(10, 60)))

    // Randomize effects
    const textures = ['none', 'grain', 'scanlines', 'dots', 'grid', 'diagonal']
    const colorMaps = ['none', 'sepia', 'cyberpunk', 'sunset', 'matrix', 'noir', 'vintage']
    const textureBlendModes = ['overlay', 'multiply', 'screen', 'soft-light', 'hard-light']

    setEffectsConfig({
      ...effectsConfig,
      blur: Math.floor(randomInRange(0, 15)),
      texture: pickOne(textures),
      textureSize: Math.floor(randomInRange(10, 60)),
      textureOpacity: Math.floor(randomInRange(0.1, 0.9)),
      vignetteIntensity: Math.floor(randomInRange(0, 0.6)),
      // Randomize fluted glass - randomly enable/disable and randomize values
      flutedGlass: {
        enabled: Math.random() > 0.8, // 80% chance to enable
        segments: Math.floor(randomInRange(20, 200)),
        rotation: Math.floor(randomInRange(0, 180)),
        motionValue: Math.floor(randomInRange(0, 1)),
        motionSpeed: Math.floor(randomInRange(0, 2)),
        overlayOpacity: Math.floor(randomInRange(0, 50)),
        distortionStrength: Math.floor(randomInRange(0.005, 0.08)),
        waveFrequency: Math.floor(randomInRange(0.5, 4)),
      },
    })

    // Randomize ribbon config
    setRibbonConfig({
      ...ribbonConfig,
      ribbonCount: Math.floor(randomInRange(2, 10)),
      speed: Math.round(randomInRange(0.1, 2) * 10) / 10,
      amplitude: Math.round(randomInRange(0.1, 3) * 10) / 10,
      spread: Math.round(randomInRange(0.5, 3) * 10) / 10,
      rotation: Math.floor(randomInRange(-90, 90) / 5) * 5,
      thickness: Math.round(randomInRange(0.1, 1) * 20) / 20,
      taper: Math.round(randomInRange(-1, 1) * 10) / 10,
      noise: Math.round(randomInRange(0, 2) * 10) / 10,
      opacity: Math.round(randomInRange(0.1, 1) * 20) / 20,
    })

    // Randomize aurora config
    setAuroraConfig({
      ...auroraConfig,
      minWidth: Math.floor(randomInRange(1, 100) / 5) * 5,
      maxWidth: Math.floor(randomInRange(1, 100) / 5) * 5,
      minHeight: Math.floor(randomInRange(50, 1000) / 50) * 50,
      maxHeight: Math.floor(randomInRange(50, 1000) / 50) * 50,
      minTTL: Math.floor(randomInRange(10, 500) / 10) * 10,
      maxTTL: Math.floor(randomInRange(10, 500) / 10) * 10,
      blurAmount: Math.floor(randomInRange(0, 50)),
      lineCount: Math.floor(randomInRange(0, 500) / 10) * 10,
    })

    // Randomize fluid/mesh config
    setFluidConfig({
      ...fluidConfig,
      speed: Math.round(randomInRange(0.1, 3) * 10) / 10,
      intensity: Math.round(randomInRange(0.1, 10) * 10) / 10,
      blurAmount: Math.floor(randomInRange(0, 100)),
    })
  }, [colorPalette, gradientConfig, tessellationConfig, effectsConfig, textConfig, textSections, ribbonConfig, auroraConfig, fluidConfig, setBackgroundType, setGradientConfig, setTessellationConfig, setEffectsConfig, setTextConfig, setTextSections, setTextGap, setRibbonConfig, setAuroraConfig, setFluidConfig])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Check CMS availability on mount
  useEffect(() => {
    checkCmsHealth().then(setCmsAvailable)
  }, [])

  // Capture thumbnail as base64 at high resolution (server will resize)
  const captureThumbnail = async () => {
    if (!layersContainerRef?.current) return null

    const restoreColors = prepareForCapture(document.body)

    try {
      await new Promise(resolve => requestAnimationFrame(resolve))

      const container = layersContainerRef.current
      const width = container.offsetWidth
      const height = container.offsetHeight

      // Capture at 2x resolution for high quality (server will generate multiple sizes)
      const scale = 2

      const outputCanvas = document.createElement('canvas')
      outputCanvas.width = width * scale
      outputCanvas.height = height * scale
      const ctx = outputCanvas.getContext('2d')

      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height)

      const getLastCanvas = (selector) => {
        const canvases = container.querySelectorAll(`${selector} canvas`)
        return canvases.length > 0 ? canvases[canvases.length - 1] : null
      }

      const backgroundCanvas =
        container.querySelector('.gradient-layer canvas') ||
        getLastCanvas('.simple-gradient-layer') ||
        getLastCanvas('.fluid-gradient-layer') ||
        getLastCanvas('.aurora-layer') ||
        getLastCanvas('.waves-layer') ||
        getLastCanvas('.ribbon-layer')

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

      drawVignetteToCanvas(ctx, outputCanvas.width, outputCanvas.height, effectsConfig.vignetteIntensity)

      // Capture tessellation layer
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

      // Capture text layer
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

      restoreColors()

      // Return as base64 data URL (PNG for high quality, server will convert to optimized JPEGs)
      return outputCanvas.toDataURL('image/png')
    } catch (error) {
      console.error('Failed to capture thumbnail:', error)
      restoreColors()
      return null
    }
  }

  // Resize thumbnail for AI API call (smaller size to avoid 413 errors)
  const resizeThumbnailForAI = (base64Data, maxWidth = 800) => {
    return new Promise((resolve) => {
      const img = document.createElement('img')
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, maxWidth / img.width)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        // Use JPEG at 70% quality for much smaller file size
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.onerror = () => resolve(base64Data) // Fallback to original if resize fails
      img.src = base64Data
    })
  }

  // Handle save scene - creates scene first, then generates AI descriptions
  const handleSaveScene = async () => {
    setIsSaving(true)
    setSaveError('')
    setSaveSuccess(false)
    setIsGenerating(false)
    setSaveThumbnail(null)
    setGeneratedContent(null)

    try {
      // Step 1: Capture thumbnail
      const thumbnail = await captureThumbnail()
      setSaveThumbnail(thumbnail)
      const sceneData = getSceneData()

      // Step 2: Create scene with placeholder title
      const placeholderTitle = 'Untitled Scene'
      const scene = await createScene(placeholderTitle, sceneData, thumbnail, null)

      // Step 3: Generate AI descriptions from resized thumbnail (smaller for API)
      setIsGenerating(true)
      const smallThumbnail = await resizeThumbnailForAI(thumbnail)
      const content = await generateSceneDescriptions(smallThumbnail)
      setIsGenerating(false)

      if (content) {
        // Step 4: Update scene with generated title and descriptions
        await updateScene(scene.id, {
          title: content.title,
          short_description: content.shortDescription,
          long_description: content.longDescription
        })
        setGeneratedContent(content)
      }

      setSaveSuccess(true)
      setTimeout(() => {
        setShowSaveDialog(false)
        setSaveSuccess(false)
        setSaveThumbnail(null)
        setGeneratedContent(null)
      }, 2000)
    } catch (error) {
      console.error('Failed to save scene:', error)
      setSaveError('Failed to save scene. Check your internet connection.')
      setIsGenerating(false)
    } finally {
      setIsSaving(false)
    }
  }

  const openDialog = (dialogKey) => {
    setActiveDialog(dialogKey)
    if (dialogKey.startsWith('gradient-') || dialogKey.startsWith('aurora-') || dialogKey.startsWith('blob-') || dialogKey.startsWith('fluid-') || dialogKey.startsWith('waves-') || dialogKey.startsWith('ribbon-')) {
      setOriginalValues({ type: 'gradient', data: { gradientConfig: { ...gradientConfig }, auroraConfig: { ...auroraConfig }, blobConfig: { ...blobConfig }, fluidConfig: { ...fluidConfig }, wavesConfig: { ...wavesConfig }, ribbonConfig: { ...ribbonConfig } } })
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
        setWavesConfig(originalValues.data.wavesConfig)
        if (originalValues.data.ribbonConfig) setRibbonConfig(originalValues.data.ribbonConfig)
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
        setWavesConfig(originalValues.data.wavesConfig)
        if (originalValues.data.ribbonConfig) setRibbonConfig(originalValues.data.ribbonConfig)
      } else if (originalValues.type === 'pattern') {
        setTessellationConfig(originalValues.data)
      } else if (originalValues.type === 'effects') {
        // Reset to default effects config instead of reverting to original values
        setEffectsConfig(DEFAULT_EFFECTS_CONFIG)
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

      // For layers with separate FlutedGlassCanvas overlay (fluid, aurora, waves),
      // we need to grab the LAST canvas (fluted glass if enabled, or base canvas)
      // GradientLayer has fluted glass built into its shader, so only has one canvas
      const getLastCanvas = (selector) => {
        const canvases = container.querySelectorAll(`${selector} canvas`)
        return canvases.length > 0 ? canvases[canvases.length - 1] : null
      }

      const backgroundCanvas =
        container.querySelector('.gradient-layer canvas') ||
        getLastCanvas('.simple-gradient-layer') ||
        getLastCanvas('.fluid-gradient-layer') ||
        getLastCanvas('.aurora-layer') ||
        getLastCanvas('.waves-layer') ||
        getLastCanvas('.ribbon-layer')

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
    { id: 'gradient', label: 'Background', icon: PaintBrushBroad },
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
      'gradient-colors': 'Background Colors',
      'simple-type': 'Gradient Type',
      'simple-position': 'Position',
      'gradient-type': 'Gradient Type',
      'gradient-stops': 'Position Stops',
      'gradient-wave': 'Wave Settings',
      'gradient-mouse': 'Mouse Influence',
      'aurora-background': 'Background',
      'aurora-lines': 'Line Settings',
      'aurora-animation': 'Animation',
      'blob-background': 'Background',
      'blob-size': 'Blob Size & Count',
      'blob-animation': 'Blob Animation',
      'blob-effect': 'Gooey Effect',
      'fluid-background': 'Background',
      'fluid-animation': 'Animation Speed',
      'fluid-settings': 'Fluid Settings',
      'waves-settings': 'Wave Settings',
      'ribbon-settings': 'Ribbon Settings',
      'pattern-icon': 'Icon Settings',
      'pattern-spacing': 'Spacing',
      'pattern-mouse': 'Mouse Influence',
      'effects-blur': 'Background Blur',
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
          <ColorsSection
            gradientConfig={gradientConfig}
            setGradientConfig={setGradientConfig}
            parsedPalette={parsedPalette}
          />
        )
      case 'simple-type':
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
      case 'simple-position':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Start X: `}>
              <NumberInput value={[gradientConfig.startPos.x]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, startPos: { ...gradientConfig.startPos, x: val } })} min={-100} max={200} step={10} showButtons />
            </ControlGroup>
            <ControlGroup label={`Start Y: `}>
              <NumberInput value={[gradientConfig.startPos.y]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, startPos: { ...gradientConfig.startPos, y: val } })} min={-100} max={200} step={10} showButtons />
            </ControlGroup>
            <ControlGroup label={`End X: `}>
              <NumberInput value={[gradientConfig.endPos.x]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, endPos: { ...gradientConfig.endPos, x: val } })} min={-100} max={200} step={10} showButtons />
            </ControlGroup>
            <ControlGroup label={`End Y: `}>
              <NumberInput value={[gradientConfig.endPos.y]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, endPos: { ...gradientConfig.endPos, y: val } })} min={-100} max={200} step={10} showButtons />
            </ControlGroup>
          </div>
        )
      case 'gradient-stops':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Start X: `}>
              <NumberInput value={[gradientConfig.startPos.x]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, startPos: { ...gradientConfig.startPos, x: val } })} min={-100} max={100} step={5} showButtons />
            </ControlGroup>
            <ControlGroup label={`Start Y: `}>
              <NumberInput value={[gradientConfig.startPos.y]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, startPos: { ...gradientConfig.startPos, y: val } })} min={-100} max={100} step={5} showButtons />
            </ControlGroup>
            <ControlGroup label={`End X: `}>
              <NumberInput value={[gradientConfig.endPos.x]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, endPos: { ...gradientConfig.endPos, x: val } })} min={-100} max={100} step={5} showButtons />
            </ControlGroup>
            <ControlGroup label={`End Y: `}>
              <NumberInput value={[gradientConfig.endPos.y]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, endPos: { ...gradientConfig.endPos, y: val } })} min={-100} max={100} step={5} showButtons />
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
          <ControlGroup label="Background Color">
            <div className="flex items-center gap-2">
              <PaletteColorPicker value={auroraConfig.backgroundColor} onChange={(newColor) => setAuroraConfig({ ...auroraConfig, backgroundColor: newColor })} palette={parsedPalette} className="w-10 h-10" />
              <Input value={auroraConfig.backgroundColor} onChange={(e) => setAuroraConfig({ ...auroraConfig, backgroundColor: e.target.value })} className="h-9 font-mono text-xs flex-1" />
            </div>
          </ControlGroup>
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
      case 'blob-background':
        return (
          <ControlGroup label="Background Color">
            <div className="flex items-center gap-2">
              <PaletteColorPicker value={blobConfig.backgroundColor} onChange={(newColor) => setBlobConfig({ ...blobConfig, backgroundColor: newColor })} palette={parsedPalette} className="w-10 h-9" />
              <Input value={blobConfig.backgroundColor} onChange={(e) => setBlobConfig({ ...blobConfig, backgroundColor: e.target.value })} className="h-9 font-mono text-xs flex-1" />
            </div>
          </ControlGroup>
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
      case 'fluid-background':
        return (
          <ControlGroup label="Background Color">
            <div className="flex items-center gap-2">
              <PaletteColorPicker value={fluidConfig.backgroundColor} onChange={(newColor) => setFluidConfig({ ...fluidConfig, backgroundColor: newColor })} palette={parsedPalette} className="w-10 h-9" />
              <Input value={fluidConfig.backgroundColor} onChange={(e) => setFluidConfig({ ...fluidConfig, backgroundColor: e.target.value })} className="h-9 font-mono text-xs flex-1" />
            </div>
          </ControlGroup>
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
            <ControlGroup label={`Intensity`}><NumberInput value={[fluidConfig.intensity]} onValueChange={([val]) => setFluidConfig({ ...fluidConfig, intensity: val })} min={0.1} max={10} step={0.1} showButtons /></ControlGroup>
            <ControlGroup label={`Blur`}><NumberInput value={[fluidConfig.blurAmount]} onValueChange={([val]) => setFluidConfig({ ...fluidConfig, blurAmount: val })} min={0} max={100} step={1} showButtons /></ControlGroup>
          </div>
        )
      case 'waves-settings':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Wave Height`}><NumberInput value={[wavesConfig.waveHeight]} onValueChange={([val]) => setWavesConfig({ ...wavesConfig, waveHeight: val })} min={0.05} max={0.5} step={0.05} showButtons /></ControlGroup>
            <ControlGroup label={`Frequency`}><NumberInput value={[wavesConfig.waveFrequency]} onValueChange={([val]) => setWavesConfig({ ...wavesConfig, waveFrequency: val })} min={1} max={10} step={0.5} showButtons /></ControlGroup>
            <ControlGroup label={`Rotation (°)`}><NumberInput value={[wavesConfig.rotation]} onValueChange={([val]) => setWavesConfig({ ...wavesConfig, rotation: val })} min={-180} max={180} step={15} showButtons /></ControlGroup>
            <ControlGroup label={`Speed`}><NumberInput value={[wavesConfig.speed]} onValueChange={([val]) => setWavesConfig({ ...wavesConfig, speed: val })} min={0} max={2} step={0.1} showButtons /></ControlGroup>
            <ControlGroup label={`Layers`}><NumberInput value={[wavesConfig.layers]} onValueChange={([val]) => setWavesConfig({ ...wavesConfig, layers: val })} min={2} max={8} step={1} showButtons /></ControlGroup>
            <ControlGroup label={`Blur`}><NumberInput value={[wavesConfig.blur]} onValueChange={([val]) => setWavesConfig({ ...wavesConfig, blur: val })} min={0} max={100} step={5} showButtons /></ControlGroup>
            <ControlGroup label={`Phase Offset`}><NumberInput value={[wavesConfig.phaseOffset ?? 0]} onValueChange={([val]) => setWavesConfig({ ...wavesConfig, phaseOffset: val })} min={0} max={2} step={0.1} showButtons /></ControlGroup>
          </div>
        )
      case 'ribbon-settings':
        return (
          <div className="space-y-2">
            <ControlGroup label={`Ribbon Count`}><NumberInput value={[ribbonConfig.ribbonCount]} onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, ribbonCount: val })} min={2} max={10} step={1} showButtons /></ControlGroup>
            <ControlGroup label={`Speed`}><NumberInput value={[ribbonConfig.speed]} onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, speed: val })} min={0.1} max={2} step={0.1} showButtons /></ControlGroup>
            <ControlGroup label={`Amplitude`}><NumberInput value={[ribbonConfig.amplitude]} onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, amplitude: val })} min={0.1} max={3} step={0.1} showButtons /></ControlGroup>
            <ControlGroup label={`Spread`}><NumberInput value={[ribbonConfig.spread]} onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, spread: val })} min={0.5} max={3} step={0.1} showButtons /></ControlGroup>
            <ControlGroup label={`Rotation (°)`}><NumberInput value={[ribbonConfig.rotation]} onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, rotation: val })} min={-90} max={90} step={5} showButtons /></ControlGroup>
            <ControlGroup label={`Thickness`}><NumberInput value={[ribbonConfig.thickness]} onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, thickness: val })} min={0.1} max={1} step={0.05} showButtons /></ControlGroup>
            <ControlGroup label={`Taper`}><NumberInput value={[ribbonConfig.taper]} onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, taper: val })} min={-1} max={1} step={0.1} showButtons /></ControlGroup>
            <ControlGroup label={`Noise`}><NumberInput value={[ribbonConfig.noise]} onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, noise: val })} min={0} max={2} step={0.1} showButtons /></ControlGroup>
            <ControlGroup label={`Opacity`}><NumberInput value={[ribbonConfig.opacity]} onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, opacity: val })} min={0.1} max={1} step={0.05} showButtons /></ControlGroup>
          </div>
        )
      case 'pattern-icon':
        return (
          <div className="space-y-2">
            <ControlGroup label="Icon">
              <IconGridDropdown
                value={tessellationConfig.icon}
                onChange={(v) => setTessellationConfig({ ...tessellationConfig, icon: v })}
              />
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
            <ControlGroup label="Section Gap"><NumberInput value={[textGap]} onValueChange={([val]) => setTextGap(val)} min={-10} max={100} step={4} showButtons={true} /></ControlGroup>
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
                {(section.font === 'serif' || section.font === 'scribble') && (
                  <ControlGroup label="Italic">
                    <Switch
                      checked={section.italic || false}
                      onCheckedChange={(checked) => updateTextSection(section.id, 'italic', checked)}
                    />
                  </ControlGroup>
                )}
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

  // Capture Modal Component (shared between mobile and desktop)
  const CaptureModal = () => (
    <Dialog open={showCaptureModal} onOpenChange={setShowCaptureModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCapturing ? 'Exporting...' : 'Export Image'}</DialogTitle>
          <DialogDescription>
            {isCapturing ? 'Please wait while we generate your image.' : 'Choose how you want to capture your scene.'}
          </DialogDescription>
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

  // Save Scene Dialog Component (shared between mobile and desktop)
  const SaveSceneDialog = () => (
    <Dialog open={showSaveDialog} onOpenChange={(open) => {
      setShowSaveDialog(open)
      if (!open) {
        setSaveError('')
        setSaveSuccess(false)
        setIsSaving(false)
        setIsGenerating(false)
        setSaveThumbnail(null)
        setGeneratedContent(null)
      }
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <FloppyDisk size={20} weight="duotone" />
              Save Scene
            </div>
          </DialogTitle>
          <DialogDescription>
            Save your current scene configuration to your library.
          </DialogDescription>
        </DialogHeader>

        {/* Show thumbnail and color stops while saving/generating */}
        {(isSaving || saveSuccess) && saveThumbnail && (
          <div className="space-y-4">
            {/* Thumbnail preview */}
            <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
              <img src={saveThumbnail} alt="Scene preview" className="w-full h-full object-cover" />
            </div>

            {/* Color stops */}
            <div className="flex gap-1 h-6 rounded-md overflow-hidden">
              {gradientConfig.colors.map((color, index) => (
                <div
                  key={index}
                  className="flex-1 transition-all"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {saveSuccess ? (
          <div className="space-y-4">
            {/* Show generated content on success */}
            {generatedContent && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Title</span>
                  <p className="font-medium">{generatedContent.title}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Description</span>
                  <p className="text-sm text-muted-foreground">{generatedContent.shortDescription}</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check size={16} weight="bold" className="text-green-500" />
              </div>
              <span className="text-muted-foreground">Scene saved successfully!</span>
            </div>
          </div>
        ) : isSaving ? (
          <div className="flex items-center justify-center gap-3 py-4">
            <CircleNotch size={24} className="animate-spin text-primary" />
            <span className="text-muted-foreground">
              {isGenerating ? 'Generating AI descriptions...' : 'Saving scene...'}
            </span>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {!cmsAvailable && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-600 dark:text-yellow-400">
                Unable to connect to database. Check your internet connection.
              </div>
            )}
            {saveError ? (
              <div className="text-center py-4">
                <p className="text-sm text-destructive">{saveError}</p>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Save this scene to your collection. AI will generate a title and description automatically.
              </div>
            )}
          </div>
        )}
        {!saveSuccess && !isSaving && (
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSaveScene} disabled={!cmsAvailable}>
              <FloppyDisk size={16} className="mr-2" />
              Save Scene
            </Button>
          </DialogFooter>
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
            <Button variant="outline" size="sm" className="flex items-center gap-2 h-10 px-4 border-primary/50" onClick={() => setIsPaused(!isPaused)} title={isPaused ? "Resume Animations" : "Pause Animations"}>
              {isPaused ? <Play size={18} weight="fill" /> : <Pause size={18} />}
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2 h-10 px-4 border-primary/50" onClick={() => setShowPaletteDialog(true)} title={colorPalette ? "Edit Palette" : "Upload Palette"}>
              <Palette size={18} weight={colorPalette ? 'fill' : 'regular'} />
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2 h-10 px-4 border-primary/50" onClick={randomizeGradient} title="Shuffle Gradient">
              <Shuffle size={18} />
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2 h-10 px-4 border-primary/50" onClick={() => setShowSaveDialog(true)} title="Save Scene">
              <FloppyDisk size={18} />
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2 h-10 px-4 border-primary/50" onClick={() => navigate('/scenes')} title="Saved Scenes">
              <Images size={18} />
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
                  {/* Colors Section - Always visible */}
                  <div className="px-1">
                    <Button
                      variant="outline"
                      className="w-full h-11 px-3 justify-between"
                      onClick={() => openDialog('gradient-colors')}
                    >
                      <span className="text-sm">Colors</span>
                      <div className="flex items-center gap-1">
                        {gradientConfig.colors.map((color, idx) => (
                          <div
                            key={idx}
                            className="w-5 h-5 rounded-sm border border-border/50"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </Button>
                  </div>

                  <div className="h-px bg-border mx-3" />

                  {/* Background Type Selector */}
                  <div className="flex items-center justify-between px-3 py-2">
                    <Label className="text-sm">Background Type</Label>
                    <Select value={backgroundType} onValueChange={(value) => setBackgroundType(value)}>
                      <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple</SelectItem>
                        <SelectItem value="liquid">Fog</SelectItem>
                        <SelectItem value="aurora">Aurora</SelectItem>
                        <SelectItem value="fluid">Mesh</SelectItem>
                        <SelectItem value="waves">Waves</SelectItem>
                        <SelectItem value="ribbon">Ribbon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type-specific settings */}
                  <div className="space-y-1 flex flex-row flex-wrap gap-1 px-1">
                    {backgroundType === 'simple' && (
                      <>
                        <SubsectionButton title="Type" onClick={() => openDialog('simple-type')} />
                        <SubsectionButton title="Position" onClick={() => openDialog('simple-position')} />
                      </>
                    )}
                    {backgroundType === 'liquid' && (
                      <>
                        <SubsectionButton title="Type" onClick={() => openDialog('gradient-type')} />
                        <SubsectionButton title="Stops" onClick={() => openDialog('gradient-stops')} />
                        <SubsectionButton title="Wave" onClick={() => openDialog('gradient-wave')} />
                        <SubsectionButton title="Mouse" onClick={() => openDialog('gradient-mouse')} />
                      </>
                    )}
                    {backgroundType === 'aurora' && (
                      <>
                        <SubsectionButton title="Background" onClick={() => openDialog('aurora-background')} />
                        <SubsectionButton title="Lines" onClick={() => openDialog('aurora-lines')} />
                        <SubsectionButton title="Animation" onClick={() => openDialog('aurora-animation')} />
                      </>
                    )}
                    {backgroundType === 'fluid' && (
                      <>
                        <SubsectionButton title="Background" onClick={() => openDialog('fluid-background')} />
                        <SubsectionButton title="Animation" onClick={() => openDialog('fluid-animation')} />
                        <SubsectionButton title="Settings" onClick={() => openDialog('fluid-settings')} />
                      </>
                    )}
                    {backgroundType === 'waves' && (
                      <>
                        <SubsectionButton title="Settings" onClick={() => openDialog('waves-settings')} />
                      </>
                    )}
                    {backgroundType === 'ribbon' && (
                      <>
                        <SubsectionButton title="Settings" onClick={() => openDialog('ribbon-settings')} />
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
                <div className="space-y-2">
                  <div className="space-y-1 flex flex-row flex-wrap gap-1 px-1">
                    <SubsectionButton title="Blur" onClick={() => openDialog('effects-blur')} />
                    <SubsectionButton title="Texture" onClick={() => openDialog('effects-texture')} />
                    <SubsectionButton title="Color Map" onClick={() => openDialog('effects-colormap')} />
                    <SubsectionButton title="Vignette" onClick={() => openDialog('effects-vignette')} />
                    <SubsectionButton title="Color" onClick={() => openDialog('effects-color')} />
                    <SubsectionButton title="Fluted Glass" onClick={() => openDialog('effects-fluted')} />
                    <div className="flex flex-1 justify-end px-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEffectsConfig(DEFAULT_EFFECTS_CONFIG)}
                        className="h-full px-3 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <ArrowCounterClockwise size={14} className="mr-1" />
                        Reset
                      </Button>
                    </div>
                  </div>

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
            <DialogHeader>
              <DialogTitle>{getDialogTitle(activeDialog)}</DialogTitle>
              <DialogDescription className="sr-only">
                Adjust the settings for this section.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] py-4">{renderDialogContent()}</ScrollArea>
            <DialogFooter className="flex-row gap-2">
              <Button variant="outline" className="flex-1" onClick={resetDialog}><ArrowCounterClockwise size={16} className="mr-2" />Reset</Button>
              <Button className="flex-1" onClick={applyDialog}><Check size={16} className="mr-2" />Apply</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <CaptureModal />
        <ColorPaletteDialog
          open={showPaletteDialog}
          onOpenChange={setShowPaletteDialog}
          colorPalette={colorPalette}
          setColorPalette={setColorPalette}
          gradientConfig={gradientConfig}
          setGradientConfig={setGradientConfig}
          cmsAvailable={cmsAvailable}
        />
        <SaveSceneDialog />
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
          "text-foreground",
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

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => setIsCollapsed(!isCollapsed)}>
              {isCollapsed ? <CaretUpDown size={12} /> : <ArrowsInSimple size={12} />}
              <img src={faviconImg} alt="Logo" className="h-4 w-4 rounded-[4px]" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/scenes')} title="Saved Scenes">
              <Images size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPaletteDialog(true)} title={colorPalette ? "Edit Palette" : "Upload Palette"}>
              <Palette size={16} weight={colorPalette ? 'fill' : 'regular'} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={randomizeGradient} disabled={isCapturing} title="Shuffle Gradient">
              <Shuffle size={16} weight="regular" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsPaused(!isPaused)} title={isPaused ? "Resume Animations" : "Pause Animations"}>
              {isPaused ? <Play size={16} weight="fill" /> : <Pause size={16} />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSaveDialog(true)} title="Save Scene">
              <FloppyDisk size={16} />
            </Button>

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowCaptureModal(true)} disabled={isCapturing}>
              <Camera size={16} weight={isCapturing ? 'fill' : 'regular'} />
            </Button>

          </div>
          <div className="text-muted-foreground"><DotsSixVertical size={16} weight="bold" /></div>
        </div>

        {!isCollapsed && (
          <Tabs value={activePanel} onValueChange={setActivePanel} className="flex h-full flex-col flex-1 max-h-[calc(85vh-4rem)]">
            <TabsList className="w-full rounded-none border-b border-border bg-transparent p-1 gap-1 shrink-0">
              {tabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex-1 flex flex-col gap-1 py-2 data-[state=active]:bg-muted rounded-md">
                  <tab.icon size={14} weight={activePanel === tab.id ? 'fill' : 'regular'} />
                  <span className="text-[10px] uppercase tracking-wide">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="min-h-0 flex flex-col h-full">
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
                    wavesConfig={wavesConfig}
                    setWavesConfig={setWavesConfig}
                    ribbonConfig={ribbonConfig}
                    setRibbonConfig={setRibbonConfig}
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
      <ColorPaletteDialog
        open={showPaletteDialog}
        onOpenChange={setShowPaletteDialog}
        colorPalette={colorPalette}
        setColorPalette={setColorPalette}
        gradientConfig={gradientConfig}
        setGradientConfig={setGradientConfig}
        cmsAvailable={cmsAvailable}
      />
      <SaveSceneDialog />
    </>
  )
}

export default ControlPanel
