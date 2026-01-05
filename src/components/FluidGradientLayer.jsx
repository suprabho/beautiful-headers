import { useMemo } from 'react'

const FluidGradientLayer = ({ config, paletteColors = [] }) => {
  const {
    backgroundColor = '#1C89FF',
    useGradientColors = true,
    colors = ['#71ECFF', '#39F58A', '#71ECFF', '#F0CBA8'],
    speed = 1,
    intensity = 0.5,
    blurAmount = 0,
  } = config

  // Get duration based on base value and speed multiplier
  const getDuration = (base) => `${base / speed}s`

  // Determine which colors to use
  const gradientColors = useMemo(() => {
    if (useGradientColors && paletteColors.length >= 4) {
      return paletteColors.slice(0, 4)
    }
    if (useGradientColors && paletteColors.length >= 2) {
      // If we have 2-3 colors, repeat them to get 4
      const repeated = []
      for (let i = 0; i < 4; i++) {
        repeated.push(paletteColors[i % paletteColors.length])
      }
      return repeated
    }
    return colors
  }, [useGradientColors, paletteColors, colors])

  // Get background color - use first palette color darkened or custom
  const bgColor = useMemo(() => {
    if (useGradientColors && paletteColors.length > 0) {
      // Use a darker version of the first color or the color itself
      return paletteColors[0]
    }
    return backgroundColor
  }, [useGradientColors, paletteColors, backgroundColor])

  // Generate unique IDs for this instance
  const instanceId = useMemo(() => Math.random().toString(36).substr(2, 9), [])

  return (
    <div
      className="fluid-gradient-layer"
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: bgColor,
        overflow: 'hidden',
        filter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <defs>
          {/* Gradient 1 */}
          <radialGradient
            id={`fluidGrad1-${instanceId}`}
            cx="50%"
            cy="50%"
            fx="10%"
            fy="50%"
            r={intensity}
          >
            <animate
              attributeName="fx"
              dur={getDuration(34)}
              values="0%;3%;0%"
              repeatCount="indefinite"
            />
            <stop offset="0%" stopColor={gradientColors[0]} />
            <stop offset="100%" stopColor={`${gradientColors[0]}00`} />
          </radialGradient>

          {/* Gradient 2 */}
          <radialGradient
            id={`fluidGrad2-${instanceId}`}
            cx="50%"
            cy="50%"
            fx="10%"
            fy="50%"
            r={intensity}
          >
            <animate
              attributeName="fx"
              dur={getDuration(23.5)}
              values="0%;3%;0%"
              repeatCount="indefinite"
            />
            <stop offset="0%" stopColor={gradientColors[1]} />
            <stop offset="100%" stopColor={`${gradientColors[1]}00`} />
          </radialGradient>

          {/* Gradient 3 */}
          <radialGradient
            id={`fluidGrad3-${instanceId}`}
            cx="50%"
            cy="50%"
            fx="50%"
            fy="50%"
            r={intensity}
          >
            <animate
              attributeName="fx"
              dur={getDuration(21.5)}
              values="0%;3%;0%"
              repeatCount="indefinite"
            />
            <stop offset="0%" stopColor={gradientColors[2]} />
            <stop offset="100%" stopColor={`${gradientColors[2]}00`} />
          </radialGradient>

          {/* Gradient 4 */}
          <radialGradient
            id={`fluidGrad4-${instanceId}`}
            cx="50%"
            cy="50%"
            fx="90%"
            fy="50%"
            r={intensity}
          >
            <animate
              attributeName="fx"
              dur={getDuration(28)}
              values="0%;3%;0%"
              repeatCount="indefinite"
            />
            <stop offset="0%" stopColor={gradientColors[3]} />
            <stop offset="100%" stopColor={`${gradientColors[3]}00`} />
          </radialGradient>
        </defs>

        {/* Rectangle 1 */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={`url(#fluidGrad1-${instanceId})`}
        >
          <animate
            attributeName="x"
            dur={getDuration(20)}
            values="25%;0%;25%"
            repeatCount="indefinite"
          />
          <animate
            attributeName="y"
            dur={getDuration(21)}
            values="0%;25%;0%"
            repeatCount="indefinite"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur={getDuration(17)}
            repeatCount="indefinite"
          />
        </rect>

        {/* Rectangle 2 */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={`url(#fluidGrad2-${instanceId})`}
        >
          <animate
            attributeName="x"
            dur={getDuration(23)}
            values="-25%;0%;-25%"
            repeatCount="indefinite"
          />
          <animate
            attributeName="y"
            dur={getDuration(24)}
            values="0%;50%;0%"
            repeatCount="indefinite"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur={getDuration(18)}
            repeatCount="indefinite"
          />
        </rect>

        {/* Rectangle 3 */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={`url(#fluidGrad3-${instanceId})`}
        >
          <animate
            attributeName="x"
            dur={getDuration(25)}
            values="0%;25%;0%"
            repeatCount="indefinite"
          />
          <animate
            attributeName="y"
            dur={getDuration(26)}
            values="0%;25%;0%"
            repeatCount="indefinite"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 50 50"
            to="0 50 50"
            dur={getDuration(19)}
            repeatCount="indefinite"
          />
        </rect>

        {/* Rectangle 4 */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={`url(#fluidGrad4-${instanceId})`}
        >
          <animate
            attributeName="x"
            dur={getDuration(22)}
            values="25%;50%;25%"
            repeatCount="indefinite"
          />
          <animate
            attributeName="y"
            dur={getDuration(27)}
            values="25%;0%;25%"
            repeatCount="indefinite"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur={getDuration(20)}
            repeatCount="indefinite"
          />
        </rect>
      </svg>
    </div>
  )
}

export default FluidGradientLayer

