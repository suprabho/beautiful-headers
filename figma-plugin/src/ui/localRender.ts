// Renders a scene on this machine: loads the embed in an iframe at the capture
// size and asks it for a PNG over the embed's postMessage bridge
// (SceneEmbedPage.jsx). The user's GPU does the WebGL work, so this takes
// seconds, where the capture endpoint runs software WebGL on a shared server.

import type { RenderOptions } from '../shared'
import { AURA_ORIGIN, captureSize } from './api'

// Scene fetch + renderer chunk + fonts + the embed's settle delay: a few seconds
// even on software WebGL, so past these something is wrong and the server
// fallback should take over rather than keep the user waiting.
const READY_TIMEOUT = 15_000
const CAPTURE_TIMEOUT = 15_000

// One embed at a time: each is a full WebGL page at up to 3840 px.
let queue: Promise<unknown> = Promise.resolve()

export function renderLocally(slug: string, width: number, height: number, options: RenderOptions) {
  const run = queue.then(() => renderOnce(slug, width, height, options))
  queue = run.catch(() => {})
  return run
}

async function renderOnce(slug: string, width: number, height: number, options: RenderOptions) {
  const { w, h, dpr } = captureSize(width, height, options.dpr)
  const params = new URLSearchParams({ capture: '1' })
  if (options.hideText) params.set('hideText', 'true')
  if (options.hideIcons) params.set('hideIcons', 'true')
  params.set('theme', options.theme)

  const iframe = document.createElement('iframe')
  iframe.src = `${AURA_ORIGIN}/embed/${encodeURIComponent(slug)}?${params}`
  iframe.tabIndex = -1
  iframe.setAttribute('aria-hidden', 'true')
  // Laid out at the exact capture size and kept in the viewport (behind the
  // UI): Chromium stops rendering cross-origin frames that are off-screen or
  // display:none, and the capture takes the embed's layout size.
  Object.assign(iframe.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: `${w}px`,
    height: `${h}px`,
    border: '0',
    zIndex: '-1',
    pointerEvents: 'none',
  })
  document.body.appendChild(iframe)
  try {
    await waitForMessage(iframe, (d) => d.type === 'promad-aura:ready', READY_TIMEOUT, 'Scene did not load in time')
    const requestId = Math.random().toString(36).slice(2)
    const result = waitForMessage(
      iframe,
      (d) => d.type === 'promad-aura:capture-result' && d.requestId === requestId,
      CAPTURE_TIMEOUT,
      'Capture timed out',
    )
    // '*': if the plugin UI is a sandboxed frame, the embed inherits the sandbox
    // and has an opaque origin, so naming AURA_ORIGIN would drop the message.
    // It goes to the iframe we created and carries nothing sensitive.
    iframe.contentWindow!.postMessage({ type: 'promad-aura:capture', requestId, pixelRatio: dpr }, '*')
    const { dataUrl, error } = (await result) as { dataUrl?: string; error?: string }
    if (!dataUrl) throw new Error(error || 'Capture failed')
    return dataUrlToBytes(dataUrl)
  } finally {
    iframe.remove()
  }
}

type EmbedMessage = { type?: string; requestId?: string }

function waitForMessage(
  iframe: HTMLIFrameElement,
  match: (data: EmbedMessage) => boolean,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<EmbedMessage> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', onMessage)
      reject(new Error(timeoutMessage))
    }, timeoutMs)
    function onMessage(event: MessageEvent) {
      if (event.source !== iframe.contentWindow || !event.data || !match(event.data)) return
      clearTimeout(timer)
      window.removeEventListener('message', onMessage)
      resolve(event.data)
    }
    window.addEventListener('message', onMessage)
  })
}

function dataUrlToBytes(dataUrl: string) {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}
