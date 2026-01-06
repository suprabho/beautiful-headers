import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import * as PhosphorIcons from '@phosphor-icons/react'

const TessellationLayer = ({ config, mousePos = { x: 0.5, y: 0.5 } }) => {
  const { icon, rowGap, colGap, size, opacity, rotation, color, mouseRotationInfluence = 0 } = config
  
  // Track viewport size to re-render grid on resize
  const [viewportSize, setViewportSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })
  
  // Track smoothed mouse position for smooth animation
  const currentMouseRef = useRef({ x: 0.5, y: 0.5 })
  const [smoothedMouse, setSmoothedMouse] = useState({ x: 0.5, y: 0.5 })
  const animationRef = useRef(null)
  
  // Listen for viewport resize
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const IconComponent = useMemo(() => {
    const iconName = icon || 'Star'
    return PhosphorIcons[iconName] || PhosphorIcons.Star
  }, [icon])

  // Animate mouse smoothing for rotation effect
  useEffect(() => {
    if (mouseRotationInfluence <= 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }
    
    const animate = () => {
      const lerpFactor = 0.1
      currentMouseRef.current.x += (mousePos.x - currentMouseRef.current.x) * lerpFactor
      currentMouseRef.current.y += (mousePos.y - currentMouseRef.current.y) * lerpFactor
      setSmoothedMouse({ x: currentMouseRef.current.x, y: currentMouseRef.current.y })
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [mousePos.x, mousePos.y, mouseRotationInfluence])

  // Calculate rotation based on mouse position for each element
  const getMouseRotation = useCallback((itemX, itemY) => {
    if (mouseRotationInfluence <= 0) return 0
    
    const mouseX = smoothedMouse.x * viewportSize.width
    const mouseY = smoothedMouse.y * viewportSize.height
    
    // Vector from element to mouse
    const dx = mouseX - itemX
    const dy = mouseY - itemY
    
    // Calculate angle from element to mouse (in degrees)
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)
    
    // Distance-based falloff
    const distance = Math.sqrt(dx * dx + dy * dy)
    const maxDistance = 300 // Max influence distance in pixels
    const falloff = Math.max(0, 1 - distance / maxDistance)
    
    // Apply influence with falloff - icons point toward mouse
    return angle * falloff * mouseRotationInfluence
  }, [smoothedMouse.x, smoothedMouse.y, mouseRotationInfluence, viewportSize.width, viewportSize.height])

  const grid = useMemo(() => {
    const items = []
    const cols = Math.ceil(viewportSize.width / colGap) + 2
    const rows = Math.ceil(viewportSize.height / rowGap) + 2
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const isOffset = row % 2 === 1
        items.push({
          key: `${row}-${col}`,
          x: col * colGap + (isOffset ? colGap / 2 : 0) - colGap,
          y: row * rowGap - rowGap,
          delay: (row + col) * 0.02,
        })
      }
    }
    return items
  }, [rowGap, colGap, viewportSize.width, viewportSize.height])

  return (
    <div
      className="tessellation-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 2,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {grid.map((item) => {
        const mouseRot = getMouseRotation(item.x + size / 2, item.y + size / 2)
        const totalRotation = rotation + mouseRot
        
        return (
          <div
            key={item.key}
            style={{
              position: 'absolute',
              left: item.x,
              top: item.y,
              transform: `rotate(${totalRotation}deg)`,
              opacity: opacity,
              color: color,
              transition: mouseRotationInfluence > 0 ? 'transform 0.1s ease-out' : 'none',
            }}
          >
            <IconComponent size={size} weight="regular" />
          </div>
        )
      })}
    </div>
  )
}

export { TessellationLayer as default }
export const AVAILABLE_ICONS = [
  'Star', 'Heart', 'Diamond', 'Circle', 'Square', 'Triangle',
  'Hexagon', 'Octagon', 'Pentagon', 'Cross', 'Plus', 'Minus',
  'Lightning', 'Sun', 'Moon', 'Cloud', 'Sparkle', 'Fire',
  'Drop', 'Leaf', 'Flower', 'Tree', 'Mountains', 'Waves',
  'Eye', 'Hand', 'Crown', 'Gift', 'Gear', 'Atom',
  'Planet', 'Rocket', 'Alien', 'Ghost', 'Skull', 'Smiley',
  'MusicNote', 'Headphones', 'Camera', 'GameController',
  'Butterfly', 'Bird', 'Fish', 'Cat', 'Dog', 'Horse',
  'Snowflake', 'Rainbow', 'Compass', 'Anchor', 'Infinity', 'CarProfile', 'AirplaneTilt', 'Cheers', 'Sailboat', 'Wand', 'MagicWand', 'Baby', 'Balloon', 'BabyCarriage'
]
