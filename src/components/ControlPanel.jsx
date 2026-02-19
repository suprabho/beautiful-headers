import { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import { useRandomize } from '../hooks/useRandomize'
import { usePanelDrag } from '../hooks/usePanelDrag'
import { useSceneSave } from '../hooks/useSceneSave'
import { useCanvasCapture } from '../hooks/useCanvasCapture'
import { MobilePanel } from './controls/MobilePanel'
import { DesktopPanel } from './controls/DesktopPanel'
import { CaptureModal } from './controls/CaptureModal'
import { SaveSceneDialog } from './controls/SaveSceneDialog'
import { ColorPaletteDialog } from './controls'

const ControlPanel = ({ layersContainerRef, audioAnalyser }) => {
  // Minimal store subscriptions — only what the orchestrator needs
  const colorPalette = useStore((state) => state.colorPalette)
  const setColorPalette = useStore((state) => state.setColorPalette)
  const gradientConfig = useStore((state) => state.gradientConfig)
  const setGradientConfig = useStore((state) => state.setGradientConfig)

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Palette dialog state (shared between mobile and desktop)
  const [showPaletteDialog, setShowPaletteDialog] = useState(false)

  // Compose hooks
  const { randomize } = useRandomize()
  const { panelRef, position, isDragging, handleMouseDown } = usePanelDrag(isMobile)
  const {
    showSaveDialog, setShowSaveDialog,
    isSaving, saveError, saveSuccess,
    isGenerating, saveThumbnail, generatedContent,
    cmsAvailable, handleSaveScene, resetSaveState,
  } = useSceneSave(layersContainerRef)
  const {
    isCapturing, showCaptureModal, setShowCaptureModal, captureSnapshot,
  } = useCanvasCapture(layersContainerRef)

  return (
    <>
      {isMobile ? (
        <MobilePanel
          onRandomize={randomize}
          onShowPalette={() => setShowPaletteDialog(true)}
          onShowSave={() => setShowSaveDialog(true)}
          onShowCapture={() => setShowCaptureModal(true)}
        />
      ) : (
        <DesktopPanel
          panelRef={panelRef}
          position={position}
          isDragging={isDragging}
          handleMouseDown={handleMouseDown}
          isCapturing={isCapturing}
          onRandomize={randomize}
          onShowPalette={() => setShowPaletteDialog(true)}
          onShowSave={() => setShowSaveDialog(true)}
          onShowCapture={() => setShowCaptureModal(true)}
          audioAnalyser={audioAnalyser}
        />
      )}

      <CaptureModal
        open={showCaptureModal}
        onOpenChange={setShowCaptureModal}
        isCapturing={isCapturing}
        onCapture={captureSnapshot}
      />
      <SaveSceneDialog
        open={showSaveDialog}
        onOpenChange={(open) => {
          setShowSaveDialog(open)
          if (!open) resetSaveState()
        }}
        isSaving={isSaving}
        saveError={saveError}
        saveSuccess={saveSuccess}
        isGenerating={isGenerating}
        saveThumbnail={saveThumbnail}
        generatedContent={generatedContent}
        cmsAvailable={cmsAvailable}
        gradientColors={gradientConfig.colors}
        onSave={handleSaveScene}
      />
      <ColorPaletteDialog
        open={showPaletteDialog}
        onOpenChange={setShowPaletteDialog}
        colorPalette={colorPalette}
        setColorPalette={setColorPalette}
        gradientConfig={gradientConfig}
        setGradientConfig={setGradientConfig}
        cmsAvailable={cmsAvailable}
      />
    </>
  )
}

export default ControlPanel
