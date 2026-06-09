# @aura/headers-liquid

Animated header backgrounds for React — **Lite + the WebGL `liquid` background**.

Everything in `@aura/headers-lite`, plus the animated liquid mesh-gradient
shader (`backgroundType: 'liquid'`). Requires three.js as a peer dependency.

```bash
npm i @aura/headers-liquid react react-dom three @react-three/fiber @react-three/postprocessing
```

```jsx
import { AuraHeader } from '@aura/headers-liquid'
import '@aura/headers-liquid/styles.css'

<div style={{ height: 320 }}>
  <AuraHeader config={liquidScene} input="mouse" />
</div>
```

See [`@aura/headers-lite`](../headers-lite) for the full prop reference. Other
WebGL backgrounds (`ribbon`, `dandelion`, `particleRing`) degrade to the SVG
placeholder here — use the matching package or `@aura/headers-pro` for all of
them.

## Documentation

Full guides — scene config reference, theming, interactions, custom
backgrounds — live at
<https://github.com/suprabho/beautiful-headers/tree/main/packages/docs>.
