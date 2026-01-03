import { useState, useCallback, useRef } from 'react'
import GradientLayer from './components/GradientLayer'
import AuroraLayer from './components/AuroraLayer'
import BlobLayer from './components/BlobLayer'
import TessellationLayer from './components/TessellationLayer'
import EffectsLayer from './components/EffectsLayer'
import TextLayer from './components/TextLayer'
import ControlPanel from './components/ControlPanel'
import './App.css'

function App() {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const [activePanel, setActivePanel] = useState('gradient')
  const layersContainerRef = useRef(null)

  // Background Type State
  const [backgroundType, setBackgroundType] = useState('liquid') // 'liquid', 'aurora', or 'blob'

  // Gradient Layer State (Liquid effect)
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

  // Aurora Layer State
  const [auroraConfig, setAuroraConfig] = useState({
    minWidth: 10,
    maxWidth: 30,
    minHeight: 200,
    maxHeight: 600,
    minTTL: 100,
    maxTTL: 300,
    blurAmount: 13,
    hueStart: 120,
    hueEnd: 180,
    backgroundColor: '#000000',
    lineCount: 0, // 0 = auto-calculate
    decaySpeed: 0.95,
    useGradientColors: true, // Use colors from gradient palette
  })

  // Blob Layer State (Gooey metaball effect)
  const [blobConfig, setBlobConfig] = useState({
    blobCount: 5,
    minRadius: 40,
    maxRadius: 120,
    speed: 0.5,
    orbitRadius: 150,
    blurAmount: 12,
    threshold: 180,
    mouseInfluence: 0.3,
    decaySpeed: 0.95,
    useGradientColors: true, // Use colors from gradient palette
    colors: ['#40204c', '#a3225c', '#e24926'], // Fallback colors
    backgroundColor: '#152a8e',
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

  // Custom color palette state (uploaded by user)
  const [colorPalette, setColorPalette] = useState(null)

  const handleMouseMove = useCallback((e) => {
    const x = e.clientX / window.innerWidth
    const y = e.clientY / window.innerHeight
    setMousePos({ x, y })
  }, [])

  const randomizeGradient = () => {
    const randomHex = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    const randomInRange = (min, max) => Math.random() * (max - min) + min
    const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)]

    const numColors = Math.floor(Math.random() * 4) + 2
    const colors = Array.from({ length: numColors }, randomHex)
    const colorStops = colors.map((_, i) => Math.round((i / (numColors - 1)) * 100))

    setGradientConfig((prev) => ({
      ...prev,
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
    }))

    // Also randomize related layer styling
    setTessellationConfig((prev) => ({
      ...prev,
      // "Icon color" is tessellation icon color
      color: pickOne([...colors, '#ffffff', '#000000']),
      // Keep it subtle by default
      opacity: randomInRange(0.05, 0.35),
    }))

    setEffectsConfig((prev) => ({
      ...prev,
      textureOpacity: randomInRange(0.1, 0.9),
    }))

    setTextConfig((prev) => ({
      ...prev,
      // Single text color applies to all sections (current design)
      color: pickOne([...colors, '#ffffff', '#000000']),
    }))
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
        {/* Layer 1: Background with effects (blur, saturation, contrast, brightness, colorMap) */}
        <div 
          className="gradient-effects-wrapper"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            filter: getGradientFilter(),
          }}
        >
          {backgroundType === 'liquid' && (
            <GradientLayer config={gradientConfig} mousePos={mousePos} />
          )}
          {backgroundType === 'aurora' && (
            <AuroraLayer config={auroraConfig} mousePos={mousePos} paletteColors={gradientConfig.colors} />
          )}
          {backgroundType === 'blob' && (
            <BlobLayer config={blobConfig} mousePos={mousePos} paletteColors={gradientConfig.colors} />
          )}
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
        backgroundType={backgroundType}
        setBackgroundType={setBackgroundType}
        gradientConfig={gradientConfig}
        setGradientConfig={setGradientConfig}
        auroraConfig={auroraConfig}
        setAuroraConfig={setAuroraConfig}
        blobConfig={blobConfig}
        setBlobConfig={setBlobConfig}
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
        colorPalette={colorPalette}
        setColorPalette={setColorPalette}
      />
    </div>
  )
}

export default App
