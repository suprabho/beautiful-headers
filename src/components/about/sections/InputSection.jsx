import { useState } from 'react'
import { FeatureCard } from '../FeatureCard'
import { MiniSceneRenderer } from '../MiniSceneRenderer'
import { cn } from '@/lib/utils'
import { Mouse, Microphone, Prohibit } from '@phosphor-icons/react'
import {
  getScene,
  makeGradientConfig,
  DEFAULT_EFFECTS_CONFIG,
  DEFAULT_DANDELION_CONFIG,
} from '../sectionScenes'

const scene = getScene('input')

const INPUT_MODES = [
  { value: 'mouse', label: 'Mouse', icon: Mouse },
  { value: 'mic', label: 'Microphone', icon: Microphone },
  { value: 'off', label: 'Off', icon: Prohibit },
]

export function InputSection() {
  const [inputMode, setInputMode] = useState('mouse')
  const gradientConfig = makeGradientConfig(scene.colors)

  return (
    <FeatureCard
      title={scene.title}
      description={scene.description}
      renderPreview={() => (
        <MiniSceneRenderer
          backgroundType={scene.backgroundType}
          gradientConfig={gradientConfig}
          effectsConfig={DEFAULT_EFFECTS_CONFIG}
          dandelionConfig={DEFAULT_DANDELION_CONFIG}
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
              ? "bg-white text-black"
              : "bg-white/15 text-white/80 hover:bg-white/25"
          )}
        >
          <mode.icon size={14} />
          {mode.label}
        </button>
      ))}
    </FeatureCard>
  )
}
