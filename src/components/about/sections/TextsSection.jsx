import { useState } from 'react'
import { FeatureCard } from '../FeatureCard'
import { MiniSceneRenderer } from '../MiniSceneRenderer'
import { cn } from '@/lib/utils'
import {
  getScene,
  makeGradientConfig,
  DEFAULT_EFFECTS_CONFIG,
  DEFAULT_TEXT_CONFIG,
  DEFAULT_TEXT_SECTIONS,
} from '../sectionScenes'

const scene = getScene('text')

const FONT_OPTIONS = [
  { value: 'sans-serif', label: 'Sans', family: 'Manrope' },
  { value: 'serif', label: 'Serif', family: 'Playfair Display' },
  { value: 'mono', label: 'Mono', family: 'Space Grotesk' },
  { value: 'scribble', label: 'Script', family: 'Pacifico' },
]

export function TextsSection() {
  const [currentFont, setCurrentFont] = useState('mono')
  const gradientConfig = makeGradientConfig(scene.colors)
  const textSections = DEFAULT_TEXT_SECTIONS.map(s => ({ ...s, font: currentFont }))

  return (
    <FeatureCard
      title={scene.title}
      description={scene.description}
      renderPreview={() => (
        <MiniSceneRenderer
          backgroundType={scene.backgroundType}
          gradientConfig={gradientConfig}
          effectsConfig={DEFAULT_EFFECTS_CONFIG}
          textConfig={DEFAULT_TEXT_CONFIG}
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
              ? "bg-white text-black"
              : "bg-white/15 text-white/80 hover:bg-white/25"
          )}
          style={{ fontFamily: font.family }}
        >
          {font.label}
        </button>
      ))}
    </FeatureCard>
  )
}
