import { audioData } from './audioData'
import { AUDIO_MAPPINGS } from './audioMappings'

/**
 * Given a base config object and a background type, returns a new config
 * with audio-modulated values. Called inside animation loops (per-frame).
 * Returns baseConfig unchanged when audio is inactive.
 */
export function getAudioModulatedConfig(baseConfig, layerType) {
  if (!audioData.isActive) return baseConfig

  const mappings = AUDIO_MAPPINGS[layerType]
  if (!mappings) return baseConfig

  const result = { ...baseConfig }

  for (const mapping of mappings) {
    const audioValue = audioData[mapping.band] ?? 0
    const base = baseConfig[mapping.param]
    if (base === undefined) continue

    result[mapping.param] = base + audioValue * mapping.weight
  }

  return result
}
