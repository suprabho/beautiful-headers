import { useState } from 'react'
import { FeatureCard } from '../FeatureCard'
import { MiniSceneRenderer } from '../MiniSceneRenderer'
import { cn } from '@/lib/utils'
import {
  getScene,
  makeGradientConfig,
  DEFAULT_EFFECTS_CONFIG,
  DEFAULT_FLUID_CONFIG,
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

export function EffectsSection({ dbScene }) {
  const sd = dbScene?.scene_data
  const [texture, setTexture] = useState('none')
  const gradientConfig = sd?.gradientConfig || makeGradientConfig(fallback.colors)
  const baseEffects = sd?.effectsConfig || DEFAULT_EFFECTS_CONFIG
  const effectsConfig = {
    ...baseEffects,
    texture,
    textureOpacity: texture !== 'none' ? 0.5 : 0,
    vignetteIntensity: texture !== 'none' ? 0.5 : 0.3,
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
          fluidConfig={sd?.fluidConfig || DEFAULT_FLUID_CONFIG}
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
    </FeatureCard>
  )
}
