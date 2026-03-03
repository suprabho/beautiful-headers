import { MiniSceneRenderer } from './MiniSceneRenderer'
import {
  DEFAULT_EFFECTS_CONFIG,
  DEFAULT_AURORA_CONFIG,
  DEFAULT_FLUID_CONFIG,
  DEFAULT_WAVES_CONFIG,
  DEFAULT_RIBBON_CONFIG,
  DEFAULT_DANDELION_CONFIG,
  DEFAULT_PARTICLE_RING_CONFIG,
  makeGradientConfig,
  getScene,
} from './sectionScenes'

const fallback = getScene('hero')

const HERO_GRADIENT_CONFIG = makeGradientConfig(fallback.colors)

const HERO_EFFECTS_CONFIG = {
  ...DEFAULT_EFFECTS_CONFIG,
  flutedGlass: { enabled: false },
}

export function AboutHeroSection({ dbScene }) {
  const sd = dbScene?.scene_data
  const backgroundType = sd?.backgroundType ?? fallback.backgroundType
  const gradientConfig = sd?.gradientConfig || HERO_GRADIENT_CONFIG
  const effectsConfig = sd?.effectsConfig || HERO_EFFECTS_CONFIG

  return (
    <div className="relative w-full h-[300px] md:h-[360px] overflow-hidden">
      {/* Live background */}
      <MiniSceneRenderer
        backgroundType={backgroundType}
        gradientConfig={gradientConfig}
        effectsConfig={effectsConfig}
        auroraConfig={sd?.auroraConfig || DEFAULT_AURORA_CONFIG}
        fluidConfig={sd?.fluidConfig || DEFAULT_FLUID_CONFIG}
        wavesConfig={sd?.wavesConfig || DEFAULT_WAVES_CONFIG}
        ribbonConfig={sd?.ribbonConfig || DEFAULT_RIBBON_CONFIG}
        dandelionConfig={sd?.dandelionConfig || DEFAULT_DANDELION_CONFIG}
        particleRingConfig={sd?.particleRingConfig || DEFAULT_PARTICLE_RING_CONFIG}
      />

      {/* Overlay content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/20">
        <div className="flex items-center gap-3 mb-4">
          <img src="/apple-touch-icon.png" alt="Aura" className="w-12 h-12 rounded-xl" />
          <span className="text-sm font-medium text-white/70 tracking-widest uppercase">Aura</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-white text-center px-6 leading-tight" style={{ textShadow: '0 2px 40px rgba(0,0,0,0.5)' }}>
          Beautiful animated headers
        </h1>
        <p className="text-white/70 text-center mt-4 max-w-lg px-6 text-sm md:text-base">
          Interactive backgrounds with effects, tessellation, and text. Embed anywhere, customize everything.
        </p>
      </div>
    </div>
  )
}
