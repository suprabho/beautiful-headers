const EffectsLayer = ({ config }) => {
  const {
    texture,
    textureSize = 20,
    textureOpacity = 0.5,
    textureBlendMode = 'overlay',
    vignetteIntensity,
  } = config

  const getTexturePattern = () => {
    const lineWidth = Math.max(1, textureSize * 0.1)
    const dotSize = Math.max(1, textureSize * 0.15)
    
    switch (texture) {
      case 'grain':
        return `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
      case 'scanlines':
        return `repeating-linear-gradient(
          0deg,
          transparent,
          transparent ${textureSize - lineWidth}px,
          rgba(0, 0, 0, 0.3) ${textureSize - lineWidth}px,
          rgba(0, 0, 0, 0.3) ${textureSize}px
        )`
      case 'dots':
        return `radial-gradient(circle, rgba(255,255,255,0.4) ${dotSize}px, transparent ${dotSize}px)`
      case 'grid':
        return `
          linear-gradient(rgba(255,255,255,0.15) ${lineWidth}px, transparent ${lineWidth}px),
          linear-gradient(90deg, rgba(255,255,255,0.15) ${lineWidth}px, transparent ${lineWidth}px)
        `
      case 'diagonal':
        return `repeating-linear-gradient(
          45deg,
          transparent,
          transparent ${textureSize}px,
          rgba(255, 255, 255, 0.1) ${textureSize}px,
          rgba(255, 255, 255, 0.1) ${textureSize + lineWidth}px
        )`
      default:
        return 'none'
    }
  }

  const getTextureSize = () => {
    switch (texture) {
      case 'dots':
      case 'grid':
        return `${textureSize}px ${textureSize}px`
      case 'grain':
        return `${textureSize * 10}px ${textureSize * 10}px`
      default:
        return 'auto'
    }
  }

  return (
    <div
      className="effects-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 3,
        pointerEvents: 'none',
      }}
    >
      {/* Texture Layer */}
      {texture !== 'none' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: getTexturePattern(),
            backgroundSize: getTextureSize(),
            opacity: textureOpacity,
            mixBlendMode: textureBlendMode,
          }}
        />
      )}

      {/* Vignette Layer */}
      {vignetteIntensity > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(
              ellipse at center,
              transparent 0%,
              transparent 30%,
              rgba(0, 0, 0, ${vignetteIntensity}) 100%
            )`,
          }}
        />
      )}
    </div>
  )
}

export default EffectsLayer

