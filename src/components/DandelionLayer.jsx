import { useRef, useEffect, useState, useMemo, memo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import FlutedGlassCanvas from './FlutedGlassCanvas'

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

const lineVertexShader = `
  varying float vFade;
  varying vec3 vInstanceColor;
  varying float vFogDepth;

  void main() {
    vFade = (position.y + 1.0) / 2.0;

    #ifdef USE_INSTANCING_COLOR
      vInstanceColor = instanceColor;
    #else
      vInstanceColor = vec3(1.0);
    #endif

    vec4 worldPos = vec4(position, 1.0);
    #ifdef USE_INSTANCING
      worldPos = instanceMatrix * worldPos;
    #endif

    vec4 mvPosition = modelViewMatrix * worldPos;
    gl_Position = projectionMatrix * mvPosition;
    vFogDepth = -mvPosition.z;
  }
`

const lineFragmentShader = `
  uniform float opacity;
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;

  varying float vFade;
  varying vec3 vInstanceColor;
  varying float vFogDepth;

  void main() {
    float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
    vec3 color = mix(vInstanceColor, fogColor, fogFactor);
    float alpha = opacity * vFade * (1.0 - fogFactor);
    gl_FragColor = vec4(color, alpha);
  }
`
const MAX_LINES = 3000
const LINE_SCALE = 6

function generateLineData(lineCount, spread, radiusMin, radiusMax) {
  const maxPolarAngle = Math.PI * (spread ?? 0.3)
  const lines = []
  for (let i = 0; i < lineCount; i++) {
    const t = i / Math.max(lineCount - 1, 1)
    const polarAngle = t * maxPolarAngle
    const azimuthal = GOLDEN_ANGLE * i
    const sinP = Math.sin(polarAngle)
    const cosP = Math.cos(polarAngle)
    lines.push({
      dx: sinP * Math.cos(azimuthal),
      dy: cosP,
      dz: sinP * Math.sin(azimuthal),
      length: radiusMin + Math.random() * (radiusMax - radiusMin),
      phaseOffset: Math.random() * Math.PI * 2,
      swayAmount: 0.02 + Math.random() * 0.03,
      colorIdx: Math.floor(Math.random() * 4),
    })
  }
  return lines
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
      config.radialGradientCenter || config.backgroundColor || '#e8f4fc',
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

    const fogColor = gradColors[0] || '#e8f4fc'
    scene.fog = new THREE.Fog(fogColor, 4, 13)

    return () => {
      texture.dispose()
      scene.background = null
      scene.fog = null
    }
  }, [
    config.radialGradientColors, config.radialGradientStops,
    config.gradientEndX, config.gradientEndY,
    config.radialGradientCenter, config.radialGradientOuter,
    config.backgroundColor, colors, scene
  ])

  return null
}

function DandelionMesh({ config, colors, isPaused }) {
  const groupRef = useRef()
  const lineMeshRef = useRef()
  const dotMeshRef = useRef()
  const lineMaterialRef = useRef()
  const dotMaterialRef = useRef()
  const timeRef = useRef(0)
  const configRef = useRef(config)
  const mouseNDC = useMemo(() => new THREE.Vector2(0, 0), [])
  const smoothMouse = useMemo(() => new THREE.Vector2(0, 0), [])

  useEffect(() => { configRef.current = config }, [config])

  // Track mouse at window level so overlapping layers don't block events
  useEffect(() => {
    const onMove = (e) => {
      mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const lineUniforms = useMemo(() => ({
    opacity: { value: 0.8 },
    fogColor: { value: new THREE.Color('#e8f4fc') },
    fogNear: { value: 4 },
    fogFar: { value: 13 },
  }), [])

  const tempObj = useMemo(() => new THREE.Object3D(), [])
  const tempColor = useMemo(() => new THREE.Color(), [])
  const tempDir = useMemo(() => new THREE.Vector3(), [])
  const tempVec = useMemo(() => new THREE.Vector3(), [])
  const upVec = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const mvpMatrix = useMemo(() => new THREE.Matrix4(), [])
  const vpMatrix = useMemo(() => new THREE.Matrix4(), [])

  const lineData = useMemo(() =>
    generateLineData(config.lineCount, config.spread, config.radiusMin, config.radiusMax),
    [config.lineCount, config.spread, config.radiusMin, config.radiusMax]
  )

  // Set instance count and colors
  useEffect(() => {
    if (!lineMeshRef.current || !dotMeshRef.current) return
    lineMeshRef.current.count = lineData.length
    dotMeshRef.current.count = lineData.length

    for (let i = 0; i < lineData.length; i++) {
      tempColor.set(colors[lineData[i].colorIdx % colors.length])
      lineMeshRef.current.setColorAt(i, tempColor)
      dotMeshRef.current.setColorAt(i, tempColor)
    }
    if (lineMeshRef.current.instanceColor) lineMeshRef.current.instanceColor.needsUpdate = true
    if (dotMeshRef.current.instanceColor) dotMeshRef.current.instanceColor.needsUpdate = true
  }, [lineData, colors])

  const { camera } = useThree()

  useFrame((state, delta) => {
    const cfg = configRef.current
    if (!isPaused) timeRef.current += delta * (cfg.speed ?? 0.3)
    const time = timeRef.current

    // Smooth mouse tracking (from window-level listener)
    smoothMouse.x += (mouseNDC.x - smoothMouse.x) * 0.05
    smoothMouse.y += (mouseNDC.y - smoothMouse.y) * 0.05

    // Position group based on centerY
    if (groupRef.current) {
      const vFov = (camera.fov * Math.PI) / 180
      const visH = 2 * camera.position.z * Math.tan(vFov / 2)
      groupRef.current.position.y = visH / 2 - (cfg.centerY ?? 0.85) * visH
      groupRef.current.rotation.y = time * 0.3
      groupRef.current.rotation.x = Math.sin(time * 0.15) * 0.15

      // Build combined MVP matrix for projecting tips to screen
      groupRef.current.updateMatrixWorld(true)
      vpMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      mvpMatrix.multiplyMatrices(vpMatrix, groupRef.current.matrixWorld)
    }

    // Update line shader uniforms
    const opacity = cfg.lineOpacity ?? 0.8
    lineUniforms.opacity.value = opacity
    const fog = state.scene.fog
    if (fog) {
      lineUniforms.fogColor.value.copy(fog.color)
      lineUniforms.fogNear.value = fog.near
      lineUniforms.fogFar.value = fog.far
    }
    if (dotMaterialRef.current) dotMaterialRef.current.opacity = opacity

    if (!lineMeshRef.current || !dotMeshRef.current) return

    const sphereR = 0.15
    const thickness = (cfg.thickness ?? 1.5) * 0.008
    const dotSize = (cfg.dotSize ?? 3) * 0.015

    for (let i = 0; i < lineData.length; i++) {
      const line = lineData[i]

      // Base sway
      const sway = Math.sin(time * 2 + line.phaseOffset) * line.swayAmount
      const swayX = Math.cos(time * 1.5 + line.phaseOffset * 2) * line.swayAmount * 0.5

      let dx = line.dx + swayX
      let dy = line.dy + sway
      let dz = line.dz

      // Project tip to screen NDC to check mouse proximity
      const len = line.length * LINE_SCALE
      tempVec.set(dx * len, dy * len, dz * len).applyMatrix4(mvpMatrix)
      const sdx = tempVec.x - smoothMouse.x
      const sdy = tempVec.y - smoothMouse.y
      const screenDist = Math.sqrt(sdx * sdx + sdy * sdy)

      const repelRadius = 0.35
      if (screenDist < repelRadius && screenDist > 0.001) {
        const strength = (1 - screenDist / repelRadius)
        const repel = strength * strength * 1.2
        // Push direction away from cursor in screen-aligned axes
        const pushX = (sdx / screenDist) * repel
        const pushY = (sdy / screenDist) * repel
        // Convert screen push to local-space displacement via inverse VP
        // Approximate: screen X maps mostly to local X/Z, screen Y to local Y
        dx += pushX
        dy += pushY
        dz += pushX * 0.5
      }

      const mag = Math.sqrt(dx * dx + dy * dy + dz * dz)
      dx /= mag; dy /= mag; dz /= mag

      const midDist = (sphereR + len) / 2
      const halfLen = (len - sphereR) / 2

      // Line cylinder: position at midpoint, orient along direction
      tempObj.position.set(dx * midDist, dy * midDist, dz * midDist)
      tempDir.set(dx, dy, dz)
      tempObj.quaternion.setFromUnitVectors(upVec, tempDir)
      tempObj.scale.set(thickness, halfLen, thickness)
      tempObj.updateMatrix()
      lineMeshRef.current.setMatrixAt(i, tempObj.matrix)

      // Dot at tip
      tempObj.position.set(dx * len, dy * len, dz * len)
      tempObj.quaternion.identity()
      tempObj.scale.setScalar(dotSize)
      tempObj.updateMatrix()
      dotMeshRef.current.setMatrixAt(i, tempObj.matrix)
    }

    lineMeshRef.current.instanceMatrix.needsUpdate = true
    dotMeshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group ref={groupRef}>
      <instancedMesh ref={lineMeshRef} args={[null, null, MAX_LINES]} frustumCulled={false}>
        <cylinderGeometry args={[1, 1, 2, 6, 1, true]} />
        <shaderMaterial
          ref={lineMaterialRef}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          uniforms={lineUniforms}
          vertexShader={lineVertexShader}
          fragmentShader={lineFragmentShader}
        />
      </instancedMesh>
      <instancedMesh ref={dotMeshRef} args={[null, null, MAX_LINES]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial ref={dotMaterialRef} transparent />
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

const DandelionLayer = memo(({ config, paletteColors = [], effectsConfig, isPaused }) => {
  const canvasRef = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)

  const flutedEnabled = effectsConfig?.flutedGlass?.enabled ?? false
  const colors = useMemo(() =>
    paletteColors.length >= 2 ? paletteColors : ['#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'],
    [paletteColors]
  )

  const handleCanvasReady = useMemo(() => () => setCanvasReady(true), [])

  return (
    <div
      className="dandelion-layer"
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
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        camera={{ position: [0, 0, 8], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        dpr={Math.min(window.devicePixelRatio, 2)}
      >
        <CanvasRefExporter canvasRef={canvasRef} onReady={handleCanvasReady} />
        <SceneSetup config={config} colors={colors} />
        <DandelionMesh config={config} colors={colors} isPaused={isPaused} />
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

DandelionLayer.displayName = 'DandelionLayer'

export default DandelionLayer
