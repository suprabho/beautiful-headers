# @aura/headers-ribbon

Animated header backgrounds for React — **Lite + the WebGL `ribbon` background**.

Everything in `@aura/headers-lite`, plus the flowing 3D ribbon background
(`backgroundType: 'ribbon'`). Requires three.js as a peer dependency.

```bash
npm i @aura/headers-ribbon react react-dom three @react-three/fiber
```

```jsx
import { AuraHeader } from '@aura/headers-ribbon'
import '@aura/headers-ribbon/styles.css'

<div style={{ height: 320 }}>
  <AuraHeader config={ribbonScene} input="mouse" />
</div>
```

See [`@aura/headers-lite`](../headers-lite) for the full prop reference. Want all
backgrounds at once? Use `@aura/headers-pro`.
