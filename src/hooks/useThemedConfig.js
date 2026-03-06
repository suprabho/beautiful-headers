import { useMemo, useCallback } from 'react'
import useStore from '../store/useStore'
import { deepMerge, computeOverrideDiff } from '../lib/themeUtils'

/**
 * Hook that returns the effective config for a given config key
 * and a setter that writes to the correct location based on editor mode.
 *
 * In dark mode: reads/writes the base config directly.
 * In light mode: reads the merged config, writes diffs to themeOverrides.light.
 *
 * Usage:
 *   const [config, setConfig] = useThemedConfig('ribbonConfig')
 */
export function useThemedConfig(configKey) {
  const baseConfig = useStore((state) => state[configKey])
  const lightOverrides = useStore((state) => state.themeOverrides?.light?.[configKey])
  const editorThemeMode = useStore((state) => state.editorThemeMode)

  // Get the base setter (e.g. setRibbonConfig for 'ribbonConfig')
  const setterName = `set${configKey.charAt(0).toUpperCase() + configKey.slice(1)}`
  const baseSetter = useStore((state) => state[setterName])
  const setLightOverride = useStore((state) => state.setLightOverride)

  const effectiveConfig = useMemo(() => {
    if (editorThemeMode === 'dark' || !lightOverrides) {
      return baseConfig
    }
    return deepMerge(baseConfig, lightOverrides)
  }, [baseConfig, lightOverrides, editorThemeMode])

  const setConfig = useCallback((newConfig) => {
    if (editorThemeMode === 'dark') {
      baseSetter(newConfig)
    } else {
      // Compute diff from base and store as override
      const diff = computeOverrideDiff(baseConfig, newConfig)
      if (diff) {
        setLightOverride(configKey, diff)
      }
    }
  }, [editorThemeMode, baseSetter, baseConfig, setLightOverride, configKey])

  return [effectiveConfig, setConfig]
}
