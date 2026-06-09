# Aura Headers documentation

Animated header backgrounds for React, driven by a single `scene_data` JSON
config from the [Aura editor](https://aura.promad.design).

| Guide | What's in it |
| --- | --- |
| [Getting started](./getting-started.md) | Picking a package, install, first render, getting a scene config, SSR. |
| [API reference](./api.md) | `<AuraHeader />` props and every named export. |
| [Scene config reference](./scene-config.md) | Every `scene_data` field, typed, with defaults — backgrounds, effects, icons, text. |
| [Theming](./theming.md) | Dark/light overrides, the `colorMode` prop, the `theme-change` postMessage protocol. |
| [Interactions](./interactions.md) | Mouse and microphone input — what each background reacts to, pausing. |
| [Custom backgrounds](./custom-backgrounds.md) | The registry, fallbacks, and writing your own background renderer. |

For the package architecture (how the lite/pro split works, building,
publishing), see the [workspace README](../README.md).
