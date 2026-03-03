import { useState, useEffect } from 'react'
import { prepareForCapture } from '@/lib/colorConversion'
import { captureLayersToCanvas, resizeThumbnailForAI } from '@/lib/canvasCapture'
import { createScene, updateScene, checkCmsHealth } from '@/lib/scenesApi'
import { generateSceneDescriptions } from '@/lib/gemini'
import useStore from '../store/useStore'

export function useSceneSave(layersContainerRef) {
  const effectsConfig = useStore((state) => state.effectsConfig)
  const getSceneData = useStore((state) => state.getSceneData)
  const currentSceneId = useStore((state) => state.currentSceneId)

  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [cmsAvailable, setCmsAvailable] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [saveThumbnail, setSaveThumbnail] = useState(null)
  const [generatedContent, setGeneratedContent] = useState(null)

  // Check CMS availability on mount
  useEffect(() => {
    checkCmsHealth().then(setCmsAvailable)
  }, [])

  // Capture thumbnail as base64 at high resolution
  const captureThumbnail = async () => {
    if (!layersContainerRef?.current) return null

    const restoreColors = prepareForCapture(document.body)

    try {
      await new Promise(resolve => requestAnimationFrame(resolve))

      const outputCanvas = await captureLayersToCanvas(
        layersContainerRef.current,
        effectsConfig,
        { scale: 2, mode: 'all', targetAspectRatio: 16 / 9 }
      )

      restoreColors()
      return outputCanvas.toDataURL('image/png')
    } catch (error) {
      console.error('Failed to capture thumbnail:', error)
      restoreColors()
      return null
    }
  }

  const handleSaveScene = async () => {
    setIsSaving(true)
    setSaveError('')
    setSaveSuccess(false)
    setIsGenerating(false)
    setSaveThumbnail(null)
    setGeneratedContent(null)

    try {
      // Step 1: Capture thumbnail
      const thumbnail = await captureThumbnail()
      setSaveThumbnail(thumbnail)
      const sceneData = getSceneData()

      if (currentSceneId) {
        // Editing existing scene: update scene data and thumbnail
        await updateScene(currentSceneId, { sceneData, thumbnail })

        setSaveSuccess(true)
        setTimeout(() => {
          setShowSaveDialog(false)
          setSaveSuccess(false)
          setSaveThumbnail(null)
          setGeneratedContent(null)
        }, 2000)
      } else {
        // Creating new scene (remix or fresh)
        const placeholderTitle = 'Untitled Scene'
        const scene = await createScene(placeholderTitle, sceneData, thumbnail, null)

        // Generate AI descriptions from resized thumbnail (smaller for API)
        setIsGenerating(true)
        const smallThumbnail = await resizeThumbnailForAI(thumbnail)
        const content = await generateSceneDescriptions(smallThumbnail)
        setIsGenerating(false)

        if (content) {
          await updateScene(scene.id, {
            title: content.title,
            short_description: content.shortDescription,
            long_description: content.longDescription
          })
          setGeneratedContent(content)
        }

        setSaveSuccess(true)
        setTimeout(() => {
          setShowSaveDialog(false)
          setSaveSuccess(false)
          setSaveThumbnail(null)
          setGeneratedContent(null)
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to save scene:', error)
      setSaveError('Failed to save scene. Check your internet connection.')
      setIsGenerating(false)
    } finally {
      setIsSaving(false)
    }
  }

  const resetSaveState = () => {
    setSaveError('')
    setSaveSuccess(false)
    setIsSaving(false)
    setIsGenerating(false)
    setSaveThumbnail(null)
    setGeneratedContent(null)
  }

  return {
    showSaveDialog, setShowSaveDialog,
    isSaving, saveError, saveSuccess,
    isGenerating, saveThumbnail, generatedContent,
    cmsAvailable,
    handleSaveScene,
    resetSaveState,
  }
}
