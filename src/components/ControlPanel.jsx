import { useState, useRef, useEffect, useCallback } from 'react'
import { AVAILABLE_ICONS } from './TessellationLayer'
import { 
  Sliders, Palette, GridFour, Sparkle, TextT, 
  Shuffle, Plus, Trash, CaretDown, CaretUp, DotsSixVertical 
} from '@phosphor-icons/react'

const ControlPanel = ({
  activePanel,
  setActivePanel,
  gradientConfig,
  setGradientConfig,
  randomizeGradient,
  tessellationConfig,
  setTessellationConfig,
  effectsConfig,
  setEffectsConfig,
  textSections,
  setTextSections,
  textGap,
  setTextGap,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const panelRef = useRef(null)

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.panel-content') || e.target.closest('.panel-tabs')) return
    
    setIsDragging(true)
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
    e.preventDefault()
  }, [position])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return
    
    const newX = e.clientX - dragOffset.current.x
    const newY = e.clientY - dragOffset.current.y
    
    // Keep panel within viewport bounds
    const panel = panelRef.current
    if (panel) {
      const maxX = window.innerWidth - panel.offsetWidth
      const maxY = window.innerHeight - panel.offsetHeight
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      })
    }
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const tabs = [
    { id: 'gradient', label: 'Gradient', icon: Palette },
    { id: 'tessellation', label: 'Pattern', icon: GridFour },
    { id: 'effects', label: 'Effects', icon: Sparkle },
    { id: 'text', label: 'Text', icon: TextT },
  ]

  const updateGradientColor = (index, color) => {
    const newColors = [...gradientConfig.colors]
    newColors[index] = color
    setGradientConfig({ ...gradientConfig, colors: newColors })
  }

  const addGradientColor = () => {
    if (gradientConfig.colors.length < 8) {
      const newColors = [...gradientConfig.colors, '#ffffff']
      const newStops = newColors.map((_, i) => Math.round((i / (newColors.length - 1)) * 100))
      setGradientConfig({
        ...gradientConfig,
        colors: newColors,
        colorStops: newStops,
        numColors: newColors.length,
      })
    }
  }

  const removeGradientColor = (index) => {
    if (gradientConfig.colors.length > 2) {
      const newColors = gradientConfig.colors.filter((_, i) => i !== index)
      const newStops = newColors.map((_, i) => Math.round((i / (newColors.length - 1)) * 100))
      setGradientConfig({
        ...gradientConfig,
        colors: newColors,
        colorStops: newStops,
        numColors: newColors.length,
      })
    }
  }

  const updateColorStop = (index, value) => {
    const newStops = [...gradientConfig.colorStops]
    newStops[index] = parseInt(value)
    setGradientConfig({ ...gradientConfig, colorStops: newStops })
  }

  const addTextSection = () => {
    const newId = Math.max(...textSections.map(s => s.id), 0) + 1
    setTextSections([
      ...textSections,
      { id: newId, text: 'NEW TEXT', size: 60, weight: 400, spacing: 0.1 }
    ])
  }

  const updateTextSection = (id, field, value) => {
    setTextSections(textSections.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ))
  }

  const removeTextSection = (id) => {
    if (textSections.length > 1) {
      setTextSections(textSections.filter(s => s.id !== id))
    }
  }

  return (
    <div 
      ref={panelRef}
      className={`control-panel ${isCollapsed ? 'collapsed' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <div 
        className="panel-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="drag-handle">
          <DotsSixVertical size={16} weight="bold" />
        </div>
        <button 
          className="collapse-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <Sliders size={18} />
          {isCollapsed ? <CaretUp size={14} /> : <CaretDown size={14} />}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <div className="panel-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`panel-tab ${activePanel === tab.id ? 'active' : ''}`}
                onClick={() => setActivePanel(tab.id)}
              >
                <tab.icon size={16} weight={activePanel === tab.id ? 'fill' : 'regular'} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="panel-content">
            {/* Gradient Panel */}
            {activePanel === 'gradient' && (
              <div className="panel-section">
                <div className="section-header">
                  <h3>Gradient Colors</h3>
                  <button className="icon-button" onClick={randomizeGradient}>
                    <Shuffle size={16} />
                  </button>
                </div>

                <div className="color-list">
                  {gradientConfig.colors.map((color, index) => (
                    <div key={index} className="color-row">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => updateGradientColor(index, e.target.value)}
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={gradientConfig.colorStops[index] || 0}
                        onChange={(e) => updateColorStop(index, e.target.value)}
                        className="stop-input"
                      />
                      <span className="percent">%</span>
                      <button 
                        className="remove-btn"
                        onClick={() => removeGradientColor(index)}
                        disabled={gradientConfig.colors.length <= 2}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                  {gradientConfig.colors.length < 8 && (
                    <button className="add-color-btn" onClick={addGradientColor}>
                      <Plus size={14} /> Add Color
                    </button>
                  )}
                </div>

                <div className="control-group">
                  <label>Gradient Type</label>
                  <select
                    value={gradientConfig.type}
                    onChange={(e) => setGradientConfig({ ...gradientConfig, type: e.target.value })}
                  >
                    <option value="linear">Linear</option>
                    <option value="radial">Radial</option>
                    <option value="conic">Conic</option>
                  </select>
                </div>

                <div className="control-row">
                  <div className="control-group half">
                    <label>Start X</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={gradientConfig.startPos.x}
                      onChange={(e) => setGradientConfig({
                        ...gradientConfig,
                        startPos: { ...gradientConfig.startPos, x: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="control-group half">
                    <label>Start Y</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={gradientConfig.startPos.y}
                      onChange={(e) => setGradientConfig({
                        ...gradientConfig,
                        startPos: { ...gradientConfig.startPos, y: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                </div>

                <div className="control-row">
                  <div className="control-group half">
                    <label>End X</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={gradientConfig.endPos.x}
                      onChange={(e) => setGradientConfig({
                        ...gradientConfig,
                        endPos: { ...gradientConfig.endPos, x: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="control-group half">
                    <label>End Y</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={gradientConfig.endPos.y}
                      onChange={(e) => setGradientConfig({
                        ...gradientConfig,
                        endPos: { ...gradientConfig.endPos, y: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                </div>

                <div className="control-group">
                  <label>Wave Intensity: {gradientConfig.waveIntensity.toFixed(2)}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={gradientConfig.waveIntensity}
                    onChange={(e) => setGradientConfig({
                      ...gradientConfig,
                      waveIntensity: parseFloat(e.target.value)
                    })}
                  />
                </div>

                <div className="control-group">
                  <label>Mouse Influence: {gradientConfig.mouseInfluence.toFixed(2)}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={gradientConfig.mouseInfluence}
                    onChange={(e) => setGradientConfig({
                      ...gradientConfig,
                      mouseInfluence: parseFloat(e.target.value)
                    })}
                  />
                </div>

                <div className="control-group">
                  <label>Decay Speed: {gradientConfig.decaySpeed.toFixed(2)}</label>
                  <input
                    type="range"
                    min="0.8"
                    max="0.99"
                    step="0.01"
                    value={gradientConfig.decaySpeed}
                    onChange={(e) => setGradientConfig({
                      ...gradientConfig,
                      decaySpeed: parseFloat(e.target.value)
                    })}
                  />
                </div>
              </div>
            )}

            {/* Tessellation Panel */}
            {activePanel === 'tessellation' && (
              <div className="panel-section">
                <h3>Pattern Settings</h3>

                <div className="control-group">
                  <label>Icon</label>
                  <select
                    value={tessellationConfig.icon}
                    onChange={(e) => setTessellationConfig({
                      ...tessellationConfig,
                      icon: e.target.value
                    })}
                  >
                    {AVAILABLE_ICONS.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>

                <div className="control-row">
                  <div className="control-group half">
                    <label>Row Gap: {tessellationConfig.rowGap}px</label>
                    <input
                      type="range"
                      min="20"
                      max="200"
                      value={tessellationConfig.rowGap}
                      onChange={(e) => setTessellationConfig({
                        ...tessellationConfig,
                        rowGap: parseInt(e.target.value)
                      })}
                    />
                  </div>
                  <div className="control-group half">
                    <label>Col Gap: {tessellationConfig.colGap}px</label>
                    <input
                      type="range"
                      min="20"
                      max="200"
                      value={tessellationConfig.colGap}
                      onChange={(e) => setTessellationConfig({
                        ...tessellationConfig,
                        colGap: parseInt(e.target.value)
                      })}
                    />
                  </div>
                </div>

                <div className="control-group">
                  <label>Icon Size: {tessellationConfig.size}px</label>
                  <input
                    type="range"
                    min="8"
                    max="100"
                    value={tessellationConfig.size}
                    onChange={(e) => setTessellationConfig({
                      ...tessellationConfig,
                      size: parseInt(e.target.value)
                    })}
                  />
                </div>

                <div className="control-group">
                  <label>Opacity: {tessellationConfig.opacity.toFixed(2)}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={tessellationConfig.opacity}
                    onChange={(e) => setTessellationConfig({
                      ...tessellationConfig,
                      opacity: parseFloat(e.target.value)
                    })}
                  />
                </div>

                <div className="control-group">
                  <label>Rotation: {tessellationConfig.rotation}°</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={tessellationConfig.rotation}
                    onChange={(e) => setTessellationConfig({
                      ...tessellationConfig,
                      rotation: parseInt(e.target.value)
                    })}
                  />
                </div>

                <div className="control-group">
                  <label>Color</label>
                  <input
                    type="color"
                    value={tessellationConfig.color}
                    onChange={(e) => setTessellationConfig({
                      ...tessellationConfig,
                      color: e.target.value
                    })}
                  />
                </div>
              </div>
            )}

            {/* Effects Panel */}
            {activePanel === 'effects' && (
              <div className="panel-section">
                <h3>Visual Effects</h3>

                <div className="control-group">
                  <label>Background Blur: {effectsConfig.blur}px</label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={effectsConfig.blur}
                    onChange={(e) => setEffectsConfig({
                      ...effectsConfig,
                      blur: parseInt(e.target.value)
                    })}
                  />
                </div>

                <div className="control-group toggle-group">
                  <label>Enable Noise</label>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={effectsConfig.noiseEnabled}
                      onChange={(e) => setEffectsConfig({
                        ...effectsConfig,
                        noiseEnabled: e.target.checked
                      })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {effectsConfig.noiseEnabled && (
                  <>
                    <div className="control-group">
                      <label>Noise Amount: {effectsConfig.noise.toFixed(2)}</label>
                      <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.01"
                        value={effectsConfig.noise}
                        onChange={(e) => setEffectsConfig({
                          ...effectsConfig,
                          noise: parseFloat(e.target.value)
                        })}
                      />
                    </div>

                    <div className="control-group">
                      <label>Noise Scale: {effectsConfig.noiseScale.toFixed(1)}</label>
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={effectsConfig.noiseScale}
                        onChange={(e) => setEffectsConfig({
                          ...effectsConfig,
                          noiseScale: parseFloat(e.target.value)
                        })}
                      />
                    </div>
                  </>
                )}

                <div className="control-group">
                  <label>Texture</label>
                  <select
                    value={effectsConfig.texture}
                    onChange={(e) => setEffectsConfig({
                      ...effectsConfig,
                      texture: e.target.value
                    })}
                  >
                    <option value="none">None</option>
                    <option value="grain">Grain</option>
                    <option value="scanlines">Scanlines</option>
                    <option value="dots">Dots</option>
                    <option value="grid">Grid</option>
                    <option value="diagonal">Diagonal Lines</option>
                  </select>
                </div>

                {effectsConfig.texture !== 'none' && (
                  <>
                    <div className="control-group">
                      <label>Texture Size: {effectsConfig.textureSize}px</label>
                      <input
                        type="range"
                        min="4"
                        max="100"
                        value={effectsConfig.textureSize}
                        onChange={(e) => setEffectsConfig({
                          ...effectsConfig,
                          textureSize: parseInt(e.target.value)
                        })}
                      />
                    </div>

                    <div className="control-group">
                      <label>Texture Opacity: {effectsConfig.textureOpacity.toFixed(2)}</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={effectsConfig.textureOpacity}
                        onChange={(e) => setEffectsConfig({
                          ...effectsConfig,
                          textureOpacity: parseFloat(e.target.value)
                        })}
                      />
                    </div>

                    <div className="control-group">
                      <label>Texture Blend Mode</label>
                      <select
                        value={effectsConfig.textureBlendMode}
                        onChange={(e) => setEffectsConfig({
                          ...effectsConfig,
                          textureBlendMode: e.target.value
                        })}
                      >
                        <option value="normal">Normal</option>
                        <option value="multiply">Multiply</option>
                        <option value="screen">Screen</option>
                        <option value="overlay">Overlay</option>
                        <option value="darken">Darken</option>
                        <option value="lighten">Lighten</option>
                        <option value="color-dodge">Color Dodge</option>
                        <option value="color-burn">Color Burn</option>
                        <option value="hard-light">Hard Light</option>
                        <option value="soft-light">Soft Light</option>
                        <option value="difference">Difference</option>
                        <option value="exclusion">Exclusion</option>
                        <option value="hue">Hue</option>
                        <option value="saturation">Saturation</option>
                        <option value="color">Color</option>
                        <option value="luminosity">Luminosity</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="control-group">
                  <label>Color Map</label>
                  <select
                    value={effectsConfig.colorMap}
                    onChange={(e) => setEffectsConfig({
                      ...effectsConfig,
                      colorMap: e.target.value
                    })}
                  >
                    <option value="none">None</option>
                    <option value="sepia">Sepia</option>
                    <option value="cyberpunk">Cyberpunk</option>
                    <option value="sunset">Sunset</option>
                    <option value="matrix">Matrix</option>
                    <option value="noir">Noir</option>
                    <option value="vintage">Vintage</option>
                  </select>
                </div>

                <div className="control-group">
                  <label>Vignette: {effectsConfig.vignetteIntensity.toFixed(2)}</label>
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.01"
                    value={effectsConfig.vignetteIntensity}
                    onChange={(e) => setEffectsConfig({
                      ...effectsConfig,
                      vignetteIntensity: parseFloat(e.target.value)
                    })}
                  />
                </div>

                <div className="control-group">
                  <label>Saturation: {effectsConfig.saturation}%</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={effectsConfig.saturation}
                    onChange={(e) => setEffectsConfig({
                      ...effectsConfig,
                      saturation: parseInt(e.target.value)
                    })}
                  />
                </div>

                <div className="control-group">
                  <label>Contrast: {effectsConfig.contrast}%</label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={effectsConfig.contrast}
                    onChange={(e) => setEffectsConfig({
                      ...effectsConfig,
                      contrast: parseInt(e.target.value)
                    })}
                  />
                </div>

                <div className="control-group">
                  <label>Brightness: {effectsConfig.brightness}%</label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={effectsConfig.brightness}
                    onChange={(e) => setEffectsConfig({
                      ...effectsConfig,
                      brightness: parseInt(e.target.value)
                    })}
                  />
                </div>
              </div>
            )}

            {/* Text Panel */}
            {activePanel === 'text' && (
              <div className="panel-section">
                <div className="section-header">
                  <h3>Text Sections</h3>
                  <button className="icon-button" onClick={addTextSection}>
                    <Plus size={16} />
                  </button>
                </div>

                <div className="control-group">
                  <label>Section Gap: {textGap}px</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={textGap}
                    onChange={(e) => setTextGap(parseInt(e.target.value))}
                  />
                </div>

                {textSections.map((section, index) => (
                  <div key={section.id} className="text-section-controls">
                    <div className="text-section-header">
                      <span>Section {index + 1}</span>
                      <button
                        className="remove-btn"
                        onClick={() => removeTextSection(section.id)}
                        disabled={textSections.length <= 1}
                      >
                        <Trash size={14} />
                      </button>
                    </div>

                    <div className="control-group">
                      <label>Text</label>
                      <input
                        type="text"
                        value={section.text}
                        onChange={(e) => updateTextSection(section.id, 'text', e.target.value)}
                        className="text-input"
                      />
                    </div>

                    <div className="control-group">
                      <label>Size: {section.size}px</label>
                      <input
                        type="range"
                        min="12"
                        max="200"
                        value={section.size}
                        onChange={(e) => updateTextSection(section.id, 'size', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="control-group">
                      <label>Weight</label>
                      <select
                        value={section.weight}
                        onChange={(e) => updateTextSection(section.id, 'weight', parseInt(e.target.value))}
                      >
                        <option value="100">Thin</option>
                        <option value="200">Extra Light</option>
                        <option value="300">Light</option>
                        <option value="400">Regular</option>
                        <option value="500">Medium</option>
                        <option value="600">Semi Bold</option>
                        <option value="700">Bold</option>
                        <option value="800">Extra Bold</option>
                        <option value="900">Black</option>
                      </select>
                    </div>

                    <div className="control-group">
                      <label>Letter Spacing: {section.spacing.toFixed(2)}em</label>
                      <input
                        type="range"
                        min="-0.1"
                        max="0.5"
                        step="0.01"
                        value={section.spacing}
                        onChange={(e) => updateTextSection(section.id, 'spacing', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default ControlPanel

