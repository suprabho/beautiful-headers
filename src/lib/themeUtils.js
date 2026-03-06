/**
 * Theme utilities for dark/light mode per-property overrides.
 *
 * The base scene config represents dark mode. Light mode stores only
 * the properties that differ in `themeOverrides.light`, which get
 * deep-merged on top of the base at render time.
 */

function isPlainObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}

/**
 * Deep-merge overrides into a base object.
 * - Plain objects: recurse into child keys
 * - Arrays: replaced entirely (not concatenated)
 * - Primitives: override wins
 * - undefined in overrides: keep base value
 */
export function deepMerge(base, overrides) {
  if (!overrides) return base
  if (!isPlainObject(base)) return overrides

  const result = { ...base }
  for (const key of Object.keys(overrides)) {
    const overVal = overrides[key]
    if (overVal === undefined) continue
    if (isPlainObject(result[key]) && isPlainObject(overVal)) {
      result[key] = deepMerge(result[key], overVal)
    } else {
      result[key] = overVal
    }
  }
  return result
}

/**
 * Resolve themed configs for a given mode.
 * If mode is null, 'dark', or no light overrides exist, returns sceneData as-is.
 * If mode is 'light', deep-merges each config slice with its override.
 */
export function resolveThemedConfigs(sceneData, mode) {
  if (!mode || mode === 'dark' || !sceneData.themeOverrides?.light) {
    return sceneData
  }
  const lightOverrides = sceneData.themeOverrides.light
  const resolved = { ...sceneData }
  for (const configKey of Object.keys(lightOverrides)) {
    if (resolved[configKey] && isPlainObject(lightOverrides[configKey])) {
      resolved[configKey] = deepMerge(resolved[configKey], lightOverrides[configKey])
    }
  }
  return resolved
}

/**
 * Compute the minimal diff between a base config and an edited version.
 * Returns only the properties that differ, or null if identical.
 */
export function computeOverrideDiff(base, edited) {
  if (!isPlainObject(base) || !isPlainObject(edited)) {
    return base !== edited ? edited : null
  }
  const diff = {}
  let hasDiff = false
  for (const key of Object.keys(edited)) {
    const baseVal = base[key]
    const editVal = edited[key]
    if (Array.isArray(editVal)) {
      if (JSON.stringify(baseVal) !== JSON.stringify(editVal)) {
        diff[key] = editVal
        hasDiff = true
      }
    } else if (isPlainObject(baseVal) && isPlainObject(editVal)) {
      const sub = computeOverrideDiff(baseVal, editVal)
      if (sub !== null) {
        diff[key] = sub
        hasDiff = true
      }
    } else if (baseVal !== editVal) {
      diff[key] = editVal
      hasDiff = true
    }
  }
  return hasDiff ? diff : null
}
