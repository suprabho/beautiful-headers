import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { ArrowLeft, CircleNotch, Warning, Play, Code, Check, Copy, Download, ArrowCounterClockwiseIcon as ArrowCounterClockwise, CameraIcon, CheckCircle, XCircle } from '@phosphor-icons/react'
import { getSceneBySlug, getProjects, updateScene, verifyDeletePassword, titleToSlug, recaptureThumbnail, deleteScene } from '@/lib/scenesApi'
import { generateSceneDescriptions } from '@/lib/gemini'
import { prepareForCapture } from '@/lib/colorConversion'
import { drawTextToCanvas } from '@/lib/canvasCapture'
import { Button } from '@/components/ui/button'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import '../App.css'
import GradientLayer from './GradientLayer'
import SimpleGradientLayer from './SimpleGradientLayer'
import AuroraLayer from './AuroraLayer'
import FluidGradientLayer from './FluidGradientLayer'
import WavesLayer from './WavesLayer'
import RibbonLayer from './RibbonLayer'
import DandelionLayer from './DandelionLayer'
import ParticleRingLayer from './ParticleRingLayer'
import ShapeTrailLayer from './ShapeTrailLayer'
import TessellationLayer, { ICON_PATHS } from './TessellationLayer'
import EffectsLayer from './EffectsLayer'
import TextLayer from './TextLayer'
import EmbedDialog from './EmbedDialog'
import DownloadDialog from './dialogs/DownloadDialog'
import RegenerateDialog from './dialogs/RegenerateDialog'
import RecaptureDialog from './dialogs/RecaptureDialog'
import ProjectsDialog from './dialogs/ProjectsDialog'
import AcceptReviewDialog from './dialogs/AcceptReviewDialog'
import RejectReviewDialog from './dialogs/RejectReviewDialog'
import useStore from '../store/useStore'

function SceneViewPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const loadSceneData = useStore((state) => state.loadSceneData)
  const setCurrentSceneId = useStore((state) => state.setCurrentSceneId)
  const setCurrentPage = useStore((state) => state.setCurrentPage)

  const [scene, setScene] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false)
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)
  const [projects, setProjects] = useState([])

  // Projects dialog state
  const [projectsDialogOpen, setProjectsDialogOpen] = useState(false)
  const [allProjects, setAllProjects] = useState([])
  const [loadingAllProjects, setLoadingAllProjects] = useState(false)

  // Dialog open states
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false)
  const [recaptureDialogOpen, setRecaptureDialogOpen] = useState(false)
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  const [thumbnailCacheBuster, setThumbnailCacheBuster] = useState('')
  const [thumbnailCopied, setThumbnailCopied] = useState(false)

  // Update document meta tags with scene data (use large for OG image)
  useDocumentMeta({
    title: scene ? `${scene.title} - Aura` : null,
    description: scene?.short_description || scene?.long_description,
    image: scene?.thumbnail?.large || scene?.thumbnail?.medium || scene?.thumbnail?.small,
    url: scene ? `https://aura.promad.design/scenes/${slug}` : null,
  })

  // Ref to track if RAF is pending for mouse throttling
  const rafPendingRef = useRef(false)
  const pendingMouseRef = useRef({ x: 0.5, y: 0.5 })
  const layersContainerRef = useRef(null)

  // Throttled mouse move handler
  const handleMouseMove = useCallback((e) => {
    pendingMouseRef.current.x = e.clientX / window.innerWidth
    pendingMouseRef.current.y = e.clientY / window.innerHeight

    if (rafPendingRef.current) return

    rafPendingRef.current = true
    requestAnimationFrame(() => {
      setMousePos({
        x: pendingMouseRef.current.x,
        y: pendingMouseRef.current.y
      })
      rafPendingRef.current = false
    })
  }, [])

  useEffect(() => {
    const fetchScene = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const sceneData = await getSceneBySlug(slug)
        setScene(sceneData)

        // Fetch projects if scene has linked projects
        const selectedProjectIds = sceneData?.scene_data?.selectedProjectIds || []
        if (selectedProjectIds.length > 0) {
          const allProjects = await getProjects()
          const linkedProjects = allProjects.filter(p => selectedProjectIds.includes(p.id))
          setProjects(linkedProjects)
        }
      } catch (err) {
        console.error('Failed to fetch scene:', err)
        setError('Scene not found')
      } finally {
        setIsLoading(false)
      }
    }

    if (slug) {
      fetchScene()
    }
  }, [slug])

  const handleApplyScene = () => {
    if (scene?.scene_data) {
      loadSceneData(scene.scene_data)
      setCurrentSceneId(scene.id)
      setCurrentPage('editor')
      navigate('/')
    }
  }

  // Open projects dialog and load all projects
  const handleOpenProjectsDialog = async () => {
    setProjectsDialogOpen(true)
    setLoadingAllProjects(true)

    try {
      const all = await getProjects()
      setAllProjects(all)
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoadingAllProjects(false)
    }
  }

  // Save project assignments (called from ProjectsDialog)
  const handleSaveProjects = async (selectedProjectIds, password) => {
    const isValid = await verifyDeletePassword(password)
    if (!isValid) throw new Error('Incorrect password')

    const updatedSceneData = {
      ...scene.scene_data,
      selectedProjectIds,
    }

    await updateScene(scene.id, { sceneData: updatedSceneData })

    setScene(prev => ({
      ...prev,
      scene_data: updatedSceneData,
    }))

    const linkedProjects = allProjects.filter(p => selectedProjectIds.includes(p.id))
    setProjects(linkedProjects)
  }

  // Convert a thumbnail URL to a resized base64 string for the AI API
  const thumbnailUrlToBase64 = (url, maxWidth = 800) => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img')
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, maxWidth / img.width)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.onerror = () => reject(new Error('Failed to load thumbnail image'))
      img.src = url
    })
  }

  // Regenerate AI descriptions (called from RegenerateDialog)
  const handleRegenerate = async (password) => {
    const isValid = await verifyDeletePassword(password)
    if (!isValid) throw new Error('Incorrect password')

    const thumbnailUrl = scene.thumbnail?.medium || scene.thumbnail?.small || scene.thumbnail?.large
    if (!thumbnailUrl) throw new Error('No thumbnail available for this scene')

    const base64Thumbnail = await thumbnailUrlToBase64(thumbnailUrl)
    const content = await generateSceneDescriptions(base64Thumbnail)

    if (!content) throw new Error('AI generation failed. Please try again.')

    await updateScene(scene.id, {
      title: content.title,
      short_description: content.shortDescription,
      long_description: content.longDescription,
    })

    setScene(prev => ({
      ...prev,
      title: content.title,
      slug: titleToSlug(content.title),
      short_description: content.shortDescription,
      long_description: content.longDescription,
    }))
  }

  // Recapture thumbnail (called from RecaptureDialog)
  const handleRecaptureThumbnail = async (password) => {
    const isValid = await verifyDeletePassword(password)
    if (!isValid) throw new Error('Incorrect password')

    if (!layersContainerRef?.current) throw new Error('Scene not ready for capture')

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
        getLastCanvas('.ribbon-layer') ||
        getLastCanvas('.dandelion-layer') ||
        getLastCanvas('.particle-ring-layer') ||
        getLastCanvas('.shape-trail-layer')

      if (backgroundCanvas) {
        const wrapper = container.querySelector('.gradient-effects-wrapper')
        const filterStyle = wrapper ? getComputedStyle(wrapper).filter : 'none'
        ctx.filter = filterStyle !== 'none' ? filterStyle : 'none'
        ctx.drawImage(backgroundCanvas, 0, 0, outputCanvas.width, outputCanvas.height)
        ctx.filter = 'none'
      }

      const currentEffectsConfig = scene?.scene_data?.effectsConfig || {}
      drawTextureToCanvas(
        ctx,
        outputCanvas.width,
        outputCanvas.height,
        currentEffectsConfig.texture,
        (currentEffectsConfig.textureSize || 20) * scale,
        currentEffectsConfig.textureOpacity || 0.5,
        currentEffectsConfig.textureBlendMode || 'overlay'
      )
      drawVignetteToCanvas(ctx, outputCanvas.width, outputCanvas.height, currentEffectsConfig.vignetteIntensity || 0)

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

      const sceneTextConfig = scene?.scene_data?.textConfig || {}
      if (sceneTextConfig.enabled) {
        drawTextToCanvas(ctx, outputCanvas.width, outputCanvas.height, {
          sections: scene?.scene_data?.textSections || [],
          gap: scene?.scene_data?.textGap || 0,
          color: sceneTextConfig.color,
          opacity: sceneTextConfig.opacity,
        }, scale)
      }

      const base64Data = outputCanvas.toDataURL('image/jpeg', 0.9)
      restoreColors()

      const updatedScene = await recaptureThumbnail(scene.id, base64Data)

      setScene(prev => ({
        ...prev,
        thumbnail: updatedScene.thumbnail,
      }))

      setThumbnailCacheBuster(`?t=${Date.now()}`)
    } catch (captureError) {
      restoreColors()
      throw captureError
    }
  }

  // Accept review: recapture thumbnail + remove pendingReview (called from AcceptReviewDialog)
  const handleAcceptReview = async (password) => {
    const isValid = await verifyDeletePassword(password)
    if (!isValid) throw new Error('Incorrect password')

    if (!layersContainerRef?.current) throw new Error('Scene not ready for capture')

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
        getLastCanvas('.ribbon-layer') ||
        getLastCanvas('.dandelion-layer') ||
        getLastCanvas('.particle-ring-layer') ||
        getLastCanvas('.shape-trail-layer')

      if (backgroundCanvas) {
        const wrapper = container.querySelector('.gradient-effects-wrapper')
        const filterStyle = wrapper ? getComputedStyle(wrapper).filter : 'none'
        ctx.filter = filterStyle !== 'none' ? filterStyle : 'none'
        ctx.drawImage(backgroundCanvas, 0, 0, outputCanvas.width, outputCanvas.height)
        ctx.filter = 'none'
      }

      const currentEffectsConfig = scene?.scene_data?.effectsConfig || {}
      drawTextureToCanvas(
        ctx,
        outputCanvas.width,
        outputCanvas.height,
        currentEffectsConfig.texture,
        (currentEffectsConfig.textureSize || 20) * scale,
        currentEffectsConfig.textureOpacity || 0.5,
        currentEffectsConfig.textureBlendMode || 'overlay'
      )
      drawVignetteToCanvas(ctx, outputCanvas.width, outputCanvas.height, currentEffectsConfig.vignetteIntensity || 0)

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

      const reviewTextConfig = scene?.scene_data?.textConfig || {}
      if (reviewTextConfig.enabled) {
        drawTextToCanvas(ctx, outputCanvas.width, outputCanvas.height, {
          sections: scene?.scene_data?.textSections || [],
          gap: scene?.scene_data?.textGap || 0,
          color: reviewTextConfig.color,
          opacity: reviewTextConfig.opacity,
        }, scale)
      }

      const base64Data = outputCanvas.toDataURL('image/jpeg', 0.9)
      restoreColors()

      const updatedScene = await recaptureThumbnail(scene.id, base64Data)

      const updatedSceneData = { ...scene.scene_data }
      delete updatedSceneData.pendingReview
      await updateScene(scene.id, { sceneData: updatedSceneData })

      setScene(prev => ({
        ...prev,
        thumbnail: updatedScene.thumbnail,
        scene_data: updatedSceneData,
      }))

      setThumbnailCacheBuster(`?t=${Date.now()}`)
    } catch (captureError) {
      restoreColors()
      throw captureError
    }
  }

  // Reject review: delete scene (called from RejectReviewDialog)
  const handleRejectReview = async (password) => {
    const isValid = await verifyDeletePassword(password)
    if (!isValid) throw new Error('Incorrect password')

    await deleteScene(scene.id)
    navigate('/scenes')
  }

  // Helper function to draw texture to canvas
  const drawTextureToCanvas = (ctx, width, height, texture, textureSize, textureOpacity, blendMode = 'overlay') => {
    if (!texture || texture === 'none') return

    const textureCanvas = document.createElement('canvas')
    textureCanvas.width = width
    textureCanvas.height = height
    const textureCtx = textureCanvas.getContext('2d')

    const lineWidth = Math.max(1, textureSize / 10)
    const dotSize = textureSize / 8

    switch (texture) {
      case 'noise': {
        const imageData = textureCtx.createImageData(width, height)
        for (let i = 0; i < imageData.data.length; i += 4) {
          const value = Math.random() * 255
          imageData.data[i] = value
          imageData.data[i + 1] = value
          imageData.data[i + 2] = value
          imageData.data[i + 3] = 60
        }
        textureCtx.putImageData(imageData, 0, 0)
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

  // Download handler (called from DownloadDialog)
  const handleDownload = async (downloadOptions) => {
    if (!layersContainerRef?.current) return

    const restoreColors = prepareForCapture(document.body)

    try {
      await new Promise(resolve => requestAnimationFrame(resolve))

      const container = layersContainerRef.current
      const width = container.offsetWidth
      const height = container.offsetHeight

      const scaleMap = { 'small': 0.5, 'medium': 1, 'large': 1.5, 'full': 2 }
      const scale = scaleMap[downloadOptions.size] || 2

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
        getLastCanvas('.ribbon-layer') ||
        getLastCanvas('.dandelion-layer') ||
        getLastCanvas('.particle-ring-layer') ||
        getLastCanvas('.shape-trail-layer')

      if (backgroundCanvas) {
        const wrapper = container.querySelector('.gradient-effects-wrapper')
        const filterStyle = wrapper ? getComputedStyle(wrapper).filter : 'none'
        ctx.filter = filterStyle !== 'none' ? filterStyle : 'none'
        ctx.drawImage(backgroundCanvas, 0, 0, outputCanvas.width, outputCanvas.height)
        ctx.filter = 'none'
      }

      const currentEffectsConfig = scene?.scene_data?.effectsConfig || {}
      drawTextureToCanvas(
        ctx,
        outputCanvas.width,
        outputCanvas.height,
        currentEffectsConfig.texture,
        (currentEffectsConfig.textureSize || 20) * scale,
        currentEffectsConfig.textureOpacity || 0.5,
        currentEffectsConfig.textureBlendMode || 'overlay'
      )
      drawVignetteToCanvas(ctx, outputCanvas.width, outputCanvas.height, currentEffectsConfig.vignetteIntensity || 0)

      if (!downloadOptions.hideIcons) {
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
      }

      if (!downloadOptions.hideText) {
        const dlTextConfig = scene?.scene_data?.textConfig || {}
        if (dlTextConfig.enabled) {
          drawTextToCanvas(ctx, outputCanvas.width, outputCanvas.height, {
            sections: scene?.scene_data?.textSections || [],
            gap: scene?.scene_data?.textGap || 0,
            color: dlTextConfig.color,
            opacity: dlTextConfig.opacity,
          }, scale)
        }
      }

      const filename = `${scene.title || slug}-${downloadOptions.size}.png`

      await new Promise((resolve) => {
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
          resolve()
        }, 'image/png')
      })
    } catch (error) {
      console.error('Failed to download:', error)
      restoreColors()
      throw error
    }
  }

  // Build the gradient filter string
  const getGradientFilter = () => {
    if (!scene?.scene_data) return 'none'
    const effectsConfig = scene.scene_data.effectsConfig || {}
    const backgroundType = scene.scene_data.backgroundType || 'liquid'

    if (backgroundType === 'liquid') {
      return effectsConfig.blur > 0 ? `blur(${effectsConfig.blur}px)` : 'none'
    }

    const filters = [
      effectsConfig.blur > 0 ? `blur(${effectsConfig.blur}px)` : '',
      `saturate(${effectsConfig.saturation || 100}%)`,
      `contrast(${effectsConfig.contrast || 100}%)`,
      `brightness(${effectsConfig.brightness || 100}%)`,
    ]

    switch (effectsConfig.colorMap) {
      case 'sepia': filters.push('sepia(0.8)'); break
      case 'cyberpunk': filters.push('hue-rotate(280deg) saturate(1.5)'); break
      case 'sunset': filters.push('hue-rotate(30deg) saturate(1.3)'); break
      case 'matrix': filters.push('hue-rotate(90deg) saturate(2) brightness(0.9)'); break
      case 'noir': filters.push('grayscale(1) contrast(1.2)'); break
      case 'vintage': filters.push('sepia(0.3) saturate(1.5) hue-rotate(-10deg)'); break
    }

    return filters.filter(Boolean).join(' ') || 'none'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <CircleNotch size={32} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !scene) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
          <div className="container max-w-420 w-full mx-auto px-4 h-14 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/scenes')}>
              <ArrowLeft size={20} weight="bold" />
            </Button>
            <h1 className="text-lg font-semibold">Scene Not Found</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-20">
          <div className="flex flex-col items-center justify-center text-center">
            <Warning size={48} className="text-destructive mb-4" weight="light" />
            <p className="text-muted-foreground mb-4">{error || 'This scene does not exist.'}</p>
            <Button variant="outline" onClick={() => navigate('/scenes')}>
              View All Scenes
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const sceneData = scene.scene_data || {}
  const backgroundType = sceneData.backgroundType || 'liquid'
  const gradientConfig = sceneData.gradientConfig || {}
  const auroraConfig = sceneData.auroraConfig || {}
  const fluidConfig = sceneData.fluidConfig || {}
  const wavesConfig = sceneData.wavesConfig || {}
  const ribbonConfig = sceneData.ribbonConfig || {}
  const dandelionConfig = sceneData.dandelionConfig || {}
  const particleRingConfig = sceneData.particleRingConfig || {}
  const shapeTrailConfig = sceneData.shapeTrailConfig || {}
  const tessellationConfig = sceneData.tessellationConfig || {}
  const effectsConfig = sceneData.effectsConfig || {}
  const textSections = sceneData.textSections || []
  const textGap = sceneData.textGap || 0
  const textConfig = sceneData.textConfig || {}
  const mouseConfig = sceneData.mouseConfig || { enabled: true, intensity: 0.5 }
  const inputEnabled = sceneData.inputEnabled !== undefined ? sceneData.inputEnabled : true
  const effectiveMouseIntensity = inputEnabled ? mouseConfig.intensity : 0
  const effectiveMouseEnabled = inputEnabled && mouseConfig.enabled

  return (
    <div className="min-h-screen bg-background" onMouseMove={effectiveMouseEnabled ? handleMouseMove : undefined}>
      {/* Full-screen scene preview */}
      <div className="fixed inset-0 z-0">
        <div ref={layersContainerRef} className="layers-container" style={{ position: 'absolute', inset: 0 }}>
          {/* Background layer */}
          <div
            className="gradient-effects-wrapper"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              filter: getGradientFilter(),
            }}
          >
            {backgroundType === 'simple' && (
              <SimpleGradientLayer config={gradientConfig} gradientColors={gradientConfig.colors} effectsConfig={effectsConfig} />
            )}
            {backgroundType === 'liquid' && (
              <GradientLayer config={gradientConfig} effectsConfig={effectsConfig} mousePos={mousePos} isPaused={false} mouseIntensity={effectiveMouseIntensity} />
            )}
            {backgroundType === 'aurora' && (
              <AuroraLayer config={auroraConfig} mousePos={mousePos} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} />
            )}
            {backgroundType === 'fluid' && (
              <FluidGradientLayer config={fluidConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} />
            )}
            {backgroundType === 'waves' && (
              <WavesLayer config={wavesConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} />
            )}
            {backgroundType === 'ribbon' && (
              <RibbonLayer config={ribbonConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} />
            )}
            {backgroundType === 'dandelion' && (
              <DandelionLayer config={dandelionConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} mouseEnabled={effectiveMouseEnabled} mouseIntensity={effectiveMouseIntensity} />
            )}
            {backgroundType === 'particleRing' && (
              <ParticleRingLayer config={particleRingConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} />
            )}
            {backgroundType === 'shapeTrail' && (
              <ShapeTrailLayer config={shapeTrailConfig} paletteColors={gradientConfig.colors} effectsConfig={effectsConfig} isPaused={false} />
            )}
          </div>

          {/* Tessellation layer */}
          {tessellationConfig.enabled && (
            <TessellationLayer config={tessellationConfig} mousePos={mousePos} isPaused={false} mouseIntensity={effectiveMouseIntensity} />
          )}

          {/* Effects layer */}
          <EffectsLayer config={effectsConfig} />

          {/* Text layer */}
          {textConfig.enabled && (
            <TextLayer
              sections={textSections}
              gap={textGap}
              color={textConfig.color}
              opacity={textConfig.opacity}
            />
          )}
        </div>
      </div>

      {/* Page header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="container max-w-420 w-full mx-auto p-2 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/scenes')}>
              <ArrowLeft size={20} weight="bold" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold hidden md:block">{scene.title}</h1>

            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleApplyScene}>
              <Play size={16} weight="fill" className="mr-2" />
              Open in Editor
            </Button>
          </div>
        </div>
      </header>

      {/* Scene info panel - on mobile it appears in second fold, on desktop fixed bottom-right */}
      <div className="relative mt-[76vh] md:mt-0 md:fixed md:bottom-4 md:right-4 md:z-50 md:w-80 p-4 md:p-0">
        <div className="flex flex-col bg-background/80 backdrop-blur border border-border rounded-xl p-4 gap-2 shadow-lg">

          {scene.title && (
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold">{scene.title}</h1>
            </div>
          )}

          {/* Pending Review: Accept / Reject */}
          {scene.scene_data?.pendingReview && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/25">
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-500 flex-1">
                Pending Review
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-green-500 hover:text-green-400 hover:bg-green-500/10"
                onClick={() => setAcceptDialogOpen(true)}
              >
                <CheckCircle size={14} weight="bold" className="mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10"
                onClick={() => setRejectDialogOpen(true)}
              >
                <XCircle size={14} weight="bold" className="mr-1" />
                Reject
              </Button>
            </div>
          )}

          <div className="flex w-full flex-wrap gap-2">
            <Button className="flex flex-row flex-1 border border-primary" variant="outline" onClick={() => setEmbedDialogOpen(true)}>
              <Code size={16} weight="bold" />
              Embed
            </Button>
            <Button className="flex flex-row flex-1 border border-primary" variant="outline" onClick={() => setDownloadDialogOpen(true)}>
              <Download size={16} weight="bold" />
              Download
            </Button>
          </div>
          {scene.short_description && (
            <p className="text-md text-foreground italic">{scene.short_description}</p>
          )}
          {scene.long_description && (

            <p className="text-sm text-muted-foreground">{scene.long_description}</p>
          )}

          {gradientConfig.colors && gradientConfig.colors.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Colors</span>
              <div className="flex gap-0.5">
                {gradientConfig.colors.map((color, idx) => (
                  <div
                    key={idx}
                    className="w-full h-8 rounded-xs border border-border/50 shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Backgroun Name</span>
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="px-2 py-0.5 text-xs bg-muted rounded-md capitalize">
                  {sceneData.backgroundType}
                </span>
              </div>
          </div>  
          {/* Effects */}
          {(() => {
            const effects = []
            if (effectsConfig.texture && effectsConfig.texture !== 'none') {
              effects.push({ type: 'text', value: effectsConfig.texture })
            }
            if (effectsConfig.colorMap && effectsConfig.colorMap !== 'none') {
              effects.push({ type: 'text', value: effectsConfig.colorMap })
            }
            if (effectsConfig.flutedGlass?.enabled) {
              effects.push({ type: 'text', value: 'fluted glass' })
            }
            if (effectsConfig.blur > 0) {
              effects.push({ type: 'text', value: `blur (${effectsConfig.blur}px)` })
            }
            if (effectsConfig.vignetteIntensity > 0) {
              effects.push({ type: 'text', value: 'vignette' })
            }

            return effects.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Effects</span>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {effects.map((effect, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs bg-muted rounded-md capitalize"
                    >
                      {effect.value}
                    </span>
                  ))}
                </div>


              </div>
            ) : null
          })()}

          <div className="flex items-center flex-row justify-between w-full gap-2">
            {/*Icons*/}
            {(() => {
              const icons = []
              if (tessellationConfig.enabled) {
                icons.push({ type: 'icon', value: tessellationConfig.icon })
              }
              return icons.length > 0 ? (
                <div className="flex items-center flex-row gap-2">
                  <span className="flex text-xs text-muted-foreground uppercase tracking-wide">Icons</span>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {icons.map((icon, idx) => (
                      icon.type === 'icon' ? (

                        <span
                          key={idx}
                          className="p-1 bg-muted rounded-md flex items-center justify-center"
                          title={`Pattern: ${icon.value}`}
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 256 256"
                            fill="currentColor"
                            className="text-foreground"
                          >
                            <path d={ICON_PATHS[icon.value] || ICON_PATHS.Star} />
                          </svg>
                        </span>
                      ) : null
                    ))}
                  </div>
                </div>
              ) : null
            })()}
            {/* Fonts */}
            {(() => {
              const fonts = [...new Set(textSections.map(s => s.font).filter(Boolean))]
              return fonts.length > 0 && textConfig.enabled ? (
                <div className="flex items-center flex-row gap-2">
                  <span className="flex text-xs text-muted-foreground uppercase tracking-wide">Fonts</span>
                  <div className="flex flex-wrap gap-1.5">
                    {fonts.map((font, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs bg-muted rounded-md"
                      >
                        {font}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null
            })()}

          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setRegenerateDialogOpen(true)}
            >
              <ArrowCounterClockwise size={12} className="mr-1" />
              Regenerate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setRecaptureDialogOpen(true)}
            >
              <CameraIcon size={12} className="mr-1" />
              Recapture
            </Button>
          </div>

          {/* Projects */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Projects</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={handleOpenProjectsDialog}
              >
                Edit
              </Button>
            </div>
            {projects.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {projects.map((project) => (
                  <a
                    key={project.id}
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <span className="text-sm font-medium">{project.name}</span>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      Visit →
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No projects linked</p>
            )}
          </div>

          {/* Thumbnail - use medium size for info panel (800px width) */}
          {(scene.thumbnail?.medium || scene.thumbnail?.small) && (
            <div className="h-full relative group">
              <img
                src={`${scene.thumbnail.medium || scene.thumbnail.small}${thumbnailCacheBuster}`}
                alt={scene.title}
                className="w-full h-40 object-cover rounded-md"
              />
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={async () => {
                  const url = scene.thumbnail.large || scene.thumbnail.medium || scene.thumbnail.small
                  try {
                    await navigator.clipboard.writeText(url)
                    setThumbnailCopied(true)
                    setTimeout(() => setThumbnailCopied(false), 2000)
                  } catch (err) {
                    console.error('Failed to copy thumbnail URL:', err)
                  }
                }}
              >
                {thumbnailCopied ? (
                  <>
                    <Check size={12} className="mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} className="mr-1" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          )}

        </div>
      </div>

      <EmbedDialog
        open={embedDialogOpen}
        onOpenChange={setEmbedDialogOpen}
        slug={slug}
        sceneTitle={scene?.title}
      />

      <DownloadDialog
        open={downloadDialogOpen}
        onOpenChange={setDownloadDialogOpen}
        onDownload={handleDownload}
      />

      <RegenerateDialog
        open={regenerateDialogOpen}
        onOpenChange={setRegenerateDialogOpen}
        onSubmit={handleRegenerate}
      />

      <RecaptureDialog
        open={recaptureDialogOpen}
        onOpenChange={setRecaptureDialogOpen}
        onSubmit={handleRecaptureThumbnail}
      />

      <ProjectsDialog
        open={projectsDialogOpen}
        onOpenChange={setProjectsDialogOpen}
        allProjects={allProjects}
        loadingAllProjects={loadingAllProjects}
        initialSelectedIds={scene?.scene_data?.selectedProjectIds || []}
        onSave={handleSaveProjects}
      />

      <AcceptReviewDialog
        open={acceptDialogOpen}
        onOpenChange={setAcceptDialogOpen}
        onSubmit={handleAcceptReview}
      />

      <RejectReviewDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        sceneTitle={scene.title}
        onSubmit={handleRejectReview}
      />
    </div>
  )
}

export default SceneViewPage
