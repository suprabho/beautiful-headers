import { useState } from 'react'
import { FeatureCard } from '../FeatureCard'
import { MiniSceneRenderer } from '../MiniSceneRenderer'
import { cn } from '@/lib/utils'
import {
  getScene,
  makeGradientConfig,
  DEFAULT_EFFECTS_CONFIG,
  DEFAULT_AURORA_CONFIG,
  DEFAULT_FLUID_CONFIG,
  DEFAULT_WAVES_CONFIG,
  DEFAULT_RIBBON_CONFIG,
  DEFAULT_DANDELION_CONFIG,
  DEFAULT_PARTICLE_RING_CONFIG,
} from '../sectionScenes'

const fallback = getScene('effects')

const TEXTURE_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'grain', label: 'Grain' },
  { value: 'scanlines', label: 'Scanlines' },
  { value: 'dots', label: 'Dots' },
  { value: 'grid', label: 'Grid' },
  { value: 'diagonal', label: 'Diagonal' },
]

const COLOR_MAP_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'sepia', label: 'Sepia' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'matrix', label: 'Matrix' },
  { value: 'noir', label: 'Noir' },
  { value: 'vintage', label: 'Vintage' },
]

export function EffectsSection({ dbScene }) {
  const sd = dbScene?.scene_data
  const [texture, setTexture] = useState('grid')
  const [colorMap, setColorMap] = useState('none')
  const gradientConfig = sd?.gradientConfig || makeGradientConfig(fallback.colors)
  const baseEffects = sd?.effectsConfig || DEFAULT_EFFECTS_CONFIG
  const effectsConfig = {
    ...baseEffects,
    texture,
    textureSize: 20,
    textureOpacity: texture !== 'none' ? 0.5 : 0,
    vignetteIntensity: texture !== 'none' ? 0.5 : 0.3,
    colorMap,
  }

  return (
    <FeatureCard
      title={fallback.title}
      description={fallback.description}
      renderPreview={() => (
        <MiniSceneRenderer
          backgroundType={sd?.backgroundType || fallback.backgroundType}
          gradientConfig={gradientConfig}
          effectsConfig={effectsConfig}
          auroraConfig={sd?.auroraConfig || DEFAULT_AURORA_CONFIG}
          fluidConfig={sd?.fluidConfig || DEFAULT_FLUID_CONFIG}
          wavesConfig={sd?.wavesConfig || DEFAULT_WAVES_CONFIG}
          ribbonConfig={sd?.ribbonConfig || DEFAULT_RIBBON_CONFIG}
          dandelionConfig={sd?.dandelionConfig || DEFAULT_DANDELION_CONFIG}
          particleRingConfig={sd?.particleRingConfig || DEFAULT_PARTICLE_RING_CONFIG}
          showEffects={true}
        />
      )}
    >
      {TEXTURE_TYPES.map(tex => (
        <button
          key={tex.value}
          onClick={() => setTexture(tex.value)}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs transition-colors",
            texture === tex.value
              ? "bg-primary text-black"
              : "bg-black/50 text-white/80 hover:bg-primary/50"
          )}
        >
          {tex.label}
        </button>
      ))}
      <div className="w-full h-px" />
      {COLOR_MAP_TYPES.map(cm => (
        <button
          key={cm.value}
          onClick={() => setColorMap(cm.value)}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs transition-colors",
            colorMap === cm.value
              ? "bg-primary text-black"
              : "bg-black/50 text-white/80 hover:bg-primary/50"
          )}
        >
          {cm.label}
        </button>
      ))}
    </FeatureCard>
  )
}
