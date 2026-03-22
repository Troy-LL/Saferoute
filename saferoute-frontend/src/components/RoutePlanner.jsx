import { useState } from 'react'
import axios from 'axios'
import './RoutePlanner.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function RoutePlanner({ onRoutesFound, onSafeSpotsFound }) {
  const [startInput, setStartInput] = useState('')
  const [endInput, setEndInput] = useState('')
  const [hour, setHour] = useState(new Date().getHours())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [routes, setRoutes] = useState(null)
  const [selectedRoute, setSelectedRoute] = useState(0)
  const [buddyModalOpen, setBuddyModalOpen] = useState(false)
  const [buddyPhone, setBuddyPhone] = useState('')
  const [buddyName, setBuddyName] = useState('')
  const [alertSent, setAlertSent] = useState(false)

  async function geocode(query) {
    const res = await axios.get(`${API_BASE}/api/geocode`, {
      params: { address: query }
    })
    const results = res.data.results
    if (!results || results.length === 0) throw new Error(`No results for "${query}"`)
    return results[0]
  }

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
      // Geocode both locations
      const [start, end] = await Promise.all([
        geocode(startInput + ' Metro Manila Philippines'),
        geocode(endInput + ' Metro Manila Philippines')
      ])

      // Calculate routes
      const res = await axios.post(`${API_BASE}/api/calculate-route`, {
        start_lat: start.lat,
        start_lng: start.lng,
        end_lat: end.lat,
        end_lng: end.lng,
        time_of_day: hour
      })

      setRoutes(res.data)
      onRoutesFound(res.data, { start, end })

      // Also load safe spots
      const spotsRes = await axios.get(`${API_BASE}/api/safe-spots`, {
        params: {
          lat: (start.lat + end.lat) / 2,
          lng: (start.lng + end.lng) / 2,
          radius_km: 1.5
        }
      })
      if (onSafeSpotsFound) onSafeSpotsFound(spotsRes.data)

    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to calculate route')
    } finally {
      setLoading(false)
    }
  }

  async function sendBuddyAlert() {
    if (!buddyPhone) {
      alert('Please enter a buddy phone number')
      return
    }
    try {
      await axios.post(`${API_BASE}/api/buddy-alert`, {
        user_name: buddyName || 'A SafeRoute user',
        current_lat: 14.5995,
        current_lng: 121.0175,
        current_address: startInput || 'Metro Manila',
        destination: endInput || 'Destination',
        buddy_phone: buddyPhone
      })
      setAlertSent(true)
      setTimeout(() => {
        setBuddyModalOpen(false)
        setAlertSent(false)
        setBuddyPhone('')
      }, 3000)
    } catch (err) {
      alert('Could not send alert: ' + (err.response?.data?.detail || err.message))
    }
  }

  const SCORE_COLORS = { green: '#10B981', yellow: '#F59E0B', red: '#EF4444' }
  const timeLabel = `${String(hour).padStart(2, '0')}:00`

  return (
    <aside className="route-planner">
      <div className="planner-header">
        <h2 className="planner-title">🗺️ Plan Safe Route</h2>
        <p className="planner-subtitle">Enter your walkway in Metro Manila</p>
      </div>

      <form onSubmit={handleSearch} className="planner-form">
        <div className="field">
          <label className="field-label">📍 From</label>
          <input
            className="input"
            placeholder="e.g., Katipunan MRT Station"
            value={startInput}
            onChange={e => setStartInput(e.target.value)}
            id="start-location"
          />
        </div>
        <div className="field">
          <label className="field-label">🏁 To</label>
          <input
            className="input"
            placeholder="e.g., Ateneo Gate 1"
            value={endInput}
            onChange={e => setEndInput(e.target.value)}
            id="end-location"
          />
        </div>
        <div className="field">
          <label className="field-label">🕐 Time of Travel: <strong>{timeLabel}</strong></label>
          <input
            type="range"
            min="0" max="23"
            value={hour}
            onChange={e => setHour(Number(e.target.value))}
            className="time-slider"
            id="time-slider"
          />
          <div className="time-hints">
            <span>🌅 6am</span>
            <span>☀️ Noon</span>
            <span>🌙 Midnight</span>
          </div>
        </div>

        {error && <div className="error-msg">❌ {error}</div>}

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} id="find-route-btn">
          {loading ? <><span className="spinner"></span> Calculating...</> : '🛡️ Find Safest Route'}
        </button>
      </form>

      {/* Route Results */}
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
              onClick={() => setSelectedRoute(idx)}
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
                    style={{ width: `${route.safety_score}%`, background: SCORE_COLORS[route.color] }}
                  />
                </div>
                <span className="score-num" style={{ color: SCORE_COLORS[route.color] }}>
                  {route.safety_score}/100
                </span>
              </div>

              <div className="route-stats">
                <span>📏 {route.distance_km} km</span>
                <span>⏱️ ~{route.duration_minutes} min walk</span>
              </div>
            </div>
          ))}

          {/* Buddy Alert */}
          <button
            className="btn btn-danger"
            style={{ width: '100%', marginTop: '8px' }}
            onClick={() => setBuddyModalOpen(true)}
            id="buddy-alert-btn"
          >
            🆘 Alert Emergency Buddy
          </button>
        </div>
      )}

      {/* Buddy Alert Modal */}
      {buddyModalOpen && (
        <div className="modal-overlay" onClick={() => setBuddyModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>🆘 Send Buddy Alert</h3>
            <p>Your buddy will receive an SMS with your current location and route details.</p>

            {alertSent ? (
              <div className="alert-success">
                ✅ Alert sent! Your buddy has been notified.
              </div>
            ) : (
              <>
                <div className="field">
                  <label className="field-label">Your Name</label>
                  <input
                    className="input"
                    placeholder="e.g., Maria"
                    value={buddyName}
                    onChange={e => setBuddyName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Buddy's Phone (with country code)</label>
                  <input
                    className="input"
                    placeholder="+63 9XX XXX XXXX"
                    value={buddyPhone}
                    onChange={e => setBuddyPhone(e.target.value)}
                  />
                </div>
                <div className="modal-actions">
                  <button className="btn btn-glass" onClick={() => setBuddyModalOpen(false)}>Cancel</button>
                  <button className="btn btn-danger" onClick={sendBuddyAlert}>🆘 Send Alert</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
