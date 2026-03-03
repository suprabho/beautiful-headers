import { useState } from 'react'
import { FeatureCard } from '../FeatureCard'
import { MiniSceneRenderer } from '../MiniSceneRenderer'
import { cn } from '@/lib/utils'
import { ICON_PATHS } from '../../TessellationLayer'
import {
  getScene,
  makeGradientConfig,
  DEFAULT_EFFECTS_CONFIG,
  DEFAULT_TESSELLATION_CONFIG,
  DEFAULT_AURORA_CONFIG,
} from '../sectionScenes'

const fallback = getScene('icons')

const ICON_CHOICES = [
  'Star', 'Heart', 'Diamond', 'Circle', 'Hexagon',
  'Lightning', 'Sparkle', 'Snowflake', 'Flower', 'Crown',
  'MusicNote', 'Butterfly', 'Rocket', 'Atom', 'Infinity',
]

export function IconsSection({ dbScene }) {
  const sd = dbScene?.scene_data
  const [icon, setIcon] = useState('Star')
  const gradientConfig = sd?.gradientConfig || makeGradientConfig(fallback.colors)
  const tessellationConfig = {
    ...(sd?.tessellationConfig || DEFAULT_TESSELLATION_CONFIG),
    icon,
    enabled: true,
  }

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
          tessellationConfig={tessellationConfig}
          showTessellation={true}
        />
      )}
    >
      {ICON_CHOICES.map(ic => (
        <button
          key={ic}
          onClick={() => setIcon(ic)}
          title={ic}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            icon === ic
              ? "bg-primary"
              : "bg-black/50 hover:bg-primary/50"
          )}
        >
          <svg viewBox="0 0 256 256" className="w-6 h-6" fill={icon === ic ? "black" : "rgba(255,255,255,0.8)"}>
            <path d={ICON_PATHS[ic]} />
          </svg>
        </button>
      ))}
    </FeatureCard>
  )
}
