import { useState } from 'react'
import { DEFAULT_EFFECTS_CONFIG } from '../components/controls'
import useStore from '../store/useStore'

export function useMobileDialogs() {
  const gradientConfig = useStore((state) => state.gradientConfig)
  const setGradientConfig = useStore((state) => state.setGradientConfig)
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
  const guillocheConfig = useStore((state) => state.guillocheConfig)
  const setGuillocheConfig = useStore((state) => state.setGuillocheConfig)
  const tessellationConfig = useStore((state) => state.tessellationConfig)
  const setTessellationConfig = useStore((state) => state.setTessellationConfig)
  const effectsConfig = useStore((state) => state.effectsConfig)
  const setEffectsConfig = useStore((state) => state.setEffectsConfig)
  const textSections = useStore((state) => state.textSections)
  const setTextSections = useStore((state) => state.setTextSections)
  const textGap = useStore((state) => state.textGap)
  const setTextGap = useStore((state) => state.setTextGap)
  const textConfig = useStore((state) => state.textConfig)
  const setTextConfig = useStore((state) => state.setTextConfig)

  const [activeDialog, setActiveDialog] = useState(null)
  const [originalValues, setOriginalValues] = useState(null)

  const openDialog = (dialogKey) => {
    setActiveDialog(dialogKey)
    if (dialogKey.startsWith('gradient-') || dialogKey.startsWith('aurora-') || dialogKey.startsWith('blob-') || dialogKey.startsWith('fluid-') || dialogKey.startsWith('waves-') || dialogKey.startsWith('ribbon-') || dialogKey.startsWith('dandelion-') || dialogKey.startsWith('particleRing-') || dialogKey.startsWith('guilloche-')) {
      setOriginalValues({ type: 'gradient', data: { gradientConfig: { ...gradientConfig }, auroraConfig: { ...auroraConfig }, blobConfig: { ...blobConfig }, fluidConfig: { ...fluidConfig }, wavesConfig: { ...wavesConfig }, ribbonConfig: { ...ribbonConfig }, dandelionConfig: { ...dandelionConfig }, particleRingConfig: { ...particleRingConfig }, guillocheConfig: { ...guillocheConfig } } })
    } else if (dialogKey.startsWith('pattern-')) {
      setOriginalValues({ type: 'pattern', data: { ...tessellationConfig } })
    } else if (dialogKey.startsWith('effects-')) {
      setOriginalValues({ type: 'effects', data: { ...effectsConfig } })
    } else if (dialogKey.startsWith('text-')) {
      setOriginalValues({ type: 'text', data: { sections: [...textSections], gap: textGap, config: { ...textConfig } } })
    }
  }

  const applyDialog = () => {
    setActiveDialog(null)
    setOriginalValues(null)
  }

  const backDialog = () => {
    if (originalValues) {
      if (originalValues.type === 'gradient') {
        setGradientConfig(originalValues.data.gradientConfig)
        setAuroraConfig(originalValues.data.auroraConfig)
        setFluidConfig(originalValues.data.fluidConfig)
        setWavesConfig(originalValues.data.wavesConfig)
        if (originalValues.data.ribbonConfig) setRibbonConfig(originalValues.data.ribbonConfig)
        if (originalValues.data.dandelionConfig) setDandelionConfig(originalValues.data.dandelionConfig)
        if (originalValues.data.particleRingConfig) setParticleRingConfig(originalValues.data.particleRingConfig)
        if (originalValues.data.guillocheConfig) setGuillocheConfig(originalValues.data.guillocheConfig)
      } else if (originalValues.type === 'pattern') {
        setTessellationConfig(originalValues.data)
      } else if (originalValues.type === 'effects') {
        setEffectsConfig(originalValues.data)
      } else if (originalValues.type === 'text') {
        setTextSections(originalValues.data.sections)
        setTextGap(originalValues.data.gap)
        setTextConfig(originalValues.data.config)
      }
    }
    setActiveDialog(null)
    setOriginalValues(null)
  }

  const resetDialog = () => {
    if (originalValues) {
      if (originalValues.type === 'gradient') {
        setGradientConfig(originalValues.data.gradientConfig)
        setAuroraConfig(originalValues.data.auroraConfig)
        setBlobConfig(originalValues.data.blobConfig)
        setFluidConfig(originalValues.data.fluidConfig)
        setWavesConfig(originalValues.data.wavesConfig)
        if (originalValues.data.ribbonConfig) setRibbonConfig(originalValues.data.ribbonConfig)
        if (originalValues.data.dandelionConfig) setDandelionConfig(originalValues.data.dandelionConfig)
        if (originalValues.data.particleRingConfig) setParticleRingConfig(originalValues.data.particleRingConfig)
        if (originalValues.data.guillocheConfig) setGuillocheConfig(originalValues.data.guillocheConfig)
      } else if (originalValues.type === 'pattern') {
        setTessellationConfig(originalValues.data)
      } else if (originalValues.type === 'effects') {
        setEffectsConfig(DEFAULT_EFFECTS_CONFIG)
      } else if (originalValues.type === 'text') {
        setTextSections(originalValues.data.sections)
        setTextGap(originalValues.data.gap)
        setTextConfig(originalValues.data.config)
      }
    }
  }

  return { activeDialog, openDialog, applyDialog, backDialog, resetDialog }
}
