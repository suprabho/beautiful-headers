import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Custom camera that ensures the plane fills the entire viewport
const FullScreenCamera = () => {
  const { camera, size } = useThree()
  
  // Update camera to always fit the viewport
  useMemo(() => {
    if (camera.isOrthographicCamera) {
      camera.left = -1
      camera.right = 1
      camera.top = 1
      camera.bottom = -1
      camera.near = 0.1
      camera.far = 10
      camera.position.z = 1
      camera.updateProjectionMatrix()
    }
  }, [camera, size])
  
  return null
}

// Fluted glass shader that samples from a texture
const FlutedGlassMaterial = ({ textureRef, effectsConfig }) => {
  const materialRef = useRef()
  const { size } = useThree()
  const timeRef = useRef(0)

  const fluted = effectsConfig?.flutedGlass ?? {}

  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(size.width, size.height) },
    u_texture: { value: null },
    // Fluted glass uniforms
    u_segments: { value: fluted.segments ?? 80 },
    u_rotation: { value: fluted.rotation ?? 0 },
    u_motionValue: { value: fluted.motionValue ?? 0.5 },
    u_overlayOpacity: { value: fluted.overlayOpacity ?? 0 },
    u_flutedMotionSpeed: { value: fluted.motionSpeed ?? 0.5 },
    u_distortionStrength: { value: fluted.distortionStrength ?? 0.02 },
    u_waveFrequency: { value: fluted.waveFrequency ?? 1 },
  }), [size.width, size.height])

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
    uniform vec2 u_resolution;
    uniform sampler2D u_texture;
    
    // Fluted glass uniforms
    uniform float u_segments;
    uniform float u_rotation;
    uniform float u_motionValue;
    uniform float u_overlayOpacity;
    uniform float u_flutedMotionSpeed;
    uniform float u_distortionStrength;
    uniform float u_waveFrequency;
    
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
      float amplitude = u_distortionStrength;
      rotatedUV.x += amplitude * sin(sliceProgress * 3.14159265 * 2.0 * u_waveFrequency) * (1.0 - 0.5 * abs(sliceProgress - 0.5));
      
      // Rotate the UVs back to the original orientation
      vec2 finalUV = vec2(
        cos(-rotationRadians) * (rotatedUV.x - 0.5) - sin(-rotationRadians) * (rotatedUV.y - 0.5) + 0.5,
        sin(-rotationRadians) * (rotatedUV.x - 0.5) + cos(-rotationRadians) * (rotatedUV.y - 0.5) + 0.5
      );
      
      // Mirror UV at edges for seamless tiling instead of clamping
      vec2 tileIndex = floor(finalUV);
      vec2 oddTile = mod(tileIndex, 2.0);
      vec2 mirroredUV = mix(fract(finalUV), 1.0 - fract(finalUV), oddTile);
      
      return mirroredUV;
    }
    
    void main() {
      vec2 uv = vUv;
      float sliceProgress = 0.0;
      
      // Apply fluted glass distortion
      uv = applyFlutedGlass(uv, sliceProgress);
      
      // Sample the texture with distorted UVs
      vec4 color = texture2D(u_texture, uv);
      
      // Apply fluted glass overlays for 3D effect
      if (u_overlayOpacity > 0.0) {
        // Black overlay for depth
        float blackOverlayAlpha = 0.08 * (1.0 - abs(sin(sliceProgress * 3.14159265 * 0.5 + 1.57))) * (u_overlayOpacity / 100.0);
        color.rgb *= (1.0 - blackOverlayAlpha);
        
        // White highlight overlay
        float whiteOverlayAlpha = 0.2 * (1.0 - abs(sin(sliceProgress * 3.14159265 * 0.7 - 0.7))) * (u_overlayOpacity / 100.0);
        color.rgb = mix(color.rgb, vec3(1.0), whiteOverlayAlpha);
      }
      
      gl_FragColor = color;
    }
  `

  useFrame((state, delta) => {
    if (!materialRef.current) return

    timeRef.current += delta

    const mat = materialRef.current
    mat.uniforms.u_time.value = timeRef.current
    mat.uniforms.u_resolution.value.set(size.width, size.height)

    // Update texture if available
    if (textureRef.current) {
      if (!mat.uniforms.u_texture.value) {
        mat.uniforms.u_texture.value = new THREE.CanvasTexture(textureRef.current)
      } else {
        mat.uniforms.u_texture.value.needsUpdate = true
      }
    }

    // Update fluted glass uniforms
    const fl = effectsConfig?.flutedGlass ?? {}
    mat.uniforms.u_segments.value = fl.segments ?? 80
    mat.uniforms.u_rotation.value = fl.rotation ?? 0
    mat.uniforms.u_motionValue.value = fl.motionValue ?? 0.5
    mat.uniforms.u_overlayOpacity.value = fl.overlayOpacity ?? 0
    mat.uniforms.u_flutedMotionSpeed.value = fl.motionSpeed ?? 0.5
    mat.uniforms.u_distortionStrength.value = fl.distortionStrength ?? 0.02
    mat.uniforms.u_waveFrequency.value = fl.waveFrequency ?? 1
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

const FlutedGlassScene = ({ textureRef, effectsConfig }) => {
  return (
    <>
      <FullScreenCamera />
      <mesh>
        <planeGeometry args={[2, 2]} />
        <FlutedGlassMaterial textureRef={textureRef} effectsConfig={effectsConfig} />
      </mesh>
    </>
  )
}

// Wrapper component that applies fluted glass effect to a source canvas
const FlutedGlassCanvas = ({ sourceCanvasRef, effectsConfig, style }) => {
  return (
    <div style={{ position: 'absolute', inset: 0, ...style }}>
      <Canvas
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        orthographic
        camera={{ position: [0, 0, 1], left: -1, right: 1, top: 1, bottom: -1, near: 0.1, far: 10 }}
        style={{ width: '100%', height: '100%' }}
        dpr={Math.min(window.devicePixelRatio, 2)}
      >
        <FlutedGlassScene textureRef={sourceCanvasRef} effectsConfig={effectsConfig} />
      </Canvas>
    </div>
  )
}

export default FlutedGlassCanvas

