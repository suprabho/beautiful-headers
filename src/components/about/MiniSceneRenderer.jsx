import { useState, useCallback, useRef } from 'react'
import GradientLayer from '../GradientLayer'
import SimpleGradientLayer from '../SimpleGradientLayer'
import AuroraLayer from '../AuroraLayer'
import FluidGradientLayer from '../FluidGradientLayer'
import WavesLayer from '../WavesLayer'
import RibbonLayer from '../RibbonLayer'
import DandelionLayer from '../DandelionLayer'
import ParticleRingLayer from '../ParticleRingLayer'
import ChidiyaUddLayer from '../ChidiyaUddLayer'
import TessellationLayer from '../TessellationLayer'
import EffectsLayer from '../EffectsLayer'
import TextLayer from '../TextLayer'

// Virtual viewport size for the mini scene
const VIRTUAL_W = 800
const VIRTUAL_H = 500

export function MiniSceneRenderer({
  backgroundType = 'liquid',
  gradientConfig,
  auroraConfig,
  fluidConfig,
  wavesConfig,
  ribbonConfig,
  dandelionConfig,
  particleRingConfig,
  chidiyaUddConfig,
  tessellationConfig,
  effectsConfig,
  textConfig,
  textSections,
  textGap = 20,
  mouseConfig = { enabled: true, intensity: 0.5 },
  showTessellation = false,
  showEffects = false,
  showText = false,
}) {
  const containerRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })

  const rafPendingRef = useRef(false)
  const pendingMouseRef = useRef({ x: 0.5, y: 0.5 })

  const handleMouseMove = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    pendingMouseRef.current.x = (e.clientX - rect.left) / rect.width
    pendingMouseRef.current.y = (e.clientY - rect.top) / rect.height

    if (rafPendingRef.current) return
    rafPendingRef.current = true
    requestAnimationFrame(() => {
      setMousePos({ ...pendingMouseRef.current })
      rafPendingRef.current = false
    })
  }, [])

  // Build CSS filter for non-liquid backgrounds
  const getGradientFilter = () => {
    if (!effectsConfig) return 'none'
    if (backgroundType === 'liquid') {
      return effectsConfig.blur > 0 ? `blur(${effectsConfig.blur}px)` : 'none'
    }
    const filters = [
      effectsConfig.blur > 0 ? `blur(${effectsConfig.blur}px)` : '',
      `saturate(${effectsConfig.saturation || 100}%)`,
      `contrast(${effectsConfig.contrast || 100}%)`,
      `brightness(${effectsConfig.brightness || 100}%)`,
    ]
    switch (effectsConfig.colorMap) {
      case 'sepia': filters.push('sepia(0.8)'); break
      case 'cyberpunk': filters.push('hue-rotate(280deg) saturate(1.5)'); break
      case 'sunset': filters.push('hue-rotate(30deg) saturate(1.3)'); break
      case 'matrix': filters.push('hue-rotate(90deg) saturate(2) brightness(0.9)'); break
      case 'noir': filters.push('grayscale(1) contrast(1.2)'); break
      case 'vintage': filters.push('sepia(0.3) saturate(1.5) hue-rotate(-10deg)'); break
    }
    return filters.filter(Boolean).join(' ') || 'none'
  }

  const intensity = mouseConfig?.intensity ?? 0.5
  const paletteColors = gradientConfig?.colors || ['#b80038', '#fdf7f2', '#004d9c', '#00999a']

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Scaled virtual viewport */}
      <div
        className="absolute inset-0"
        style={{ position: 'absolute', inset: 0 }}
      >
        <div className="layers-container" style={{ position: 'absolute', inset: 0 }}>
          {/* Background layer */}
          <div
            className="gradient-effects-wrapper"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              filter: getGradientFilter(),
            }}
          >
            {backgroundType === 'simple' && gradientConfig && (
              <SimpleGradientLayer config={gradientConfig} gradientColors={paletteColors} effectsConfig={effectsConfig || {}} />
            )}
            {backgroundType === 'liquid' && gradientConfig && (
              <GradientLayer config={gradientConfig} effectsConfig={effectsConfig || {}} mousePos={mousePos} isPaused={false} mouseIntensity={intensity} />
            )}
            {backgroundType === 'aurora' && (
              <AuroraLayer config={auroraConfig || {}} mousePos={mousePos} paletteColors={paletteColors} effectsConfig={effectsConfig || {}} isPaused={false} mouseIntensity={intensity} />
            )}
            {backgroundType === 'fluid' && (
              <FluidGradientLayer config={fluidConfig || {}} paletteColors={paletteColors} effectsConfig={effectsConfig || {}} isPaused={false} mousePos={mousePos} mouseIntensity={intensity} />
            )}
            {backgroundType === 'waves' && (
              <WavesLayer config={wavesConfig || {}} paletteColors={paletteColors} effectsConfig={effectsConfig || {}} isPaused={false} mousePos={mousePos} mouseIntensity={intensity} />
            )}
            {backgroundType === 'ribbon' && (
              <RibbonLayer config={ribbonConfig || {}} paletteColors={paletteColors} effectsConfig={effectsConfig || {}} isPaused={false} mousePos={mousePos} mouseIntensity={intensity} />
            )}
            {backgroundType === 'dandelion' && (
              <DandelionLayer config={dandelionConfig || {}} paletteColors={paletteColors} effectsConfig={effectsConfig || {}} isPaused={false} mouseEnabled={true} mouseIntensity={intensity} />
            )}
            {backgroundType === 'particleRing' && (
              <ParticleRingLayer config={particleRingConfig || {}} paletteColors={paletteColors} effectsConfig={effectsConfig || {}} isPaused={false} mousePos={mousePos} mouseIntensity={intensity} />
            )}
            {backgroundType === 'chidiyaUdd' && (
              <ChidiyaUddLayer config={chidiyaUddConfig || {}} paletteColors={paletteColors} effectsConfig={effectsConfig || {}} isPaused={false} mousePos={mousePos} mouseIntensity={intensity} />
            )}
          </div>

          {/* Tessellation layer */}
          {showTessellation && tessellationConfig?.enabled && (
            <TessellationLayer config={tessellationConfig} mousePos={mousePos} isPaused={false} mouseIntensity={intensity} />
          )}

          {/* Effects layer */}
          {showEffects && effectsConfig && (
            <EffectsLayer config={effectsConfig} />
          )}

          {/* Text layer */}
          {showText && textConfig?.enabled && textSections && (
            <TextLayer
              sections={textSections}
              gap={textGap}
              color={textConfig.color}
              opacity={textConfig.opacity}
            />
          )}
        </div>
      </div>
    </div>
  )
}
