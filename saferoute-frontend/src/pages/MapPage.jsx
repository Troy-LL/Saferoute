import { useState, useCallback } from 'react'
import axios from 'axios'
import SafeMap from '../components/SafeMap'
import RoutePlanner from '../components/RoutePlanner'
import './MapPage.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function MapPage() {
  const [routes, setRoutes] = useState(null)
  const [heatmapData, setHeatmapData] = useState(null)
  const [safeSpots, setSafeSpots] = useState([])
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [showSpots, setShowSpots] = useState(true)
  const [clickMode, setClickMode] = useState(null) // 'start' | 'end' | null

  // Load heatmap on mount
  useState(() => {
    axios.get(`${API_BASE}/api/heatmap`, {
      params: { lat_min: 14.4, lat_max: 14.8, lng_min: 120.9, lng_max: 121.2 }
    })
      .then(r => setHeatmapData(r.data))
      .catch(() => {})
  })

  const handleRoutesFound = useCallback((foundRoutes) => {
    setRoutes(foundRoutes)
  }, [])

  const handleSafeSpotsFound = useCallback((spots) => {
    if (showSpots) setSafeSpots(spots)
  }, [showSpots])

  const handleMapClick = useCallback((latlng) => {
    // Future: allow clicking to set start/end
  }, [])

  return (
    <div className="map-page">
      <RoutePlanner
        onRoutesFound={handleRoutesFound}
        onSafeSpotsFound={handleSafeSpotsFound}
      />

      <div className="map-area">
        {/* Map Controls */}
        <div className="map-controls">
          <button
            className={`btn btn-sm ${showHeatmap ? 'btn-primary' : 'btn-glass'}`}
            onClick={() => setShowHeatmap(v => !v)}
            title="Toggle crime heatmap"
          >
            🔥 Crime Heatmap
          </button>
          <button
            className={`btn btn-sm ${showSpots ? 'btn-primary' : 'btn-glass'}`}
            onClick={() => setShowSpots(v => !v)}
            title="Toggle safe spots"
          >
            🛡️ Safe Spots
          </button>
        </div>

        <SafeMap
          routes={routes}
          heatmapData={showHeatmap ? heatmapData : null}
          safeSpots={showSpots ? safeSpots : []}
          onMapClick={handleMapClick}
        />
      </div>
    </div>
  )
}
