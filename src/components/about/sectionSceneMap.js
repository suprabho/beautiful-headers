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
  hero:        'magenta-wavy-gradient-header-dynamic-website-design',
  background:  'bright-morning-ribbon-header-energetic-sunrise-flow', // auto-match: waves
  icons:       'late-night-waves-moonlit-harbour-swell', // auto-match: aurora
  effects:     'aura-blue-gradient-stunning-website-header-design', // auto-match: fluid
  flutedGlass: 'dynamic-blue-green-gradient-modern-abstract-visuals', // auto-match: ribbon
  text:        'mediterranean-coast-simple-azure-serenity', // auto-match: liquid
  input:       'sakura-garden-dandelion-cherry-blossom-drift', // auto-match: dandelion
  theme:       'late-night-ribbon-jazz-club-velvet-curtain', // auto-match: liquid
  palettes:    'coral-turquoise-ribbon-bold-tropical-wave-header', // auto-match: liquid
  embed:       'teal-gradient-background-modern-wavy-website-header', // auto-match: particleRing
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
          } else if (slug) {
            console.warn(`[sectionSceneMap] No match for "${section.id}" (slug: "${slug}"). Available slugs:`, docs.map(d => d.slug || titleToSlug(d.title)))
          }
        }

        console.log('[sectionSceneMap] Resolved map:', Object.fromEntries(
          Object.entries(map).map(([k, v]) => [k, { title: v.title, type: v.scene_data?.backgroundType }])
        ))
        setSceneMap(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { sceneMap, loading }
}
