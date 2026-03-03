import { MiniSceneRenderer } from './MiniSceneRenderer'

const HERO_GRADIENT_CONFIG = {
  colors: ['#b80038', '#fdf7f2', '#004d9c', '#00999a'],
  numColors: 4,
  type: 'radial',
  startPos: { x: 0, y: 0 },
  endPos: { x: 100, y: 100 },
  colorStops: [0, 33, 66, 100],
  waveIntensity: 0.3,
  mouseInfluence: 0.5,
  decaySpeed: 0.95,
  wave1Speed: 0.2,
  wave1Direction: 1,
  wave2Speed: 0.15,
  wave2Direction: -1,
}

const HERO_EFFECTS_CONFIG = {
  blur: 0,
  texture: 'none',
  textureSize: 20,
  textureOpacity: 0.5,
  textureBlendMode: 'overlay',
  colorMap: 'none',
  vignetteIntensity: 0.3,
  saturation: 100,
  contrast: 100,
  brightness: 100,
  flutedGlass: { enabled: false },
}

export function AboutHeroSection() {
  return (
    <div className="relative w-full h-[300px] md:h-[360px] overflow-hidden">
      {/* Live background */}
      <MiniSceneRenderer
        backgroundType="liquid"
        gradientConfig={HERO_GRADIENT_CONFIG}
        effectsConfig={HERO_EFFECTS_CONFIG}
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
