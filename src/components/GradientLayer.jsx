import { useRef, useEffect, useCallback } from 'react'

const GradientLayer = ({ config, mousePos }) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const timeRef = useRef(0)
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 })
  const currentMouseRef = useRef({ x: 0.5, y: 0.5 })

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    } : { r: 0, g: 0, b: 0 }
  }

  const createShader = (gl, type, source) => {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      return null
    }
    return shader
  }

  const initWebGL = useCallback((canvas) => {
    const gl = canvas.getContext('webgl')
    if (!gl) return null

    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `

    const fragmentShaderSource = `
      precision highp float;
      varying vec2 v_uv;
      
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform vec2 u_resolution;
      uniform vec3 u_color0;
      uniform vec3 u_color1;
      uniform vec3 u_color2;
      uniform vec3 u_color3;
      uniform vec3 u_color4;
      uniform vec3 u_color5;
      uniform vec3 u_color6;
      uniform vec3 u_color7;
      uniform float u_stop0;
      uniform float u_stop1;
      uniform float u_stop2;
      uniform float u_stop3;
      uniform float u_stop4;
      uniform float u_stop5;
      uniform float u_stop6;
      uniform float u_stop7;
      uniform int u_numColors;
      uniform int u_gradientType;
      uniform vec2 u_startPos;
      uniform vec2 u_endPos;
      uniform float u_waveIntensity;
      uniform float u_mouseInfluence;
      
      // Simplex noise functions
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
      
      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                        + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                               dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }
      
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        for (int i = 0; i < 5; i++) {
          value += amplitude * snoise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        return value;
      }
      
      vec3 getColor(int idx) {
        if (idx == 0) return u_color0;
        if (idx == 1) return u_color1;
        if (idx == 2) return u_color2;
        if (idx == 3) return u_color3;
        if (idx == 4) return u_color4;
        if (idx == 5) return u_color5;
        if (idx == 6) return u_color6;
        return u_color7;
      }
      
      float getStop(int idx) {
        if (idx == 0) return u_stop0;
        if (idx == 1) return u_stop1;
        if (idx == 2) return u_stop2;
        if (idx == 3) return u_stop3;
        if (idx == 4) return u_stop4;
        if (idx == 5) return u_stop5;
        if (idx == 6) return u_stop6;
        return u_stop7;
      }
      
      vec3 getGradientColor(float t) {
        vec3 color = u_color0;
        
        for (int i = 1; i < 8; i++) {
          if (i >= u_numColors) break;
          float stop0 = getStop(i - 1) / 100.0;
          float stop1 = getStop(i) / 100.0;
          if (t >= stop0 && t <= stop1) {
            float localT = (t - stop0) / max(stop1 - stop0, 0.001);
            color = mix(getColor(i - 1), getColor(i), smoothstep(0.0, 1.0, localT));
          }
        }
        
        // Handle case where t is beyond the last stop
        float lastStop = getStop(u_numColors - 1) / 100.0;
        if (t >= lastStop) {
          color = getColor(u_numColors - 1);
        }
        
        return color;
      }
      
      void main() {
        vec2 uv = v_uv;
        vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
        
        // Mouse influence with distance falloff
        vec2 mouseOffset = u_mouse - uv;
        float mouseDist = length(mouseOffset * aspect);
        float mouseEffect = exp(-mouseDist * 3.0) * u_mouseInfluence;
        
        // Wave distortion
        float wave1 = fbm(uv * 3.0 + u_time * 0.2);
        float wave2 = fbm(uv * 2.0 - u_time * 0.15 + 10.0);
        vec2 waveOffset = vec2(wave1, wave2) * u_waveIntensity;
        
        // Mouse distortion
        vec2 mouseDistort = mouseOffset * mouseEffect * 0.3;
        
        // Apply distortions
        vec2 distortedUV = uv + waveOffset + mouseDistort;
        
        // Calculate gradient position
        float t = 0.0;
        vec2 start = u_startPos / 100.0;
        vec2 end = u_endPos / 100.0;
        
        if (u_gradientType == 0) { // Linear
          vec2 dir = end - start;
          float len = length(dir);
          if (len > 0.001) {
            t = dot(distortedUV - start, dir) / (len * len);
          }
        } else if (u_gradientType == 1) { // Radial
          vec2 center = (start + end) * 0.5;
          float radius = length(end - start) * 0.5;
          if (radius > 0.001) {
            t = length((distortedUV - center) * aspect) / radius;
          }
        } else { // Conic
          vec2 center = (start + end) * 0.5;
          vec2 d = distortedUV - center;
          t = (atan(d.y, d.x) / 3.14159 + 1.0) * 0.5;
        }
        
        t = clamp(t, 0.0, 1.0);
        
        // Add some dynamic movement to t
        t += snoise(distortedUV * 2.0 + u_time * 0.1) * 0.1;
        t = clamp(t, 0.0, 1.0);
        
        vec3 color = getGradientColor(t);
        
        // Add subtle shimmer
        float shimmer = snoise(uv * 10.0 + u_time) * 0.05;
        color += shimmer;
        
        // Vignette
        float vignette = 1.0 - length((uv - 0.5) * 1.2);
        color *= smoothstep(0.0, 0.7, vignette);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

    if (!vertexShader || !fragmentShader) return null

    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program))
      return null
    }

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW)

    return { gl, program, positionBuffer }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    const webgl = initWebGL(canvas)
    if (!webgl) return

    const { gl, program, positionBuffer } = webgl

    const render = () => {
      timeRef.current += 0.016

      // Smooth mouse following with decay
      currentMouseRef.current.x += (targetMouseRef.current.x - currentMouseRef.current.x) * (1 - config.decaySpeed)
      currentMouseRef.current.y += (targetMouseRef.current.y - currentMouseRef.current.y) * (1 - config.decaySpeed)

      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(program)

      // Set uniforms
      gl.uniform1f(gl.getUniformLocation(program, 'u_time'), timeRef.current)
      gl.uniform2f(gl.getUniformLocation(program, 'u_mouse'), currentMouseRef.current.x, 1 - currentMouseRef.current.y)
      gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height)
      gl.uniform1i(gl.getUniformLocation(program, 'u_numColors'), config.numColors)
      gl.uniform1i(gl.getUniformLocation(program, 'u_gradientType'), 
        config.type === 'linear' ? 0 : config.type === 'radial' ? 1 : 2)
      gl.uniform2f(gl.getUniformLocation(program, 'u_startPos'), config.startPos.x, config.startPos.y)
      gl.uniform2f(gl.getUniformLocation(program, 'u_endPos'), config.endPos.x, config.endPos.y)
      gl.uniform1f(gl.getUniformLocation(program, 'u_waveIntensity'), config.waveIntensity)
      gl.uniform1f(gl.getUniformLocation(program, 'u_mouseInfluence'), config.mouseInfluence)

      // Set individual color uniforms
      for (let i = 0; i < 8; i++) {
        if (i < config.colors.length) {
          const rgb = hexToRgb(config.colors[i])
          gl.uniform3f(gl.getUniformLocation(program, `u_color${i}`), rgb.r, rgb.g, rgb.b)
          gl.uniform1f(gl.getUniformLocation(program, `u_stop${i}`), config.colorStops[i] || (i * 100 / (config.colors.length - 1)))
        } else {
          gl.uniform3f(gl.getUniformLocation(program, `u_color${i}`), 0, 0, 0)
          gl.uniform1f(gl.getUniformLocation(program, `u_stop${i}`), 100)
        }
      }

      // Draw
      const positionLoc = gl.getAttribLocation(program, 'a_position')
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.enableVertexAttribArray(positionLoc)
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      animationRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [config, initWebGL])

  useEffect(() => {
    targetMouseRef.current = mousePos
  }, [mousePos])

  return (
    <canvas
      ref={canvasRef}
      className="gradient-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
    />
  )
}

export default GradientLayer
