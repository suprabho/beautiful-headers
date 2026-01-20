import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { CircleNotch } from '@phosphor-icons/react'
import { getSceneBySlug } from '@/lib/scenesApi'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import '../App.css'
import GradientLayer from './GradientLayer'
import SimpleGradientLayer from './SimpleGradientLayer'
import AuroraLayer from './AuroraLayer'
import FluidGradientLayer from './FluidGradientLayer'
import WavesLayer from './WavesLayer'
import TessellationLayer from './TessellationLayer'
import EffectsLayer from './EffectsLayer'
import TextLayer from './TextLayer'

function SceneEmbedPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()

  // Parse query parameters for hiding elements
  const hideText = searchParams.get('hideText') === 'true'
  const hideIcons = searchParams.get('hideIcons') === 'true'

  const [scene, setScene] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })

  // Update document meta tags with scene data
  useDocumentMeta({
    title: scene ? `${scene.title} - Aura` : null,
    description: scene?.short_description || scene?.long_description,
    image: scene?.thumbnail?.large || scene?.thumbnail?.small,
    url: scene ? `https://aura.promad.design/embed/${slug}` : null,
  })

  // Ref to track if RAF is pending for mouse throttling
  const rafPendingRef = useRef(false)
  const pendingMouseRef = useRef({ x: 0.5, y: 0.5 })

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
      <div className="w-full h-screen bg-background flex items-center justify-center">
        <CircleNotch size={32} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !scene) {
    return (
      <div className="w-full h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{error || 'Scene not found'}</p>
      </div>
    )
  }

  const sceneData = scene.scene_data || {}
  const backgroundType = sceneData.backgroundType || 'liquid'
  const gradientConfig = sceneData.gradientConfig || {}
  const auroraConfig = sceneData.auroraConfig || {}
  const fluidConfig = sceneData.fluidConfig || {}
  const wavesConfig = sceneData.wavesConfig || {}
  const tessellationConfig = sceneData.tessellationConfig || {}
  const effectsConfig = sceneData.effectsConfig || {}
  const textSections = sceneData.textSections || []
  const textGap = sceneData.textGap || 0
  const textConfig = sceneData.textConfig || {}

  return (
    <div className="w-full h-screen overflow-hidden" onMouseMove={handleMouseMove}>
      {/* Full-screen scene - no UI overlay */}
      <div className="absolute inset-0">
        <div className="layers-container" style={{ position: 'absolute', inset: 0 }}>
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
              <GradientLayer config={gradientConfig} effectsConfig={effectsConfig} mousePos={mousePos} isPaused={false} />
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
          </div>

          {/* Tessellation layer */}
          {tessellationConfig.enabled && !hideIcons && (
            <TessellationLayer config={tessellationConfig} mousePos={mousePos} isPaused={false} />
          )}

          {/* Effects layer */}
          <EffectsLayer config={effectsConfig} />

          {/* Text layer */}
          {textConfig.enabled && !hideText && (
            <TextLayer
              sections={textSections}
              gap={textGap}
              color={textConfig.color}
              opacity={textConfig.opacity}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default SceneEmbedPage
