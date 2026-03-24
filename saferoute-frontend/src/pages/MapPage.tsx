import { useState, useCallback, useEffect } from 'react'
import SafeMap from '../components/SafeMap'
import RoutePlanner from '../components/RoutePlanner'
import './MapPage.css'

function parseCsvLine(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      const isEscapedQuote = inQuotes && line[i + 1] === '"'
      if (isEscapedQuote) {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
      continue
    }
    current += char
  }
  values.push(current)
  return values.map(v => v.trim())
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const headers = parseCsvLine(lines[0])
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    const row = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? ''
    })
    return row
  })
}

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
  const [isLayersOpen, setIsLayersOpen] = useState(false)
  const [baseMapMode, setBaseMapMode] = useState('transit')

  useEffect(() => {
    Promise.all([
      fetch('/data/safety_data_cleaned.csv').then(r => r.text()),
      fetch('/data/crime_incidents.csv').then(r => r.text()),
    ])
      .then(([safeSpotsCsv, incidentsCsv]) => {
        const safeSpotRows = parseCsv(safeSpotsCsv)
        const incidentRows = parseCsv(incidentsCsv)

        const mappedSpots = safeSpotRows
          .map((row) => ({
            lat: Number(row.latitude),
            lng: Number(row.longitude),
            type:
              row.surveillance_type === 'camera' ? 'surveillance'
              : /police/i.test(row.name || '') ? 'police_station'
              : /fire/i.test(row.name || '') ? 'fire_station'
              : /hospital|medical|clinic/i.test(row.name || '') ? 'hospital'
              : /7-eleven|mini|store|market/i.test(row.name || '') ? 'convenience_store'
              : 'security_post',
            name: row.name || 'Safe Spot',
            address: row.osm_type ? `${row.osm_type} mapped point` : '',
            hours: row.opening_hours || '24/7',
            city: '',
          }))
          .filter(spot => Number.isFinite(spot.lat) && Number.isFinite(spot.lng))
          .slice(0, 500)

        const mappedHeatmap = incidentRows
          .map((row) => ({
            lat: Number(row.latitude),
            lng: Number(row.longitude),
            intensity:
              row.incident_type === 'robbery' ? 0.95
              : row.incident_type === 'assault' ? 0.84
              : row.incident_type === 'harassment' ? 0.72
              : 0.62,
          }))
          .filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lng))
          .slice(0, 600)

        setSafeSpots(mappedSpots)
        setHeatmapData(mappedHeatmap)
      })
      .catch(() => {
        setSafeSpots([])
        setHeatmapData([])
      })
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
    if (Array.isArray(spots) && spots.length > 0) {
      setSafeSpots(spots)
    }
  }, [])

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
            <h2 className="map-empty-title">Map Preview Ready</h2>
            <p className="map-empty-text">
              Use Layers to toggle Crime Heatmap and Safe Spots, or enter start/destination to route.
            </p>
          </div>
        )}

        <div className="map-controls">
          <button
            type="button"
            className="map-layers-trigger"
            onClick={() => setIsLayersOpen(v => !v)}
            title={isLayersOpen ? 'Close map layers' : 'Open map layers'}
            aria-expanded={isLayersOpen}
            aria-controls="map-layers-panel"
            aria-label={isLayersOpen ? 'Close map layers panel' : 'Open map layers panel'}
          >
            <img
              src="/map-layer-icon.png"
              alt=""
              aria-hidden="true"
              className="map-layers-trigger-icon"
            />
          </button>

          {isLayersOpen && (
            <div
              id="map-layers-panel"
              className="map-layers-panel"
              role="dialog"
              aria-label="Choose map"
            >
              <div className="map-layers-header">
                <h3>Choose Map</h3>
                <button
                  type="button"
                  className="map-layers-close"
                  onClick={() => setIsLayersOpen(false)}
                  aria-label="Close map chooser"
                >
                  ×
                </button>
              </div>

              <div className="map-layer-section">
                <p className="map-layer-section-label">Map Features</p>
                <div className="map-layer-grid">
                  <button
                    type="button"
                    className={`map-layer-tile ${showSpots ? 'active' : ''}`}
                    onClick={() => setShowSpots(v => !v)}
                    aria-pressed={showSpots}
                  >
                    <span className="map-layer-preview map-layer-preview-spots" aria-hidden />
                    <span className="map-layer-label">Safe Spots</span>
                  </button>

                  <button
                    type="button"
                    className={`map-layer-tile ${showHeatmap ? 'active' : ''}`}
                    onClick={() => setShowHeatmap(v => !v)}
                    aria-pressed={showHeatmap}
                  >
                    <span className="map-layer-preview map-layer-preview-heatmap" aria-hidden />
                    <span className="map-layer-label">Crime Heatmap</span>
                  </button>
                </div>
              </div>

              <div className="map-layer-section">
                <p className="map-layer-section-label">Base Map</p>
                <div className="map-layer-grid">
                  <button
                    type="button"
                    className={`map-layer-tile ${baseMapMode === 'transit' ? 'active' : ''}`}
                    onClick={() => setBaseMapMode('transit')}
                    aria-pressed={baseMapMode === 'transit'}
                  >
                    <span className="map-layer-preview map-layer-preview-transit" aria-hidden />
                    <span className="map-layer-label">Transit</span>
                  </button>

                  <button
                    type="button"
                    className={`map-layer-tile ${baseMapMode === 'satellite' ? 'active' : ''}`}
                    onClick={() => setBaseMapMode('satellite')}
                    aria-pressed={baseMapMode === 'satellite'}
                  >
                    <span className="map-layer-preview map-layer-preview-satellite" aria-hidden />
                    <span className="map-layer-label">Satellite</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <SafeMap
          routes={routes}
          highlightedRouteIndex={selectedRouteIndex}
          baseMapMode={baseMapMode}
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
