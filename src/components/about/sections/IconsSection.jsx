import { useState } from 'react'
import { FeatureCard } from '../FeatureCard'
import { MiniSceneRenderer } from '../MiniSceneRenderer'
import { cn } from '@/lib/utils'
import {
  getScene,
  makeGradientConfig,
  DEFAULT_EFFECTS_CONFIG,
  DEFAULT_TESSELLATION_CONFIG,
  DEFAULT_AURORA_CONFIG,
} from '../sectionScenes'

const scene = getScene('icons')

const ICON_CHOICES = [
  'Star', 'Heart', 'Diamond', 'Circle', 'Hexagon',
  'Lightning', 'Sparkle', 'Snowflake', 'Flower', 'Crown',
  'MusicNote', 'Butterfly', 'Rocket', 'Atom', 'Infinity',
]

export function IconsSection() {
  const [icon, setIcon] = useState('Star')
  const gradientConfig = makeGradientConfig(scene.colors)
  const tessellationConfig = { ...DEFAULT_TESSELLATION_CONFIG, icon, enabled: true }

  return (
    <FeatureCard
      title={scene.title}
      description={scene.description}
      renderPreview={() => (
        <MiniSceneRenderer
          backgroundType={scene.backgroundType}
          gradientConfig={gradientConfig}
          effectsConfig={DEFAULT_EFFECTS_CONFIG}
          auroraConfig={DEFAULT_AURORA_CONFIG}
          tessellationConfig={tessellationConfig}
          showTessellation={true}
        />
      )}
    >
      {ICON_CHOICES.map(ic => (
        <button
          key={ic}
          onClick={() => setIcon(ic)}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs transition-colors",
            icon === ic
              ? "bg-white text-black"
              : "bg-white/15 text-white/80 hover:bg-white/25"
          )}
        >
          {ic}
        </button>
      ))}
    </FeatureCard>
  )
}
