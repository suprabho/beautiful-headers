// Bootstrap for embed.html. Everything real lives in embedMain.jsx, loaded via a
// dynamic import once the host page has painted (see embed.html for why):
// inside an iframe the first two animation frames only arrive after the host
// has presented its first frame, so React and the scene renderer are never on
// the host page's critical path. The timer is a safety net for environments
// that never tick animation frames.
let started = false
function start() {
  if (started) return
  started = true
  import('./embedMain.jsx')
}
requestAnimationFrame(() => requestAnimationFrame(start))
setTimeout(start, 1000)
