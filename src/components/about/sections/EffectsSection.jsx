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

const scene = getScene('effects')

const TEXTURE_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'grain', label: 'Grain' },
  { value: 'scanlines', label: 'Scanlines' },
  { value: 'dots', label: 'Dots' },
  { value: 'grid', label: 'Grid' },
  { value: 'diagonal', label: 'Diagonal' },
]

export function EffectsSection() {
  const [texture, setTexture] = useState('none')
  const gradientConfig = makeGradientConfig(scene.colors)
  const effectsConfig = {
    ...DEFAULT_EFFECTS_CONFIG,
    texture,
    textureOpacity: texture !== 'none' ? 0.5 : 0,
    vignetteIntensity: texture !== 'none' ? 0.5 : 0.3,
  }

  return (
    <FeatureCard
      title={scene.title}
      description={scene.description}
      renderPreview={() => (
        <MiniSceneRenderer
          backgroundType={scene.backgroundType}
          gradientConfig={gradientConfig}
          effectsConfig={effectsConfig}
          fluidConfig={DEFAULT_FLUID_CONFIG}
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
              ? "bg-white text-black"
              : "bg-white/15 text-white/80 hover:bg-white/25"
          )}
        >
          {tex.label}
        </button>
      ))}
    </FeatureCard>
  )
}
