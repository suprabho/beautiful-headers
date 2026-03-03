import { useState } from 'react'
import { FeatureCard } from '../FeatureCard'
import { MiniSceneRenderer } from '../MiniSceneRenderer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

const fallback = getScene('background')

const BACKGROUND_TYPES = [
  { value: 'liquid', label: 'Liquid' },
  { value: 'aurora', label: 'Aurora' },
  { value: 'fluid', label: 'Fluid' },
  { value: 'waves', label: 'Waves' },
  { value: 'ribbon', label: 'Ribbon' },
  { value: 'dandelion', label: 'Dandelion' },
  { value: 'particleRing', label: 'Particle Ring' },
  { value: 'simple', label: 'Simple' },
]

export function BackgroundSection({ dbScene }) {
  const sd = dbScene?.scene_data
  // Detect the mapped scene's background type first
  const detectedType = sd?.backgroundType || fallback.backgroundType
  const [userBgType, setUserBgType] = useState(null)
  const backgroundType = userBgType ?? detectedType
  const gradientConfig = sd?.gradientConfig || makeGradientConfig(sd?.gradientConfig?.colors || fallback.colors)

  return (
    <FeatureCard
      title={fallback.title}
      description={fallback.description}
      renderPreview={() => (
        <MiniSceneRenderer
          backgroundType={backgroundType}
          gradientConfig={gradientConfig}
          effectsConfig={sd?.effectsConfig || DEFAULT_EFFECTS_CONFIG}
          auroraConfig={sd?.auroraConfig || DEFAULT_AURORA_CONFIG}
          fluidConfig={sd?.fluidConfig || DEFAULT_FLUID_CONFIG}
          wavesConfig={sd?.wavesConfig || DEFAULT_WAVES_CONFIG}
          ribbonConfig={sd?.ribbonConfig || DEFAULT_RIBBON_CONFIG}
          dandelionConfig={sd?.dandelionConfig || DEFAULT_DANDELION_CONFIG}
          particleRingConfig={sd?.particleRingConfig || DEFAULT_PARTICLE_RING_CONFIG}
        />
      )}
    >
      <Select value={backgroundType} onValueChange={setUserBgType}>
        <SelectTrigger className="w-[140px] h-8 bg-black/30 border-white/20 text-white text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BACKGROUND_TYPES.map(type => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FeatureCard>
  )
}
