# @aura/headers-particle-ring

Animated header backgrounds for React — **Lite + the WebGL `particleRing`
background**.

Everything in `@aura/headers-lite`, plus the orbiting particle-ring background
(`backgroundType: 'particleRing'`). Requires three.js as a peer dependency.

```bash
npm i @aura/headers-particle-ring react react-dom three @react-three/fiber
```

```jsx
import { AuraHeader } from '@aura/headers-particle-ring'
import '@aura/headers-particle-ring/styles.css'

<div style={{ height: 320 }}>
  <AuraHeader config={particleRingScene} input="mouse" />
</div>
```

See [`@aura/headers-lite`](../headers-lite) for the full prop reference. Want all
backgrounds at once? Use `@aura/headers-pro`.
