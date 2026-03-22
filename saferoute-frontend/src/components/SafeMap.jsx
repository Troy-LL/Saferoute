import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import './SafeMap.css'

// Fix Leaflet default icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

// Metro Manila center
const METRO_MANILA = [14.5995, 121.0175]

export default function SafeMap({
  routes,
  heatmapData,
  safeSpots,
  onMapClick,
  startMarker,
  endMarker,
  highlightedRouteIndex = 0,
}) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const routeLayers = useRef([])
  const heatLayer = useRef(null)
  const spotsLayer = useRef([])
  const endpointMarkers = useRef([])

  // Initialize map
  useEffect(() => {
    if (mapInstance.current) return

    const map = L.map(mapRef.current, {
      center: METRO_MANILA,
      zoom: 13,
      zoomControl: true,
    })

    // Dark tile layer from CartoDB
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }
    ).addTo(map)

    map.on('click', (e) => {
      if (onMapClick) onMapClick(e.latlng)
    })

    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  // Update click handler when callback changes
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return
    map.off('click')
    map.on('click', (e) => {
      if (onMapClick) onMapClick(e.latlng)
    })
  }, [onMapClick])

  // Draw routes
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    // Clear old routes
    routeLayers.current.forEach(l => map.removeLayer(l))
    routeLayers.current = []

    if (!routes || routes.length === 0) return

    const COLORS = {
      green: '#10B981',
      yellow: '#F59E0B',
      red: '#EF4444'
    }
    const WIDTHS = [5, 4, 3.5]

    routes.forEach((route, idx) => {
      // Convert [lng, lat] → [lat, lng] for Leaflet
      const latlngs = route.geometry.map(([lng, lat]) => [lat, lng])
      const color = COLORS[route.color] || '#fff'
      const weight = WIDTHS[idx] || 3
      const isHighlighted = idx === highlightedRouteIndex

      // Glow effect: draw thick transparent line behind
      const glowLine = L.polyline(latlngs, {
        color,
        weight: weight + 6,
        opacity: 0.15,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map)

      const line = L.polyline(latlngs, {
        color,
        weight,
        opacity: isHighlighted ? 0.95 : 0.55,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: isHighlighted ? null : '8 6'
      }).addTo(map)

      line.bindTooltip(`
        <div style="font-family: Inter, sans-serif; font-size: 13px;">
          <strong>Route ${idx + 1}</strong><br/>
          🛡️ Safety: ${route.safety_score}/100 (${route.safety_label})<br/>
          📍 ${route.distance_km} km · ${route.duration_minutes} min
        </div>
      `, { sticky: true })

      routeLayers.current.push(glowLine, line)
    })

    // Fit map to route bounds
    if (routes[0]?.geometry?.length > 0) {
      const allCoords = routes.flatMap(r => r.geometry).map(([lng, lat]) => [lat, lng])
      map.fitBounds(L.latLngBounds(allCoords), { padding: [60, 60] })
    }
  }, [routes, highlightedRouteIndex])

  // Draw heatmap
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    // Remove old heatmap
    if (heatLayer.current) {
      map.removeLayer(heatLayer.current)
      heatLayer.current = null
    }

    if (!heatmapData || heatmapData.length === 0) return

    // Use leaflet.heat if available
    if (typeof L.heatLayer === 'function') {
      const points = heatmapData.map(d => [
        d.lat,
        d.lng,
        typeof d.intensity === 'number' ? d.intensity : 0.6,
      ])
      const layer = L.heatLayer(points, {
        radius: 20,
        blur: 15,
        minOpacity: 0.4,
        gradient: {
          0.0: '#10B981',
          0.4: '#F59E0B',
          0.7: '#EF4444',
          1.0: '#B91C1C'
        }
      }).addTo(map)
      heatLayer.current = layer
    } else {
      // Fallback: circle markers
      heatmapData.slice(0, 200).forEach(d => {
        const opacity = d.intensity * 0.6
        const radius = 10 + d.intensity * 15
        const layer = L.circleMarker([d.lat, d.lng], {
          radius: radius,
          fillColor: '#EF4444',
          fillOpacity: opacity,
          stroke: false
        }).addTo(map)
        routeLayers.current.push(layer)
      })
    }
  }, [heatmapData])

  // Draw safe spots
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    spotsLayer.current.forEach(l => map.removeLayer(l))
    spotsLayer.current = []

    if (!safeSpots || safeSpots.length === 0) return

    const TYPE_ICONS = {
      police_station: '🚔',
      convenience_store: '🏪',
      security_post: '🛡️',
      hospital: '🏥',
      fire_station: '🚒'
    }

    safeSpots.forEach(spot => {
      const emoji = TYPE_ICONS[spot.type] || '📍'
      const icon = L.divIcon({
        html: `<div class="safe-spot-marker">${emoji}</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
      const marker = L.marker([spot.lat, spot.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div class="spot-popup">
            <strong>${emoji} ${spot.name}</strong><br/>
            <span style="color: #8B949E;">${String(spot.type || '').replace(/_/g, ' ')}</span><br/>
            ${spot.address ? `📌 ${spot.address}<br/>` : ''}
            🕐 ${spot.hours || '—'}<br/>
            📍 ${spot.city || ''}
            ${spot.distance_km != null ? `<br/><strong>${spot.distance_km} km away</strong>` : ''}
          </div>
        `)
      spotsLayer.current.push(marker)
    })
  }, [safeSpots])

  // Start / end markers (geocoded search points)
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    endpointMarkers.current.forEach(m => map.removeLayer(m))
    endpointMarkers.current = []

    const startIcon = L.divIcon({
      className: 'endpoint-marker endpoint-start',
      html: '<div class="endpoint-pin">A</div>',
      iconSize: [28, 36],
      iconAnchor: [14, 36],
    })
    const endIcon = L.divIcon({
      className: 'endpoint-marker endpoint-end',
      html: '<div class="endpoint-pin">B</div>',
      iconSize: [28, 36],
      iconAnchor: [14, 36],
    })

    if (startMarker) {
      const m = L.marker([startMarker.lat, startMarker.lng], { icon: startIcon })
        .addTo(map)
        .bindPopup('Start')
      endpointMarkers.current.push(m)
    }
    if (endMarker) {
      const m = L.marker([endMarker.lat, endMarker.lng], { icon: endIcon })
        .addTo(map)
        .bindPopup('Destination')
      endpointMarkers.current.push(m)
    }
  }, [startMarker, endMarker])

  return (
    <div className="safemap-container">
      <div ref={mapRef} id="safemap" style={{ width: '100%', height: '100%' }} />

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-title">Route Safety</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#10B981' }}></span>Safe</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#F59E0B' }}></span>Moderate</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#EF4444' }}></span>High Risk</div>
      </div>
    </div>
  )
}
