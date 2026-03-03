import { useState } from 'react'
import { Copy, Check } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { FeatureCard } from '../FeatureCard'
import { MiniSceneRenderer } from '../MiniSceneRenderer'
import {
  getScene,
  makeGradientConfig,
  DEFAULT_EFFECTS_CONFIG,
  DEFAULT_PARTICLE_RING_CONFIG,
} from '../sectionScenes'

const scene = getScene('embed')

const EMBED_CODE = `<iframe src="https://aura.promad.design/embed/your-scene" width="100%" height="400" frameborder="0" style="border:none;border-radius:12px"></iframe>`

export function EmbedSection() {
  const [copied, setCopied] = useState(false)
  const gradientConfig = makeGradientConfig(scene.colors)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(EMBED_CODE)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <FeatureCard
      title={scene.title}
      description={scene.description}
      renderPreview={() => (
        <MiniSceneRenderer
          backgroundType={scene.backgroundType}
          gradientConfig={gradientConfig}
          effectsConfig={DEFAULT_EFFECTS_CONFIG}
          particleRingConfig={DEFAULT_PARTICLE_RING_CONFIG}
        />
      )}
    >
      <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-2 max-w-xs mx-auto">
        <code className="text-[10px] text-green-400 font-mono truncate">&lt;iframe src=&quot;...&quot; /&gt;</code>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-white/70 hover:text-white shrink-0"
          onClick={handleCopy}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span className="ml-1 text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>
    </FeatureCard>
  )
}
