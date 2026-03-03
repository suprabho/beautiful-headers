import { Trash, ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parsePaletteJson } from '@/lib/colorConversion'
import useStore from '../../store/useStore'
import { useThemedConfig } from '../../hooks/useThemedConfig'
import {
  ControlGroup,
  NumberInput,
  PaletteColorPicker,
  ContrastAwarePaletteColorPicker,
  ColorsSection,
  RadialGradientSection,
  LockedGradientSection,
  IconGridDropdown,
} from './index'

export const getDialogTitle = (key, textSections) => {
  const titles = {
    'gradient-colors': 'Background Colors',
    'simple-type': 'Gradient Type',
    'simple-position': 'Position',
    'gradient-type': 'Gradient Type',
    'gradient-stops': 'Position Stops',
    'gradient-wave': 'Wave Settings',
    'gradient-mouse': 'Decay Speed',
    'aurora-background': 'Background',
    'aurora-lines': 'Line Settings',
    'aurora-animation': 'Animation',
    'fluid-background': 'Background',
    'fluid-animation': 'Animation Speed',
    'fluid-settings': 'Fluid Settings',
    'waves-shape': 'Wave Shape',
    'waves-position': 'Wave Position',
    'waves-animation': 'Wave Animation',
    'ribbon-background': 'Ribbon Background',
    'ribbon-shape': 'Ribbon Shape',
    'ribbon-motion': 'Ribbon Motion',
    'ribbon-animation': 'Ribbon Animation',
    'dandelion-background': 'Dandelion Background',
    'dandelion-lines': 'Dandelion Lines',
    'dandelion-shape': 'Dandelion Shape',
    'dandelion-animation': 'Dandelion Animation',
    'particleRing-background': 'Ring Background',
    'particleRing-ring': 'Ring Settings',
    'particleRing-particles': 'Particle Settings',
    'particleRing-animation': 'Ring Animation',
    'particleRing-tilt': 'Ring Tilt',
    'pattern-icon': 'Icon Settings',
    'pattern-spacing': 'Spacing',
    'effects-blur': 'Background Blur',
    'effects-texture': 'Texture',
    'effects-colormap': 'Color Map',
    'effects-vignette': 'Vignette',
    'effects-color': 'Color Correction',
    'effects-fluted': 'Fluted Glass',
    'text-settings': 'Text Settings',
  }
  if (key && key.startsWith('text-section-')) {
    const sectionId = parseInt(key.replace('text-section-', ''))
    const sectionIndex = textSections.findIndex(s => s.id === sectionId)
    const section = textSections.find(s => s.id === sectionId)
    return section ? `Section ${sectionIndex + 1}: ${section.text?.slice(0, 15) || 'Empty'}${section.text?.length > 15 ? '...' : ''}` : 'Text Section'
  }
  return titles[key] || 'Settings'
}

export const MobileDialogContent = ({ activeDialog, onCloseDialog }) => {
  const [gradientConfig, setGradientConfig] = useThemedConfig('gradientConfig')
  const auroraConfig = useStore((state) => state.auroraConfig)
  const setAuroraConfig = useStore((state) => state.setAuroraConfig)
  const blobConfig = useStore((state) => state.blobConfig)
  const setBlobConfig = useStore((state) => state.setBlobConfig)
  const fluidConfig = useStore((state) => state.fluidConfig)
  const setFluidConfig = useStore((state) => state.setFluidConfig)
  const wavesConfig = useStore((state) => state.wavesConfig)
  const setWavesConfig = useStore((state) => state.setWavesConfig)
  const ribbonConfig = useStore((state) => state.ribbonConfig)
  const setRibbonConfig = useStore((state) => state.setRibbonConfig)
  const dandelionConfig = useStore((state) => state.dandelionConfig)
  const setDandelionConfig = useStore((state) => state.setDandelionConfig)
  const particleRingConfig = useStore((state) => state.particleRingConfig)
  const setParticleRingConfig = useStore((state) => state.setParticleRingConfig)
  const tessellationConfig = useStore((state) => state.tessellationConfig)
  const setTessellationConfig = useStore((state) => state.setTessellationConfig)
  const effectsConfig = useStore((state) => state.effectsConfig)
  const setEffectsConfig = useStore((state) => state.setEffectsConfig)
  const textSections = useStore((state) => state.textSections)
  const setTextSections = useStore((state) => state.setTextSections)
  const textGap = useStore((state) => state.textGap)
  const setTextGap = useStore((state) => state.setTextGap)
  const [textConfig, setTextConfig] = useThemedConfig('textConfig')
  const colorPalette = useStore((state) => state.colorPalette)

  const parsedPalette = colorPalette ? parsePaletteJson(colorPalette) : null

  // Text section helpers
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

  switch (activeDialog) {
    case 'gradient-colors':
      return (
        <ColorsSection
          gradientConfig={gradientConfig}
          setGradientConfig={setGradientConfig}
          parsedPalette={parsedPalette}
        />
      )
    case 'simple-type':
      return (
        <div className="space-y-2">
          <LockedGradientSection
            colors={gradientConfig.colors}
            colorStops={gradientConfig.colorStops}
            onColorStopsChange={(newStops) => setGradientConfig({ ...gradientConfig, colorStops: newStops })}
          />
          <ControlGroup label="Gradient Type">
            <Select
              value={gradientConfig.type}
              onValueChange={(value) => setGradientConfig({ ...gradientConfig, type: value })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="radial">Radial</SelectItem>
                <SelectItem value="conic">Conic</SelectItem>
              </SelectContent>
            </Select>
          </ControlGroup>
        </div>
      )
    case 'gradient-type':
      return (
        <div className="space-y-2">
          <LockedGradientSection
            colors={gradientConfig.colors}
            colorStops={gradientConfig.colorStops}
            onColorStopsChange={(newStops) => setGradientConfig({ ...gradientConfig, colorStops: newStops })}
          />
          <ControlGroup label="Gradient Type">
            <Select
              value={gradientConfig.type}
              onValueChange={(value) => setGradientConfig({ ...gradientConfig, type: value })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="radial">Radial</SelectItem>
                <SelectItem value="conic">Conic</SelectItem>
              </SelectContent>
            </Select>
          </ControlGroup>
        </div>
      )
    case 'simple-position':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Start X: `}>
            <NumberInput value={[gradientConfig.startPos.x]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, startPos: { ...gradientConfig.startPos, x: val } })} min={-100} max={200} step={10} showButtons />
          </ControlGroup>
          <ControlGroup label={`Start Y: `}>
            <NumberInput value={[gradientConfig.startPos.y]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, startPos: { ...gradientConfig.startPos, y: val } })} min={-100} max={200} step={10} showButtons />
          </ControlGroup>
          <ControlGroup label={`End X: `}>
            <NumberInput value={[gradientConfig.endPos.x]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, endPos: { ...gradientConfig.endPos, x: val } })} min={-100} max={200} step={10} showButtons />
          </ControlGroup>
          <ControlGroup label={`End Y: `}>
            <NumberInput value={[gradientConfig.endPos.y]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, endPos: { ...gradientConfig.endPos, y: val } })} min={-100} max={200} step={10} showButtons />
          </ControlGroup>
        </div>
      )
    case 'gradient-stops':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Start X: `}>
            <NumberInput value={[gradientConfig.startPos.x]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, startPos: { ...gradientConfig.startPos, x: val } })} min={-100} max={100} step={5} showButtons />
          </ControlGroup>
          <ControlGroup label={`Start Y: `}>
            <NumberInput value={[gradientConfig.startPos.y]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, startPos: { ...gradientConfig.startPos, y: val } })} min={-100} max={100} step={5} showButtons />
          </ControlGroup>
          <ControlGroup label={`End X: `}>
            <NumberInput value={[gradientConfig.endPos.x]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, endPos: { ...gradientConfig.endPos, x: val } })} min={-100} max={100} step={5} showButtons />
          </ControlGroup>
          <ControlGroup label={`End Y: `}>
            <NumberInput value={[gradientConfig.endPos.y]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, endPos: { ...gradientConfig.endPos, y: val } })} min={-100} max={100} step={5} showButtons />
          </ControlGroup>
        </div>
      )
    case 'gradient-wave':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Wave Intensity`}>
            <NumberInput value={[gradientConfig.waveIntensity]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, waveIntensity: val })} max={1} step={0.05} showButtons />
          </ControlGroup>
          <ControlGroup label={`Wave 1 Speed`}>
            <NumberInput value={[gradientConfig.wave1Speed]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, wave1Speed: val })} max={0.5} step={0.05} showButtons />
          </ControlGroup>
          <ControlGroup label="Wave 1 Direction">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setGradientConfig({ ...gradientConfig, wave1Direction: gradientConfig.wave1Direction === 1 ? -1 : 1 })}>
              {gradientConfig.wave1Direction === 1 ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            </Button>
          </ControlGroup>
          <ControlGroup label={`Wave 2 Speed`}>
            <NumberInput value={[gradientConfig.wave2Speed]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, wave2Speed: val })} max={0.5} step={0.05} showButtons />
          </ControlGroup>
          <ControlGroup label="Wave 2 Direction">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setGradientConfig({ ...gradientConfig, wave2Direction: gradientConfig.wave2Direction === 1 ? -1 : 1 })}>
              {gradientConfig.wave2Direction === 1 ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            </Button>
          </ControlGroup>
        </div>
      )
    case 'gradient-mouse':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Decay Speed`}>
            <NumberInput value={[gradientConfig.decaySpeed]} onValueChange={([val]) => setGradientConfig({ ...gradientConfig, decaySpeed: val })} min={0.8} max={0.99} step={0.01} showButtons />
          </ControlGroup>
        </div>
      )
    case 'aurora-background':
      return (
        <ControlGroup label="Background Color">
          <div className="flex items-center gap-2">
            <PaletteColorPicker value={auroraConfig.backgroundColor} onChange={(newColor) => setAuroraConfig({ ...auroraConfig, backgroundColor: newColor })} palette={parsedPalette} className="w-10 h-10" />
            <Input value={auroraConfig.backgroundColor} onChange={(e) => setAuroraConfig({ ...auroraConfig, backgroundColor: e.target.value })} className="h-9 font-mono text-xs flex-1" />
          </div>
        </ControlGroup>
      )
    case 'aurora-lines':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Width`}><NumberInput value={[auroraConfig.width]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, width: val })} min={1} max={100} step={5} showButtons /></ControlGroup>
          <ControlGroup label={`Min Height`}><NumberInput value={[auroraConfig.minHeight]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, minHeight: val })} min={50} max={1000} step={50} showButtons /></ControlGroup>
          <ControlGroup label={`Max Height`}><NumberInput value={[auroraConfig.maxHeight]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, maxHeight: val })} min={50} max={1000} step={50} showButtons /></ControlGroup>
          <ControlGroup label={`Line Count (0 = auto)`}><NumberInput value={[auroraConfig.lineCount]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, lineCount: val })} min={0} max={500} step={10} showButtons /></ControlGroup>
        </div>
      )
    case 'aurora-animation':
      return (
        <div className="space-y-2">
          <ControlGroup label={`TTL`}><NumberInput value={[auroraConfig.ttl]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, ttl: val })} min={10} max={500} step={10} showButtons /></ControlGroup>
          <ControlGroup label={`Blur Amount`}><NumberInput value={[auroraConfig.blurAmount]} onValueChange={([val]) => setAuroraConfig({ ...auroraConfig, blurAmount: val })} min={0} max={50} step={1} showButtons /></ControlGroup>
        </div>
      )
    case 'fluid-background':
      return (
        <ControlGroup label="Background Color">
          <div className="flex items-center gap-2">
            <PaletteColorPicker value={fluidConfig.backgroundColor} onChange={(newColor) => setFluidConfig({ ...fluidConfig, backgroundColor: newColor })} palette={parsedPalette} className="w-10 h-9" />
            <Input value={fluidConfig.backgroundColor} onChange={(e) => setFluidConfig({ ...fluidConfig, backgroundColor: e.target.value })} className="h-9 font-mono text-xs flex-1" />
          </div>
        </ControlGroup>
      )
    case 'fluid-animation':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Speed`}><NumberInput value={[fluidConfig.speed]} onValueChange={([val]) => setFluidConfig({ ...fluidConfig, speed: val })} min={0.1} max={3} step={0.1} showButtons /></ControlGroup>
        </div>
      )
    case 'fluid-settings':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Intensity`}><NumberInput value={[fluidConfig.intensity]} onValueChange={([val]) => setFluidConfig({ ...fluidConfig, intensity: val })} min={0.5} max={2} step={0.1} showButtons /></ControlGroup>
          <ControlGroup label={`Scale`}><NumberInput value={[fluidConfig.scale]} onValueChange={([val]) => setFluidConfig({ ...fluidConfig, scale: val })} min={0.1} max={10} step={0.1} showButtons /></ControlGroup>
          <ControlGroup label={`Blur`}><NumberInput value={[fluidConfig.blurAmount]} onValueChange={([val]) => setFluidConfig({ ...fluidConfig, blurAmount: val })} min={0} max={100} step={1} showButtons /></ControlGroup>
        </div>
      )
    case 'waves-shape':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Wave Height`}><NumberInput value={[wavesConfig.waveHeight]} onValueChange={([val]) => setWavesConfig({ ...wavesConfig, waveHeight: val })} min={0.05} max={0.5} step={0.05} showButtons /></ControlGroup>
          <ControlGroup label={`Frequency`}><NumberInput value={[wavesConfig.waveFrequency]} onValueChange={([val]) => setWavesConfig({ ...wavesConfig, waveFrequency: val })} min={1} max={10} step={0.5} showButtons /></ControlGroup>
          <ControlGroup label={`Layers`}><NumberInput value={[wavesConfig.layers]} onValueChange={([val]) => setWavesConfig({ ...wavesConfig, layers: val })} min={2} max={8} step={1} showButtons /></ControlGroup>
        </div>
      )
    case 'waves-position':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Rotation (°)`}><NumberInput value={[wavesConfig.rotation]} onValueChange={([val]) => setWavesConfig({ ...wavesConfig, rotation: val })} min={-180} max={180} step={15} showButtons /></ControlGroup>
          <ControlGroup label={`Phase Offset`}><NumberInput value={[wavesConfig.phaseOffset ?? 0]} onValueChange={([val]) => setWavesConfig({ ...wavesConfig, phaseOffset: val })} min={0} max={2} step={0.1} showButtons /></ControlGroup>
        </div>
      )
    case 'waves-animation':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Speed`}><NumberInput value={[wavesConfig.speed]} onValueChange={([val]) => setWavesConfig({ ...wavesConfig, speed: val })} min={0} max={2} step={0.1} showButtons /></ControlGroup>
          <ControlGroup label={`Blur`}><NumberInput value={[wavesConfig.blur]} onValueChange={([val]) => setWavesConfig({ ...wavesConfig, blur: val })} min={0} max={100} step={5} showButtons /></ControlGroup>
        </div>
      )
    case 'ribbon-background':
      return (
        <ControlGroup label="Background Color">
          <div className="flex items-center gap-2">
            <PaletteColorPicker value={ribbonConfig.backgroundColor} onChange={(newColor) => setRibbonConfig({ ...ribbonConfig, backgroundColor: newColor })} palette={parsedPalette} className="w-10 h-10" />
            <Input value={ribbonConfig.backgroundColor} onChange={(e) => setRibbonConfig({ ...ribbonConfig, backgroundColor: e.target.value })} className="h-9 font-mono text-xs flex-1" />
          </div>
        </ControlGroup>
      )
    case 'ribbon-shape':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Ribbon Count`}><NumberInput value={[ribbonConfig.ribbonCount]} onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, ribbonCount: val })} min={2} max={10} step={1} showButtons /></ControlGroup>
          <ControlGroup label={`Thickness`}><NumberInput value={[ribbonConfig.thickness]} onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, thickness: val })} min={0.1} max={1} step={0.05} showButtons /></ControlGroup>
          <ControlGroup label={`Taper`}><NumberInput value={[ribbonConfig.taper]} onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, taper: val })} min={-1} max={1} step={0.1} showButtons /></ControlGroup>
          <ControlGroup label={`Spread`}><NumberInput value={[ribbonConfig.spread]} onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, spread: val })} min={0.5} max={3} step={0.1} showButtons /></ControlGroup>
        </div>
      )
    case 'ribbon-motion':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Amplitude`}><NumberInput value={[ribbonConfig.amplitude]} onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, amplitude: val })} min={0.1} max={3} step={0.1} showButtons /></ControlGroup>
          <ControlGroup label={`Rotation (°)`}><NumberInput value={[ribbonConfig.rotation]} onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, rotation: val })} min={-90} max={90} step={5} showButtons /></ControlGroup>
          <ControlGroup label={`Noise`}><NumberInput value={[ribbonConfig.noise]} onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, noise: val })} min={0} max={2} step={0.1} showButtons /></ControlGroup>
        </div>
      )
    case 'ribbon-animation':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Speed`}><NumberInput value={[ribbonConfig.speed]} onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, speed: val })} min={0.1} max={2} step={0.1} showButtons /></ControlGroup>
          <ControlGroup label={`Opacity`}><NumberInput value={[ribbonConfig.opacity]} onValueChange={([val]) => setRibbonConfig({ ...ribbonConfig, opacity: val })} min={0.1} max={1} step={0.05} showButtons /></ControlGroup>
        </div>
      )
    case 'dandelion-background': {
      const dandelionColors = dandelionConfig.radialGradientColors || [
        dandelionConfig.radialGradientCenter || dandelionConfig.backgroundColor || '#e8f4fc',
        dandelionConfig.radialGradientOuter || '#fef3c7'
      ]
      const dandelionStops = dandelionConfig.radialGradientStops || [0, 100]
      return (
        <RadialGradientSection
          colors={dandelionColors}
          colorStops={dandelionStops}
          endX={dandelionConfig.gradientEndX ?? 200}
          endY={dandelionConfig.gradientEndY ?? 200}
          onColorsChange={(newColors) => setDandelionConfig({ ...dandelionConfig, radialGradientColors: newColors })}
          onColorStopsChange={(newStops) => setDandelionConfig({ ...dandelionConfig, radialGradientStops: newStops })}
          onBothChange={(newColors, newStops) => setDandelionConfig({ ...dandelionConfig, radialGradientColors: newColors, radialGradientStops: newStops })}
          onEndXChange={(val) => setDandelionConfig({ ...dandelionConfig, gradientEndX: val })}
          onEndYChange={(val) => setDandelionConfig({ ...dandelionConfig, gradientEndY: val })}
          parsedPalette={parsedPalette}
        />
      )
    }
    case 'dandelion-lines':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Line Count`}><NumberInput value={[dandelionConfig.lineCount]} onValueChange={([val]) => setDandelionConfig({ ...dandelionConfig, lineCount: val })} min={20} max={3000} step={50} showButtons /></ControlGroup>
          <ControlGroup label={`Thickness`}><NumberInput value={[dandelionConfig.thickness]} onValueChange={([val]) => setDandelionConfig({ ...dandelionConfig, thickness: val })} min={0.5} max={5} step={0.5} showButtons /></ControlGroup>
          <ControlGroup label={`Dot Size`}><NumberInput value={[dandelionConfig.dotSize]} onValueChange={([val]) => setDandelionConfig({ ...dandelionConfig, dotSize: val })} min={1} max={8} step={0.5} showButtons /></ControlGroup>
        </div>
      )
    case 'dandelion-shape':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Min Radius`}><NumberInput value={[dandelionConfig.radiusMin]} onValueChange={([val]) => setDandelionConfig({ ...dandelionConfig, radiusMin: val })} min={0.05} max={0.5} step={0.05} showButtons /></ControlGroup>
          <ControlGroup label={`Max Radius`}><NumberInput value={[dandelionConfig.radiusMax]} onValueChange={([val]) => setDandelionConfig({ ...dandelionConfig, radiusMax: val })} min={0.2} max={0.8} step={0.05} showButtons /></ControlGroup>
          <ControlGroup label={`Spread`}><NumberInput value={[dandelionConfig.spread]} onValueChange={([val]) => setDandelionConfig({ ...dandelionConfig, spread: val })} min={0.1} max={1} step={0.1} showButtons /></ControlGroup>
          <ControlGroup label={`Center Y`}><NumberInput value={[dandelionConfig.centerY]} onValueChange={([val]) => setDandelionConfig({ ...dandelionConfig, centerY: val })} min={0.5} max={1.2} step={0.05} showButtons /></ControlGroup>
        </div>
      )
    case 'dandelion-animation':
      return (
        <ControlGroup label={`Sway Speed`}><NumberInput value={[dandelionConfig.speed]} onValueChange={([val]) => setDandelionConfig({ ...dandelionConfig, speed: val })} min={0} max={2} step={0.1} showButtons /></ControlGroup>
      )
    case 'particleRing-background': {
      const particleRingColors = particleRingConfig.radialGradientColors || [
        particleRingConfig.radialGradientCenter || particleRingConfig.backgroundColor || '#fef6f9',
        particleRingConfig.radialGradientOuter || '#fef3c7'
      ]
      const particleRingStops = particleRingConfig.radialGradientStops || [0, 100]
      return (
        <RadialGradientSection
          colors={particleRingColors}
          colorStops={particleRingStops}
          endX={particleRingConfig.gradientEndX ?? 100}
          endY={particleRingConfig.gradientEndY ?? 100}
          onColorsChange={(newColors) => setParticleRingConfig({ ...particleRingConfig, radialGradientColors: newColors })}
          onColorStopsChange={(newStops) => setParticleRingConfig({ ...particleRingConfig, radialGradientStops: newStops })}
          onBothChange={(newColors, newStops) => setParticleRingConfig({ ...particleRingConfig, radialGradientColors: newColors, radialGradientStops: newStops })}
          onEndXChange={(val) => setParticleRingConfig({ ...particleRingConfig, gradientEndX: val })}
          onEndYChange={(val) => setParticleRingConfig({ ...particleRingConfig, gradientEndY: val })}
          parsedPalette={parsedPalette}
        />
      )
    }
    case 'particleRing-ring':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Particle Count`}><NumberInput value={[particleRingConfig.particleCount]} onValueChange={([val]) => setParticleRingConfig({ ...particleRingConfig, particleCount: val })} min={100} max={2000} step={50} showButtons /></ControlGroup>
          <ControlGroup label={`Ring Radius`}><NumberInput value={[particleRingConfig.ringRadius]} onValueChange={([val]) => setParticleRingConfig({ ...particleRingConfig, ringRadius: val })} min={0.1} max={0.8} step={0.05} showButtons /></ControlGroup>
          <ControlGroup label={`Ring Width`}><NumberInput value={[particleRingConfig.ringWidth]} onValueChange={([val]) => setParticleRingConfig({ ...particleRingConfig, ringWidth: val })} min={0.05} max={0.4} step={0.05} showButtons /></ControlGroup>
        </div>
      )
    case 'particleRing-particles':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Particle Size`}><NumberInput value={[particleRingConfig.particleSize]} onValueChange={([val]) => setParticleRingConfig({ ...particleRingConfig, particleSize: val })} min={1} max={8} step={0.5} showButtons /></ControlGroup>
          <ControlGroup label={`Dispersion`}><NumberInput value={[particleRingConfig.dispersion]} onValueChange={([val]) => setParticleRingConfig({ ...particleRingConfig, dispersion: val })} min={0} max={0.5} step={0.05} showButtons /></ControlGroup>
        </div>
      )
    case 'particleRing-animation':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Pulse Speed`}><NumberInput value={[particleRingConfig.speed]} onValueChange={([val]) => setParticleRingConfig({ ...particleRingConfig, speed: val })} min={0} max={2} step={0.1} showButtons /></ControlGroup>
          <ControlGroup label={`Rotation Speed`}><NumberInput value={[particleRingConfig.rotationSpeed]} onValueChange={([val]) => setParticleRingConfig({ ...particleRingConfig, rotationSpeed: val })} min={0} max={1} step={0.05} showButtons /></ControlGroup>
        </div>
      )
    case 'particleRing-tilt':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Tilt X`}><NumberInput value={[particleRingConfig.tiltX ?? 0]} onValueChange={([val]) => setParticleRingConfig({ ...particleRingConfig, tiltX: val })} min={-90} max={90} step={5} showButtons /></ControlGroup>
          <ControlGroup label={`Tilt Z`}><NumberInput value={[particleRingConfig.tiltZ ?? 0]} onValueChange={([val]) => setParticleRingConfig({ ...particleRingConfig, tiltZ: val })} min={-90} max={90} step={5} showButtons /></ControlGroup>
        </div>
      )
    case 'pattern-icon':
      return (
        <div className="space-y-2">
          <ControlGroup label="Icon">
            <IconGridDropdown
              value={tessellationConfig.icon}
              onChange={(v) => setTessellationConfig({ ...tessellationConfig, icon: v })}
            />
          </ControlGroup>
          <ControlGroup label={`Size`}><NumberInput value={[tessellationConfig.size]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, size: val })} min={8} max={100} step={4} showButtons /></ControlGroup>
          <ControlGroup label="Color">
            <div className="flex items-center gap-2">
              <PaletteColorPicker value={tessellationConfig.color} onChange={(newColor) => setTessellationConfig({ ...tessellationConfig, color: newColor })} palette={parsedPalette} className="w-10 h-10" />
              <Input value={tessellationConfig.color} onChange={(e) => setTessellationConfig({ ...tessellationConfig, color: e.target.value })} className="h-9 font-mono text-xs flex-1" />
            </div>
          </ControlGroup>
          <ControlGroup label={`Opacity`}><NumberInput value={[tessellationConfig.opacity]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, opacity: val })} max={1} step={0.05} showButtons /></ControlGroup>
          <ControlGroup label={`Rotation`}><NumberInput value={[tessellationConfig.rotation]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, rotation: val })} max={360} step={15} showButtons /></ControlGroup>
        </div>
      )
    case 'pattern-spacing':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Row Gap`}><NumberInput value={[tessellationConfig.rowGap]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, rowGap: val })} min={20} max={200} step={10} showButtons /></ControlGroup>
          <ControlGroup label={`Col Gap`}><NumberInput value={[tessellationConfig.colGap]} onValueChange={([val]) => setTessellationConfig({ ...tessellationConfig, colGap: val })} min={20} max={200} step={10} showButtons /></ControlGroup>
        </div>
      )
    case 'effects-blur':
      return <ControlGroup label={`Blur`}><NumberInput value={[effectsConfig.blur]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, blur: val })} max={50} step={2} showButtons /></ControlGroup>
    case 'effects-texture':
      return (
        <div className="space-y-2">
          <ControlGroup label="Texture Type">
            <Select value={effectsConfig.texture} onValueChange={(v) => setEffectsConfig({ ...effectsConfig, texture: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="grain">Grain</SelectItem>
                <SelectItem value="scanlines">Scanlines</SelectItem>
                <SelectItem value="dots">Dots</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="diagonal">Diagonal Lines</SelectItem>
              </SelectContent>
            </Select>
          </ControlGroup>
          {effectsConfig.texture !== 'none' && (
            <>
              <ControlGroup label={`Size`}><NumberInput value={[effectsConfig.textureSize]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, textureSize: val })} min={4} max={100} step={2} showButtons /></ControlGroup>
              <ControlGroup label={`Opacity`}><NumberInput value={[effectsConfig.textureOpacity]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, textureOpacity: val })} max={1} step={0.05} showButtons /></ControlGroup>
              <ControlGroup label="Blend Mode">
                <Select value={effectsConfig.textureBlendMode} onValueChange={(v) => setEffectsConfig({ ...effectsConfig, textureBlendMode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="multiply">Multiply</SelectItem>
                    <SelectItem value="screen">Screen</SelectItem>
                    <SelectItem value="overlay">Overlay</SelectItem>
                    <SelectItem value="darken">Darken</SelectItem>
                    <SelectItem value="lighten">Lighten</SelectItem>
                    <SelectItem value="color-dodge">Color Dodge</SelectItem>
                    <SelectItem value="color-burn">Color Burn</SelectItem>
                    <SelectItem value="hard-light">Hard Light</SelectItem>
                    <SelectItem value="soft-light">Soft Light</SelectItem>
                    <SelectItem value="difference">Difference</SelectItem>
                    <SelectItem value="exclusion">Exclusion</SelectItem>
                  </SelectContent>
                </Select>
              </ControlGroup>
            </>
          )}
        </div>
      )
    case 'effects-colormap':
      return (
        <ControlGroup label="Color Map:">
          <Select value={effectsConfig.colorMap} onValueChange={(v) => setEffectsConfig({ ...effectsConfig, colorMap: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="sepia">Sepia</SelectItem>
              <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
              <SelectItem value="sunset">Sunset</SelectItem>
              <SelectItem value="matrix">Matrix</SelectItem>
              <SelectItem value="noir">Noir</SelectItem>
              <SelectItem value="vintage">Vintage</SelectItem>
            </SelectContent>
          </Select>
        </ControlGroup>
      )
    case 'effects-vignette':
      return <ControlGroup label={`Intensity`}><NumberInput value={[effectsConfig.vignetteIntensity]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, vignetteIntensity: val })} max={1} step={0.05} showButtons /></ControlGroup>
    case 'effects-color':
      return (
        <div className="space-y-2">
          <ControlGroup label={`Saturation`}><NumberInput value={[effectsConfig.saturation]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, saturation: val })} max={200} step={10} showButtons /></ControlGroup>
          <ControlGroup label={`Contrast`}><NumberInput value={[effectsConfig.contrast]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, contrast: val })} min={50} max={150} step={5} showButtons /></ControlGroup>
          <ControlGroup label={`Brightness`}><NumberInput value={[effectsConfig.brightness]} onValueChange={([val]) => setEffectsConfig({ ...effectsConfig, brightness: val })} min={50} max={150} step={5} showButtons /></ControlGroup>
        </div>
      )
    case 'effects-fluted':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Enable Fluted Glass</Label>
            <Switch
              checked={effectsConfig.flutedGlass?.enabled ?? false}
              onCheckedChange={(checked) => setEffectsConfig({
                ...effectsConfig,
                flutedGlass: { ...effectsConfig.flutedGlass, enabled: checked }
              })}
            />
          </div>
          {effectsConfig.flutedGlass?.enabled && (
            <>
              <ControlGroup label={`Ridges / Segments`}>
                <NumberInput
                  value={[effectsConfig.flutedGlass?.segments ?? 80]}
                  onValueChange={([val]) => setEffectsConfig({
                    ...effectsConfig,
                    flutedGlass: { ...effectsConfig.flutedGlass, segments: val }
                  })}
                  min={5} max={300} step={5} showButtons
                />
              </ControlGroup>
              <ControlGroup label={`Distortion`}>
                <NumberInput
                  value={[effectsConfig.flutedGlass?.distortionStrength ?? 0.02]}
                  onValueChange={([val]) => setEffectsConfig({
                    ...effectsConfig,
                    flutedGlass: { ...effectsConfig.flutedGlass, distortionStrength: val }
                  })}
                  min={0} max={0.1} step={0.01} showButtons
                />
              </ControlGroup>
              <ControlGroup label={`Wave Frequency`}>
                <NumberInput
                  value={[effectsConfig.flutedGlass?.waveFrequency ?? 1]}
                  onValueChange={([val]) => setEffectsConfig({
                    ...effectsConfig,
                    flutedGlass: { ...effectsConfig.flutedGlass, waveFrequency: val }
                  })}
                  min={0.5} max={5} step={0.5} showButtons
                />
              </ControlGroup>
              <ControlGroup label={`Rotation (°)`}>
                <NumberInput
                  value={[effectsConfig.flutedGlass?.rotation ?? 0]}
                  onValueChange={([val]) => setEffectsConfig({
                    ...effectsConfig,
                    flutedGlass: { ...effectsConfig.flutedGlass, rotation: val }
                  })}
                  min={0} max={180} step={5} showButtons
                />
              </ControlGroup>
              <ControlGroup label={`Motion Value`}>
                <NumberInput
                  value={[effectsConfig.flutedGlass?.motionValue ?? 0.5]}
                  onValueChange={([val]) => setEffectsConfig({
                    ...effectsConfig,
                    flutedGlass: { ...effectsConfig.flutedGlass, motionValue: val }
                  })}
                  min={0} max={2} step={0.1} showButtons
                />
              </ControlGroup>
              <ControlGroup label={`Motion Speed`}>
                <NumberInput
                  value={[effectsConfig.flutedGlass?.motionSpeed ?? 0.5]}
                  onValueChange={([val]) => setEffectsConfig({
                    ...effectsConfig,
                    flutedGlass: { ...effectsConfig.flutedGlass, motionSpeed: val }
                  })}
                  min={0} max={3} step={0.1} showButtons
                />
              </ControlGroup>
              <ControlGroup label={`3D Overlay`}>
                <NumberInput
                  value={[effectsConfig.flutedGlass?.overlayOpacity ?? 0]}
                  onValueChange={([val]) => setEffectsConfig({
                    ...effectsConfig,
                    flutedGlass: { ...effectsConfig.flutedGlass, overlayOpacity: val }
                  })}
                  min={0} max={100} step={5} showButtons
                />
              </ControlGroup>
            </>
          )}
        </div>
      )
    case 'text-settings':
      return (
        <div className="space-y-2">
          <ControlGroup label="Text Color">
            <ContrastAwarePaletteColorPicker value={textConfig.color} onChange={(newColor) => setTextConfig({ ...textConfig, color: newColor })} palette={parsedPalette} gradientColors={gradientConfig.colors} className="w-16 h-8" />
          </ControlGroup>
          <ControlGroup label="Text Opacity"><NumberInput value={[textConfig.opacity]} onValueChange={([val]) => setTextConfig({ ...textConfig, opacity: val })} min={0} max={1} step={0.05} showButtons={true} /></ControlGroup>
          <ControlGroup label="Section Gap"><NumberInput value={[textGap]} onValueChange={([val]) => setTextGap(val)} min={0} max={100} step={4} showButtons={true} /></ControlGroup>
        </div>
      )
    default:
      // Handle dynamic text section dialogs
      if (activeDialog && activeDialog.startsWith('text-section-')) {
        const sectionId = parseInt(activeDialog.replace('text-section-', ''))
        const section = textSections.find(s => s.id === sectionId)
        if (section) {
          return (
            <div className="space-y-2">
              <Input value={section.text} onChange={(e) => updateTextSection(section.id, 'text', e.target.value)} className="h-11 text-base" placeholder="Enter text..." />
              <ControlGroup label="Size (in px)"><NumberInput value={[section.size]} onValueChange={([val]) => updateTextSection(section.id, 'size', val)} min={12} max={200} step={4} showButtons={true} /></ControlGroup>
              <ControlGroup label="Font">
                <Select value={section.font || 'sans-serif'} onValueChange={(value) => updateTextSection(section.id, 'font', value)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sans-serif">Manrope</SelectItem>
                    <SelectItem value="serif">Playfair Display</SelectItem>
                    <SelectItem value="mono">Space Grotesk</SelectItem>
                    <SelectItem value="scribble">Pacifico</SelectItem>
                  </SelectContent>
                </Select>
              </ControlGroup>
              {(section.font === 'serif' || section.font === 'scribble') && (
                <ControlGroup label="Italic">
                  <Switch
                    checked={section.italic || false}
                    onCheckedChange={(checked) => updateTextSection(section.id, 'italic', checked)}
                  />
                </ControlGroup>
              )}
              <ControlGroup label="Weight">
                <Select value={String(section.weight)} onValueChange={(value) => updateTextSection(section.id, 'weight', parseInt(value))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">Thin</SelectItem>
                    <SelectItem value="200">Extra Light</SelectItem>
                    <SelectItem value="300">Light</SelectItem>
                    <SelectItem value="400">Regular</SelectItem>
                    <SelectItem value="500">Medium</SelectItem>
                    <SelectItem value="600">Semi Bold</SelectItem>
                    <SelectItem value="700">Bold</SelectItem>
                    <SelectItem value="800">Extra Bold</SelectItem>
                    <SelectItem value="900">Black</SelectItem>
                  </SelectContent>
                </Select>
              </ControlGroup>
              <ControlGroup label="Spacing (in em)"><NumberInput value={[section.spacing]} onValueChange={([val]) => updateTextSection(section.id, 'spacing', val)} min={-0.1} max={0.5} step={0.01} showButtons={true} /></ControlGroup>
              <Button variant="destructive" className="w-full mt-4" onClick={() => { removeTextSection(section.id); if (onCloseDialog) onCloseDialog() }} disabled={textSections.length <= 1}>
                <Trash size={16} className="mr-2" />Delete Section
              </Button>
            </div>
          )
        }
      }
      return null
  }
}
