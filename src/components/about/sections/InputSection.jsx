import { useState } from 'react'
import { FeatureCard } from '../FeatureCard'
import { MiniSceneRenderer } from '../MiniSceneRenderer'
import { cn } from '@/lib/utils'
import { Mouse, Microphone, Prohibit } from '@phosphor-icons/react'
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

const fallback = getScene('input')

const INPUT_MODES = [
  { value: 'mouse', label: 'Mouse', icon: Mouse },
  { value: 'mic', label: 'Microphone', icon: Microphone },
  { value: 'off', label: 'Off', icon: Prohibit },
]

export function InputSection({ dbScene }) {
  const sd = dbScene?.scene_data
  const [inputMode, setInputMode] = useState('mouse')
  const gradientConfig = sd?.gradientConfig || makeGradientConfig(fallback.colors)

  return (
    <FeatureCard
      title={fallback.title}
      description={fallback.description}
      renderPreview={() => (
        <MiniSceneRenderer
          backgroundType={sd?.backgroundType || fallback.backgroundType}
          gradientConfig={gradientConfig}
          effectsConfig={sd?.effectsConfig || DEFAULT_EFFECTS_CONFIG}
          auroraConfig={sd?.auroraConfig || DEFAULT_AURORA_CONFIG}
          fluidConfig={sd?.fluidConfig || DEFAULT_FLUID_CONFIG}
          wavesConfig={sd?.wavesConfig || DEFAULT_WAVES_CONFIG}
          ribbonConfig={sd?.ribbonConfig || DEFAULT_RIBBON_CONFIG}
          dandelionConfig={sd?.dandelionConfig || DEFAULT_DANDELION_CONFIG}
          particleRingConfig={sd?.particleRingConfig || DEFAULT_PARTICLE_RING_CONFIG}
          mouseConfig={{
            enabled: inputMode === 'mouse',
            intensity: inputMode === 'mouse' ? 0.5 : 0,
          }}
        />
      )}
    >
      {INPUT_MODES.map(mode => (
        <button
          key={mode.value}
          onClick={() => setInputMode(mode.value)}
          className={cn(
            "flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs transition-colors",
            inputMode === mode.value
              ? "bg-primary text-black"
              : "bg-black/50 text-white/80 hover:bg-primary/50"
          )}
        >
          <mode.icon size={14} />
          {mode.label}
        </button>
      ))}
    </FeatureCard>
  )
}
