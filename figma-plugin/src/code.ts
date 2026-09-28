/// <reference types="@figma/plugin-typings" />
// Figma main thread. Owns the document: reports the selection to the UI,
// creates frames, and writes the rendered scene PNGs as image fills. All
// network work (scene gallery + capture renders) happens in the UI iframe.

import type { AuraNodeData, MainToUi, Target, UiToMain } from './shared'

const DATA_KEY = 'aura'

type FillableNode =
  | FrameNode
  | ComponentNode
  | InstanceNode
  | RectangleNode
  | EllipseNode
  | PolygonNode
  | StarNode
  | VectorNode

const FILLABLE_TYPES = new Set<NodeType>([
  'FRAME', 'COMPONENT', 'INSTANCE', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR',
])

function isFillable(node: BaseNode | null): node is FillableNode {
  return !!node && FILLABLE_TYPES.has(node.type)
}

function readAuraData(node: BaseNode): AuraNodeData | null {
  const raw = node.getPluginData(DATA_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuraNodeData
  } catch {
    return null
  }
}

function toTarget(node: FillableNode): Target {
  return {
    id: node.id,
    name: node.name,
    width: node.width,
    height: node.height,
    aura: readAuraData(node),
  }
}

function post(msg: MainToUi) {
  figma.ui.postMessage(msg)
}

function currentTargets() {
  const selection = figma.currentPage.selection
  const targets = selection.filter(isFillable).map(toTarget)
  return { targets, unsupported: selection.length - targets.length }
}

function postSelection() {
  post({ type: 'selection', ...currentTargets() })
}

async function applyImage(msg: Extract<UiToMain, { type: 'apply-image' }>) {
  const image = figma.createImage(msg.bytes)
  const fill: ImagePaint = { type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }

  for (const id of msg.nodeIds) {
    const node = await figma.getNodeByIdAsync(id)
    if (!isFillable(node) || node.removed) continue
    // The scene *is* the background, so it replaces the layer's fills rather
    // than stacking on top of whatever was there (undo restores them).
    node.fills = [fill]
    node.setPluginData(DATA_KEY, JSON.stringify(msg.data))
    node.setRelaunchData({
      refresh: `Re-render "${msg.data.title}" at this layer's current size`,
      open: 'Pick a different Aura scene',
    })
  }
  if (!msg.preview) postSelection()
}

function createFrame(width: number, height: number, name: string): FrameNode {
  const frame = figma.createFrame()
  frame.name = name
  frame.resize(width, height)
  const { x, y } = figma.viewport.center
  frame.x = Math.round(x - width / 2)
  frame.y = Math.round(y - height / 2)
  frame.fills = [{ type: 'SOLID', color: { r: 0.06, g: 0.06, b: 0.08 } }]
  figma.currentPage.appendChild(frame)
  figma.currentPage.selection = [frame]
  figma.viewport.scrollAndZoomIntoView([frame])
  return frame
}

// Layers to re-render headlessly when launched from a layer's "Refresh" button.
let refreshTargets: Target[] | null = null

figma.ui.onmessage = async (msg: UiToMain) => {
  switch (msg.type) {
    case 'ready':
      if (refreshTargets) post({ type: 'refresh', targets: refreshTargets })
      else postSelection()
      break
    case 'create-frame': {
      const frame = createFrame(msg.width, msg.height, msg.name)
      post({ type: 'frame-created', target: toTarget(frame) })
      break
    }
    case 'apply-image':
      try {
        await applyImage(msg)
      } catch (err) {
        figma.notify(`Aura: couldn't apply image — ${(err as Error).message}`, { error: true })
      }
      break
    case 'notify':
      figma.notify(msg.message, { error: msg.error })
      break
    case 'done':
      figma.closePlugin(msg.message)
      break
  }
}

if (figma.command === 'refresh') {
  // Relaunch button on a layer: re-render headlessly at the layer's new size.
  const targets = currentTargets().targets.filter((t) => t.aura)
  refreshTargets = targets
  if (targets.length === 0) {
    figma.closePlugin('Select a layer with an Aura background to refresh.')
  } else {
    figma.showUI(__html__, { visible: false })
  }
} else {
  figma.showUI(__html__, { width: 720, height: 600, themeColors: true, title: 'Aura Backgrounds' })
  figma.on('selectionchange', postSelection)
  // Keep the reported sizes live while the user resizes the selected layers.
  const watchPage = () => figma.currentPage.on('nodechange', postSelection)
  figma.on('currentpagechange', () => {
    watchPage()
    postSelection()
  })
  watchPage()
}
