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

const scene = getScene('background')

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

export function BackgroundSection() {
  const [backgroundType, setBackgroundType] = useState(scene.backgroundType)
  const gradientConfig = makeGradientConfig(scene.colors)

  return (
    <FeatureCard
      title={scene.title}
      description={scene.description}
      renderPreview={() => (
        <MiniSceneRenderer
          backgroundType={backgroundType}
          gradientConfig={gradientConfig}
          effectsConfig={DEFAULT_EFFECTS_CONFIG}
          auroraConfig={DEFAULT_AURORA_CONFIG}
          fluidConfig={DEFAULT_FLUID_CONFIG}
          wavesConfig={DEFAULT_WAVES_CONFIG}
          ribbonConfig={DEFAULT_RIBBON_CONFIG}
          dandelionConfig={DEFAULT_DANDELION_CONFIG}
          particleRingConfig={DEFAULT_PARTICLE_RING_CONFIG}
        />
      )}
    >
      <Select value={backgroundType} onValueChange={setBackgroundType}>
        <SelectTrigger className="w-[140px] h-8 bg-white/15 border-white/20 text-white text-xs">
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
