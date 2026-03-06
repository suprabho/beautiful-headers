import { useState, useEffect, useMemo, memo, useCallback } from 'react'

const hexToRgb = (hex) => {
  if (typeof hex !== 'string') return null
  const cleaned = hex.replace('#', '').trim()
  if (cleaned.length !== 6) return null
  const r = parseInt(cleaned.slice(0, 2), 16)
  const g = parseInt(cleaned.slice(2, 4), 16)
  const b = parseInt(cleaned.slice(4, 6), 16)
  if ([r, g, b].some((v) => Number.isNaN(v))) return null
  return { r, g, b }
}

// Font family mapping for the 4 supported font types
const FONT_FAMILIES = {
  'sans-serif': "'Manrope', sans-serif",
  'serif': "'Playfair Display', serif",
  'mono': "'Space Grotesk', monospace",
  'scribble': "'Petit Formal Script', cursive",
}

// Memoized text section component
const TextSection = memo(({ section, index, gap, color, opacity, rgb, getResponsiveFontSize }) => {
  const responsiveFontSize = useMemo(
    () => getResponsiveFontSize(section.size),
    [getResponsiveFontSize, section.size]
  )

  return (
    <div
      className="text-section"
      style={{
        fontSize: `${responsiveFontSize}px`,
        fontWeight: section.weight,
        fontStyle: section.italic ? 'italic' : 'normal',
        letterSpacing: `${section.spacing}em`,
        color,
        opacity,
        textShadow: `
          0 0 40px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3),
          0 0 80px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2),
          0 4px 20px rgba(0, 0, 0, 0.5)
        `,
        fontFamily: FONT_FAMILIES[section.font] || FONT_FAMILIES['sans-serif'],
        mixBlendMode: 'difference',
        animation: `text-float 6s ease-in-out ${index * 0.5}s infinite`,
        textAlign: 'center',
        padding: '0 20px',
        wordBreak: 'break-word',
      }}
    >
      {section.text}
    </div>
  )
})

TextSection.displayName = 'TextSection'

const TextLayer = memo(({ sections, gap, color = '#ffffff', opacity = 1 }) => {
  const rgb = useMemo(() => hexToRgb(color) || { r: 255, g: 255, b: 255 }, [color])

  const [windowWidth, setWindowWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth
    }
    return 1920 // Default to desktop size for SSR
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    // Set initial width
    setWindowWidth(window.innerWidth)

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Responsive scale factor shared by font sizes and gap
  const responsiveScale = useMemo(() => {
    if (windowWidth <= 480) return 0.35
    if (windowWidth <= 768) return 0.65
    if (windowWidth <= 1024) return 0.85
    return 1
  }, [windowWidth])

  // Memoize responsive font size calculator
  const getResponsiveFontSize = useCallback((baseSize) => {
    // Scale down proportionally on smaller screens
    // Mobile (320px): ~35% of base size
    // Tablet (768px): ~65% of base size
    // Desktop (1920px+): full size
    return responsiveScale < 1
      ? Math.max(14, Math.round(baseSize * responsiveScale))
      : baseSize
  }, [responsiveScale])

  // Scale gap proportionally so spacing stays consistent with font sizes
  const responsiveGap = useMemo(
    () => Math.round(gap * responsiveScale),
    [gap, responsiveScale]
  )

  return (
    <div
      className="text-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 4,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: `${responsiveGap}px`,
        pointerEvents: 'none',
      }}
    >
      {sections.map((section, index) => (
        <TextSection
          key={section.id}
          section={section}
          index={index}
          gap={gap}
          color={color}
          opacity={opacity}
          rgb={rgb}
          getResponsiveFontSize={getResponsiveFontSize}
        />
      ))}
      <style>{`
        @keyframes text-float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  )
})

TextLayer.displayName = 'TextLayer'

export default TextLayer


