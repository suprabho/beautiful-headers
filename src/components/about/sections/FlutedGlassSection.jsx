import { useState } from 'react'
import { FeatureCard } from '../FeatureCard'
import { MiniSceneRenderer } from '../MiniSceneRenderer'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  getScene,
  makeGradientConfig,
  DEFAULT_EFFECTS_CONFIG,
  DEFAULT_RIBBON_CONFIG,
} from '../sectionScenes'

const scene = getScene('flutedGlass')

export function FlutedGlassSection() {
  const [flutedEnabled, setFlutedEnabled] = useState(false)
  const gradientConfig = makeGradientConfig(scene.colors)
  const effectsConfig = {
    ...DEFAULT_EFFECTS_CONFIG,
    flutedGlass: {
      ...DEFAULT_EFFECTS_CONFIG.flutedGlass,
      enabled: flutedEnabled,
    },
  }

  return (
    <FeatureCard
      title={scene.title}
      description={scene.description}
      renderPreview={() => (
        <MiniSceneRenderer
          backgroundType={scene.backgroundType}
          gradientConfig={gradientConfig}
          effectsConfig={effectsConfig}
          ribbonConfig={DEFAULT_RIBBON_CONFIG}
        />
      )}
    >
      <div className="flex items-center gap-3">
        <Switch
          checked={flutedEnabled}
          onCheckedChange={setFlutedEnabled}
        />
        <Label className="text-sm text-white/70">
          {flutedEnabled ? 'Enabled' : 'Disabled'}
        </Label>
      </div>
    </FeatureCard>
  )
}
