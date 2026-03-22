import { useState, useCallback, useEffect } from 'react'
import SafeMap from '../components/SafeMap'
import RoutePlanner from '../components/RoutePlanner'
import { getHeatmapBbox } from '../services/api'
import './MapPage.css'

export default function MapPage() {
  const [routes, setRoutes] = useState(null)
  const [heatmapData, setHeatmapData] = useState(null)
  const [safeSpots, setSafeSpots] = useState([])
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [showSpots, setShowSpots] = useState(true)
  const [startMarker, setStartMarker] = useState(null)
  const [endMarker, setEndMarker] = useState(null)
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)

  useEffect(() => {
    getHeatmapBbox({
      lat_min: 14.4,
      lat_max: 14.8,
      lng_min: 120.9,
      lng_max: 121.2,
    })
      .then(setHeatmapData)
      .catch(() => {})
  }, [])

  const handleRoutesFound = useCallback((foundRoutes, markers) => {
    setRoutes(foundRoutes)
    setSelectedRouteIndex(0)
    if (markers?.start && markers?.end) {
      setStartMarker({ lat: markers.start.lat, lng: markers.start.lng })
      setEndMarker({ lat: markers.end.lat, lng: markers.end.lng })
    }
  }, [])

  const handleSafeSpotsFound = useCallback((spots) => {
    if (showSpots) setSafeSpots(spots)
  }, [showSpots])

  const handleMapClick = useCallback(() => {
    // Future: tap-to-set start/end
  }, [])

  return (
    <div className="map-page">
      <RoutePlanner
        onRoutesFound={handleRoutesFound}
        onSafeSpotsFound={handleSafeSpotsFound}
        onSelectedRouteChange={setSelectedRouteIndex}
      />

      <div className="map-area">
        <div className="map-controls">
          <button
            type="button"
            className={`btn btn-sm ${showHeatmap ? 'btn-primary' : 'btn-glass'}`}
            onClick={() => setShowHeatmap(v => !v)}
            title="Toggle crime heatmap"
          >
            🔥 Crime Heatmap
          </button>
          <button
            type="button"
            className={`btn btn-sm ${showSpots ? 'btn-primary' : 'btn-glass'}`}
            onClick={() => setShowSpots(v => !v)}
            title="Toggle safe spots"
          >
            🛡️ Safe Spots
          </button>
        </div>

        <SafeMap
          routes={routes}
          highlightedRouteIndex={selectedRouteIndex}
          heatmapData={showHeatmap ? heatmapData : null}
          safeSpots={showSpots ? safeSpots : []}
          onMapClick={handleMapClick}
          startMarker={startMarker}
          endMarker={endMarker}
        />
      </div>
    </div>
  )
}
