import { useState } from 'react'
import { FeatureCard } from '../FeatureCard'
import { MiniSceneRenderer } from '../MiniSceneRenderer'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Moon, Sun } from '@phosphor-icons/react'
import {
  getScene,
  makeGradientConfig,
  DEFAULT_EFFECTS_CONFIG,
} from '../sectionScenes'

const fallback = getScene('theme')
const DARK_COLORS = ['#b80038', '#fdf7f2', '#004d9c', '#00999a']
const LIGHT_COLORS = ['#fbbf24', '#f472b6', '#60a5fa', '#34d399']

export function ThemeSection({ dbScene }) {
  const sd = dbScene?.scene_data
  const [isDark, setIsDark] = useState(true)
  const darkColors = sd?.gradientConfig?.colors || DARK_COLORS
  const colors = isDark ? darkColors : LIGHT_COLORS
  const gradientConfig = sd?.gradientConfig
    ? { ...sd.gradientConfig, colors }
    : makeGradientConfig(colors)

  return (
    <FeatureCard
      title={fallback.title}
      description={fallback.description}
      renderPreview={() => (
        <MiniSceneRenderer
          backgroundType={sd?.backgroundType || fallback.backgroundType}
          gradientConfig={gradientConfig}
          effectsConfig={{
            ...(sd?.effectsConfig || DEFAULT_EFFECTS_CONFIG),
            brightness: isDark ? 100 : 110,
          }}
        />
      )}
    >
      <div className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${isDark ? 'bg-black/20' : 'bg-white/20'}`}>
        <Sun size={16} className={isDark ? 'text-white/70' : 'text-black/70'} weight={!isDark ? 'fill' : 'regular'} />
        <Switch checked={isDark} onCheckedChange={setIsDark} className={isDark ? 'data-[state=checked]:bg-white/40 data-[state=unchecked]:bg-white/20' : 'data-[state=checked]:bg-black/40 data-[state=unchecked]:bg-black/20'} />
        <Moon size={16} className={isDark ? 'text-white/70' : 'text-black/70'} weight={isDark ? 'fill' : 'regular'} />
        <Label className={`text-sm ml-1 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </Label>
      </div>
    </FeatureCard>
  )
}
