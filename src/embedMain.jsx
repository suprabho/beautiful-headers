import React from 'react'
import ReactDOM from 'react-dom/client'
import SceneEmbedPage from './components/SceneEmbedPage.jsx'

// Dedicated entry for /embed/:slug (see embed.html + vercel.json). It skips the
// router, the studio UI, Supabase client, Tailwind and the Google Fonts link so
// an embedded scene only ships the renderer it needs. Loaded by embed.jsx once
// the host page has painted.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SceneEmbedPage />
  </React.StrictMode>,
)
