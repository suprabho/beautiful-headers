import { useRef, useEffect, useState, useMemo, memo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import FlutedGlassCanvas from './FlutedGlassCanvas'
import { audioData } from '../audio/audioData'
import { getAudioModulatedConfig } from '../audio/applyAudioModulation'
import { smoothMouse, getMouseEffects } from '../mouse/applyMouseEffect'

// Security-print pattern generators ported from the Deconflict studio
// (deconXpromad · PatternScene.tsx), re-rendered as true 3D line art:
//   rosette  — the timestretch.com four-harmonic spirograph guilloché, one
//              closed curve per repeat pass, the passes fanned through Z depth
//   intaglio — engraved-banknote line art: a sine-band wave substrate plus
//              concentric rings that morph shape while receding into a tunnel

const DEG2RAD = Math.PI / 180
const ROSETTE_SAMPLES = 720
const RIPPLE_SAMPLES = 200
const WAVE_SAMPLES = 160
// The source patterns are authored in a 1200×750 reference frame; wave
// amplitude is stored in those units and mapped onto the visible height.
const REF_H = 750

const colorCache = new Map()
const hexToColor = (hex) => {
  if (!colorCache.has(hex)) colorCache.set(hex, new THREE.Color(hex))
  return colorCache.get(hex)
}

/** Unit boundary point of a regular n-gon at angle th (one vertex up). */
function polyPoint(th, n) {
  const seg = (Math.PI * 2) / n
  const edgeMid = -Math.PI / 2 + seg / 2
  const a = ((((th - edgeMid) % seg) + seg) % seg) - seg / 2
  const r = Math.cos(seg / 2) / Math.cos(a)
  return [r * Math.cos(th), r * Math.sin(th)]
}

/** Unit boundary point of a 5-point star at angle th. */
function starPoint(th) {
  const seg = (Math.PI * 2) / 5
  const m = ((((th + Math.PI / 2) % seg) + seg) % seg) / seg
  const v = Math.abs(m * 2 - 1)
  const r = 0.4 + 0.6 * v
  return [r * Math.cos(th), r * Math.sin(th)]
}

/** A ripple shape's unit boundary point at angle th (extent ≈ 1). */
export function shapePoint(kind, th) {
  switch (kind) {
    case 'circle': return [Math.cos(th), Math.sin(th)]
    case 'ellipse': return [Math.cos(th), 0.74 * Math.sin(th)]
    case 'rectangle': {
      const c = Math.cos(th)
      const s = Math.sin(th)
      const k = 1 / Math.max(Math.abs(c), Math.abs(s) / 0.64)
      return [c * k, s * k]
    }
    case 'triangle': return polyPoint(th, 3)
    case 'diamond': return polyPoint(th, 4)
    case 'pentagon': return polyPoint(th, 5)
    case 'hexagon': return polyPoint(th, 6)
    case 'octagon': return polyPoint(th, 8)
    case 'star': return starPoint(th)
    default: return [Math.cos(th), Math.sin(th)]
  }
}

export const RIPPLE_SHAPES = ['ellipse', 'circle', 'rectangle', 'triangle', 'diamond', 'pentagon', 'hexagon', 'octagon', 'star']

// Radial-gradient scene background, same convention as ParticleRingLayer
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
      config.backgroundColor || '#101c3f',
      colors[colors.length - 1] || '#05070f'
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
    config.backgroundColor, colors, scene
  ])

  return null
}

/** Build a THREE.Line with a preallocated position buffer of `count` points. */
function makeLine(count, color, opacity) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
  const material = new THREE.LineBasicMaterial({
    color: hexToColor(color),
    transparent: true,
    opacity,
    depthWrite: false,
  })
  const line = new THREE.Line(geometry, material)
  line.frustumCulled = false
  return line
}

function disposeGroup(group) {
  for (const child of group.children) {
    child.geometry?.dispose()
    child.material?.dispose()
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 * Rosette — one closed four-harmonic curve per repeat pass:
 *   x = sA·sin(aA·t) + sB·sin(aB·t+off) + sC·sin(aC·t) + (sD + p·rOff)·sin(aD·t)
 *   y = sA·cos(aA·t) + sB·cos(aB·t+off) + sC·cos(aC·t) + (sD + p·rOff)·cos(aD·t)
 * The B-term phase `off` is animated over time, so the lacework continuously
 * weaves. Passes are fanned through Z (near→far) and fade with depth.
 * ───────────────────────────────────────────────────────────────────────── */
function RosetteLines({ configRef, colors, isPaused, mouseStateRef }) {
  const groupRef = useRef()
  const timeRef = useRef(0)
  const { camera } = useThree()
  const passCount = Math.max(1, Math.round(configRef.current.repeatCount))

  const lines = useMemo(() => {
    const group = new THREE.Group()
    for (let p = 0; p < passCount; p++) {
      group.add(makeLine(ROSETTE_SAMPLES + 1, colors[p % colors.length], 0.5))
    }
    return group
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passCount, colors])

  useEffect(() => () => disposeGroup(lines), [lines])

  useFrame((_, delta) => {
    const cfg = getAudioModulatedConfig(configRef.current, 'guilloche')
    if (!isPaused) timeRef.current += delta * (cfg.speed + (audioData.isActive ? audioData.treble : 0))
    const time = timeRef.current
    const group = groupRef.current
    if (!group) return

    // Visible height at z=0 → the figure's world radius
    const vFov = (camera.fov * Math.PI) / 180
    const visH = 2 * camera.position.z * Math.tan(vFov / 2)
    const passes = group.children.length
    const drift = Math.abs(cfg.repeatOffset) * (passes - 1)
    const ampMax = Math.abs(cfg.scaleA) + Math.abs(cfg.scaleB) + Math.abs(cfg.scaleC) + Math.abs(cfg.scaleD) + drift
    const radius = (visH / 2) * 0.92 * cfg.scale
    const norm = ampMax > 0 ? radius / ampMax : 0
    const zSpread = cfg.depth
    const off = cfg.offset * DEG2RAD + time * 0.4
    const audioPulse = audioData.isActive ? 1 + audioData.amplitude * 0.18 : 1

    for (let p = 0; p < passes; p++) {
      const line = group.children[p]
      const D = cfg.scaleD + p * cfg.repeatOffset
      const t01 = passes === 1 ? 0 : p / (passes - 1)
      const z = (0.5 - t01) * zSpread
      const positions = line.geometry.attributes.position.array
      for (let i = 0; i <= ROSETTE_SAMPLES; i++) {
        const t = (i / ROSETTE_SAMPLES) * Math.PI * 2
        const x = cfg.scaleA * Math.sin(cfg.angleA * t) +
          cfg.scaleB * Math.sin(cfg.angleB * t + off) +
          cfg.scaleC * Math.sin(cfg.angleC * t) +
          D * Math.sin(cfg.angleD * t)
        const y = cfg.scaleA * Math.cos(cfg.angleA * t) +
          cfg.scaleB * Math.cos(cfg.angleB * t + off) +
          cfg.scaleC * Math.cos(cfg.angleC * t) +
          D * Math.cos(cfg.angleD * t)
        positions[i * 3] = x * norm * audioPulse
        positions[i * 3 + 1] = y * norm * audioPulse
        positions[i * 3 + 2] = z
      }
      line.geometry.attributes.position.needsUpdate = true
      // Deeper passes recede and dim
      line.material.opacity = cfg.lineOpacity * (0.35 + 0.65 * (1 - t01))
    }

    const mouseFx = mouseStateRef.current.fx
    group.rotation.x = (cfg.tiltX ?? 0) * DEG2RAD + (mouseFx.tiltX ?? 0)
    group.rotation.y = (mouseFx.tiltZ ?? 0) * 0.5
    group.rotation.z = (cfg.tiltZ ?? 0) * DEG2RAD + time * cfg.rotationSpeed * 0.5
  })

  return <primitive object={lines} ref={groupRef} />
}

/* ─────────────────────────────────────────────────────────────────────────
 * Intaglio — two systems, as in the engraved-banknote source:
 *   WAVES  — full-bleed sine-band rows (each with a near-miss twin for moiré)
 *            undulating in Y and Z, staggered slightly in depth for parallax
 *   RIPPLE — concentric rings morphing point-wise from a start shape to an
 *            end shape while receding into Z — a slow shape-shifting tunnel
 * ───────────────────────────────────────────────────────────────────────── */
function IntaglioLines({ configRef, colors, isPaused, mouseStateRef }) {
  const groupRef = useRef()
  const timeRef = useRef(0)
  const { camera, size } = useThree()
  const cfg0 = configRef.current
  const rowCount = Math.max(4, Math.round(cfg0.waveRows))
  const stepCount = Math.max(2, Math.round(cfg0.rippleSteps))
  const startKind = cfg0.rippleStartShape
  const endKind = cfg0.rippleEndShape

  // Unit samples of both morph endpoint shapes (recomputed only on kind change)
  const morphUnits = useMemo(() => {
    const start = []
    const end = []
    for (let j = 0; j <= RIPPLE_SAMPLES; j++) {
      const th = (j / RIPPLE_SAMPLES) * Math.PI * 2
      start.push(shapePoint(startKind, th))
      end.push(shapePoint(endKind, th))
    }
    return { start, end }
  }, [startKind, endKind])

  const built = useMemo(() => {
    const waves = new THREE.Group()
    for (let r = 0; r < rowCount; r++) {
      const col = colors[r % colors.length]
      waves.add(makeLine(WAVE_SAMPLES + 1, col, 0.2))   // main row
      waves.add(makeLine(WAVE_SAMPLES + 1, col, 0.14))  // near-miss twin (moiré)
    }
    const rings = new THREE.Group()
    for (let i = 0; i < stepCount; i++) {
      rings.add(makeLine(RIPPLE_SAMPLES + 1, colors[i % colors.length], 0.5))
    }
    const root = new THREE.Group()
    root.add(waves)
    root.add(rings)
    return { root, waves, rings }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowCount, stepCount, colors])

  useEffect(() => () => {
    disposeGroup(built.waves)
    disposeGroup(built.rings)
  }, [built])

  useFrame((_, delta) => {
    const cfg = getAudioModulatedConfig(configRef.current, 'guilloche')
    if (!isPaused) timeRef.current += delta * (cfg.speed + (audioData.isActive ? audioData.treble : 0))
    const time = timeRef.current
    if (!groupRef.current) return

    const vFov = (camera.fov * Math.PI) / 180
    const visH = 2 * camera.position.z * Math.tan(vFov / 2)
    const visW = visH * (size.width / size.height)
    const unit = visH / REF_H // reference-frame px → world units

    /* WAVES — rows spread across the visible height, twin rows detuned */
    const rows = rowCount
    const amp = cfg.waveAmplitude * unit * (audioData.isActive ? 1 + audioData.bass * 0.8 : 1)
    const freq = (0.011 * cfg.waveFrequency * REF_H) / visH
    const freq2 = (0.029 * cfg.waveFrequency * REF_H) / visH
    const ph = time * 1.1
    const halfW = visW * 0.62
    for (let r = 0; r < rows; r++) {
      const yBase = ((r / (rows - 1)) - 0.5) * visH * 1.12
      const zBase = ((r / (rows - 1)) - 0.5) * cfg.depth * -0.4
      for (let twin = 0; twin < 2; twin++) {
        const line = built.waves.children[r * 2 + twin]
        const fmul = twin === 0 ? 1 : 1.04
        const phT = twin === 0 ? ph : ph + 0.6
        const positions = line.geometry.attributes.position.array
        for (let i = 0; i <= WAVE_SAMPLES; i++) {
          const x = -halfW + (i / WAVE_SAMPLES) * halfW * 2
          const y = yBase + amp * Math.sin(freq * fmul * x + phT) + amp * 0.42 * Math.sin(freq2 * fmul * x + phT * 1.7)
          const z = zBase + amp * 0.8 * Math.cos(freq * fmul * x * 0.7 + phT * 0.8)
          positions[i * 3] = x
          positions[i * 3 + 1] = y
          positions[i * 3 + 2] = z
        }
        line.geometry.attributes.position.needsUpdate = true
        line.material.opacity = cfg.lineOpacity * (twin === 0 ? 0.38 : 0.26)
      }
    }

    /* RIPPLE — morphing rings receding into a tunnel */
    const steps = stepCount
    const refR = (visH / 2) * 0.92 * cfg.scale
    const endRot = cfg.rippleRotation * DEG2RAD
    const { start, end } = morphUnits
    for (let i = 0; i < steps; i++) {
      const t = steps === 1 ? 0 : i / (steps - 1)
      const ring = built.rings.children[i]
      // Ripple propagation — a pulse travelling outward through the rings
      const pulse = 1 + 0.05 * Math.sin(time * 1.6 - i * 0.45) + (audioData.isActive ? audioData.amplitude * 0.2 : 0)
      const scale = (cfg.rippleStartScale + (cfg.rippleEndScale - cfg.rippleStartScale) * t) * refR * pulse
      const rot = endRot * t + time * cfg.rotationSpeed * 0.5 * (1 - t * 0.5)
      const cr = Math.cos(rot)
      const sr = Math.sin(rot)
      const z = cfg.depth * (0.25 - t)
      const positions = ring.geometry.attributes.position.array
      for (let j = 0; j <= RIPPLE_SAMPLES; j++) {
        const ux = start[j][0] + (end[j][0] - start[j][0]) * t
        const uy = start[j][1] + (end[j][1] - start[j][1]) * t
        positions[j * 3] = (ux * cr - uy * sr) * scale
        positions[j * 3 + 1] = (ux * sr + uy * cr) * scale
        positions[j * 3 + 2] = z
      }
      ring.geometry.attributes.position.needsUpdate = true
      ring.material.opacity = cfg.lineOpacity * Math.max(0.18, 1 - t * 0.7)
    }

    const mouseFx = mouseStateRef.current.fx
    const g = groupRef.current
    g.rotation.x = (cfg.tiltX ?? 0) * DEG2RAD + (mouseFx.tiltX ?? 0)
    g.rotation.y = (mouseFx.tiltZ ?? 0) * 0.5
    g.rotation.z = (cfg.tiltZ ?? 0) * DEG2RAD
  })

  return <primitive object={built.root} ref={groupRef} />
}

/** Per-frame mouse smoothing shared by both motifs (kept outside R3F state). */
function MouseEffects({ mousePos, mouseIntensity, mouseStateRef }) {
  const targetRef = useRef({ x: 0.5, y: 0.5 })
  const intensityRef = useRef(mouseIntensity)

  useEffect(() => { targetRef.current = mousePos }, [mousePos])
  useEffect(() => { intensityRef.current = mouseIntensity }, [mouseIntensity])

  useFrame(() => {
    if (intensityRef.current === 0) {
      mouseStateRef.current.fx = {}
      return
    }
    smoothMouse(mouseStateRef.current.smoothed, targetRef.current, 'guilloche')
    mouseStateRef.current.fx = getMouseEffects('guilloche', mouseStateRef.current.smoothed, intensityRef.current)
  })

  return null
}

function CanvasRefExporter({ canvasRef, onReady }) {
  const { gl } = useThree()
  useEffect(() => {
    canvasRef.current = gl.domElement
    onReady()
  }, [gl])
  return null
}

const GuillocheLayer = memo(({ config, paletteColors = [], effectsConfig, isPaused, mousePos = { x: 0.5, y: 0.5 }, mouseIntensity = 1 }) => {
  const canvasRef = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const configRef = useRef(config)
  useEffect(() => { configRef.current = config }, [config])

  const mouseStateRef = useRef({ smoothed: { x: 0.5, y: 0.5 }, fx: {} })

  const flutedEnabled = effectsConfig?.flutedGlass?.enabled ?? false
  const colors = useMemo(() =>
    paletteColors.length >= 2 ? paletteColors : ['#2E54E8', '#6D5BE8', '#71ECFF', '#F4F6FA'],
    [paletteColors]
  )

  const handleCanvasReady = useMemo(() => () => setCanvasReady(true), [])
  const motif = config.motif || 'rosette'

  return (
    <div
      className="guilloche-layer"
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
        <MouseEffects mousePos={mousePos} mouseIntensity={mouseIntensity} mouseStateRef={mouseStateRef} />
        {motif === 'rosette' ? (
          <RosetteLines
            key={`rosette-${Math.max(1, Math.round(config.repeatCount))}`}
            configRef={configRef}
            colors={colors}
            isPaused={isPaused}
            mouseStateRef={mouseStateRef}
          />
        ) : (
          <IntaglioLines
            key={`intaglio-${Math.max(4, Math.round(config.waveRows))}-${Math.max(2, Math.round(config.rippleSteps))}-${config.rippleStartShape}-${config.rippleEndShape}`}
            configRef={configRef}
            colors={colors}
            isPaused={isPaused}
            mouseStateRef={mouseStateRef}
          />
        )}
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

GuillocheLayer.displayName = 'GuillocheLayer'

export default GuillocheLayer
