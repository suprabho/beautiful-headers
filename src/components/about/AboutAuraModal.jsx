import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollRootContext } from './FeatureCard'
import { AboutHeroSection } from './AboutHeroSection'
import { BackgroundSection } from './sections/BackgroundSection'
import { IconsSection } from './sections/IconsSection'
import { EffectsSection } from './sections/EffectsSection'
import { FlutedGlassSection } from './sections/FlutedGlassSection'
import { TextsSection } from './sections/TextsSection'
import { InputSection } from './sections/InputSection'
import { ThemeSection } from './sections/ThemeSection'
import { PalettesSection } from './sections/PalettesSection'
import { EmbedSection } from './sections/EmbedSection'
import { GallerySection } from './sections/GallerySection'
import { useSectionScenes } from './sectionSceneMap'

export function AboutAuraModal({ open, onOpenChange }) {
  // Use callback ref so we get a re-render when the element mounts
  const [scrollElement, setScrollElement] = useState(null)
  const { sceneMap } = useSectionScenes()

  // Scroll to top when modal opens
  useEffect(() => {
    if (open && scrollElement) {
      scrollElement.scrollTop = 0
    }
  }, [open, scrollElement])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw]! max-w-5x! h-[90vh]! max-h-[90vh]! p-0! rounded-2xl! flex flex-col top-[50%]! -translate-y-[50%]!"
      >
        <DialogTitle className="sr-only">About Aura</DialogTitle>
        <DialogDescription className="sr-only">Feature showcase for Aura interactive backgrounds</DialogDescription>
        <ScrollRootContext.Provider value={scrollElement}>
          <div ref={setScrollElement} className="overflow-y-auto flex-1 rounded-2xl">
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
      </DialogContent>
    </Dialog>
  )
}
