import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Menu, X } from 'lucide-react'
import { toast } from 'sonner'
import SafeMap from '@/components/SafeMap'
import RoutePlanner from '@/components/RoutePlanner'
import MapOverlayPanel from '@/components/MapOverlayPanel'
import SpotDetailPanel from '@/components/SpotDetailPanel'
import AliPresence from '@/components/AliPresence'
import { AliIcon } from '@/components/mascot/Ali'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { RouteResult, HeatmapPoint, SafeSpot } from '@/services/api'
import { calculateRoute, getSafeSpots } from '@/services/api'

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3
  const p1 = lat1 * Math.PI/180
  const p2 = lat2 * Math.PI/180
  const dp = (lat2-lat1) * Math.PI/180
  const dl = (lon2-lon1) * Math.PI/180
  const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function parseCsvLine(line: string): string[] {
  const values: string[] = []
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

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const headers = parseCsvLine(lines[0])
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? ''
    })
    return row
  })
}

export default function MapPage() {
  const [routes, setRoutes] = useState<RouteResult[] | null>(null)
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[] | null>(null)
  const [safeSpots, setSafeSpots] = useState<SafeSpot[]>([])
  const [baseSafeSpots, setBaseSafeSpots] = useState<SafeSpot[]>([])
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showSpots, setShowSpots] = useState(true)
  const [showRealTime, setShowRealTime] = useState(false)
  const [baseMapMode, setBaseMapMode] = useState('transit')

  // --- Real-time Filter Logic ---
  const isSpotOpen = (hours: string | null | undefined): boolean => {
    if (!hours || hours === 'nan') return true // Assume open if unknown for now
    const h = hours.toLowerCase().trim()
    if (h === '24/7' || h.includes('24 hours')) return true
    
    try {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      
      // Handle simple HH:mm-HH:mm format
      const match = h.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/)
      if (match) {
        const startH = parseInt(match[1])
        const startM = parseInt(match[2])
        const endH = parseInt(match[3])
        const endM = parseInt(match[4])
        
        let startTotal = startH * 60 + startM
        let endTotal = endH * 60 + endM
        
        // Handle midnight crossing (e.g., 08:00 - 02:00)
        if (endTotal <= startTotal) {
          return currentMinutes >= startTotal || currentMinutes < endTotal
        }
        return currentMinutes >= startTotal && currentMinutes < endTotal
      }
    } catch (e) {
      console.warn("Failed to parse hours:", hours, e)
    }
    return true // Fallback to showing it
  }

  const filteredSafeSpots = useMemo(() => {
    if (!showRealTime) return safeSpots
    return safeSpots.filter(s => isSpotOpen(s.hours))
  }, [safeSpots, showRealTime])

  const [startMarker, setStartMarker] = useState<{ lat: number; lng: number } | null>(null)
  const [endMarker, setEndMarker] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [routeSearchLoading, setRouteSearchLoading] = useState(false)
  const [travelHour, setTravelHour] = useState(() => new Date().getHours())
  const [isDesktopPanelOpen, setIsDesktopPanelOpen] = useState(false)
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState<SafeSpot | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; heading: number; speed: number } | null>(null)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading ?? 0,
          speed: pos.coords.speed ?? 0,
        })
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [])

  useEffect(() => {
    if (!routes || routes.length === 0) {
      if (baseSafeSpots.length > 0) {
        setSafeSpots(baseSafeSpots)
      }
      return
    }

    const currentRoute = routes[selectedRouteIndex]
    if (!currentRoute?.geometry) return
    
    // Unpack geometry [lng, lat] to {lat, lng}
    const routePoints = currentRoute.geometry.map(([lng, lat]) => ({ lat, lng }))
    
    // We only want spots within ~250 meters of the active route
    const nearSpots = baseSafeSpots.filter(spot => {
      // Downsample check for performance
      for (let i = 0; i < routePoints.length; i += 4) {
        if (getDistance(spot.lat, spot.lng, routePoints[i].lat, routePoints[i].lng) <= 250) {
          return true
        }
      }
      // Check exact boundaries
      if (routePoints.length > 0 && getDistance(spot.lat, spot.lng, routePoints[0].lat, routePoints[0].lng) <= 250) return true
      if (routePoints.length > 0 && getDistance(spot.lat, spot.lng, routePoints[routePoints.length - 1].lat, routePoints[routePoints.length - 1].lng) <= 250) return true
      return false
    })

    setSafeSpots(nearSpots)
  }, [routes, selectedRouteIndex, baseSafeSpots])

  useEffect(() => {
    Promise.all([
      fetch('/data/safety_data_cleaned.csv').then(r => r.text()),
      fetch('/data/crime_incidents.csv').then(r => r.text()),
    ])
      .then(([safeSpotsCsv, incidentsCsv]) => {
        const safeSpotRows = parseCsv(safeSpotsCsv)
        const incidentRows = parseCsv(incidentsCsv)

        const mappedSpots: SafeSpot[] = safeSpotRows
          .map((row: Record<string, string>) => ({
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

        const mappedHeatmap: HeatmapPoint[] = incidentRows
          .map((row: Record<string, string>) => ({
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

        setBaseSafeSpots(mappedSpots)
        setSafeSpots(mappedSpots)
        setHeatmapData(mappedHeatmap)
      })
      .catch(() => {
        setBaseSafeSpots([])
        setSafeSpots([])
        setHeatmapData([])
      })
  }, [])

  const handleRoutesFound = useCallback((foundRoutes: RouteResult[], markers: { start?: { lat: number; lng: number }; end?: { lat: number; lng: number } }) => {
    setRoutes(foundRoutes)
    setSelectedRouteIndex(0)
    if (markers?.start && markers?.end) {
      setStartMarker({ lat: markers.start.lat, lng: markers.start.lng })
      setEndMarker({ lat: markers.end.lat, lng: markers.end.lng })
    }
    // Keep mobile sheet open so user sees route results immediately
    // setIsMobileSheetOpen(false) -- removed intentionally
  }, [])

  const handleSafeSpotsFound = useCallback((spots: SafeSpot[]) => {
    if (Array.isArray(spots) && spots.length > 0) {
      setBaseSafeSpots(prev => {
        const existing = new Set(prev.map(s => `${s.lat.toFixed(5)},${s.lng.toFixed(5)}`))
        const added = spots.filter(s => !existing.has(`${s.lat.toFixed(5)},${s.lng.toFixed(5)}`))
        return [...prev, ...added]
      })
    }
  }, [])

  const handleMapLongPress = useCallback(
    async (latlng: { lat: number; lng: number }) => {
      // First long-press sets start, second long-press sets end and calculates route.
      if (!startMarker || (startMarker && endMarker)) {
        setStartMarker({ lat: latlng.lat, lng: latlng.lng })
        setEndMarker(null)
        setRoutes(null)
        setSelectedRouteIndex(0)
        toast.success('Start point set — long‑press again to set destination')
        return
      }

      // We already have a start marker but no end marker yet.
      setEndMarker({ lat: latlng.lat, lng: latlng.lng })
      setRouteSearchLoading(true)
      setRoutes(null)
      setSelectedRouteIndex(0)

      try {
        const routeData = await calculateRoute(
          startMarker.lat,
          startMarker.lng,
          latlng.lat,
          latlng.lng,
          travelHour,
        )

        setRoutes(routeData)
        setSelectedRouteIndex(0)
        // Open only the correct panel for the current breakpoint
        if (window.innerWidth >= 768) {
          setIsDesktopPanelOpen(true)
        } else {
          setIsMobileSheetOpen(true)
        }

        const midLat = (startMarker.lat + latlng.lat) / 2
        const midLng = (startMarker.lng + latlng.lng) / 2
        const spots = await getSafeSpots(midLat, midLng, 1.5)
        if (Array.isArray(spots) && spots.length > 0) {
          setBaseSafeSpots(prev => {
            const existing = new Set(prev.map(s => `${s.lat.toFixed(5)},${s.lng.toFixed(5)}`))
            const added = spots.filter(s => !existing.has(`${s.lat.toFixed(5)},${s.lng.toFixed(5)}`))
            return [...prev, ...added]
          })
        }

        toast.success('Route calculated from map clicks')
      } catch (err) {
        const error = err as { message?: string }
        toast.error(error.message || 'Failed to calculate route from map clicks')
        // Reset end marker on failure so user can try again
        setEndMarker(null)
      } finally {
        setRouteSearchLoading(false)
      }
    },
    [startMarker, endMarker, travelHour],
  )

  const handleClearRoute = useCallback(() => {
    setRoutes(null)
    setStartMarker(null)
    setEndMarker(null)
    setSelectedRouteIndex(0)
    toast.success('Route and pins cleared')
  }, [])

  const handleRouteClick = useCallback((index: number) => {
    setSelectedRouteIndex(index)
    // Only open the relevant panel for the current breakpoint.
    // Opening the mobile Sheet on desktop triggers its dark backdrop overlay.
    if (window.innerWidth >= 768) {
      setIsDesktopPanelOpen(true)
    } else {
      setIsMobileSheetOpen(true)
    }
  }, [])

  const handleSpotClick = useCallback((spot: SafeSpot) => {
    setSelectedSpot(spot)
  }, [])

  return (
    <div className="flex h-[calc(100vh-5rem)]">
      {/* Desktop: side-by-side layout */}
      <div className={`hidden md:block ${isDesktopPanelOpen ? 'md:w-96' : 'md:w-0'} transition-all duration-300 overflow-hidden`}>
        <RoutePlanner
          travelHour={travelHour}
          onTravelHourChange={setTravelHour}
          onRoutesFound={handleRoutesFound}
          onSafeSpotsFound={handleSafeSpotsFound}
          onSelectedRouteChange={setSelectedRouteIndex}
          onLoadingChange={setRouteSearchLoading}
          externalRoutes={routes}
          externalSelectedIndex={selectedRouteIndex}
          startMarker={startMarker}
          endMarker={endMarker}
          onClear={handleClearRoute}
        />
      </div>

      {/* Mobile: Sheet drawer */}
      <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
        <SheetContent side="left" className="w-full sm:w-96 p-0 md:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>Route Planner</SheetTitle>
          </SheetHeader>
          <RoutePlanner
            travelHour={travelHour}
            onTravelHourChange={setTravelHour}
            onRoutesFound={handleRoutesFound}
            onSafeSpotsFound={handleSafeSpotsFound}
            onSelectedRouteChange={setSelectedRouteIndex}
            onLoadingChange={setRouteSearchLoading}
            externalRoutes={routes}
            externalSelectedIndex={selectedRouteIndex}
            startMarker={startMarker}
            endMarker={endMarker}
            onClear={handleClearRoute}
          />
        </SheetContent>
      </Sheet>

      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 z-0 min-h-0">
          <SafeMap
            startMarker={startMarker}
            endMarker={endMarker}
            routes={routes}
            highlightedRouteIndex={selectedRouteIndex}
            heatmapData={showHeatmap ? heatmapData : null}
            safeSpots={!showSpots || baseMapMode === 'satellite' ? [] : filteredSafeSpots}
            onMapClick={undefined}
            onMapLongPress={handleMapLongPress}
            onRouteClick={handleRouteClick}
            onSpotClick={handleSpotClick}
            onClearRoute={handleClearRoute}
            baseMapMode={baseMapMode}
          />
        </div>

        {routeSearchLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 shadow-lg">
              <div className="ali-waiting">
                <AliIcon size={64} />
              </div>
              <p className="text-sm text-muted-foreground">Finding you the safest path...</p>
            </div>
          </div>
        )}

        {!routes?.length && !routeSearchLoading && (
          <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-xl border border-border bg-card/90 p-4 shadow-md backdrop-blur-sm md:left-1/2 md:-translate-x-1/2">
            <h2 className="text-sm font-semibold text-foreground">Map Preview Ready</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Use Layers to toggle features, or enter start/destination to route.
            </p>
          </div>
        )}

        {/* Toggle button for route planner */}
        <div className="absolute left-4 top-4 z-50">
          {/* Desktop button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsDesktopPanelOpen(!isDesktopPanelOpen)}
            className="hidden md:flex h-10 w-10 rounded-xl bg-card/90 shadow-md backdrop-blur-sm"
            aria-label={isDesktopPanelOpen ? "Close route planner" : "Open route planner"}
          >
            {isDesktopPanelOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          {/* Mobile button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMobileSheetOpen(!isMobileSheetOpen)}
            className="flex md:hidden h-10 w-10 rounded-xl bg-card/90 shadow-md backdrop-blur-sm"
            aria-label={isMobileSheetOpen ? "Close route planner" : "Open route planner"}
          >
            {isMobileSheetOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Layer overlay panel — top-right */}
        <div className="absolute right-4 top-4 z-50">
          <MapOverlayPanel
            showHeatmap={showHeatmap}
            onShowHeatmapChange={setShowHeatmap}
            showSpots={showSpots}
            onShowSpotsChange={setShowSpots}
            showRealTime={showRealTime}
            onShowRealTimeChange={setShowRealTime}
            baseMapMode={baseMapMode}
            onBaseMapModeChange={setBaseMapMode}
          />
        </div>

        {/* Spot detail panel */}
        <SpotDetailPanel
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
        />

        {/* Ali ambient presence */}
        <AliPresence isLoading={routeSearchLoading} />
      </div>
    </div>
  )
}
