import { useState } from 'react'
import { Copy, Check } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { EmbedDialogContent } from '@/components/EmbedDialog'
import { FeatureCard } from '../FeatureCard'
import { MiniSceneRenderer } from '../MiniSceneRenderer'
import {
  getScene,
  makeGradientConfig,
  DEFAULT_EFFECTS_CONFIG,
  DEFAULT_PARTICLE_RING_CONFIG,
} from '../sectionScenes'

const fallback = getScene('embed')

const EMBED_CODE = `<iframe src="https://aura.promad.design/embed/your-scene" width="100%" height="600" frameborder="0" style="border:0;border-radius:8px;" allowfullscreen></iframe>`

export function EmbedSection({ dbScene }) {
  const sd = dbScene?.scene_data
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)
  const gradientConfig = sd?.gradientConfig || makeGradientConfig(fallback.colors)

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
      title={fallback.title}
      description={fallback.description}
      renderPreview={() => (
        <MiniSceneRenderer
          backgroundType={sd?.backgroundType || fallback.backgroundType}
          gradientConfig={gradientConfig}
          effectsConfig={sd?.effectsConfig || DEFAULT_EFFECTS_CONFIG}
          particleRingConfig={sd?.particleRingConfig || DEFAULT_PARTICLE_RING_CONFIG}
        />
      )}
    >
      <div
        className="w-full"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Default: small code snippet */}
        <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-2 max-w-xs mx-auto cursor-default">
          <code className="text-[10px] text-green-400 font-mono truncate">&lt;iframe src=&quot;.../embed/your-scene&quot; height=&quot;600&quot; allowfullscreen&gt;&lt;/iframe&gt;</code>
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
        {/* Hover: actual EmbedDialog content overlay */}
        <div
          className={`absolute inset-0 z-20 bg-popover/95 backdrop-blur-xl rounded-2xl p-3 shadow-2xl transition-all duration-200 overflow-y-auto ${
            hovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <EmbedDialogContent slug="your-scene" />
        </div>
      </div>
    </FeatureCard>
  )
}
