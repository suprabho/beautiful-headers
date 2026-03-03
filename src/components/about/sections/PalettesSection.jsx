import { useState } from 'react'
import { FeatureCard } from '../FeatureCard'
import { MiniSceneRenderer } from '../MiniSceneRenderer'
import { cn } from '@/lib/utils'
import {
  getScene,
  makeGradientConfig,
  DEFAULT_EFFECTS_CONFIG,
} from '../sectionScenes'

const scene = getScene('palettes')

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

export function PalettesSection() {
  const [paletteColors, setPaletteColors] = useState(scene.colors)
  const gradientConfig = makeGradientConfig(paletteColors)

  const activePalette = PRESET_PALETTES.find(
    p => JSON.stringify(p.colors) === JSON.stringify(paletteColors)
  )?.name || null

  return (
    <FeatureCard
      title={scene.title}
      description={scene.description}
      renderPreview={() => (
        <MiniSceneRenderer
          backgroundType={scene.backgroundType}
          gradientConfig={gradientConfig}
          effectsConfig={DEFAULT_EFFECTS_CONFIG}
        />
      )}
    >
      {PRESET_PALETTES.map(palette => (
        <button
          key={palette.name}
          onClick={() => setPaletteColors(palette.colors)}
          className={cn(
            "flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors",
            activePalette === palette.name
              ? "bg-white/20 ring-1 ring-white/50"
              : "hover:bg-white/10"
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
          <span className="text-[10px] text-white/60">{palette.name}</span>
        </button>
      ))}
    </FeatureCard>
  )
}
