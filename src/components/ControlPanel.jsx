import { useState, useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { useThemedConfig } from '../hooks/useThemedConfig'
import { useRandomize } from '../hooks/useRandomize'
import { usePanelDrag } from '../hooks/usePanelDrag'
import { useSceneSave } from '../hooks/useSceneSave'
import { useCanvasCapture } from '../hooks/useCanvasCapture'
import { MobilePanel } from './controls/MobilePanel'
import { DesktopPanel } from './controls/DesktopPanel'
import { CaptureModal } from './controls/CaptureModal'
import { SaveSceneDialog } from './controls/SaveSceneDialog'
import { ColorPaletteDialog } from './controls'
import { AboutAuraModal } from './about/AboutAuraModal'

const ControlPanel = ({ layersContainerRef, audioAnalyser }) => {
  // Minimal store subscriptions — only what the orchestrator needs
  const colorPalette = useStore((state) => state.colorPalette)
  const setColorPalette = useStore((state) => state.setColorPalette)
  const isPaused = useStore((state) => state.isPaused)
  const setIsPaused = useStore((state) => state.setIsPaused)
  const inputEnabled = useStore((state) => state.inputEnabled)
  const setInputEnabled = useStore((state) => state.setInputEnabled)
  const currentSceneId = useStore((state) => state.currentSceneId)
  const currentSceneName = useStore((state) => state.currentSceneName)
  const exitSceneEdit = useStore((state) => state.exitSceneEdit)
  const [gradientConfig, setGradientConfig] = useThemedConfig('gradientConfig')

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
  const [showAboutModal, setShowAboutModal] = useState(false)

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

  // Pause scene and disable input when any modal is open, restore previous state when all close
  const prevStateRef = useRef({ isPaused: false, inputEnabled: true })
  const anyModalOpen = showPaletteDialog || showAboutModal || showSaveDialog || showCaptureModal
  useEffect(() => {
    if (anyModalOpen) {
      prevStateRef.current = { isPaused, inputEnabled }
      setIsPaused(true)
      setInputEnabled(false)
    } else {
      setIsPaused(prevStateRef.current.isPaused)
      setInputEnabled(prevStateRef.current.inputEnabled)
    }
  }, [anyModalOpen])

  return (
    <>
      {isMobile ? (
        <MobilePanel
          onRandomize={randomize}
          onShowPalette={() => setShowPaletteDialog(true)}
          onShowSave={() => setShowSaveDialog(true)}
          onShowCapture={() => setShowCaptureModal(true)}
          onShowAbout={() => setShowAboutModal(true)}
          audioAnalyser={audioAnalyser}
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
          onShowAbout={() => setShowAboutModal(true)}
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
        isEditing={!!currentSceneId}
        sceneName={currentSceneName}
        onSave={handleSaveScene}
        onSaveAsNew={() => {
          exitSceneEdit()
          handleSaveScene({ forceNew: true })
        }}
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
      <AboutAuraModal
        open={showAboutModal}
        onOpenChange={setShowAboutModal}
      />
    </>
  )
}

export default ControlPanel
