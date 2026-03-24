import { useState, useCallback, useEffect, useRef } from 'react'
import { Menu, X } from 'lucide-react'
import SafeMap from '@/components/SafeMap'
import RoutePlanner from '@/components/RoutePlanner'
import MapOverlayPanel from '@/components/MapOverlayPanel'
import SpotDetailPanel from '@/components/SpotDetailPanel'
import AliPresence from '@/components/AliPresence'
import { AliIcon } from '@/components/mascot/Ali'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { RouteResult, HeatmapPoint, SafeSpot } from '@/services/api'

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
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [showSpots, setShowSpots] = useState(true)
  const [startMarker, setStartMarker] = useState<{ lat: number; lng: number } | null>(null)
  const [endMarker, setEndMarker] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [routeSearchLoading, setRouteSearchLoading] = useState(false)
  const [travelHour, setTravelHour] = useState(() => new Date().getHours())
  const [baseMapMode, setBaseMapMode] = useState('transit')
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

        setSafeSpots(mappedSpots)
        setHeatmapData(mappedHeatmap)
      })
      .catch(() => {
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
    // Auto-close mobile sheet after route is found
    setIsMobileSheetOpen(false)
  }, [])

  const handleSafeSpotsFound = useCallback((spots: SafeSpot[]) => {
    if (Array.isArray(spots) && spots.length > 0) {
      setSafeSpots(spots)
    }
  }, [])

  const handleMapClick = useCallback(() => {
    // Future: tap-to-set start/end
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
          />
        </SheetContent>
      </Sheet>

      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 z-0 min-h-0">
          <SafeMap
            routes={routes}
            highlightedRouteIndex={selectedRouteIndex}
            baseMapMode={baseMapMode}
            heatmapData={showHeatmap ? heatmapData : null}
            safeSpots={showSpots ? safeSpots : []}
            onMapClick={handleMapClick}
            startMarker={startMarker}
            endMarker={endMarker}
            userLocation={userLocation}
            onSpotClick={handleSpotClick}
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
