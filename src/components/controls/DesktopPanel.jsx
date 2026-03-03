import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Palette, GridFour, Sparkle, TextT, Waveform,
  Shuffle, DotsSixVertical, Camera,
  Pause, Play, FloppyDisk, Images, PaintBrushBroad, ArrowsInSimple, ArrowsOutSimple,
  Moon, Sun,
} from '@phosphor-icons/react'
import { InputPanel } from './InputControls'
import { cn } from '@/lib/utils'
import { parsePaletteJson } from '@/lib/colorConversion'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import useStore from '../../store/useStore'
import { useThemedConfig } from '../../hooks/useThemedConfig'
import {
  GradientPanel,
  PatternPanel,
  EffectsPanel,
  TextPanel,
} from './index'

const tabs = [
  { id: 'gradient', label: 'Background', icon: PaintBrushBroad },
  { id: 'tessellation', label: 'Pattern', icon: GridFour },
  { id: 'effects', label: 'Effects', icon: Sparkle },
  { id: 'text', label: 'Text', icon: TextT },
  { id: 'audio', label: 'Input', icon: Waveform },
]

export const DesktopPanel = ({
  panelRef, position, isDragging, handleMouseDown,
  isCapturing, onRandomize, onShowPalette, onShowSave, onShowCapture,
  audioAnalyser,
}) => {
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const activePanel = useStore((state) => state.activePanel)
  const setActivePanel = useStore((state) => state.setActivePanel)
  const backgroundType = useStore((state) => state.backgroundType)
  const setBackgroundType = useStore((state) => state.setBackgroundType)
  const [gradientConfig, setGradientConfig] = useThemedConfig('gradientConfig')
  const auroraConfig = useStore((state) => state.auroraConfig)
  const setAuroraConfig = useStore((state) => state.setAuroraConfig)
  const blobConfig = useStore((state) => state.blobConfig)
  const setBlobConfig = useStore((state) => state.setBlobConfig)
  const fluidConfig = useStore((state) => state.fluidConfig)
  const setFluidConfig = useStore((state) => state.setFluidConfig)
  const wavesConfig = useStore((state) => state.wavesConfig)
  const setWavesConfig = useStore((state) => state.setWavesConfig)
  const [ribbonConfig, setRibbonConfig] = useThemedConfig('ribbonConfig')
  const editorThemeMode = useStore((state) => state.editorThemeMode)
  const setEditorThemeMode = useStore((state) => state.setEditorThemeMode)
  const dandelionConfig = useStore((state) => state.dandelionConfig)
  const setDandelionConfig = useStore((state) => state.setDandelionConfig)
  const particleRingConfig = useStore((state) => state.particleRingConfig)
  const setParticleRingConfig = useStore((state) => state.setParticleRingConfig)
  const shapeTrailConfig = useStore((state) => state.shapeTrailConfig)
  const setShapeTrailConfig = useStore((state) => state.setShapeTrailConfig)
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
  const isPaused = useStore((state) => state.isPaused)
  const setIsPaused = useStore((state) => state.setIsPaused)

  const parsedPalette = colorPalette ? parsePaletteJson(colorPalette) : null

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed z-50 bg-card/95 backdrop-blur-xl border border-border rounded-2xl w-[340px] max-h-[85vh]",
        "shadow-2xl shadow-black/50 transition-shadow duration-200",
        "text-foreground",
        isDragging && "shadow-3xl shadow-black/60",
        isCollapsed && "w-auto max-h-none overflow-hidden",
        !isCollapsed && "flex flex-col overflow-hidden"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-2 border-b border-border select-none"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <ArrowsOutSimple size={12} /> : <ArrowsInSimple size={12} />}
            <img src="/apple-touch-icon.png" alt="Logo" className="h-4 w-4 rounded-[4px]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/scenes')} title="Saved Scenes">
            <Images size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onShowPalette} title={colorPalette ? "Edit Palette" : "Upload Palette"}>
            <Palette size={16} weight={colorPalette ? 'fill' : 'regular'} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRandomize} disabled={isCapturing} title="Shuffle Gradient">
            <Shuffle size={16} weight="regular" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsPaused(!isPaused)} title={isPaused ? "Resume Animations" : "Pause Animations"}>
            {isPaused ? <Play size={16} weight="fill" /> : <Pause size={16} />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onShowSave} title="Save Scene">
            <FloppyDisk size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onShowCapture} disabled={isCapturing}>
            <Camera size={16} weight={isCapturing ? 'fill' : 'regular'} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setEditorThemeMode(editorThemeMode === 'dark' ? 'light' : 'dark')}
            title={editorThemeMode === 'dark' ? 'Preview Light Mode' : 'Preview Dark Mode'}
          >
            {editorThemeMode === 'dark' ? <Moon size={16} /> : <Sun size={16} weight="fill" />}
          </Button>
        </div>
        <div className="text-muted-foreground"><DotsSixVertical size={16} weight="bold" /></div>
      </div>

      {!isCollapsed && (
        <Tabs value={activePanel} onValueChange={setActivePanel} className="flex h-full flex-col flex-1 max-h-[calc(85vh-4rem)]">
          <TabsList className="w-full rounded-none border-b border-border bg-transparent p-1 gap-1 shrink-0">
            {tabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex-1 flex flex-col gap-1 py-2 data-[state=active]:bg-muted rounded-md">
                <tab.icon size={14} weight={activePanel === tab.id ? 'fill' : 'regular'} />
                <span className="text-[10px] uppercase tracking-wide">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="min-h-0 flex flex-col h-full">
            <ScrollArea className="flex-1 min-h-0 p-5">
              <TabsContent value="gradient" className="m-0">
                <GradientPanel
                  backgroundType={backgroundType}
                  setBackgroundType={setBackgroundType}
                  gradientConfig={gradientConfig}
                  setGradientConfig={setGradientConfig}
                  auroraConfig={auroraConfig}
                  setAuroraConfig={setAuroraConfig}
                  blobConfig={blobConfig}
                  setBlobConfig={setBlobConfig}
                  fluidConfig={fluidConfig}
                  setFluidConfig={setFluidConfig}
                  wavesConfig={wavesConfig}
                  setWavesConfig={setWavesConfig}
                  ribbonConfig={ribbonConfig}
                  setRibbonConfig={setRibbonConfig}
                  dandelionConfig={dandelionConfig}
                  setDandelionConfig={setDandelionConfig}
                  particleRingConfig={particleRingConfig}
                  setParticleRingConfig={setParticleRingConfig}
                  shapeTrailConfig={shapeTrailConfig}
                  setShapeTrailConfig={setShapeTrailConfig}
                  parsedPalette={parsedPalette}
                />
              </TabsContent>
              <TabsContent value="tessellation" className="m-0">
                <PatternPanel
                  tessellationConfig={tessellationConfig}
                  setTessellationConfig={setTessellationConfig}
                  parsedPalette={parsedPalette}
                />
              </TabsContent>
              <TabsContent value="effects" className="m-0">
                <EffectsPanel
                  effectsConfig={effectsConfig}
                  setEffectsConfig={setEffectsConfig}
                />
              </TabsContent>
              <TabsContent value="text" className="m-0">
                <TextPanel
                  textSections={textSections}
                  setTextSections={setTextSections}
                  textGap={textGap}
                  setTextGap={setTextGap}
                  textConfig={textConfig}
                  setTextConfig={setTextConfig}
                  parsedPalette={parsedPalette}
                  gradientColors={gradientConfig.colors}
                />
              </TabsContent>
              <TabsContent value="audio" className="m-0">
                <InputPanel
                  loadAudioFile={audioAnalyser?.loadAudioFile}
                  playAudio={audioAnalyser?.playAudio}
                  pauseAudio={audioAnalyser?.pauseAudio}
                  audioElement={audioAnalyser?.audioElement}
                />
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      )}
    </div>
  )
}
