import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ScrollRootContext } from './about/FeatureCard'
import { AboutHeroSection } from './about/AboutHeroSection'
import { BackgroundSection } from './about/sections/BackgroundSection'
import { IconsSection } from './about/sections/IconsSection'
import { EffectsSection } from './about/sections/EffectsSection'
import { FlutedGlassSection } from './about/sections/FlutedGlassSection'
import { TextsSection } from './about/sections/TextsSection'
import { InputSection } from './about/sections/InputSection'
import { ThemeSection } from './about/sections/ThemeSection'
import { PalettesSection } from './about/sections/PalettesSection'
import { EmbedSection } from './about/sections/EmbedSection'
import { GallerySection } from './about/sections/GallerySection'
import { useSectionScenes } from './about/sectionSceneMap'

export default function AboutPage() {
  const [scrollElement, setScrollElement] = useState(null)
  const { sceneMap } = useSectionScenes()

  return (
    <ScrollRootContext.Provider value={scrollElement}>
      <div
        ref={setScrollElement}
        className="min-h-screen bg-black text-white overflow-y-auto"
      >
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/60 backdrop-blur-md border-b border-white/10">
          <Link to="/" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
            ← Back to Editor
          </Link>
          <Link to="/scenes" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
            Gallery
          </Link>
        </nav>

        {/* Hero */}
        <AboutHeroSection dbScene={sceneMap.hero} />

        {/* Feature cards grid */}
        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <BackgroundSection dbScene={sceneMap.background} />
            <IconsSection dbScene={sceneMap.icons} />
            <EffectsSection dbScene={sceneMap.effects} />
            <FlutedGlassSection dbScene={sceneMap.flutedGlass} />
            <TextsSection dbScene={sceneMap.text} />
            <InputSection dbScene={sceneMap.input} />
            <ThemeSection dbScene={sceneMap.theme} />
            <PalettesSection dbScene={sceneMap.palettes} />
            <EmbedSection dbScene={sceneMap.embed} />
            <GallerySection sceneMap={sceneMap} />
          </div>
        </div>
      </div>
    </ScrollRootContext.Provider>
  )
}
