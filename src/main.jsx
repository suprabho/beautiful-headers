import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import SavedScenesPage from './components/SavedScenesPage.jsx'
import DashboardPage from './components/DashboardPage.jsx'
import SceneViewPage from './components/SceneViewPage.jsx'
import SceneEmbedPage from './components/SceneEmbedPage.jsx'
import AboutPage from './components/AboutPage.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/scenes" element={<SavedScenesPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/scenes/:slug" element={<SceneViewPage />} />
        <Route path="/embed/:slug" element={<SceneEmbedPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
