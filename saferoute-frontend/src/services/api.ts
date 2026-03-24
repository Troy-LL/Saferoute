import axios from 'axios'

/**
 * Local dev: leave `VITE_API_URL` unset (or empty) so requests use the Vite dev server
 * proxy (`vite.config.js` → http://localhost:8000). Set `VITE_API_URL` only if you want
 * to call the API directly (then CORS on the backend must allow localhost:5173).
 * Production builds (Vercel): `VITE_API_URL` must be your deployed API URL at build time.
 */
const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : '')

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

export async function calculateRoute(startLat, startLng, endLat, endLng, timeOfDay = null) {
  const { data } = await api.post('/api/calculate-route', {
    start_lat: startLat,
    start_lng: startLng,
    end_lat: endLat,
    end_lng: endLng,
    time_of_day: timeOfDay ?? new Date().getHours(),
  })
  return data
}

export async function geocodeAddress(address) {
  const { data } = await api.get('/api/geocode', { params: { address } })
  return data.results || []
}

export async function getHeatmapBbox(params) {
  const { data } = await api.get('/api/heatmap', { params })
  return data
}

export async function getDangerHeatmap(timeOfDay = null) {
  const { data } = await api.get('/api/danger-heatmap', {
    params: timeOfDay != null ? { time_of_day: timeOfDay } : {},
  })
  return data
}

export async function getSafeSpots(lat, lng, radiusKm = 2) {
  const { data } = await api.get('/api/safe-spots', {
    params: { lat, lng, radius_km: radiusKm },
  })
  return data
}

export async function getNearestSafeSpot(lat, lng, radiusKm = 10) {
  const { data } = await api.get('/api/safe-spots/nearest', {
    params: { lat, lng, radius_km: radiusKm },
  })
  return data
}

export async function sendBuddyAlert(payload) {
  const { data } = await api.post('/api/buddy-alert', payload)
  return data
}

export default api
