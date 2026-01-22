import { memo } from 'react'
import { cn } from '@/lib/utils'

// Reusable Color Palette Preview component
export const ColorPalettePreview = memo(({
  palette,
  maxColors = 300,
  action,
  className,
  compact = false
}) => {
  if (!palette?.colors?.length) return null

  const displayColors = palette.colors.slice(0, maxColors)
  const remainingCount = palette.colors.length - maxColors

  return (
    <div className={cn("flex flex-col flex-1 p-3 bg-muted/50 rounded-lg border border-border", className)}>
      {!compact && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Palette Preview</span>
          {action}
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {displayColors.map((color, idx) => (
          <div
            key={idx}
            className={cn(
              "rounded border border-border/50",
              compact ? "w-4 h-4" : "w-5 h-5"
            )}
            style={{ backgroundColor: color.hex }}
            title={color.shade ? `${color.name}-${color.shade}` : color.name}
          />
        ))}
        {remainingCount > 0 && (
          <span className="text-xs text-muted-foreground self-center ml-1">
            +{remainingCount} more
          </span>
        )}
      </div>
    </div>
  )
})

ColorPalettePreview.displayName = 'ColorPalettePreview'

export default ColorPalettePreview
