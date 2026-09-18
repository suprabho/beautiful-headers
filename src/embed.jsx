// Bootstrap for embed.html. Everything real lives in embedMain.jsx, loaded
// once the inline gate in embed.html (window.__auraBoot) says the host page
// has had a chance to paint, so React and the scene renderer never sit on the
// host page's critical path.
;(window.__auraBoot || Promise.resolve()).then(() => import('./embedMain.jsx'))
