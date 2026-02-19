import { X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BACKGROUND_EFFECTS, COLOR_FAMILIES } from '@/lib/sceneFilters'

function SceneFilterBar({
  projects,
  projectId,
  onProjectChange,
  backgroundType,
  onBackgroundTypeChange,
  colorFamily,
  onColorFamilyChange,
  onClear,
  hasActiveFilters,
}) {
  return (
    <div className="border-b border-border bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 py-3 flex flex-col gap-3">
        {/* Dropdowns row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Project filter */}
          <Select
            value={projectId || ""}
            onValueChange={(v) => onProjectChange(v === "__all__" ? null : v)}
          >
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Background effect filter */}
          <Select
            value={backgroundType || ""}
            onValueChange={(v) => onBackgroundTypeChange(v === "__all__" ? null : v)}
          >
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="All Effects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Effects</SelectItem>
              {BACKGROUND_EFFECTS.map((effect) => (
                <SelectItem key={effect.value} value={effect.value}>
                  {effect.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Color family swatches */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Colors</span>
          {COLOR_FAMILIES.map((family) => (
            <button
              key={family.name}
              title={family.name}
              onClick={() =>
                onColorFamilyChange(colorFamily === family.name ? null : family.name)
              }
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                colorFamily === family.name
                  ? "border-foreground scale-110 ring-2 ring-foreground/20"
                  : "border-transparent"
              )}
              style={{ backgroundColor: family.color }}
            />
          ))}
        </div>
          {hasActiveFilters && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onClear}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              <X size={14} className="mr-1" />
              Clear
            </Button>
          )}
        </div>

        
      </div>
    </div>
  )
}

export default SceneFilterBar
