import { useRef, useEffect, useMemo, useState, memo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import FlutedGlassCanvas from './FlutedGlassCanvas'

// Color cache for hex to RGB conversions
const colorCache = new Map()

const hexToRgbCached = (hex) => {
  if (colorCache.has(hex)) return colorCache.get(hex)
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  const rgb = result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  } : { r: 0, g: 0, b: 0 }
  colorCache.set(hex, rgb)
  return rgb
}

// Vertex shader: displaces a flat plane into a flowing ribbon
const ribbonVertexShader = `
  precision highp float;

  uniform float u_time;
  uniform float u_amplitude;
  uniform float u_noise;
  uniform float u_speed;
  uniform float u_phaseOffset;
  uniform float u_ribbonIndex;
  uniform float u_ribbonCount;
  uniform float u_spread;
  uniform float u_rotation;
  uniform float u_taper;
  uniform vec2 u_resolution;

  varying vec2 vUv;
  varying float vDisplacement;
  varying vec3 vNormal;

  // Simplex noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                    + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                           dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vUv = uv;

    vec3 pos = position;

    // Taper: scale ribbon width along its length
    // u_taper > 0 = bulge (center wider), u_taper < 0 = pinch (center thinner)
    // Uses a parabolic curve centered at uv.x = 0.5
    float taperCurve = 1.0 - 4.0 * (uv.x - 0.5) * (uv.x - 0.5); // 0 at edges, 1 at center
    float taperFactor = 1.0 + u_taper * taperCurve;
    pos.y *= taperFactor;

    float t = u_time * u_speed;

    // Primary wave along the ribbon length (uv.x direction)
    float wave1 = sin(uv.x * 3.14159 * 2.0 + t + u_phaseOffset) * u_amplitude * 0.4;
    float wave2 = sin(uv.x * 3.14159 * 4.0 + t * 1.3 + u_phaseOffset * 0.7) * u_amplitude * 0.15;
    float wave3 = cos(uv.x * 3.14159 * 1.5 + t * 0.7 + u_phaseOffset * 1.3) * u_amplitude * 0.25;

    // Noise-based displacement for organic movement
    float noiseVal = snoise(vec2(uv.x * 2.0 + t * 0.3, u_ribbonIndex * 3.0 + t * 0.1)) * u_noise;
    float noiseVal2 = snoise(vec2(uv.x * 4.0 - t * 0.2, u_ribbonIndex * 5.0 + t * 0.15)) * u_noise * 0.3;

    // Combine displacements
    float displacement = wave1 + wave2 + wave3 + noiseVal + noiseVal2;

    // Apply displacement perpendicular to ribbon surface
    pos.y += displacement;

    // Slight z-displacement for depth
    pos.z += sin(uv.x * 3.14159 * 3.0 + t * 0.5 + u_phaseOffset) * u_amplitude * 0.1;
    pos.z += snoise(vec2(uv.x * 1.5 + t * 0.2, u_ribbonIndex * 7.0)) * u_noise * 0.15;

    vDisplacement = displacement;

    // Approximate normal for lighting
    float dx = 0.01;
    float dispNext = sin((uv.x + dx) * 3.14159 * 2.0 + t + u_phaseOffset) * u_amplitude * 0.4
                   + sin((uv.x + dx) * 3.14159 * 4.0 + t * 1.3 + u_phaseOffset * 0.7) * u_amplitude * 0.15
                   + cos((uv.x + dx) * 3.14159 * 1.5 + t * 0.7 + u_phaseOffset * 1.3) * u_amplitude * 0.25;
    float slope = (dispNext - (wave1 + wave2 + wave3)) / dx;
    vNormal = normalize(vec3(-slope, 1.0, 0.0));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

// Fragment shader: gradient color with silk-like sheen
const ribbonFragmentShader = `
  precision highp float;

  varying vec2 vUv;
  varying float vDisplacement;
  varying vec3 vNormal;

  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform float u_opacity;
  uniform float u_time;
  uniform float u_speed;
  uniform float u_taper;

  void main() {
    // Gradient along ribbon length
    float t = vUv.x;
    // Smooth s-curve for nicer gradient transition
    float gradientT = t * t * (3.0 - 2.0 * t);
    vec3 color = mix(u_color1, u_color2, gradientT);

    // Silk-like specular highlight based on displacement/normal
    vec3 lightDir = normalize(vec3(0.5, 0.8, 1.0));
    float specular = pow(max(dot(vNormal, lightDir), 0.0), 8.0);
    color += specular * 0.25;

    // Secondary, softer highlight
    vec3 lightDir2 = normalize(vec3(-0.3, 0.6, 0.8));
    float specular2 = pow(max(dot(vNormal, lightDir2), 0.0), 4.0);
    color += specular2 * 0.1;

    // Add subtle iridescence based on view angle and displacement
    float iridescence = sin(vDisplacement * 5.0 + vUv.x * 10.0 + u_time * u_speed * 0.5) * 0.03;
    color += iridescence;

    // Taper-aware edge fade
    // Compute how much the ribbon is scaled at this point along its length
    float taperCurve = 1.0 - 4.0 * (vUv.x - 0.5) * (vUv.x - 0.5);
    float taperFactor = 1.0 + u_taper * taperCurve;
    // Wider fade band when ribbon is wider, tighter when narrower
    float fadeWidth = 0.15 / max(taperFactor, 0.1);
    float edgeFade = smoothstep(0.0, fadeWidth, vUv.y) * smoothstep(1.0, 1.0 - fadeWidth, vUv.y);

    // Also fade at the start/end of the ribbon
    float tipFade = smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x);

    float alpha = u_opacity * edgeFade * tipFade;

    gl_FragColor = vec4(color, alpha);
  }
`

// Single ribbon mesh component
const Ribbon = ({ index, totalRibbons, config, colors, isPausedRef }) => {
  const materialRef = useRef()
  const meshRef = useRef()
  const timeRef = useRef(Math.random() * 100) // Random start time for variety

  // Determine color pair for this ribbon
  const colorPair = useMemo(() => {
    const colorCount = colors.length
    if (colorCount === 0) return { c1: { r: 1, g: 0, b: 0.5 }, c2: { r: 0.5, g: 0.2, b: 1 } }
    const idx1 = index % colorCount
    const idx2 = (index + 1) % colorCount
    return {
      c1: hexToRgbCached(colors[idx1]),
      c2: hexToRgbCached(colors[idx2]),
    }
  }, [colors, index])

  // Phase offset per ribbon for variety
  const phaseOffset = useMemo(() => {
    return (index / totalRibbons) * Math.PI * 2 + index * 0.7
  }, [index, totalRibbons])

  // Position offset to spread ribbons
  const yOffset = useMemo(() => {
    // Distribute ribbons across vertical space
    const normalizedIndex = (index / Math.max(totalRibbons - 1, 1)) - 0.5
    return normalizedIndex * config.spread * 1.5
  }, [index, totalRibbons, config.spread])

  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_amplitude: { value: config.amplitude * 0.3 },
    u_noise: { value: config.noise * 0.2 },
    u_speed: { value: config.speed },
    u_phaseOffset: { value: phaseOffset },
    u_ribbonIndex: { value: index },
    u_ribbonCount: { value: totalRibbons },
    u_spread: { value: config.spread },
    u_rotation: { value: config.rotation },
    u_taper: { value: config.taper || 0 },
    u_resolution: { value: new THREE.Vector2(1, 1) },
    u_color1: { value: new THREE.Vector3(colorPair.c1.r, colorPair.c1.g, colorPair.c1.b) },
    u_color2: { value: new THREE.Vector3(colorPair.c2.r, colorPair.c2.g, colorPair.c2.b) },
    u_opacity: { value: config.opacity },
  }), [])

  // Update uniforms when config changes
  useEffect(() => {
    if (!materialRef.current) return
    const mat = materialRef.current
    mat.uniforms.u_amplitude.value = config.amplitude * 0.3
    mat.uniforms.u_noise.value = config.noise * 0.2
    mat.uniforms.u_speed.value = config.speed
    mat.uniforms.u_spread.value = config.spread
    mat.uniforms.u_rotation.value = config.rotation
    mat.uniforms.u_taper.value = config.taper || 0
    mat.uniforms.u_opacity.value = config.opacity
    mat.uniforms.u_ribbonCount.value = totalRibbons
  }, [config, totalRibbons])

  // Update colors
  useEffect(() => {
    if (!materialRef.current) return
    materialRef.current.uniforms.u_color1.value.set(colorPair.c1.r, colorPair.c1.g, colorPair.c1.b)
    materialRef.current.uniforms.u_color2.value.set(colorPair.c2.r, colorPair.c2.g, colorPair.c2.b)
  }, [colorPair])

  // Update mesh position when spread changes
  useEffect(() => {
    if (meshRef.current) {
      const normalizedIndex = (index / Math.max(totalRibbons - 1, 1)) - 0.5
      meshRef.current.position.y = normalizedIndex * config.spread * 1.5
    }
  }, [config.spread, index, totalRibbons])

  useFrame((_, delta) => {
    if (!materialRef.current) return
    if (!isPausedRef.current) {
      timeRef.current += delta
    }
    materialRef.current.uniforms.u_time.value = timeRef.current
  })

  // Geometry dimensions: wide ribbon
  const ribbonWidth = 3.5 // extends across the viewport
  const ribbonHeight = config.thickness * 0.8

  // Rotation for diagonal sweep
  const rotationRad = (config.rotation * Math.PI) / 180

  return (
    <mesh
      ref={meshRef}
      position={[0, yOffset, index * 0.01]}
      rotation={[0, 0, rotationRad]}
    >
      <planeGeometry args={[ribbonWidth, ribbonHeight, 200, 10]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={ribbonVertexShader}
        fragmentShader={ribbonFragmentShader}
        transparent={true}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// Background plane
const Background = ({ color }) => {
  const rgb = useMemo(() => hexToRgbCached(color), [color])
  return (
    <mesh position={[0, 0, -1]}>
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial color={new THREE.Color(rgb.r, rgb.g, rgb.b)} />
    </mesh>
  )
}

const RibbonScene = ({ config, paletteColors, isPaused }) => {
  const isPausedRef = useRef(false)

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  const colors = useMemo(() => {
    if (paletteColors && paletteColors.length >= 2) return paletteColors
    return ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0']
  }, [paletteColors])

  const bgColor = useMemo(() => {
    return config.backgroundColor || '#ffffff'
  }, [config.backgroundColor])

  const ribbonCount = Math.max(2, Math.min(10, config.ribbonCount || 5))

  return (
    <>
      <Background color={bgColor} />
      {Array.from({ length: ribbonCount }).map((_, i) => (
        <Ribbon
          key={i}
          index={i}
          totalRibbons={ribbonCount}
          config={config}
          colors={colors}
          isPausedRef={isPausedRef}
        />
      ))}
    </>
  )
}

const RibbonLayer = memo(({ config, paletteColors = [], effectsConfig, isPaused }) => {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)

  const flutedEnabled = effectsConfig?.flutedGlass?.enabled ?? false

  // After mount, grab the R3F canvas element for FlutedGlassCanvas to sample
  useEffect(() => {
    if (containerRef.current) {
      const canvas = containerRef.current.querySelector('canvas')
      if (canvas) {
        canvasRef.current = canvas
        setCanvasReady(true)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="ribbon-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
    >
      <Canvas
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: false }}
        orthographic
        camera={{ position: [0, 0, 5], left: -1, right: 1, top: 1, bottom: -1, near: 0.1, far: 100, zoom: 1 }}
        style={{ width: '100%', height: '100%' }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        frameloop="always"
      >
        <RibbonScene
          config={config}
          paletteColors={paletteColors}
          isPaused={isPaused}
        />
      </Canvas>
      {flutedEnabled && canvasReady && canvasRef.current && (
        <FlutedGlassCanvas
          sourceCanvasRef={canvasRef}
          effectsConfig={effectsConfig}
        />
      )}
    </div>
  )
})

RibbonLayer.displayName = 'RibbonLayer'

export default RibbonLayer
