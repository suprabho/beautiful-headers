import { useState } from 'react'
import { FeatureCard } from '../FeatureCard'
import { MiniSceneRenderer } from '../MiniSceneRenderer'
import { cn } from '@/lib/utils'
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
  DEFAULT_TEXT_CONFIG,
  DEFAULT_TEXT_SECTIONS,
} from '../sectionScenes'

const fallback = getScene('text')

const FONT_OPTIONS = [
  { value: 'sans-serif', label: 'Sans', family: 'Manrope' },
  { value: 'serif', label: 'Serif', family: 'Playfair Display' },
  { value: 'mono', label: 'Mono', family: 'Space Grotesk' },
  { value: 'scribble', label: 'Script', family: 'Pacifico' },
]

export function TextsSection({ dbScene }) {
  const sd = dbScene?.scene_data
  const [currentFont, setCurrentFont] = useState('mono')
  const gradientConfig = sd?.gradientConfig || makeGradientConfig(fallback.colors)
  const baseTextSections = sd?.textSections || DEFAULT_TEXT_SECTIONS
  const textSections = baseTextSections.map(s => ({ ...s, font: currentFont }))

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
          textConfig={sd?.textConfig || DEFAULT_TEXT_CONFIG}
          textSections={textSections}
          showText={true}
        />
      )}
    >
      {FONT_OPTIONS.map(font => (
        <button
          key={font.value}
          onClick={() => setCurrentFont(font.value)}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-xs transition-colors text-center min-w-[60px]",
            currentFont === font.value
              ? "bg-primary text-black"
              : "bg-black/50 text-white/80 hover:bg-primary/50"
          )}
          style={{ fontFamily: font.family }}
        >
          {font.label}
        </button>
      ))}
    </FeatureCard>
  )
}
