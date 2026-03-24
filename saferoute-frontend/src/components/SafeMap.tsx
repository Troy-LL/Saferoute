import { useEffect, useRef, useState, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { Plus, Minus, Locate } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import type { RouteResult, HeatmapPoint, SafeSpot } from '../services/api'
import { renderAliPointerHTML } from './mascot/Ali'

// Fix Leaflet default icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// @ts-expect-error _getIconUrl is a private property not in the type definitions
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

// Metro Manila center
const METRO_MANILA: [number, number] = [14.5995, 121.0175]
const SAFE_SPOT_MIN_ZOOM = 14
const CARTO_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

const TILE_LAYER_CONFIG = {
  transit_dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    options: { attribution: CARTO_ATTRIBUTION, subdomains: 'abcd', maxZoom: 20 },
  },
  transit_light: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    options: { attribution: CARTO_ATTRIBUTION, subdomains: 'abcd', maxZoom: 20 },
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; Esri',
      maxZoom: 20,
    },
  },
}

interface SafeMapProps {
  routes: RouteResult[] | null
  baseMapMode?: string
  heatmapData: HeatmapPoint[] | null
  safeSpots: SafeSpot[]
  onMapClick?: (latlng: L.LatLng) => void
  startMarker: { lat: number; lng: number } | null
  endMarker: { lat: number; lng: number } | null
  highlightedRouteIndex?: number
  userLocation?: { lat: number; lng: number; heading: number; speed: number } | null
  onSpotClick?: (spot: SafeSpot) => void
}

export default function SafeMap({
  routes,
  baseMapMode = 'transit',
  heatmapData,
  safeSpots,
  onMapClick,
  startMarker,
  endMarker,
  highlightedRouteIndex = 0,
  userLocation,
  onSpotClick,
}: SafeMapProps) {
  const { resolvedTheme } = useTheme()
  const [mapZoom, setMapZoom] = useState(13)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const routeLayers = useRef<L.Layer[]>([])
  const heatLayer = useRef<L.Layer | null>(null)
  const spotsLayer = useRef<L.Layer[]>([])
  const endpointMarkers = useRef<L.Marker[]>([])
  const baseLayerRef = useRef<L.TileLayer | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)

  // Initialize map
  useEffect(() => {
    if (mapInstance.current) return

    const map = L.map(mapRef.current!, {
      center: METRO_MANILA,
      zoom: 13,
      zoomControl: false,
    })

    const initialLayerConfig = TILE_LAYER_CONFIG.transit_dark
    baseLayerRef.current = L.tileLayer(initialLayerConfig.url, initialLayerConfig.options).addTo(map)

    mapInstance.current = map
    setMapZoom(map.getZoom())

    const handleZoomEnd = () => setMapZoom(map.getZoom())
    map.on('zoomend', handleZoomEnd)

    return () => {
      map.off('zoomend', handleZoomEnd)
      map.remove()
      mapInstance.current = null
    }
  }, [])

  // Switch basemap style — reacts to both user-chosen mode and dark/light theme
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current)
      baseLayerRef.current = null
    }

    let tileKey: keyof typeof TILE_LAYER_CONFIG
    if (baseMapMode === 'satellite') {
      tileKey = 'satellite'
    } else {
      tileKey = resolvedTheme === 'light' ? 'transit_light' : 'transit_dark'
    }

    const nextLayerConfig = TILE_LAYER_CONFIG[tileKey]
    baseLayerRef.current = L.tileLayer(nextLayerConfig.url, nextLayerConfig.options).addTo(map)
  }, [baseMapMode, resolvedTheme])

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

    const COLORS: Record<string, string> = {
      green:  '#FF91A4',   // pink for the safest route (brand primary)
      yellow: '#F59E0B',
      red:    '#EF4444',
    }
    const WIDTHS = [5, 4, 3.5]

    routes.forEach((route, idx) => {
      // Convert [lng, lat] → [lat, lng] for Leaflet
      const latlngs = route.geometry.map(([lng, lat]): [number, number] => [lat, lng])
      const color = COLORS[route.color] || '#FF91A4'
      const weight = WIDTHS[idx] || 3
      const isHighlighted = idx === highlightedRouteIndex

      // Soft glow halo behind the route line
      const glowLine = L.polyline(latlngs, {
        color,
        weight: weight + 8,
        opacity: isHighlighted ? 0.2 : 0.08,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map)

      const line = L.polyline(latlngs, {
        color,
        weight,
        opacity: isHighlighted ? 0.95 : 0.45,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: isHighlighted ? undefined : '8 6',
      }).addTo(map)

      // Firefly animation on the highlighted (selected) route
      if (isHighlighted) {
        // Wait one tick so the element is in the DOM
        setTimeout(() => {
          const el = line.getElement()
          if (el) el.classList.add('leaflet-firefly')
        }, 0)
      }

      line.bindTooltip(`
        <div style="font-family: 'Poppins', sans-serif; font-size: 13px; line-height: 1.6;">
          <strong>Route ${idx + 1}</strong><br/>
          Safety: ${route.safety_score}/100 (${route.safety_label})<br/>
          ${route.distance_km} km &middot; ${route.duration_minutes} min
        </div>
      `, { sticky: true })

      routeLayers.current.push(glowLine, line)
    })

    // Fit map to route bounds
    if (routes[0]?.geometry?.length > 0) {
      const allCoords = routes.flatMap(r => r.geometry).map(([lng, lat]): [number, number] => [lat, lng])
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

    const isDark = resolvedTheme === 'dark'
    const heatOpacity = isDark ? 0.7 : 0.6

    if (typeof (L as any).heatLayer === 'function') {
      const points = heatmapData.map(d => [
        d.lat,
        d.lng,
        typeof d.intensity === 'number' ? d.intensity : 0.6,
      ])
      const layer = (L as any).heatLayer(points, {
        radius: 22,
        blur: 16,
        minOpacity: heatOpacity * 0.6,
        maxZoom: 17,
        gradient: {
          0.0: '#FFFACD',
          0.35: '#FF8C42',
          0.7: '#C0392B',
          1.0: '#8B1A1A',
        },
      }).addTo(map)
      heatLayer.current = layer
    } else {
      heatmapData.slice(0, 200).forEach(d => {
        const opacity = d.intensity * heatOpacity
        const radius = 10 + d.intensity * 15
        const layer = L.circleMarker([d.lat, d.lng], {
          radius,
          fillColor: '#C0392B',
          fillOpacity: opacity,
          stroke: false,
        }).addTo(map)
        routeLayers.current.push(layer)
      })
    }
  }, [heatmapData])

  // Draw safe spots — two-layer pin design with lazy tooltips
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    spotsLayer.current.forEach(l => map.removeLayer(l))
    spotsLayer.current = []

    if (!safeSpots || safeSpots.length === 0) return
    if (mapZoom < SAFE_SPOT_MIN_ZOOM) return

    const SPOT_COLORS: Record<string, { label: string; color: string; category: string }> = {
      police_station:    { label: 'Police Station',    color: '#3498DB', category: 'Emergency' },
      convenience_store: { label: 'Convenience Store',  color: '#2ECC71', category: 'Safe Zone' },
      security_post:     { label: 'Security Post',     color: '#2ECC71', category: 'Safe Zone' },
      hospital:          { label: 'Hospital',           color: '#3498DB', category: 'Emergency' },
      fire_station:      { label: 'Fire Station',      color: '#3498DB', category: 'Emergency' },
      street_lamp:       { label: 'Street Lamp',       color: '#F39C12', category: 'Caution' },
      surveillance:      { label: 'Surveillance',      color: '#9B59B6', category: 'Community' },
    }

    const OUTER_R = 20
    const INNER_R = 7

    safeSpots.forEach(spot => {
      const meta = SPOT_COLORS[spot.type] || { label: 'Safe Spot', color: '#2ECC71', category: 'Safe Zone' }

      const outerRing = L.circleMarker([spot.lat, spot.lng], {
        radius: OUTER_R,
        color: meta.color,
        weight: 2,
        fillColor: meta.color,
        fillOpacity: 0.12,
        className: 'spot-outer-ring',
      }).addTo(map)

      const innerDot = L.circleMarker([spot.lat, spot.lng], {
        radius: INNER_R,
        color: '#fff',
        weight: 2,
        fillColor: meta.color,
        fillOpacity: 1,
      }).addTo(map)

      // Lazy tooltip on hover — created on mouseover, removed on mouseout
      innerDot.on('mouseover', () => {
        const tooltipContent = `
          <div class="spot-tooltip">
            <div class="spot-tooltip-name">${spot.name}</div>
            ${spot.address ? `<div class="spot-tooltip-desc">${spot.address}</div>` : ''}
            <span class="spot-tooltip-badge" style="background:${meta.color}">${meta.label}</span>
          </div>`
        innerDot.bindTooltip(tooltipContent, {
          direction: 'top',
          offset: [0, -12],
          className: 'spot-tooltip-container',
        }).openTooltip()

        outerRing.setRadius(28)
      })

      innerDot.on('mouseout', () => {
        innerDot.unbindTooltip()
        outerRing.setRadius(OUTER_R)
      })

      innerDot.on('click', () => {
        onSpotClick?.(spot)
      })

      spotsLayer.current.push(outerRing, innerDot)
    })
  }, [safeSpots, mapZoom, onSpotClick])

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

  // User location marker (Ali the firefly pointer)
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    if (!userLocation) {
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current)
        userMarkerRef.current = null
      }
      return
    }

    const isDark = resolvedTheme === 'dark'
    const isMoving = (userLocation.speed ?? 0) > 0.5
    const heading = userLocation.heading ?? 0
    const size = 48

    const aliIcon = L.divIcon({
      className: 'ali-pointer-marker',
      html: renderAliPointerHTML(heading, isMoving, isDark, size),
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng])
      userMarkerRef.current.setIcon(aliIcon)
    } else {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: aliIcon,
        zIndexOffset: 1000,
      }).addTo(map)
    }
  }, [userLocation, resolvedTheme])

  const handleZoomIn = useCallback(() => mapInstance.current?.zoomIn(), [])
  const handleZoomOut = useCallback(() => mapInstance.current?.zoomOut(), [])
  const handleLocate = useCallback(() => {
    if (!userLocation || !mapInstance.current) return
    mapInstance.current.flyTo([userLocation.lat, userLocation.lng], 16, { duration: 0.8 })
  }, [userLocation])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} id="safemap" className="w-full h-full" />

      {/* Custom map controls — bottom-right pill stack */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-0.5 map-glass-card rounded-xl overflow-hidden">
        <button
          onClick={handleZoomIn}
          className="flex items-center justify-center h-10 w-10 text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className="mx-2 h-px bg-border" />
        <button
          onClick={handleZoomOut}
          className="flex items-center justify-center h-10 w-10 text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="mx-2 h-px bg-border" />
        <button
          onClick={handleLocate}
          className="flex items-center justify-center h-10 w-10 text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          aria-label="Go to my location"
        >
          <Locate className="h-4 w-4" />
        </button>
      </div>

      {/* Legends — bottom-left */}
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
        {/* Route safety legend */}
        <div className="map-glass-card rounded-xl p-2.5">
          <div className="mb-1.5 text-[10px] font-semibold text-foreground">Route Safety</div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#FF91A4', boxShadow: '0 0 4px rgba(255,145,164,0.6)' }} />
              Safe
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#f59e0b' }} />
              Moderate
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#ef4444' }} />
              Risk
            </span>
          </div>
        </div>

        {/* Heatmap gradient legend */}
        {heatmapData && heatmapData.length > 0 && (
          <div className="map-glass-card rounded-xl p-2.5">
            <div className="mb-1.5 text-[10px] font-semibold text-foreground">Crime Density</div>
            <div
              className="h-2.5 w-[120px] rounded-full"
              style={{ background: 'linear-gradient(to right, #FFFACD, #FF8C42, #C0392B)' }}
            />
            <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
