import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import HomePage from '@/pages/HomePage'
import MapPage from '@/pages/MapPage'
import AboutPage from '@/pages/AboutPage'
import AliOnboarding, { shouldShowOnboarding } from '@/components/AliOnboarding'

function MobileHomeRedirect() {
  const isMobile = window.matchMedia('(max-width: 767px)').matches
  return isMobile ? <Navigate to="/map" replace /> : <HomePage />
}

function App() {
  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {showOnboarding && (
        <AliOnboarding onComplete={() => setShowOnboarding(false)} />
      )}

      <Navbar />
      <main className="flex-1 pt-20">
        <Routes>
          <Route path="/" element={<MobileHomeRedirect />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
