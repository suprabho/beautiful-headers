import { useState, useCallback, useRef } from 'react'
import GradientLayer from './components/GradientLayer'
import TessellationLayer from './components/TessellationLayer'
import EffectsLayer from './components/EffectsLayer'
import TextLayer from './components/TextLayer'
import ControlPanel from './components/ControlPanel'
import './App.css'

function App() {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const [activePanel, setActivePanel] = useState('gradient')
  const layersContainerRef = useRef(null)

  // Gradient Layer State
  const [gradientConfig, setGradientConfig] = useState({
    colors: ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0'],
    numColors: 4,
    type: 'radial', // linear, radial, conic
    startPos: { x: 0, y: 0 },
    endPos: { x: 100, y: 100 },
    colorStops: [0, 33, 66, 100],
    waveIntensity: 0.3,
    mouseInfluence: 0.5,
    decaySpeed: 0.95,
    wave1Speed: 0.2,
    wave1Direction: 1,  // 1 = forward, -1 = backward
    wave2Speed: 0.15,
    wave2Direction: -1,
  })

  // Tessellation Layer State
  const [tessellationConfig, setTessellationConfig] = useState({
    enabled: true,
    icon: 'Star',
    rowGap: 60,
    colGap: 60,
    size: 24,
    opacity: 0.15,
    rotation: 0,
    color: '#ffffff',
    mouseRotationInfluence: 0.5,
  })

  // Effects Layer State
  const [effectsConfig, setEffectsConfig] = useState({
    blur: 0,
    noiseEnabled: false,
    noise: 0.1,
    noiseScale: 1,
    texture: 'none', // none, grain, scanlines, dots
    textureSize: 20, // texture pattern size in pixels
    textureOpacity: 0.5, // texture layer opacity
    textureBlendMode: 'overlay', // CSS blend mode for texture
    colorMap: 'none', // none, sepia, cyberpunk, sunset, matrix
    vignetteIntensity: 0.3,
    saturation: 100,
    contrast: 100,
    brightness: 100,
  })

  // Text Layer State
  const [textSections, setTextSections] = useState([
    { id: 1, text: 'VISUAL', size: 120, weight: 900, spacing: 0.1 },
    { id: 2, text: 'EXPERIENCE', size: 80, weight: 300, spacing: 0.2 },
  ])
  const [textGap, setTextGap] = useState(20)
  const [textConfig, setTextConfig] = useState({
    enabled: true,
    color: '#ffffff',
    opacity: 1,
  })

  const handleMouseMove = useCallback((e) => {
    const x = e.clientX / window.innerWidth
    const y = e.clientY / window.innerHeight
    setMousePos({ x, y })
  }, [])

  const randomizeGradient = () => {
    const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
    const numColors = Math.floor(Math.random() * 4) + 2
    const colors = Array.from({ length: numColors }, randomColor)
    const colorStops = colors.map((_, i) => Math.round((i / (numColors - 1)) * 100))
    
    setGradientConfig({
      ...gradientConfig,
      colors,
      numColors,
      type: ['linear', 'radial', 'conic'][Math.floor(Math.random() * 3)],
      startPos: { x: Math.random() * 100, y: Math.random() * 100 },
      endPos: { x: Math.random() * 100, y: Math.random() * 100 },
      colorStops,
      waveIntensity: Math.random() * 0.5 + 0.1,
      mouseInfluence: Math.random() * 0.8 + 0.2,
      wave1Speed: Math.random() * 0.4 + 0.05,
      wave1Direction: Math.random() > 0.5 ? 1 : -1,
      wave2Speed: Math.random() * 0.4 + 0.05,
      wave2Direction: Math.random() > 0.5 ? 1 : -1,
    })
  }

  // Build the gradient filter string
  const getGradientFilter = () => {
    const filters = [
      effectsConfig.blur > 0 ? `blur(${effectsConfig.blur}px)` : '',
      `saturate(${effectsConfig.saturation}%)`,
      `contrast(${effectsConfig.contrast}%)`,
      `brightness(${effectsConfig.brightness}%)`,
    ]
    
    // Add color map filter
    switch (effectsConfig.colorMap) {
      case 'sepia': filters.push('sepia(0.8)'); break
      case 'cyberpunk': filters.push('hue-rotate(280deg) saturate(1.5)'); break
      case 'sunset': filters.push('hue-rotate(30deg) saturate(1.3)'); break
      case 'matrix': filters.push('hue-rotate(90deg) saturate(2) brightness(0.9)'); break
      case 'noir': filters.push('grayscale(1) contrast(1.2)'); break
      case 'vintage': filters.push('sepia(0.3) saturate(1.5) hue-rotate(-10deg)'); break
    }
    
    return filters.filter(Boolean).join(' ') || 'none'
  }

  return (
    <div className="app" onMouseMove={handleMouseMove}>
      <div className="layers-container" ref={layersContainerRef}>
        {/* Layer 1: Gradient with effects (blur, saturation, contrast, brightness, colorMap) */}
        <div 
          className="gradient-effects-wrapper"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            filter: getGradientFilter(),
          }}
        >
          <GradientLayer config={gradientConfig} mousePos={mousePos} />
        </div>
        
        {/* Layer 2: Tessellation (no filter effects) */}
        {tessellationConfig.enabled && (
          <TessellationLayer config={tessellationConfig} mousePos={mousePos} />
        )}
        
        {/* Layer 3: Overlay effects (noise, texture, vignette) */}
        <EffectsLayer config={effectsConfig} />
        
        {/* Layer 4: Text */}
        {textConfig.enabled && (
          <TextLayer
            sections={textSections}
            gap={textGap}
            color={textConfig.color}
            opacity={textConfig.opacity}
          />
        )}
      </div>

      <ControlPanel
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        gradientConfig={gradientConfig}
        setGradientConfig={setGradientConfig}
        randomizeGradient={randomizeGradient}
        tessellationConfig={tessellationConfig}
        setTessellationConfig={setTessellationConfig}
        effectsConfig={effectsConfig}
        setEffectsConfig={setEffectsConfig}
        textSections={textSections}
        setTextSections={setTextSections}
        textGap={textGap}
        setTextGap={setTextGap}
        textConfig={textConfig}
        setTextConfig={setTextConfig}
        layersContainerRef={layersContainerRef}
      />
    </div>
  )
}

export default App
