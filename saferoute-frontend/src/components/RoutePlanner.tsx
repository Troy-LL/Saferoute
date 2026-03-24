import { useState, useEffect } from 'react'
import {
  calculateRoute,
  geocodeAddress,
  getSafeSpots,
} from '../services/api'
import BuddyAlert from './BuddyAlert'
import './RoutePlanner.css'

export default function RoutePlanner({
  travelHour,
  onTravelHourChange,
  onRoutesFound,
  onSafeSpotsFound,
  onSelectedRouteChange,
  onLoadingChange,
}) {
  const [startInput, setStartInput] = useState('')
  const [endInput, setEndInput] = useState('')
  const hour = travelHour ?? new Date().getHours()
  const setHour = onTravelHourChange ?? (() => {})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [routes, setRoutes] = useState(null)
  const [selectedRoute, setSelectedRoute] = useState(0)
  const [routeContext, setRouteContext] = useState(null)

  useEffect(() => {
    onLoadingChange?.(loading)
  }, [loading, onLoadingChange])

  async function geocode(query) {
    const results = await geocodeAddress(query)
    if (!results || results.length === 0) throw new Error(`No results for "${query}"`)
    return results[0]
  }

  useEffect(() => {
    if (!routes?.length) return
    setSelectedRoute(0)
    onSelectedRouteChange?.(0)
  }, [routes, onSelectedRouteChange])

  async function handleSearch(e) {
    e.preventDefault()
    if (!startInput || !endInput) {
      setError('Please enter both start and end locations')
      return
    }

    setLoading(true)
    setError('')
    setRoutes(null)
    setSelectedRoute(0)

    try {
      const [start, end] = await Promise.all([
        geocode(startInput + ' Metro Manila Philippines'),
        geocode(endInput + ' Metro Manila Philippines'),
      ])

      setRouteContext({ start, end, startLabel: startInput, endLabel: endInput })

      const routeData = await calculateRoute(
        start.lat,
        start.lng,
        end.lat,
        end.lng,
        hour
      )

      setRoutes(routeData)
      onRoutesFound(routeData, { start, end })

      const spotsData = await getSafeSpots(
        (start.lat + end.lat) / 2,
        (start.lng + end.lng) / 2,
        1.5
      )
      if (onSafeSpotsFound) onSafeSpotsFound(spotsData)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(
        typeof detail === 'string'
          ? detail
          : detail
            ? JSON.stringify(detail)
            : err.message || 'Failed to calculate route'
      )
    } finally {
      setLoading(false)
    }
  }

  const SCORE_COLORS = { green: '#10B981', yellow: '#F59E0B', red: '#EF4444' }
  const timeLabel = `${String(hour).padStart(2, '0')}:00`

  return (
    <aside className="route-planner" role="region" aria-label="Route planner">
      <div className="planner-header">
        <h2 className="planner-title">🗺️ Plan Safe Route</h2>
        <p className="planner-subtitle">Enter your walkway in Metro Manila</p>
      </div>

      <form onSubmit={handleSearch} className="planner-form">
        <div className="field">
          <label className="field-label" htmlFor="start-location">
            📍 From
          </label>
          <input
            className="input"
            placeholder="e.g., Katipunan MRT Station"
            value={startInput}
            onChange={e => setStartInput(e.target.value)}
            id="start-location"
            aria-label="Starting point"
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="end-location">
            🏁 To
          </label>
          <input
            className="input"
            placeholder="e.g., Ateneo Gate 1"
            value={endInput}
            onChange={e => setEndInput(e.target.value)}
            id="end-location"
            aria-label="Destination"
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="time-slider">
            🕐 Time of Travel: <strong>{timeLabel}</strong>
          </label>
          <input
            type="range"
            min="0"
            max="23"
            value={hour}
            onChange={e => setHour(Number(e.target.value))}
            className="time-slider"
            id="time-slider"
            aria-valuetext={`${hour} hours`}
          />
          <div className="time-hints">
            <span>🌅 6am</span>
            <span>☀️ Noon</span>
            <span>🌙 Midnight</span>
          </div>
        </div>

        {error && <div className="error-msg">❌ {error}</div>}

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={loading}
          id="find-route-btn"
          aria-label="Find safe routes"
        >
          {loading ? (
            <>
              <span className="spinner"></span> Calculating...
            </>
          ) : (
            '🛡️ Find Safest Route'
          )}
        </button>
      </form>

      {routes && (
        <div className="route-results animate-in">
          <div className="results-header">
            <span>{routes.length} Routes Found</span>
            <span className="results-hint">Sorted by safety</span>
          </div>

          {routes.map((route, idx) => (
            <div
              key={route.route_id}
              className={`route-card ${selectedRoute === idx ? 'route-card-selected' : ''}`}
              onClick={() => {
                setSelectedRoute(idx)
                onSelectedRouteChange?.(idx)
              }}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedRoute(idx)
                  onSelectedRouteChange?.(idx)
                }
              }}
              aria-pressed={selectedRoute === idx}
              aria-label={`Route option ${idx + 1}, safety ${route.safety_score} of 100`}
            >
              <div className="route-card-header">
                <div className="route-rank">
                  {idx === 0 ? '⭐ Recommended' : `Option ${idx + 1}`}
                </div>
                <span className={`badge badge-${route.color}`}>
                  {route.safety_label}
                </span>
              </div>

              <div className="safety-score-row">
                <div
                  className="safety-bar-bg"
                  style={{ '--score': route.safety_score }}
                >
                  <div
                    className="safety-bar-fill"
                    style={{
                      width: `${route.safety_score}%`,
                      background: SCORE_COLORS[route.color],
                    }}
                  />
                </div>
                <span
                  className="score-num"
                  style={{ color: SCORE_COLORS[route.color] }}
                >
                  {route.safety_score}/100
                </span>
              </div>

              <div className="route-stats">
                <span>📏 {route.distance_km} km</span>
                <span>⏱️ ~{route.duration_minutes} min walk</span>
              </div>
            </div>
          ))}

          <BuddyAlert routeContext={routeContext} disabled={!routeContext} />
        </div>
      )}
    </aside>
  )
}
