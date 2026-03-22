import { useState, useCallback, useEffect } from 'react'
import SafeMap from '../components/SafeMap'
import RoutePlanner from '../components/RoutePlanner'
import { getDangerHeatmap } from '../services/api'
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
  const [routeSearchLoading, setRouteSearchLoading] = useState(false)
  const [travelHour, setTravelHour] = useState(() => new Date().getHours())

  useEffect(() => {
    getDangerHeatmap(travelHour)
      .then(setHeatmapData)
      .catch(() => {})
  }, [travelHour])

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
        travelHour={travelHour}
        onTravelHourChange={setTravelHour}
        onRoutesFound={handleRoutesFound}
        onSafeSpotsFound={handleSafeSpotsFound}
        onSelectedRouteChange={setSelectedRouteIndex}
        onLoadingChange={setRouteSearchLoading}
      />

      <div className="map-area">
        {routeSearchLoading && (
          <div
            className="map-loading-overlay"
            role="status"
            aria-live="polite"
            aria-label="Calculating routes"
          >
            <div className="map-loading-card">
              <div className="map-loading-spinner" aria-hidden />
              <p>Calculating safest routes…</p>
            </div>
          </div>
        )}

        {!routes?.length && !routeSearchLoading && (
          <div className="map-empty-hint" role="region" aria-label="Getting started">
            <h2 className="map-empty-title">Find your safe route</h2>
            <p className="map-empty-text">
              Enter start and destination in the panel, then choose the safest path on the map.
            </p>
          </div>
        )}

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
