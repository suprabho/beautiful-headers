# @aura/headers-dandelion

Animated header backgrounds for React — **Lite + the WebGL `dandelion`
background**.

Everything in `@aura/headers-lite`, plus the 3D dandelion particle background
(`backgroundType: 'dandelion'`). Requires three.js as a peer dependency.

```bash
npm i @aura/headers-dandelion react react-dom three @react-three/fiber
```

```jsx
import { AuraHeader } from '@aura/headers-dandelion'
import '@aura/headers-dandelion/styles.css'

<div style={{ height: 320 }}>
  <AuraHeader config={dandelionScene} input="mouse" />
</div>
```

See [`@aura/headers-lite`](../headers-lite) for the full prop reference. Want all
backgrounds at once? Use `@aura/headers-pro`.
