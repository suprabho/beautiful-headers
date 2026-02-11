import { useState } from 'react'
import { prepareForCapture } from '@/lib/colorConversion'
import { captureLayersToCanvas } from '@/lib/canvasCapture'
import useStore from '../store/useStore'

export function useCanvasCapture(layersContainerRef) {
  const effectsConfig = useStore((state) => state.effectsConfig)
  const [isCapturing, setIsCapturing] = useState(false)
  const [showCaptureModal, setShowCaptureModal] = useState(false)

  const captureSnapshot = async (mode = 'all') => {
    if (!layersContainerRef?.current || isCapturing) return

    setIsCapturing(true)

    const restoreColors = prepareForCapture(document.body)

    try {
      await new Promise(resolve => requestAnimationFrame(resolve))

      const outputCanvas = await captureLayersToCanvas(
        layersContainerRef.current,
        effectsConfig,
        { scale: 2, mode }
      )

      const filename = mode === 'background'
        ? `background-${Date.now()}.png`
        : `header-capture-${Date.now()}.png`

      outputCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = filename
          link.href = url
          link.click()
          URL.revokeObjectURL(url)
        }
        restoreColors()
        setShowCaptureModal(false)
        setIsCapturing(false)
      }, 'image/png')
    } catch (error) {
      console.error('Failed to capture snapshot:', error)
      restoreColors()
      setShowCaptureModal(false)
      setIsCapturing(false)
    }
  }

  return { isCapturing, showCaptureModal, setShowCaptureModal, captureSnapshot }
}
