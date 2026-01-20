import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CircleNotch, Warning, Play } from '@phosphor-icons/react'
import { getSceneBySlug } from '@/lib/scenesApi'
import { Button } from '@/components/ui/button'
import '../App.css'
import GradientLayer from './GradientLayer'
import SimpleGradientLayer from './SimpleGradientLayer'
import AuroraLayer from './AuroraLayer'
import FluidGradientLayer from './FluidGradientLayer'
import WavesLayer from './WavesLayer'
import TessellationLayer from './TessellationLayer'
import EffectsLayer from './EffectsLayer'
import TextLayer from './TextLayer'
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

  const handleApplyScene = () => {
    if (scene?.scene_data) {
      loadSceneData(scene.scene_data)
      setCurrentSceneId(scene.id)
      setCurrentPage('editor')
      navigate('/')
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
          <div className="container mx-auto px-4 h-14 flex items-center gap-4">
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
  const tessellationConfig = sceneData.tessellationConfig || {}
  const effectsConfig = sceneData.effectsConfig || {}
  const textSections = sceneData.textSections || []
  const textGap = sceneData.textGap || 0
  const textConfig = sceneData.textConfig || {}

  return (
    <div className="min-h-screen bg-background" onMouseMove={handleMouseMove}>
      {/* Full-screen scene preview */}
      <div className="fixed inset-0 z-0">
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
          {tessellationConfig.enabled && (
            <TessellationLayer config={tessellationConfig} mousePos={mousePos} isPaused={false} />
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

      {/* Overlay header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/scenes')}>
              <ArrowLeft size={20} weight="bold" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{scene.title}</h1>
              {scene.short_description && (
                <p className="text-xs text-muted-foreground">{scene.short_description}</p>
              )}
            </div>
          </div>
          <Button onClick={handleApplyScene}>
            <Play size={16} weight="fill" className="mr-2" />
            Open in Editor
          </Button>
        </div>
      </header>

      {/* Scene info panel */}
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
        <div className="bg-background/90 backdrop-blur border border-border rounded-xl p-4 shadow-lg">
          {scene.long_description && (
            <p className="text-sm text-muted-foreground mb-4">{scene.long_description}</p>
          )}

          {gradientConfig.colors && gradientConfig.colors.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Colors</span>
              <div className="flex gap-1.5">
                {gradientConfig.colors.map((color, idx) => (
                  <div
                    key={idx}
                    className="w-8 h-8 rounded-md border border-border/50 shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SceneViewPage
