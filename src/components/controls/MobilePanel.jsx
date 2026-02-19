import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Palette, GridFour, Sparkle, TextT, Waveform,
  Shuffle, Plus, Camera, Check, ArrowCounterClockwise,
  CaretCircleUp, CaretCircleDown,
  Pause, Play, FloppyDisk, Images, PaintBrushBroad,
} from '@phosphor-icons/react'
import { parsePaletteJson } from '@/lib/colorConversion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import useStore from '../../store/useStore'
import { useMobileDialogs } from '../../hooks/useMobileDialogs'
import {
  SubsectionButton,
  ColorsSection,
  DEFAULT_EFFECTS_CONFIG,
} from './index'
import { AudioPanel } from './AudioControls'
import { MobileDialogContent, getDialogTitle } from './MobileDialogContent'

const tabs = [
  { id: 'gradient', label: 'Background', icon: PaintBrushBroad },
  { id: 'tessellation', label: 'Pattern', icon: GridFour },
  { id: 'effects', label: 'Effects', icon: Sparkle },
  { id: 'text', label: 'Text', icon: TextT },
  { id: 'audio', label: 'Input', icon: Waveform },
]

export const MobilePanel = ({ onRandomize, onShowPalette, onShowSave, onShowCapture, audioAnalyser }) => {
  const navigate = useNavigate()
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(true)

  const activePanel = useStore((state) => state.activePanel)
  const setActivePanel = useStore((state) => state.setActivePanel)
  const backgroundType = useStore((state) => state.backgroundType)
  const setBackgroundType = useStore((state) => state.setBackgroundType)
  const gradientConfig = useStore((state) => state.gradientConfig)
  const setGradientConfig = useStore((state) => state.setGradientConfig)
  const tessellationConfig = useStore((state) => state.tessellationConfig)
  const setTessellationConfig = useStore((state) => state.setTessellationConfig)
  const effectsConfig = useStore((state) => state.effectsConfig)
  const setEffectsConfig = useStore((state) => state.setEffectsConfig)
  const textSections = useStore((state) => state.textSections)
  const setTextSections = useStore((state) => state.setTextSections)
  const textConfig = useStore((state) => state.textConfig)
  const setTextConfig = useStore((state) => state.setTextConfig)
  const colorPalette = useStore((state) => state.colorPalette)
  const isPaused = useStore((state) => state.isPaused)
  const setIsPaused = useStore((state) => state.setIsPaused)

  const parsedPalette = colorPalette ? parsePaletteJson(colorPalette) : null

  const { activeDialog, openDialog, applyDialog, backDialog, resetDialog } = useMobileDialogs()

  const addTextSection = () => {
    const newId = Math.max(...textSections.map(s => s.id), 0) + 1
    setTextSections([
      ...textSections,
      { id: newId, text: 'New Text', size: 60, weight: 400, spacing: 0.1, font: 'sans-serif' }
    ])
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="fixed left-0 right-0 top-0 z-50 bg-card/5 backdrop-blur-4xl">
        <div className="flex items-center justify-between gap-2 p-2 safe-area-top">
          <img src="/apple-touch-icon.png" alt="Logo" className="w-10 h-10 rounded-[12px]" />
          <Button variant="outline" size="sm" className="bg-background/30 backdrop-blur-md flex items-center gap-2 h-10 px-3 border-primary/50" onClick={() => navigate('/scenes')} title="Saved Scenes">
            <Images size={18} />
          </Button>
          <Button variant="outline" size="sm" className="bg-background/30 backdrop-blur-md flex items-center gap-2 h-10 px-3 border-primary/50" onClick={onShowPalette} title={colorPalette ? "Edit Palette" : "Upload Palette"}>
            <Palette size={18} weight={colorPalette ? 'fill' : 'regular'} />
          </Button>
          <Button variant="outline" size="sm" className="bg-background/30 backdrop-blur-md flex items-center gap-2 h-10 px-3 border-primary/50" onClick={() => setIsPaused(!isPaused)} title={isPaused ? "Resume Animations" : "Pause Animations"}>
            {isPaused ? <Play size={18} weight="fill" /> : <Pause size={18} />}
          </Button>
          <Button variant="outline" size="sm" className="bg-background/30 backdrop-blur-md flex items-center gap-2 h-10 px-3 border-primary/50" onClick={onRandomize} title="Shuffle Gradient">
            <Shuffle size={18} />
          </Button>
          <Button variant="outline" size="sm" className="bg-background/30 backdrop-blur-md flex items-center gap-2 h-10 px-3 border-primary/50" onClick={onShowSave} title="Save Scene">
            <FloppyDisk size={18} />
          </Button>
          <Button variant="outline" size="sm" className="bg-background/30 backdrop-blur-md flex items-center gap-2 h-10 px-3 border-primary/50" onClick={onShowCapture}>
            <Camera size={18} />
          </Button>
        </div>
      </div>

      {/* Mobile Bottom Panel */}
      <div className={cn("fixed left-0 right-0 bottom-0 z-50 bg-card/50 backdrop-blur-xl border-t border-border", "transition-transform duration-300 ease-out")}>
        <div className="flex items-center gap-1 p-1 border-b border-border/50 safe-area-bottom">
          {tabs.map(tab => (
            <Button
              key={tab.id}
              variant={activePanel === tab.id && !isMobileCollapsed ? "secondary" : "ghost"}
              size="sm"
              className="flex-1 flex flex-col gap-1 h-auto p-2"
              onClick={() => {
                if (activePanel === tab.id && !isMobileCollapsed) {
                  setIsMobileCollapsed(true)
                } else {
                  setActivePanel(tab.id)
                  setIsMobileCollapsed(false)
                }
              }}
            >
              <tab.icon size={18} weight={activePanel === tab.id && !isMobileCollapsed ? 'fill' : 'regular'} />
              <span className="text-[10px] uppercase tracking-wide">{tab.label}</span>
            </Button>
          ))}
          <Button variant="ghost" size="sm" className="flex flex-col gap-1 h-auto p-2 shrink-0 text-muted-foreground" onClick={() => setIsMobileCollapsed(!isMobileCollapsed)}>
            {isMobileCollapsed ? <CaretCircleUp size={18} weight="bold" /> : <CaretCircleDown size={18} weight="bold" />}
          </Button>
        </div>

        {!isMobileCollapsed && (
          <ScrollArea className="max-h-[50vh] p-1 gap-2">
            {activePanel === 'gradient' && (
              <div className="px-3 py-2 ">
                <ColorsSection
                  className="border-b border-border/50"
                  gradientConfig={gradientConfig}
                  setGradientConfig={setGradientConfig}
                  parsedPalette={parsedPalette}
                />
                {/* Background Type Selector */}
                <div className="flex items-center justify-between px-0 py-2">
                  <Label className="text-sm">Background Type</Label>
                  <Select value={backgroundType} onValueChange={(value) => setBackgroundType(value)}>
                    <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="liquid">Fog</SelectItem>
                      <SelectItem value="aurora">Aurora</SelectItem>
                      <SelectItem value="fluid">Mesh</SelectItem>
                      <SelectItem value="waves">Waves</SelectItem>
                      <SelectItem value="ribbon">Ribbon</SelectItem>
                      <SelectItem value="dandelion">Dandelion</SelectItem>
                      <SelectItem value="particleRing">Particle Ring</SelectItem>
                      <SelectItem value="shapeTrail">Shape Trail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type-specific settings */}
                <div className="space-y-1 flex flex-row flex-wrap gap-1 px-1">
                  {backgroundType === 'simple' && (
                    <>
                      <SubsectionButton title="Type" onClick={() => openDialog('simple-type')} />
                      <SubsectionButton title="Position" onClick={() => openDialog('simple-position')} />
                    </>
                  )}
                  {backgroundType === 'liquid' && (
                    <>
                      <SubsectionButton title="Type" onClick={() => openDialog('gradient-type')} />
                      <SubsectionButton title="Stops" onClick={() => openDialog('gradient-stops')} />
                      <SubsectionButton title="Wave" onClick={() => openDialog('gradient-wave')} />
                      <SubsectionButton title="Decay" onClick={() => openDialog('gradient-mouse')} />
                    </>
                  )}
                  {backgroundType === 'aurora' && (
                    <>
                      <SubsectionButton title="Background" onClick={() => openDialog('aurora-background')} />
                      <SubsectionButton title="Lines" onClick={() => openDialog('aurora-lines')} />
                      <SubsectionButton title="Animation" onClick={() => openDialog('aurora-animation')} />
                    </>
                  )}
                  {backgroundType === 'fluid' && (
                    <>
                      <SubsectionButton title="Background" onClick={() => openDialog('fluid-background')} />
                      <SubsectionButton title="Animation" onClick={() => openDialog('fluid-animation')} />
                      <SubsectionButton title="Settings" onClick={() => openDialog('fluid-settings')} />
                    </>
                  )}
                  {backgroundType === 'waves' && (
                    <>
                      <SubsectionButton title="Shape" onClick={() => openDialog('waves-shape')} />
                      <SubsectionButton title="Position" onClick={() => openDialog('waves-position')} />
                      <SubsectionButton title="Animation" onClick={() => openDialog('waves-animation')} />
                    </>
                  )}
                  {backgroundType === 'ribbon' && (
                    <>
                      <SubsectionButton title="Background" onClick={() => openDialog('ribbon-background')} />
                      <SubsectionButton title="Shape" onClick={() => openDialog('ribbon-shape')} />
                      <SubsectionButton title="Motion" onClick={() => openDialog('ribbon-motion')} />
                      <SubsectionButton title="Animation" onClick={() => openDialog('ribbon-animation')} />
                    </>
                  )}
                  {backgroundType === 'dandelion' && (
                    <>
                      <SubsectionButton title="Background" onClick={() => openDialog('dandelion-background')} />
                      <SubsectionButton title="Lines" onClick={() => openDialog('dandelion-lines')} />
                      <SubsectionButton title="Shape" onClick={() => openDialog('dandelion-shape')} />
                      <SubsectionButton title="Animation" onClick={() => openDialog('dandelion-animation')} />
                    </>
                  )}
                  {backgroundType === 'particleRing' && (
                    <>
                      <SubsectionButton title="Background" onClick={() => openDialog('particleRing-background')} />
                      <SubsectionButton title="Ring" onClick={() => openDialog('particleRing-ring')} />
                      <SubsectionButton title="Particles" onClick={() => openDialog('particleRing-particles')} />
                      <SubsectionButton title="Animation" onClick={() => openDialog('particleRing-animation')} />
                      <SubsectionButton title="Tilt" onClick={() => openDialog('particleRing-tilt')} />
                    </>
                  )}
                  {backgroundType === 'shapeTrail' && (
                    <>
                      <SubsectionButton title="Background" onClick={() => openDialog('shapeTrail-background')} />
                      <SubsectionButton title="Shape" onClick={() => openDialog('shapeTrail-shape')} />
                      <SubsectionButton title="Path" onClick={() => openDialog('shapeTrail-path')} />
                      <SubsectionButton title="Animation" onClick={() => openDialog('shapeTrail-animation')} />
                    </>
                  )}
                </div>
              </div>
            )}
            {activePanel === 'tessellation' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2">
                  <Label>Enable Pattern</Label>
                  <Switch checked={tessellationConfig.enabled} onCheckedChange={(c) => setTessellationConfig({ ...tessellationConfig, enabled: c })} />
                </div>
                <div className="space-y-1 flex flex-row gap-1">
                  <SubsectionButton title="Icon" onClick={() => openDialog('pattern-icon')} />
                  <SubsectionButton title="Spacing" onClick={() => openDialog('pattern-spacing')} />
                </div>
              </div>
            )}
            {activePanel === 'effects' && (
              <div className="space-y-2">
                <div className="space-y-1 flex flex-row flex-wrap gap-1 px-1">
                  <SubsectionButton title="Blur" onClick={() => openDialog('effects-blur')} />
                  <SubsectionButton title="Texture" onClick={() => openDialog('effects-texture')} />
                  <SubsectionButton title="Color Map" onClick={() => openDialog('effects-colormap')} />
                  <SubsectionButton title="Vignette" onClick={() => openDialog('effects-vignette')} />
                  <SubsectionButton title="Color" onClick={() => openDialog('effects-color')} />
                  <SubsectionButton title="Fluted Glass" onClick={() => openDialog('effects-fluted')} />
                  <div className="flex flex-1 justify-end px-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEffectsConfig(DEFAULT_EFFECTS_CONFIG)}
                      className="h-full px-3 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <ArrowCounterClockwise size={14} className="mr-1" />
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {activePanel === 'text' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2">
                  <Label>Enable Text</Label>
                  <Switch checked={textConfig.enabled} onCheckedChange={(checked) => setTextConfig({ ...textConfig, enabled: checked })} />
                </div>
                <div className="space-y-1 flex flex-row flex-wrap gap-1 px-1">
                  <SubsectionButton title="Settings" onClick={() => openDialog('text-settings')} />
                  {textSections.map((section, index) => (
                    <SubsectionButton key={section.id} title={`${index + 1}: ${section.text?.slice(0, 8) || 'Empty'}${section.text?.length > 8 ? '...' : ''}`} onClick={() => openDialog(`text-section-${section.id}`)} />
                  ))}
                  <Button variant="outline" className="w-fit h-11 px-3" onClick={addTextSection}>
                    <Plus size={14} className="mr-1" /><span className="text-sm">Add</span>
                  </Button>
                </div>
              </div>
            )}
            {activePanel === 'audio' && (
              <div className="px-3 py-2">
                <AudioPanel
                  loadAudioFile={audioAnalyser?.loadAudioFile}
                  playAudio={audioAnalyser?.playAudio}
                  pauseAudio={audioAnalyser?.pauseAudio}
                  audioElement={audioAnalyser?.audioElement}
                />
              </div>
            )}
          </ScrollArea>
        )}
      </div>

      {/* Mobile Dialog */}
      <Dialog open={!!activeDialog} onOpenChange={(open) => !open && backDialog()}>
        <DialogContent className="max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{getDialogTitle(activeDialog, textSections)}</DialogTitle>
            <DialogDescription className="sr-only">
              Adjust the settings for this section.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] py-4">
            <MobileDialogContent activeDialog={activeDialog} onCloseDialog={() => backDialog()} />
          </ScrollArea>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={resetDialog}><ArrowCounterClockwise size={16} className="mr-2" />Reset</Button>
            <Button className="flex-1" onClick={applyDialog}><Check size={16} className="mr-2" />Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
