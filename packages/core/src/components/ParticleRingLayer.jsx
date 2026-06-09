import { useRef, useEffect, useState, useMemo, memo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import FlutedGlassCanvas from './FlutedGlassCanvas'
import { audioData } from '../audio/audioData'
import { smoothMouse, getMouseEffects } from '../mouse/applyMouseEffect'

const DEG2RAD = Math.PI / 180
const MAX_PARTICLES = 2000

// Color cache for hex to RGB conversions
const colorCache = new Map()

const hexToRgb = (hex) => {
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

function SceneSetup({ config, colors }) {
  const { scene } = useThree()

  useEffect(() => {
    const res = 512
    const cvs = document.createElement('canvas')
    cvs.width = res
    cvs.height = res
    const ctx = cvs.getContext('2d')

    const cx = res / 2, cy = res / 2
    const endX = (config.gradientEndX ?? 100) / 100
    const endY = (config.gradientEndY ?? 100) / 100
    const endR = Math.sqrt((res * endX) ** 2 + (res * endY) ** 2)

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, endR)
    const gradColors = config.radialGradientColors || [
      config.radialGradientCenter || config.backgroundColor || '#fef6f9',
      config.radialGradientOuter || colors[colors.length - 1] || '#fef3c7'
    ]
    const gradStops = config.radialGradientStops || [0, 100]
    const sorted = gradColors
      .map((c, i) => ({ color: c, stop: (gradStops[i] ?? 0) / 100 }))
      .sort((a, b) => a.stop - b.stop)
    sorted.forEach(({ color, stop }) => grad.addColorStop(stop, color))

    ctx.fillStyle = grad
    ctx.fillRect(0, 0, res, res)

    const texture = new THREE.CanvasTexture(cvs)
    scene.background = texture

    return () => {
      texture.dispose()
      scene.background = null
    }
  }, [
    config.radialGradientColors, config.radialGradientStops,
    config.gradientEndX, config.gradientEndY,
    config.radialGradientCenter, config.radialGradientOuter,
    config.backgroundColor, colors, scene
  ])

  return null
}

function generateParticles(count, ringRadius, ringWidth, dispersion) {
  const particles = []
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const radiusOffset = (Math.random() - 0.5) * ringWidth
    const baseRadius = ringRadius + radiusOffset

    particles.push({
      angle,
      baseRadius,
      dispersionX: (Math.random() - 0.5) * dispersion,
      dispersionY: (Math.random() - 0.5) * dispersion,
      dispersionZ: (Math.random() - 0.5) * dispersion * 0.3,
      size: 0.5 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.5 + Math.random() * 1,
      opacity: 0.6 + Math.random() * 0.4,
    })
  }
  return particles
}

function ParticleRingMesh({ config, colors, isPaused, mousePos = { x: 0.5, y: 0.5 }, mouseIntensity = 1 }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const timeRef = useRef(0)
  const configRef = useRef(config)
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 })
  const smoothedMouseRef = useRef({ x: 0.5, y: 0.5 })
  const mouseIntensityRef = useRef(mouseIntensity)

  useEffect(() => { configRef.current = config }, [config])
  useEffect(() => {
    if (mouseIntensity === 0) {
      targetMouseRef.current = null
      smoothedMouseRef.current = null
    } else {
      if (!smoothedMouseRef.current) smoothedMouseRef.current = { x: 0.5, y: 0.5 }
      targetMouseRef.current = mousePos
    }
  }, [mousePos, mouseIntensity])
  useEffect(() => { mouseIntensityRef.current = mouseIntensity }, [mouseIntensity])

  const tempObj = useMemo(() => new THREE.Object3D(), [])
  const tempColor = useMemo(() => new THREE.Color(), [])

  const particleData = useMemo(() =>
    generateParticles(config.particleCount, config.ringRadius, config.ringWidth, config.dispersion),
    [config.particleCount, config.ringRadius, config.ringWidth, config.dispersion]
  )

  // Set instance count and initial colors
  useEffect(() => {
    if (!meshRef.current) return
    meshRef.current.count = particleData.length

    for (let i = 0; i < particleData.length; i++) {
      const p = particleData[i]
      const normalizedAngle = ((p.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
      const colorProgress = normalizedAngle / (Math.PI * 2)
      const colorIdx = Math.floor(colorProgress * colors.length) % colors.length
      const nextColorIdx = (colorIdx + 1) % colors.length
      const colorT = (colorProgress * colors.length) % 1

      const c1 = hexToRgb(colors[colorIdx])
      const c2 = hexToRgb(colors[nextColorIdx])

      tempColor.setRGB(
        c1.r + (c2.r - c1.r) * colorT,
        c1.g + (c2.g - c1.g) * colorT,
        c1.b + (c2.b - c1.b) * colorT
      )
      meshRef.current.setColorAt(i, tempColor)
    }
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [particleData, colors])

  const { camera } = useThree()

  useFrame((_, delta) => {
    const cfg = configRef.current
    const audioSpeedBoost = audioData.isActive ? audioData.treble * 1.5 : 0
    if (!isPaused) timeRef.current += delta * (cfg.speed + audioSpeedBoost)
    const time = timeRef.current

    if (!groupRef.current || !meshRef.current) return

    // Smooth mouse interpolation (using centralized mapping) — skip when interaction disabled
    let mouseFx = {}
    if (smoothedMouseRef.current && targetMouseRef.current) {
      smoothMouse(smoothedMouseRef.current, targetMouseRef.current, 'particleRing')
      mouseFx = getMouseEffects('particleRing', smoothedMouseRef.current, mouseIntensityRef.current)
    }

    // Apply tilt — config tilt + mouse-driven tilt
    const tiltX = (cfg.tiltX ?? 0) * DEG2RAD + (mouseFx.tiltX ?? 0)
    const tiltZ = (cfg.tiltZ ?? 0) * DEG2RAD + (mouseFx.tiltZ ?? 0)
    groupRef.current.rotation.x = tiltX
    groupRef.current.rotation.z = tiltZ
    groupRef.current.rotation.y = 0

    // Calculate visible scale based on camera
    const vFov = (camera.fov * Math.PI) / 180
    const visH = 2 * camera.position.z * Math.tan(vFov / 2)
    const maxRadius = visH / 2

    for (let i = 0; i < particleData.length; i++) {
      const p = particleData[i]

      // Each particle orbits along the ring at rotationSpeed + its own slight variation
      const angle = p.angle + time * cfg.rotationSpeed * (0.8 + p.pulseSpeed * 0.4)

      // Pulse effect on radius (with audio modulation)
      const pulse = Math.sin(time * p.pulseSpeed + p.phase) * 0.02
      const audioRadiusBoost = audioData.isActive ? audioData.amplitude * 0.25 : 0
      const currentRadius = (p.baseRadius + pulse + audioRadiusBoost) * maxRadius

      // Position in XZ plane (horizontal ring) with dispersion in all axes
      const x = Math.cos(angle) * currentRadius + p.dispersionX * maxRadius
      const z = Math.sin(angle) * currentRadius + p.dispersionZ * maxRadius
      const y = p.dispersionY * maxRadius * 0.3

      // Particles near center are bigger, farther ones smaller
      const dist = Math.sqrt(x * x + y * y + z * z)
      const distFactor = 1 - Math.min(dist / maxRadius, 1)
      const scale = cfg.particleSize * p.size * 0.04 * (0.4 + distFactor * 1.2)

      tempObj.position.set(x, y, z)
      tempObj.scale.setScalar(scale)
      tempObj.updateMatrix()
      meshRef.current.setMatrixAt(i, tempObj.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null, null, MAX_PARTICLES]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial transparent opacity={0.85} />
      </instancedMesh>
    </group>
  )
}

function CanvasRefExporter({ canvasRef, onReady }) {
  const { gl } = useThree()
  useEffect(() => {
    canvasRef.current = gl.domElement
    onReady()
  }, [gl])
  return null
}

const ParticleRingLayer = memo(({ config, paletteColors = [], effectsConfig, isPaused, mousePos = { x: 0.5, y: 0.5 }, mouseIntensity = 1 }) => {
  const canvasRef = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)

  const flutedEnabled = effectsConfig?.flutedGlass?.enabled ?? false
  const colors = useMemo(() =>
    paletteColors.length >= 2 ? paletteColors : ['#ec4899', '#a855f7', '#8b5cf6', '#6366f1'],
    [paletteColors]
  )

  const handleCanvasReady = useMemo(() => () => setCanvasReady(true), [])

  return (
    <div
      className="particle-ring-layer"
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
        camera={{ position: [0, 0, 8], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        frameloop="always"
      >
        <CanvasRefExporter canvasRef={canvasRef} onReady={handleCanvasReady} />
        <SceneSetup config={config} colors={colors} />
        <ParticleRingMesh config={config} colors={colors} isPaused={isPaused} mousePos={mousePos} mouseIntensity={mouseIntensity} />
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

ParticleRingLayer.displayName = 'ParticleRingLayer'

export default ParticleRingLayer
