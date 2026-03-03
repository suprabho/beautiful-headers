import { useState } from 'react'
import { FeatureCard } from '../FeatureCard'
import { MiniSceneRenderer } from '../MiniSceneRenderer'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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

const fallback = getScene('flutedGlass')

export function FlutedGlassSection({ dbScene }) {
  const sd = dbScene?.scene_data
  const [flutedEnabled, setFlutedEnabled] = useState(true)
  const gradientConfig = sd?.gradientConfig || makeGradientConfig(fallback.colors)
  const baseEffects = sd?.effectsConfig || DEFAULT_EFFECTS_CONFIG
  const effectsConfig = {
    ...baseEffects,
    flutedGlass: {
      ...(baseEffects.flutedGlass || DEFAULT_EFFECTS_CONFIG.flutedGlass),
      enabled: flutedEnabled,
    },
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
        />
      )}
    >
      <div className="flex items-center gap-3">
        <Switch
          checked={flutedEnabled}
          onCheckedChange={setFlutedEnabled}
        />
        <Label className="text-sm text-white/70">
          {flutedEnabled ? 'Enabled' : 'Disabled'}
        </Label>
      </div>
    </FeatureCard>
  )
}
