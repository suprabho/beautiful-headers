/**
 * ColorPlaceholder — an instant, zero-network low-quality placeholder (LQIP)
 * built from a scene's palette colors. Renders soft, blurred color blobs as an
 * inline SVG so it resembles the live scene before the thumbnail/scene load.
 */

const FALLBACK_COLORS = ['#1f1f1f', '#2b2b2b']

// Deterministic blob positions (viewBox 0..100) so the placeholder is stable
// across re-renders and roughly spreads colors across the canvas.
const BLOB_POSITIONS = [
  { x: 22, y: 28 },
  { x: 78, y: 22 },
  { x: 72, y: 74 },
  { x: 28, y: 72 },
  { x: 50, y: 48 },
  { x: 86, y: 54 },
  { x: 14, y: 52 },
  { x: 50, y: 90 },
]

function ColorPlaceholder({ colors, className, style }) {
  const list = Array.isArray(colors) && colors.length ? colors : FALLBACK_COLORS
  const bg = list[0]

  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="aura-lqip-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      <rect width="100" height="100" fill={bg} />
      <g filter="url(#aura-lqip-blur)">
        {list.map((color, i) => {
          const pos = BLOB_POSITIONS[i % BLOB_POSITIONS.length]
          return (
            <circle key={i} cx={pos.x} cy={pos.y} r={42} fill={color} opacity={0.85} />
          )
        })}
      </g>
    </svg>
  )
}

export default ColorPlaceholder
