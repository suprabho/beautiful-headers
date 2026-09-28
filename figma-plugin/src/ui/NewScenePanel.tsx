import { Plus, Shuffle, X } from '@phosphor-icons/react'
import { MAX_COLORS, MIN_COLORS, NEW_SCENE_TYPES, SHUFFLE_PALETTES } from './newScene'

export interface SceneDraft {
  title: string
  type: string
  colors: string[]
  background: string
}

export function initialDraft(): SceneDraft {
  const t = NEW_SCENE_TYPES[0]
  return { title: '', type: t.value, colors: [...t.palette], background: t.background || '#000000' }
}

/** Gradient approximation of a draft's palette, drawn over its backdrop when the type has one. */
export function DraftPreview({ draft }: { draft: SceneDraft }) {
  const type = NEW_SCENE_TYPES.find((t) => t.value === draft.type) || NEW_SCENE_TYPES[0]
  return (
    <div className="absolute inset-0" style={{ background: type.background ? draft.background : undefined }}>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${draft.colors.join(', ')})`,
          opacity: type.background ? 0.85 : 1,
        }}
      />
    </div>
  )
}

/** Form for a brand-new scene: background type, palette, backdrop and name. */
export function NewScenePanel({ draft, onChange }: { draft: SceneDraft; onChange: (d: SceneDraft) => void }) {
  const type = NEW_SCENE_TYPES.find((t) => t.value === draft.type) || NEW_SCENE_TYPES[0]
  const set = (patch: Partial<SceneDraft>) => onChange({ ...draft, ...patch })

  const pickType = (value: string) => {
    const next = NEW_SCENE_TYPES.find((t) => t.value === value)!
    set({ type: value, colors: [...next.palette], background: next.background || draft.background })
  }
  const setColor = (i: number, color: string) => set({ colors: draft.colors.map((c, j) => (j === i ? color : c)) })
  const shuffle = () => {
    const options = SHUFFLE_PALETTES.filter((p) => p.join() !== draft.colors.join())
    set({ colors: [...options[Math.floor(Math.random() * options.length)]] })
  }

  return (
    <div className="space-y-4">
      <Field label="Name">
        <input
          value={draft.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="e.g. Midnight Aurora"
          maxLength={80}
          className="h-8 w-full rounded-md border border-line bg-bg-2 px-2 outline-none placeholder:text-fg-3 focus:border-brand"
        />
      </Field>

      <Field label="Background type">
        <div className="flex flex-wrap gap-1">
          {NEW_SCENE_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => pickType(t.value)}
              className={`rounded-full border px-2.5 py-1 ${
                draft.type === t.value ? 'border-brand bg-brand text-on-brand' : 'border-line text-fg-2 hover:text-fg'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Field>

      <Field
        label="Colors"
        action={
          <button onClick={shuffle} className="flex items-center gap-1 text-fg-2 hover:text-fg" title="Try a random palette">
            <Shuffle size={12} /> Shuffle
          </button>
        }
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {draft.colors.map((color, i) => (
            <div key={i} className="group relative">
              <Swatch color={color} onChange={(c) => setColor(i, c)} title={`Color ${i + 1}`} />
              {draft.colors.length > MIN_COLORS && (
                <button
                  onClick={() => set({ colors: draft.colors.filter((_, j) => j !== i) })}
                  aria-label={`Remove color ${i + 1}`}
                  className="absolute -top-1 -right-1 hidden h-3.5 w-3.5 items-center justify-center rounded-full border border-line bg-bg text-fg-2 group-hover:flex hover:text-fg"
                >
                  <X size={8} weight="bold" />
                </button>
              )}
            </div>
          ))}
          {draft.colors.length < MAX_COLORS && (
            <button
              onClick={() => set({ colors: [...draft.colors, draft.colors[draft.colors.length - 1]] })}
              aria-label="Add color"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-line text-fg-2 hover:text-fg"
            >
              <Plus size={12} />
            </button>
          )}
        </div>
      </Field>

      {type.background && (
        <Field label="Backdrop">
          <div className="flex items-center gap-2">
            <Swatch color={draft.background} onChange={(background) => set({ background })} title="Backdrop color" />
            <span className="font-mono text-fg-2 uppercase">{draft.background}</span>
          </div>
        </Field>
      )}

      <p className="text-fg-3">
        Saved to the Aura gallery (marked for review) so it can be re-rendered and reused. Fine-tune it later in the Aura
        editor.
      </p>
    </div>
  )
}

function Field({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{label}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

function Swatch({ color, onChange, title }: { color: string; onChange: (c: string) => void; title: string }) {
  return (
    <label
      title={title}
      className="block h-7 w-7 cursor-pointer rounded-md border border-line shadow-inner"
      style={{ background: color }}
    >
      <input type="color" value={color} onChange={(e) => onChange(e.target.value)} className="sr-only" />
    </label>
  )
}
