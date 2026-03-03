import { SECTION_SCENES } from '../sectionScenes'

export function GallerySection() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 md:col-span-2">
      <div className="bg-black/40 backdrop-blur-xl p-4 md:p-5 space-y-4">
        <h3 className="text-lg md:text-xl font-semibold text-white text-center">Featured Scenes</h3>
        <p className="text-sm md:text-base text-white/70 leading-relaxed text-center max-w-lg mx-auto">
          Each feature above runs a unique live scene. Here&apos;s the palette behind every card.
        </p>

        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {SECTION_SCENES.map(scene => (
            <div
              key={scene.id}
              className="aspect-video rounded-lg overflow-hidden relative group"
            >
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${scene.colors.join(', ')})`,
                }}
              />
              <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/50 to-transparent">
                <span className="text-[10px] md:text-xs text-white font-medium drop-shadow-md leading-tight">
                  {scene.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
