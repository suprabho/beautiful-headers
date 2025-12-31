import { useMemo } from 'react'
import * as PhosphorIcons from '@phosphor-icons/react'

const TessellationLayer = ({ config }) => {
  const { icon, rowGap, colGap, size, opacity, rotation, color } = config

  const availableIcons = [
    'Star', 'Heart', 'Diamond', 'Circle', 'Square', 'Triangle',
    'Hexagon', 'Octagon', 'Pentagon', 'Cross', 'Plus', 'Minus',
    'Lightning', 'Sun', 'Moon', 'Cloud', 'Sparkle', 'Fire',
    'Drop', 'Leaf', 'Flower', 'Tree', 'Mountains', 'Waves',
    'Eye', 'Hand', 'Crown', 'Gift', 'Gear', 'Atom',
    'Planet', 'Rocket', 'Alien', 'Ghost', 'Skull', 'Smiley',
    'MusicNote', 'Headphones', 'Camera', 'GameController',
    'Butterfly', 'Bird', 'Fish', 'Cat', 'Dog', 'Horse',
    'Snowflake', 'Rainbow', 'Compass', 'Anchor', 'Infinity'
  ]

  const IconComponent = useMemo(() => {
    const iconName = icon || 'Star'
    return PhosphorIcons[iconName] || PhosphorIcons.Star
  }, [icon])

  const grid = useMemo(() => {
    const items = []
    const cols = Math.ceil(window.innerWidth / colGap) + 2
    const rows = Math.ceil(window.innerHeight / rowGap) + 2
    
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
  }, [rowGap, colGap])

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
      {grid.map((item) => (
        <div
          key={item.key}
          style={{
            position: 'absolute',
            left: item.x,
            top: item.y,
            transform: `rotate(${rotation}deg)`,
            opacity: opacity,
            color: color,
            animation: `tessellate-pulse 4s ease-in-out ${item.delay}s infinite`,
          }}
        >
          <IconComponent size={size} weight="regular" />
        </div>
      ))}
      <style>{`
        @keyframes tessellate-pulse {
          0%, 100% { 
            transform: rotate(${rotation}deg) scale(1);
            opacity: ${opacity};
          }
          50% { 
            transform: rotate(${rotation}deg) scale(1.1);
            opacity: ${opacity * 0.7};
          }
        }
      `}</style>
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
  'Snowflake', 'Rainbow', 'Compass', 'Anchor', 'Infinity'
]

