# Theming

Scenes support per-property dark/light overrides. The model is simple:

- The **base config is dark mode**.
- Light mode stores only the properties that differ, under
  `themeOverrides.light`.
- At render time the overrides are deep-merged onto the base when light mode
  is active.

```json
{
  "backgroundType": "fluid",
  "gradientConfig": { "colors": ["#0f172a", "#7c3aed", "#0ea5e9"] },
  "themeOverrides": {
    "light": {
      "gradientConfig": { "colors": ["#f8fafc", "#ddd6fe", "#bae6fd"] },
      "effectsConfig": { "brightness": 105 }
    }
  }
}
```

Any top-level config slice can be overridden (`gradientConfig`,
`effectsConfig`, `wavesConfig`, `textConfig`, …). Merge rules
(`deepMerge`):

- Plain objects merge recursively.
- **Arrays are replaced entirely** — to change one palette color, repeat the
  whole `colors` array.
- `undefined` values in the override are skipped (the base value stays).

## The `colorMode` prop

| Value | Behavior |
| --- | --- |
| `'auto'` (default) | Detects the mode at runtime — see below. |
| `'dark'` | Always the base config. |
| `'light'` | Always base + `themeOverrides.light`. |
| `'default'` | No theme resolution at all; the base config is used verbatim and runtime changes are ignored. |

In practice: `'auto'` for sites with a theme toggle or embedded headers,
`'dark'`/`'light'` when your page is single-theme, `'default'` when you manage
config variants yourself.

## How `'auto'` detects the mode

Two signals, in priority order:

1. **Parent-frame messages.** The component listens for `postMessage` events of
   the shape:

   ```js
   iframe.contentWindow.postMessage({ type: 'theme-change', theme: 'light' }, '*')
   // theme: 'dark' | 'light'
   ```

   This is how the Aura embed page switches theme live inside an iframe — and
   it works the same when the component listens within your own page: any
   frame can broadcast a `theme-change` message when the user flips a theme
   toggle.

2. **System preference.** Initial value and live updates from
   `window.matchMedia('(prefers-color-scheme: light)')`. On the server (no
   `window`) it defaults to dark.

A `theme-change` message wins over the system preference until the system
preference next changes (last signal wins).

## Driving the theme yourself

If your app has its own theme state, skip `'auto'` and pass the mode directly —
it's a controlled prop:

```jsx
function Hero({ scene }) {
  const { theme } = useMyThemeContext() // 'dark' | 'light'
  return <AuraHeader config={scene} colorMode={theme} style={{ height: 320 }} />
}
```

## Helper functions

All exported from every package:

```js
import {
  useColorModeValue,    // (colorMode?) => 'dark' | 'light' | null
  resolveThemedConfigs, // (sceneData, mode) => resolved sceneData
  deepMerge,            // (base, overrides) => merged
  computeOverrideDiff,  // (base, edited) => minimal diff | null
} from '@aura/headers-lite'
```

- `useColorModeValue` is the exact hook `AuraHeader` uses — handy if other
  parts of your header (nav links, logos) should follow the same resolution.
- `resolveThemedConfigs(scene, 'light')` gives you the merged config outside
  of React, e.g. to read the active palette for matching UI accents.
- `computeOverrideDiff(darkConfig, lightConfig)` builds a minimal
  `themeOverrides.light` object from two full configs — useful if you author
  both themes as complete configs and want to store them in the scene format.

```js
import { computeOverrideDiff } from '@aura/headers-lite'

const scene = {
  ...darkConfig,
  themeOverrides: { light: computeOverrideDiff(darkConfig, lightConfig) ?? {} },
}
```
