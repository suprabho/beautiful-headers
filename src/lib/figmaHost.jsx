// The studio running inside the Figma plugin (loaded as /?host=figma[&scene=<slug>]).
// In this mode the studio renders only its control panel, docked; the plugin
// previews the scene itself through the embed's /embed/__preview slug, laid out
// at the target frame's size. The studio streams its scene to the plugin:
//   studio → parent { type: 'promad-aura:studio-scene', sceneData }   (on ready + every edit)
//   parent → studio { type: 'promad-aura:studio-theme', theme }       ('dark' | 'light')

import { useEffect } from 'react'
import useStore from '../store/useStore'
import { getSceneBySlug } from './scenesApi'

const params = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search)

export const isFigmaHost = params.get('host') === 'figma'

/** Gallery scene the plugin asked to customize (loaded instead of a random one). */
export const figmaHostScene = isFigmaHost ? params.get('scene') : null

// Coalesce slider drags into a few updates a second.
const SEND_DEBOUNCE_MS = 150

function currentSceneData() {
  const state = useStore.getState()
  return { ...state.getSceneData(), mouseConfig: state.mouseConfig }
}

/** Wires the plugin bridge. A no-op outside Figma host mode. */
export function useFigmaHost() {
  const loadSceneData = useStore((s) => s.loadSceneData)
  const setEditorThemeMode = useStore((s) => s.setEditorThemeMode)

  useEffect(() => {
    if (!figmaHostScene) return
    let cancelled = false
    getSceneBySlug(figmaHostScene)
      .then((scene) => {
        if (!cancelled && scene?.scene_data) loadSceneData(scene.scene_data)
      })
      .catch((err) => console.warn('[figma-host] could not load scene:', err))
    return () => { cancelled = true }
  }, [loadSceneData])

  useEffect(() => {
    if (!isFigmaHost || window.parent === window) return
    // '*': the plugin UI may be a sandboxed frame with an opaque origin. The
    // scene is public data headed for our own parent window.
    let last = ''
    const send = () => {
      if (!useStore.getState().sceneLoaded) return
      const sceneData = currentSceneData()
      const json = JSON.stringify(sceneData)
      if (json === last) return
      last = json
      window.parent.postMessage({ type: 'promad-aura:studio-scene', sceneData }, '*')
    }
    let timer = null
    const unsubscribe = useStore.subscribe(() => {
      clearTimeout(timer)
      timer = setTimeout(send, SEND_DEBOUNCE_MS)
    })
    const onMessage = (e) => {
      if (e.source !== window.parent) return
      if (e.data?.type === 'promad-aura:studio-theme' && (e.data.theme === 'dark' || e.data.theme === 'light')) {
        setEditorThemeMode(e.data.theme)
      }
    }
    window.addEventListener('message', onMessage)
    send()
    return () => {
      unsubscribe()
      clearTimeout(timer)
      window.removeEventListener('message', onMessage)
    }
  }, [setEditorThemeMode])
}
