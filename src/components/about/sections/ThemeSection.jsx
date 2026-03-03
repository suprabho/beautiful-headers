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

const scene = getScene('theme')
const DARK_COLORS = ['#b80038', '#fdf7f2', '#004d9c', '#00999a']
const LIGHT_COLORS = ['#fbbf24', '#f472b6', '#60a5fa', '#34d399']

export function ThemeSection() {
  const [isDark, setIsDark] = useState(true)
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS
  const gradientConfig = makeGradientConfig(colors)

  return (
    <FeatureCard
      title={scene.title}
      description={scene.description}
      renderPreview={() => (
        <MiniSceneRenderer
          backgroundType={scene.backgroundType}
          gradientConfig={gradientConfig}
          effectsConfig={{
            ...DEFAULT_EFFECTS_CONFIG,
            brightness: isDark ? 100 : 110,
          }}
        />
      )}
    >
      <div className="flex items-center gap-3">
        <Sun size={16} className="text-white/70" weight={!isDark ? 'fill' : 'regular'} />
        <Switch checked={isDark} onCheckedChange={setIsDark} />
        <Moon size={16} className="text-white/70" weight={isDark ? 'fill' : 'regular'} />
        <Label className="text-sm text-white/70 ml-1">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </Label>
      </div>
    </FeatureCard>
  )
}
