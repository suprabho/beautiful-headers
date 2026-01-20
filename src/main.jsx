import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import SavedScenesPage from './components/SavedScenesPage.jsx'
import SceneViewPage from './components/SceneViewPage.jsx'
import SceneEmbedPage from './components/SceneEmbedPage.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/scenes" element={<SavedScenesPage />} />
        <Route path="/scenes/:slug" element={<SceneViewPage />} />
        <Route path="/embed/:slug" element={<SceneEmbedPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
