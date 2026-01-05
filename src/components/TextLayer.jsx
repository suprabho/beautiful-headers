import { useState, useEffect } from 'react'

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
  'scribble': "'Pacifico', cursive",
}

const TextLayer = ({ sections, gap, color = '#ffffff', opacity = 1 }) => {
  const rgb = hexToRgb(color) || { r: 255, g: 255, b: 255 }
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
  
  // Calculate responsive font size based on viewport width
  const getResponsiveFontSize = (baseSize) => {
    // Scale down proportionally on smaller screens
    // Mobile (320px): ~35% of base size
    // Tablet (768px): ~65% of base size  
    // Desktop (1920px+): full size
    if (windowWidth <= 480) {
      // Mobile phones
      return Math.max(14, Math.round(baseSize * 0.35))
    } else if (windowWidth <= 768) {
      // Tablets
      return Math.round(baseSize * 0.65)
    } else if (windowWidth <= 1024) {
      // Small desktops
      return Math.round(baseSize * 0.85)
    } else {
      // Large desktops - full size
      return baseSize
    }
  }
  
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
        gap: `${gap}px`,
        pointerEvents: 'none',
      }}
    >
      {sections.map((section, index) => (
        <div
          key={section.id}
          className="text-section"
          style={{
            fontSize: `${getResponsiveFontSize(section.size)}px`,
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
}

export default TextLayer


