import { useState } from 'react'
import { FeatureCard } from '../FeatureCard'
import { MiniSceneRenderer } from '../MiniSceneRenderer'
import { cn } from '@/lib/utils'
import {
  getScene,
  makeGradientConfig,
  DEFAULT_EFFECTS_CONFIG,
} from '../sectionScenes'

const fallback = getScene('palettes')

const PRESET_PALETTES = [
  { name: 'Crimson', colors: ['#b80038', '#fdf7f2', '#004d9c', '#00999a'] },
  { name: 'Sunset', colors: ['#ff6b35', '#f7931e', '#ffd700', '#ff4081'] },
  { name: 'Ocean', colors: ['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'] },
  { name: 'Forest', colors: ['#2d6a4f', '#40916c', '#52b788', '#95d5b2'] },
  { name: 'Neon', colors: ['#f72585', '#7209b7', '#3a0ca3', '#4361ee'] },
  { name: 'Pastel', colors: ['#fec5bb', '#fcd5ce', '#d8e2dc', '#ece4db'] },
  { name: 'Warm', colors: ['#ff6f61', '#ffb347', '#ff85a2', '#ffc93c'] },
  { name: 'Cool', colors: ['#4cc9f0', '#4895ef', '#4361ee', '#3f37c9'] },
]

export function PalettesSection({ dbScene }) {
  const sd = dbScene?.scene_data
  const [userColors, setUserColors] = useState(null)
  const activeColors = userColors ?? sd?.gradientConfig?.colors ?? fallback.colors
  const gradientConfig = sd?.gradientConfig
    ? { ...sd.gradientConfig, colors: activeColors }
    : makeGradientConfig(activeColors)

  const activePalette = PRESET_PALETTES.find(
    p => JSON.stringify(p.colors) === JSON.stringify(activeColors)
  )?.name || null

  return (
    <FeatureCard
      title={fallback.title}
      description={fallback.description}
      renderPreview={() => (
        <MiniSceneRenderer
          backgroundType={sd?.backgroundType || fallback.backgroundType}
          gradientConfig={gradientConfig}
          effectsConfig={sd?.effectsConfig || DEFAULT_EFFECTS_CONFIG}
        />
      )}
    >
      {PRESET_PALETTES.map(palette => (
        <button
          key={palette.name}
          onClick={() => setUserColors(palette.colors)}
          className={cn(
            "flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors",
            activePalette === palette.name
              ? "bg-primary ring-1 ring-primary/50"
              : "bg-black/50 hover:bg-primary/50"
          )}
        >
          <div className="flex gap-0.5">
            {palette.colors.map((color, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span className={cn("text-[10px]", activePalette === palette.name ? "text-black" : "text-white")}>{palette.name}</span>
        </button>
      ))}
    </FeatureCard>
  )
}
