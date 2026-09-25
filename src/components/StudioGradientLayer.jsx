import { memo, useRef, useEffect, useState, lazy, Suspense } from 'react'
import { VERTEX_SHADER, FRAGMENT_SHADERS, GLOW_SHAPES, FORM_SHAPES } from '@/lib/studioShaders'
import { STUDIO_DEFAULTS, hexToOklab, evenStops } from '@/lib/studioPresets'
import { colorToHex } from '@/lib/colorConversion'
import { getAudioModulatedConfig } from '../audio/applyAudioModulation'

// WebGL glass overlay is loaded on demand, as in SimpleGradientLayer
const FlutedGlassCanvas = lazy(() => import('./FlutedGlassCanvas'))

const compile = (gl, type, src) => {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('Studio shader compile failed:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

const createProgram = (gl, fragSrc) => {
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc)
  if (!vs || !fs) return null
  const program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.bindAttribLocation(program, 0, 'a_pos')
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Studio program link failed:', gl.getProgramInfoLog(program))
    return null
  }
  const names = ['u_res', 'u_time', 'u_colors', 'u_stops', 'u_count', 'u_scale', 'u_grain',
    'u_seed', 'u_amount', 'u_soft', 'u_shape', 'u_mouse']
  const loc = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(program, n)]))
  return { program, loc }
}

// Sort colours by stop so the shader can blend them sequentially
const buildPalette = (colors, stops) => {
  const list = (colors?.length ? colors : ['#000000', '#ffffff']).slice(0, 8)
  const s = stops?.length === list.length ? stops : evenStops(list.length)
  const pairs = list
    .map((c, i) => ({ lab: hexToOklab(colorToHex(c) || '#000000'), stop: (s[i] ?? 0) / 100 }))
    .sort((a, b) => a.stop - b.stop)
  const lab = new Float32Array(24)
  const st = new Float32Array(8)
  pairs.forEach((p, i) => {
    lab.set(p.lab, i * 3)
    st[i] = p.stop
  })
  for (let i = pairs.length; i < 8; i++) st[i] = 1
  return { lab, stops: st, count: pairs.length }
}

/**
 * StudioGradientLayer - raw WebGL renderer for the sky, watercolor, glow,
 * forms and prism background types. Sized to its container (not the window)
 * so it works in the editor, embeds and mini previews alike.
 */
const StudioGradientLayer = memo(({
  type = 'sky',
  config,
  paletteColors,
  colorStops,
  effectsConfig,
  isPaused = false,
  mousePos,
  mouseIntensity = 0,
  frameloop = 'always',
}) => {
  const canvasRef = useRef(null)
  const stateRef = useRef({})
  const [ready, setReady] = useState(false)
  const flutedEnabled = effectsConfig?.flutedGlass?.enabled ?? false

  const cfg = { ...STUDIO_DEFAULTS, ...config }
  const animate = cfg.motion && !isPaused && frameloop === 'always'

  // Latest render inputs, read by the RAF loop without restarting it
  stateRef.current.inputs = {
    type,
    cfg,
    palette: buildPalette(paletteColors, colorStops),
    mouse: mousePos
      ? [(mousePos.x - 0.5) * mouseIntensity, (0.5 - mousePos.y) * mouseIntensity]
      : [0, 0],
  }

  // GL setup — once per canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false })
    if (!gl) return
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    const s = stateRef.current
    s.gl = gl
    s.programs = {}
    s.time = 0
    s.last = performance.now()

    s.draw = () => {
      const { type: t, palette, mouse } = s.inputs
      const c = getAudioModulatedConfig(s.inputs.cfg, t)
      // Ease toward the pointer so parallax never jumps
      s.mouse = s.mouse || [0, 0]
      s.mouse[0] += (mouse[0] - s.mouse[0]) * 0.08
      s.mouse[1] += (mouse[1] - s.mouse[1]) * 0.08
      if (!s.programs[t]) s.programs[t] = createProgram(gl, FRAGMENT_SHADERS[t] || FRAGMENT_SHADERS.sky)
      const prog = s.programs[t]
      if (!prog) return
      const { loc } = prog
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(prog.program)
      gl.uniform2f(loc.u_res, canvas.width, canvas.height)
      gl.uniform1f(loc.u_time, s.time)
      gl.uniform3fv(loc.u_colors, palette.lab)
      gl.uniform1fv(loc.u_stops, palette.stops)
      gl.uniform1i(loc.u_count, palette.count)
      gl.uniform1f(loc.u_scale, Math.max(0.2, c.scale))
      gl.uniform1f(loc.u_grain, c.grain)
      gl.uniform1f(loc.u_seed, c.seed)
      gl.uniform1f(loc.u_amount, Math.min(1, c.amount))
      gl.uniform1f(loc.u_soft, c.softness)
      const shape = t === 'glow' ? GLOW_SHAPES.indexOf(c.glowShape) : t === 'forms' ? FORM_SHAPES.indexOf(c.formShape) : 0
      gl.uniform1i(loc.u_shape, Math.max(0, shape))
      gl.uniform2f(loc.u_mouse, s.mouse[0], s.mouse[1])
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      s.draw()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    setReady(true)

    return () => {
      ro.disconnect()
      cancelAnimationFrame(s.raf)
      Object.values(s.programs).forEach((p) => p && gl.deleteProgram(p.program))
      gl.deleteBuffer(buf)
      s.gl = null
    }
  }, [])

  // Animation loop
  useEffect(() => {
    const s = stateRef.current
    if (!s.gl || !animate) return
    s.last = performance.now()
    const tick = (now) => {
      const dt = Math.min(0.1, (now - s.last) / 1000)
      s.last = now
      s.time += dt * getAudioModulatedConfig(s.inputs.cfg, s.inputs.type).speed * 4
      s.draw()
      s.raf = requestAnimationFrame(tick)
    }
    s.raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(s.raf)
  }, [animate, ready])

  // Static redraw whenever inputs change and we're not animating
  useEffect(() => {
    const s = stateRef.current
    if (s.gl && !animate) s.draw()
  })

  return (
    <div className="studio-gradient-layer" style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} data-engine="studio" />
      {flutedEnabled && ready && (
        <Suspense fallback={null}>
          <FlutedGlassCanvas sourceCanvasRef={canvasRef} effectsConfig={effectsConfig} frameloop={frameloop} />
        </Suspense>
      )}
    </div>
  )
})

StudioGradientLayer.displayName = 'StudioGradientLayer'

export default StudioGradientLayer
