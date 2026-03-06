import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { titleToSlug } from '@/lib/scenesApi'
import { SECTION_SCENES } from '../sectionScenes'

const CARD_POSITIONS = [
  { left: '4%', top: '6%', rotate: -6, zIndex: 2 },
  { left: '52%', top: '0%', rotate: 5, zIndex: 1 },
  { left: '0%', top: '48%', rotate: 4, zIndex: 3 },
  { left: '50%', top: '42%', rotate: -4, zIndex: 2 },
  { left: '26%', top: '22%', rotate: -1, zIndex: 4 },
  { left: '28%', top: '58%', rotate: 2, zIndex: 1 },
]

export function GallerySection({ sceneMap = {} }) {
  const entries = useMemo(() => {
    const list = []
    const seen = new Set()
    for (const section of SECTION_SCENES) {
      const scene = sceneMap[section.id]
      if (scene && !seen.has(scene.id)) {
        seen.add(scene.id)
        list.push({ section, scene })
      }
    }
    return list
  }, [sceneMap])

  const hasScenes = entries.length > 0
  const displayEntries = entries.slice(0, CARD_POSITIONS.length)

  return (
    <div className="flex flex-1 relative overflow-hidden rounded-2xl border border-white/10">
      <div className="bg-black/60 backdrop-blur-3xl flex flex-col w-full justify-between h-full p-4 md:p-5 space-y-4">
        {!hasScenes ? (
          <div className="relative w-full aspect-4/3">
            {CARD_POSITIONS.slice(0, 4).map((pos, i) => (
              <div
                key={i}
                className="absolute w-[46%] aspect-video rounded-xl bg-white/5 animate-pulse shadow-lg"
                style={{
                  left: pos.left,
                  top: pos.top,
                  transform: `rotate(${pos.rotate}deg)`,
                  zIndex: pos.zIndex,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="relative w-full aspect-4/3">
            {displayEntries.map(({ section, scene }, i) => {
              const slug = scene.slug || titleToSlug(scene.title)
              const thumbnailUrl = scene.thumbnail?.small
              const colors = scene.scene_data?.gradientConfig?.colors
              const pos = CARD_POSITIONS[i]

              return (
                <div
                  key={section.id}
                  className="absolute w-[46%] hover:z-50!"
                  style={{
                    left: pos.left,
                    top: pos.top,
                    transform: `rotate(${pos.rotate}deg)`,
                    zIndex: pos.zIndex,
                  }}
                >
                  <Link
                    to={`/scenes/${slug}`}
                    className="block aspect-video rounded-xl overflow-hidden relative group shadow-lg shadow-black/30 transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40"
                  >
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={scene.short_description || scene.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : colors?.length ? (
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(135deg, ${colors.join(', ')})`,
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-white/5" />
                    )}
                    <div className="absolute inset-0 flex items-end p-2 bg-linear-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-[10px] md:text-xs text-white font-medium drop-shadow-md leading-tight">
                        {section.title}
                      </span>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        <div className="text-center">
          <h3 className="text-lg md:text-xl font-semibold text-white text-center">Featured Scenes</h3>
          <p className="text-sm md:text-base text-white/70 leading-relaxed text-center max-w-lg mx-auto">
            Each feature above runs a unique live scene. Here&apos;s the actual scene behind every card.
          </p>
          <Link
            to="/scenes"
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            View all scenes &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
