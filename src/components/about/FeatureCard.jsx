import { createContext, useContext, useRef, useState, useEffect } from 'react'

// Context to provide the scroll container as IntersectionObserver root
export const ScrollRootContext = createContext(null)

export function FeatureCard({ title, description, children, renderPreview, className = '' }) {
  const ref = useRef(null)
  const scrollRoot = useContext(ScrollRootContext)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || !scrollRoot) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: '100px', root: scrollRoot }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [scrollRoot])

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-2xl border border-white/10 ${className}`}
    >
      {/* Full-bleed preview background */}
      <div className="absolute inset-0">
        {isVisible && renderPreview ? renderPreview() : (
          <div className="w-full h-full bg-muted/10 animate-pulse" />
        )}
      </div>

      {/* Content: controls + text overlay at bottom */}
      <div className="relative z-10 flex flex-col justify-end min-h-[320px] md:min-h-[360px]">
        <div className="bg-black/40 backdrop-blur-xl p-4 md:p-5 space-y-3">
          {/* Controls above the text */}
          {children && <div className="flex flex-wrap justify-center gap-1.5">{children}</div>}

          {/* Title — centered */}
          <h3 className="text-lg md:text-xl font-semibold text-white text-center">{title}</h3>

          {/* Description — centered, bigger */}
          <p className="text-sm md:text-base text-white/70 leading-relaxed text-center">{description}</p>
        </div>
      </div>
    </div>
  )
}
