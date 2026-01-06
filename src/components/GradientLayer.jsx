import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Color cache for hex to RGB conversions (PERFORMANCE OPTIMIZATION)
const colorCache = new Map()

// Cached hex to RGB converter
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

// Custom shader material that combines gradient generation with fluted glass effect
const FlutedGradientMaterial = ({ config, effectsConfig, mousePos }) => {
  const materialRef = useRef()
  const { size } = useThree()
  const timeRef = useRef(0)
  const currentMouseRef = useRef({ x: 0.5, y: 0.5 })
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 })
  
  // Track previous config to avoid unnecessary uniform updates (PERFORMANCE OPTIMIZATION)
  const prevConfigRef = useRef(null)
  const prevEffectsConfigRef = useRef(null)

  // Update target mouse position
  useEffect(() => {
    targetMouseRef.current = mousePos
  }, [mousePos])

  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    u_resolution: { value: new THREE.Vector2(1, 1) }, // Updated in useFrame
    u_color0: { value: new THREE.Vector3(1, 0, 0.43) },
    u_color1: { value: new THREE.Vector3(0.51, 0.22, 0.93) },
    u_color2: { value: new THREE.Vector3(0.23, 0.53, 1) },
    u_color3: { value: new THREE.Vector3(0.02, 0.84, 0.63) },
    u_color4: { value: new THREE.Vector3(0, 0, 0) },
    u_color5: { value: new THREE.Vector3(0, 0, 0) },
    u_color6: { value: new THREE.Vector3(0, 0, 0) },
    u_color7: { value: new THREE.Vector3(0, 0, 0) },
    u_stop0: { value: 0 },
    u_stop1: { value: 33 },
    u_stop2: { value: 66 },
    u_stop3: { value: 100 },
    u_stop4: { value: 100 },
    u_stop5: { value: 100 },
    u_stop6: { value: 100 },
    u_stop7: { value: 100 },
    u_numColors: { value: 4 },
    u_gradientType: { value: 1 }, // 0=linear, 1=radial, 2=conic
    u_startPos: { value: new THREE.Vector2(0, 0) },
    u_endPos: { value: new THREE.Vector2(100, 100) },
    u_waveIntensity: { value: 0.3 },
    u_mouseInfluence: { value: 0.5 },
    u_wave1Speed: { value: 0.2 },
    u_wave1Direction: { value: 1 },
    u_wave2Speed: { value: 0.15 },
    u_wave2Direction: { value: -1 },
    // Fluted glass uniforms
    u_flutedEnabled: { value: false },
    u_segments: { value: 80 },
    u_rotation: { value: 0 },
    u_motionValue: { value: 0.5 },
    u_overlayOpacity: { value: 0 },
    u_flutedMotionSpeed: { value: 0.5 },
    u_distortionStrength: { value: 0.02 },
    u_waveFrequency: { value: 1 },
  }), []) // Empty deps - resolution updated in useFrame on every frame

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = `
    precision highp float;
    varying vec2 vUv;
    
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
    uniform float u_wave1Speed;
    uniform float u_wave1Direction;
    uniform float u_wave2Speed;
    uniform float u_wave2Direction;
    
    // Fluted glass uniforms
    uniform bool u_flutedEnabled;
    uniform float u_segments;
    uniform float u_rotation;
    uniform float u_motionValue;
    uniform float u_overlayOpacity;
    uniform float u_flutedMotionSpeed;
    uniform float u_distortionStrength;
    uniform float u_waveFrequency;
    
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
    
    // Apply fluted glass distortion to UV coordinates
    vec2 applyFlutedGlass(vec2 uv, out float sliceProgress) {
      float numSlices = u_segments;
      float rotationRadians = u_rotation * (3.14159265 / 180.0);
      
      // Animated motion value based on time
      float animatedMotion = u_motionValue + sin(u_time * u_flutedMotionSpeed) * 0.3;
      
      // Rotate the UV coordinates to align with warping axis
      vec2 rotatedUV = vec2(
        cos(rotationRadians) * (uv.x - 0.5) - sin(rotationRadians) * (uv.y - 0.5) + 0.5,
        sin(rotationRadians) * (uv.x - 0.5) + cos(rotationRadians) * (uv.y - 0.5) + 0.5
      );
      
      // Apply the warping effect along the aligned axis
      sliceProgress = fract(rotatedUV.x * numSlices + animatedMotion);
      float amplitude = u_distortionStrength; // Amplitude of the sine wave distortion
      rotatedUV.x += amplitude * sin(sliceProgress * 3.14159265 * 2.0 * u_waveFrequency) * (1.0 - 0.5 * abs(sliceProgress - 0.5));
      
      // Rotate the UVs back to the original orientation
      vec2 finalUV = vec2(
        cos(-rotationRadians) * (rotatedUV.x - 0.5) - sin(-rotationRadians) * (rotatedUV.y - 0.5) + 0.5,
        sin(-rotationRadians) * (rotatedUV.x - 0.5) + cos(-rotationRadians) * (rotatedUV.y - 0.5) + 0.5
      );
      
      // Mirror UV at edges for seamless tiling
      vec2 tileIndex = floor(finalUV);
      vec2 oddTile = mod(tileIndex, 2.0);
      vec2 mirroredUV = mix(fract(finalUV), 1.0 - fract(finalUV), oddTile);
      
      return mirroredUV;
    }
    
    void main() {
      vec2 uv = vUv;
      vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
      
      float sliceProgress = 0.0;
      
      // Apply fluted glass distortion if enabled
      if (u_flutedEnabled) {
        uv = applyFlutedGlass(uv, sliceProgress);
      }
      
      // Mouse influence with distance falloff
      vec2 mouseOffset = u_mouse - uv;
      float mouseDist = length(mouseOffset * aspect);
      float mouseEffect = exp(-mouseDist * 1.5) * u_mouseInfluence;
      
      // Wave distortion
      float wave1 = fbm(uv * 3.0 + u_time * u_wave1Speed * u_wave1Direction);
      float wave2 = fbm(uv * 2.0 + u_time * u_wave2Speed * u_wave2Direction + 10.0);
      vec2 waveOffset = vec2(wave1, wave2) * u_waveIntensity;
      
      // Mouse distortion
      vec2 mouseDistort = mouseOffset * mouseEffect * 0.8;
      
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
      
      // Add dynamic movement to t
      t += snoise(distortedUV * 2.0 + u_time * 0.1) * 0.1;
      t = clamp(t, 0.0, 1.0);
      
      vec3 color = getGradientColor(t);
      
      // Add subtle shimmer
      float shimmer = snoise(vUv * 10.0 + u_time) * 0.05;
      color += shimmer;
      
      // Vignette - only apply when fluted glass is disabled
      // When fluted glass is enabled, the distortion can push content to edges
      if (!u_flutedEnabled) {
        float vignette = 1.0 - length((vUv - 0.5) * 1.2);
        color *= smoothstep(0.0, 0.7, vignette);
      }
      
      // Apply fluted glass overlays for 3D effect
      if (u_flutedEnabled && u_overlayOpacity > 0.0) {
        // Black overlay for depth
        float blackOverlayAlpha = 0.08 * (1.0 - abs(sin(sliceProgress * 3.14159265 * 0.5 + 1.57))) * (u_overlayOpacity / 100.0);
        color.rgb *= (1.0 - blackOverlayAlpha);
        
        // White highlight overlay
        float whiteOverlayAlpha = 0.2 * (1.0 - abs(sin(sliceProgress * 3.14159265 * 0.7 - 0.7))) * (u_overlayOpacity / 100.0);
        color.rgb = mix(color.rgb, vec3(1.0), whiteOverlayAlpha);
      }
      
      gl_FragColor = vec4(color, 1.0);
    }
  `

  // Update config-dependent uniforms only when config changes (PERFORMANCE OPTIMIZATION)
  useEffect(() => {
    if (!materialRef.current) return
    const mat = materialRef.current

    // Update gradient uniforms
    mat.uniforms.u_numColors.value = config.numColors
    mat.uniforms.u_gradientType.value = config.type === 'linear' ? 0 : config.type === 'radial' ? 1 : 2
    mat.uniforms.u_startPos.value.set(config.startPos.x, config.startPos.y)
    mat.uniforms.u_endPos.value.set(config.endPos.x, config.endPos.y)
    mat.uniforms.u_waveIntensity.value = config.waveIntensity
    mat.uniforms.u_mouseInfluence.value = config.mouseInfluence
    mat.uniforms.u_wave1Speed.value = config.wave1Speed
    mat.uniforms.u_wave1Direction.value = config.wave1Direction
    mat.uniforms.u_wave2Speed.value = config.wave2Speed
    mat.uniforms.u_wave2Direction.value = config.wave2Direction

    // Update color uniforms using cached converter
    for (let i = 0; i < 8; i++) {
      if (i < config.colors.length) {
        const rgb = hexToRgbCached(config.colors[i])
        mat.uniforms[`u_color${i}`].value.set(rgb.r, rgb.g, rgb.b)
        mat.uniforms[`u_stop${i}`].value = config.colorStops[i] || (i * 100 / (config.colors.length - 1))
      } else {
        mat.uniforms[`u_color${i}`].value.set(0, 0, 0)
        mat.uniforms[`u_stop${i}`].value = 100
      }
    }

    prevConfigRef.current = config
  }, [config])

  // Update effects config uniforms only when effectsConfig changes (PERFORMANCE OPTIMIZATION)
  useEffect(() => {
    if (!materialRef.current) return
    const mat = materialRef.current

    const fluted = effectsConfig?.flutedGlass ?? {}
    mat.uniforms.u_flutedEnabled.value = fluted.enabled ?? false
    mat.uniforms.u_segments.value = fluted.segments ?? 80
    mat.uniforms.u_rotation.value = fluted.rotation ?? 0
    mat.uniforms.u_motionValue.value = fluted.motionValue ?? 0.5
    mat.uniforms.u_overlayOpacity.value = fluted.overlayOpacity ?? 0
    mat.uniforms.u_flutedMotionSpeed.value = fluted.motionSpeed ?? 0.5
    mat.uniforms.u_distortionStrength.value = fluted.distortionStrength ?? 0.02
    mat.uniforms.u_waveFrequency.value = fluted.waveFrequency ?? 1

    prevEffectsConfigRef.current = effectsConfig
  }, [effectsConfig])

  useFrame((state, delta) => {
    if (!materialRef.current) return

    timeRef.current += delta

    // Smooth mouse following
    const lerpFactor = 1 - config.decaySpeed
    currentMouseRef.current.x += (targetMouseRef.current.x - currentMouseRef.current.x) * lerpFactor
    currentMouseRef.current.y += (targetMouseRef.current.y - currentMouseRef.current.y) * lerpFactor

    const mat = materialRef.current

    // Only update per-frame uniforms (time, mouse, resolution)
    mat.uniforms.u_time.value = timeRef.current
    mat.uniforms.u_mouse.value.set(currentMouseRef.current.x, 1 - currentMouseRef.current.y)
    mat.uniforms.u_resolution.value.set(size.width, size.height)
  })

  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
    />
  )
}

const GradientScene = ({ config, effectsConfig, mousePos }) => {
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <FlutedGradientMaterial config={config} effectsConfig={effectsConfig} mousePos={mousePos} />
    </mesh>
  )
}

const GradientLayer = ({ config, effectsConfig, mousePos }) => {
  return (
    <div
      className="gradient-layer"
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
        orthographic
        camera={{ position: [0, 0, 1], left: -1, right: 1, top: 1, bottom: -1, near: 0.1, far: 10 }}
        style={{ width: '100%', height: '100%' }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        // React Three Fiber automatically pauses when tab is not visible
        frameloop="always"
      >
        <GradientScene config={config} effectsConfig={effectsConfig} mousePos={mousePos} />
      </Canvas>
    </div>
  )
}

export default GradientLayer
