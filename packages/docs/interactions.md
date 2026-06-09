# Interactions

Headers can react to the mouse or to live microphone audio. The source is
chosen with the `input` prop:

```jsx
<AuraHeader config={scene} input="mouse" />  // default
<AuraHeader config={scene} input="mic" />    // audio-reactive
<AuraHeader config={scene} input="off" />    // inert
```

Two scene-level fields gate interaction regardless of the prop:

- `inputEnabled: false` makes the scene fully inert.
- `mouseConfig: { enabled, intensity }` toggles mouse reaction and scales its
  strength (`intensity` 0–1, default `0.5`).

`input="mic"` disables mouse effects — the two sources don't combine.

## Mouse

The component tracks the cursor over its own bounding box (normalized 0–1,
throttled to one update per animation frame) and feeds the position to the
active background. What it modulates is per-background:

| Background | Effect |
| --- | --- |
| `liquid` | UV distortion around the cursor with exponential falloff (`gradientConfig.mouseInfluence` scales it). |
| `fluid` | Blob centers drift toward the cursor. |
| `waves` | Horizontal cursor position shifts the wave phase. |
| `aurora` | Lines near the cursor expand in width. |
| `ribbon` | Vertical cursor position modulates flow speed. |
| `dandelion` | Lines are repelled within a radius around the cursor. |
| `particleRing` | Cursor position tilts the ring (`tiltX`/`tiltZ`). |
| `simple` | No mouse effect (static gradient). |
| icon layer | With `tessellationConfig.mouseRotationInfluence > 0`, icons within ~300 px rotate toward the cursor. |

All effects are smoothed (lerped) so motion trails the cursor softly, and all
scale with `mouseConfig.intensity`.

## Microphone

With `input="mic"` the component calls `getUserMedia({ audio: true })` —
the browser will prompt for permission (HTTPS required). If permission is
denied, the header renders normally without reactivity and logs a console
error.

The analyser splits the FFT (size 2048) into smoothed 0–1 bands, published on
the shared `audioData` singleton:

| Band | Meaning |
| --- | --- |
| `bass` | Low-frequency energy. |
| `mid` | Mid-frequency energy. |
| `treble` | High-frequency energy. |
| `amplitude` | Weighted mix: `bass·0.5 + mid·0.35 + treble·0.15`. |

Each background maps bands onto its parameters additively
(`value = configValue + band × weight`), so the config value remains the
resting state and audio pushes above it:

| Background | Reacts with |
| --- | --- |
| `liquid` | Bass → wave intensity, mid/treble → wave speeds. |
| `aurora` | Mid → line width. |
| `fluid` | Amplitude → speed, treble → blob size. |
| `waves` | Bass → wave height, amplitude → frequency, treble → speed. |
| `ribbon` | Amplitude → amplitude, mid → noise, treble → taper. |
| `dandelion` | Treble → rotation speed, amplitude → spread (subtle). |
| `particleRing` | Treble → orbit speed, amplitude → ring radius, bass → ring width. |
| `simple` | No audio effect. |

### Caveats

- **One mic header per page.** The analyser writes to a single shared
  `audioData` object; multiple `input="mic"` instances would fight over it.
- The mic stream, audio context, and animation loop are torn down when the
  component unmounts or `input` changes.
- Custom backgrounds can read `audioData` directly per frame — see
  [Custom backgrounds](./custom-backgrounds.md).

## Pausing

`paused` freezes background animation (each renderer receives `isPaused`).
Pair it with an `IntersectionObserver` to stop work while the header is
off-screen:

```jsx
function LazyHeader({ scene }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ height: 320 }}>
      <AuraHeader config={scene} paused={!visible} />
    </div>
  )
}
```
