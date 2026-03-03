import { useState, useEffect } from 'react'
import { getScenes, titleToSlug } from '@/lib/scenesApi'
import { SECTION_SCENES } from './sectionScenes'

// ──────────────────────────────────────────────────────────
// MAPPING: section ID → scene slug from the database
//
// Set a slug to pin a specific database scene to a section.
// Set to null to auto-select the first scene whose
// backgroundType matches the section's backgroundType.
// ──────────────────────────────────────────────────────────
export const SECTION_SLUG_OVERRIDES = {
  hero:        null, // auto-match: liquid
  background:  null, // auto-match: waves
  icons:       null, // auto-match: aurora
  effects:     null, // auto-match: fluid
  flutedGlass: null, // auto-match: ribbon
  text:        null, // auto-match: liquid
  input:       null, // auto-match: dandelion
  theme:       null, // auto-match: liquid
  palettes:    null, // auto-match: liquid
  embed:       null, // auto-match: particleRing
}

/**
 * Fetch scenes from the database and resolve the section → scene mapping.
 * For each section, tries the explicit slug override first, then falls back
 * to the first unused scene whose backgroundType matches.
 *
 * @returns {{ sceneMap: Record<string, object>, loading: boolean }}
 */
export function useSectionScenes() {
  const [sceneMap, setSceneMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getScenes({ limit: 100 })
      .then(({ docs }) => {
        const map = {}
        const usedIds = new Set()

        for (const section of SECTION_SCENES) {
          const slug = SECTION_SLUG_OVERRIDES[section.id]
          let match = null

          // Explicit slug override
          if (slug) {
            match = docs.find(d => (d.slug || titleToSlug(d.title)) === slug)
          }

          // Auto-match by backgroundType (pick the first unused match)
          if (!match) {
            match = docs.find(
              d =>
                d.scene_data?.backgroundType === section.backgroundType &&
                !usedIds.has(d.id),
            )
          }

          if (match) {
            map[section.id] = match
            usedIds.add(match.id)
          }
        }

        setSceneMap(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { sceneMap, loading }
}
