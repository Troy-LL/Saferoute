import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import {
  MapPin,
  Navigation,
  Clock,
  Shield,
  Ruler,
  Timer,
  Star,
  Loader2,
  X,
  Search,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import BuddyAlert from '@/components/BuddyAlert'
import type { RouteResult, SafeSpot, GeocodedLocation, RailwaySchedule } from '@/services/api'
import { calculateRoute, geocodeAddress, getSafeSpots, getRailwaySchedules } from '@/services/api'

interface RouteContext {
  start: { lat: number; lng: number }
  end: { lat: number; lng: number }
  startLabel: string
  endLabel: string
}

interface RoutePlannerProps {
  travelHour?: number
  onTravelHourChange?: (hour: number) => void
  onRoutesFound: (
    routes: RouteResult[],
    markers: {
      start: { lat: number; lng: number }
      end: { lat: number; lng: number }
    },
  ) => void
  onSafeSpotsFound?: (spots: SafeSpot[]) => void
  onSelectedRouteChange?: (index: number) => void
  onLoadingChange?: (loading: boolean) => void
  /** Markers and routes driven from the parent (e.g. after map long-press or click) */
  startMarker?: { lat: number; lng: number } | null
  endMarker?: { lat: number; lng: number } | null
  externalRoutes?: RouteResult[] | null
  externalSelectedIndex?: number
  onClear?: () => void
}

const SCORE_COLORS: Record<string, string> = {
  green: '#22c55e',
  yellow: '#f59e0b',
  red: '#ef4444',
}

const GEOCODE_SUFFIX = ' Metro Manila Philippines'
const AUTOCOMPLETE_DEBOUNCE_MS = 350
const MIN_QUERY_LEN = 2

export default function RoutePlanner({
  travelHour,
  onTravelHourChange,
  onRoutesFound,
  onSafeSpotsFound,
  onSelectedRouteChange,
  onLoadingChange,
  externalRoutes,
  externalSelectedIndex,
  startMarker,
  endMarker,
  onClear,
}: RoutePlannerProps) {
  const [startInput, setStartInput] = useState('')
  const [endInput, setEndInput] = useState('')
  const hour = travelHour ?? new Date().getHours()
  const setHour = onTravelHourChange ?? (() => {})
  const [loading, setLoading] = useState(false)
  const [routes, setRoutes] = useState<RouteResult[] | null>(null)
  const [selectedRoute, setSelectedRoute] = useState(0)
  const [routeContext, setRouteContext] = useState<RouteContext | null>(null)

  // Sync external selection (e.g. route clicked on map) into local state
  useEffect(() => {
    if (externalSelectedIndex !== undefined) {
      setSelectedRoute(externalSelectedIndex)
    }
  }, [externalSelectedIndex])

  // The "effective" routes & selection: prefer external (map-driven) over internal
  const activeRoutes = externalRoutes ?? routes
  const activeSelectedRoute = externalSelectedIndex ?? selectedRoute

  const [startResolved, setStartResolved] = useState<GeocodedLocation | null>(null)
  const [endResolved, setEndResolved] = useState<GeocodedLocation | null>(null)
  const [startSuggestions, setStartSuggestions] = useState<GeocodedLocation[]>([])
  const [endSuggestions, setEndSuggestions] = useState<GeocodedLocation[]>([])
  const [startSuggestOpen, setStartSuggestOpen] = useState(false)
  const [endSuggestOpen, setEndSuggestOpen] = useState(false)
  const startDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const endDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [schedules, setSchedules] = useState<RailwaySchedule[]>([])

  useEffect(() => {
    getRailwaySchedules().then(setSchedules)
  }, [])

  // Sync external map markers into input labels
  useEffect(() => {
    if (startMarker) {
      setStartInput(`${startMarker.lat.toFixed(5)}, ${startMarker.lng.toFixed(5)}`)
      setStartResolved({ label: 'Map Pin', lat: startMarker.lat, lng: startMarker.lng })
      setStartSuggestOpen(false)
    } else if (!activeRoutes) {
      // Only clear if we don't have an active route (to avoid clearing on fresh route load)
      // setStartInput('')
    }
  }, [startMarker, activeRoutes])

  useEffect(() => {
    if (endMarker) {
      setEndInput(`${endMarker.lat.toFixed(5)}, ${endMarker.lng.toFixed(5)}`)
      setEndResolved({ label: 'Map Pin', lat: endMarker.lat, lng: endMarker.lng })
      setEndSuggestOpen(false)
    }
  }, [endMarker])

  const fetchSuggestions = useCallback(async (raw: string) => {
    const q = raw.trim()
    if (q.length < MIN_QUERY_LEN) return []
    const results = await geocodeAddress(q + GEOCODE_SUFFIX)
    return results || []
  }, [])

  useEffect(() => {
    onLoadingChange?.(loading)
  }, [loading, onLoadingChange])

  useEffect(() => {
    if (!routes?.length) return
    setSelectedRoute(0)
    onSelectedRouteChange?.(0)
  }, [routes, onSelectedRouteChange])

  async function geocode(query: string) {
    const results = await geocodeAddress(query + GEOCODE_SUFFIX)
    if (!results || results.length === 0)
      throw new Error(`No results for "${query}"`)
    return results[0]
  }

  function scheduleStartSuggestions(value: string) {
    if (startDebounceRef.current) clearTimeout(startDebounceRef.current)
    if (value.trim().length < MIN_QUERY_LEN) {
      setStartSuggestions([])
      setStartSuggestOpen(false)
      return
    }
    startDebounceRef.current = setTimeout(async () => {
      try {
        const list = await fetchSuggestions(value)
        setStartSuggestions(list)
        setStartSuggestOpen(list.length > 0)
      } catch {
        setStartSuggestions([])
        setStartSuggestOpen(false)
      }
    }, AUTOCOMPLETE_DEBOUNCE_MS)
  }

  function scheduleEndSuggestions(value: string) {
    if (endDebounceRef.current) clearTimeout(endDebounceRef.current)
    if (value.trim().length < MIN_QUERY_LEN) {
      setEndSuggestions([])
      setEndSuggestOpen(false)
      return
    }
    endDebounceRef.current = setTimeout(async () => {
      try {
        const list = await fetchSuggestions(value)
        setEndSuggestions(list)
        setEndSuggestOpen(list.length > 0)
      } catch {
        setEndSuggestions([])
        setEndSuggestOpen(false)
      }
    }, AUTOCOMPLETE_DEBOUNCE_MS)
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setStartSuggestOpen(false)
    setEndSuggestOpen(false)
    
    if (!startInput || !endInput) {
      toast.error('Please enter both start and end locations')
      return
    }

    setLoading(true)
    setRoutes(null)
    setSelectedRoute(0)

    try {
      const [start, end] = await Promise.all([
        startResolved ? Promise.resolve(startResolved) : geocode(startInput),
        endResolved ? Promise.resolve(endResolved) : geocode(endInput),
      ])

      setRouteContext({
        start,
        end,
        startLabel: startInput,
        endLabel: endInput,
      })

      const routeData = await calculateRoute(
        start.lat,
        start.lng,
        end.lat,
        end.lng,
        hour,
      )

      setRoutes(routeData)
      onRoutesFound(routeData, { start, end })

      const spotsData = await getSafeSpots(
        (start.lat + end.lat) / 2,
        (start.lng + end.lng) / 2,
        1.5,
      )
      onSafeSpotsFound?.(spotsData)
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { detail?: unknown } }
        message?: string
      }
      const detail = axiosErr.response?.data?.detail
      const msg =
        typeof detail === 'string'
          ? detail
          : detail
            ? JSON.stringify(detail)
            : axiosErr.message || 'Failed to calculate route'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const timeLabel = `${String(hour).padStart(2, '0')}:00`

  return (
    <aside
      className="flex h-full w-[380px] min-w-[380px] flex-col border-r border-border bg-card"
      role="region"
      aria-label="Route planner"
    >
      {/* Header */}
      <div className="border-b border-border p-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
          <Shield className="h-5 w-5 text-primary" />
          Plan Safe Route
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Type for suggestions, or long‑press the map to set A/B
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Form */}
        <form onSubmit={handleSearch} className="space-y-5 p-6">
          {/* Start location — autocomplete */}
          <div className="space-y-2 relative">
            <Label
              htmlFor="start-location"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <MapPin className="h-3.5 w-3.5 text-primary" />
              From
            </Label>
            <div className="relative group">
              <Input
                id="start-location"
                placeholder="e.g., Katipunan MRT Station"
                className="pr-9"
                value={startInput}
                autoComplete="off"
                onChange={(e) => {
                  const v = e.target.value
                  setStartInput(v)
                  setStartResolved(null)
                  scheduleStartSuggestions(v)
                }}
                onFocus={() => {
                  if (startSuggestions.length > 0) setStartSuggestOpen(true)
                }}
                onBlur={() => {
                  setTimeout(() => setStartSuggestOpen(false), 180)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setStartSuggestOpen(false)
                }}
                aria-label="Starting point"
              />
              {startInput && (
                <button
                  type="button"
                  onClick={() => {
                    setStartInput('')
                    setStartResolved(null)
                    onClear?.()
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Clear starting point"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {startSuggestOpen && startSuggestions.length > 0 && (
              <ul
                id="start-suggestions-list"
                role="listbox"
                className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-md border border-border bg-popover py-1 text-sm shadow-md"
              >
                {startSuggestions.map((s, i) => (
                  <li key={`${s.label}-${i}`} role="option">
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-start gap-2 px-3 py-2 text-left text-foreground hover:bg-muted/80"
                      onMouseDown={(ev) => ev.preventDefault()}
                      onClick={() => {
                        setStartInput(s.label)
                        setStartResolved(s)
                        setStartSuggestOpen(false)
                        setStartSuggestions([])
                      }}
                    >
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="line-clamp-2 leading-snug">{s.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* End location — autocomplete */}
          <div className="space-y-2 relative">
            <Label
              htmlFor="end-location"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <Navigation className="h-3.5 w-3.5 text-primary" />
              To
            </Label>
            <div className="relative group">
              <Input
                id="end-location"
                placeholder="e.g., Ateneo Gate 1"
                className="pr-9"
                value={endInput}
                autoComplete="off"
                onChange={(e) => {
                  const v = e.target.value
                  setEndInput(v)
                  setEndResolved(null)
                  scheduleEndSuggestions(v)
                }}
                onFocus={() => {
                  if (endSuggestions.length > 0) setEndSuggestOpen(true)
                }}
                onBlur={() => {
                  setTimeout(() => setEndSuggestOpen(false), 180)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setEndSuggestOpen(false)
                }}
                aria-label="Destination"
              />
              {endInput && (
                <button
                  type="button"
                  onClick={() => {
                    setEndInput('')
                    setEndResolved(null)
                    onClear?.()
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Clear destination"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {endSuggestOpen && endSuggestions.length > 0 && (
              <ul
                id="end-suggestions-list"
                role="listbox"
                className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-md border border-border bg-popover py-1 text-sm shadow-md"
              >
                {endSuggestions.map((s, i) => (
                  <li key={`${s.label}-${i}`} role="option">
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-start gap-2 px-3 py-2 text-left text-foreground hover:bg-muted/80"
                      onMouseDown={(ev) => ev.preventDefault()}
                      onClick={() => {
                        setEndInput(s.label)
                        setEndResolved(s)
                        setEndSuggestOpen(false)
                        setEndSuggestions([])
                      }}
                    >
                      <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="line-clamp-2 leading-snug">{s.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Time slider */}
          <div className="space-y-3">
            <Label
              htmlFor="time-slider"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <Clock className="h-3.5 w-3.5 text-primary" />
              Time of Travel:
              <span className="ml-auto font-mono text-xs text-primary">
                {timeLabel}
              </span>
            </Label>
            <Slider
              id="time-slider"
              min={0}
              max={23}
              step={1}
              value={[hour]}
              onValueChange={(val: number[]) => setHour(val[0])}
              aria-valuetext={`${hour} hours`}
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>6am</span>
              <span>Noon</span>
              <span>Midnight</span>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            id="find-route-btn"
            aria-label="Find safe routes"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Find Safest Route
              </>
            )}
          </Button>
        </form>

        {/* Route results */}
        {activeRoutes && (
          <div className="space-y-3 px-6 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Results header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {activeRoutes.length} Routes Found
              </span>
              <span className="text-xs text-muted-foreground">
                Sorted by safety
              </span>
            </div>

            {/* Route cards */}
            {activeRoutes.map((route, idx) => (
              <Card
                key={route.route_id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  activeSelectedRoute === idx
                    ? 'ring-2 ring-primary shadow-md'
                    : 'hover:border-primary/30'
                }`}
                onClick={() => {
                  setSelectedRoute(idx)
                  onSelectedRouteChange?.(idx)
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedRoute(idx)
                    onSelectedRouteChange?.(idx)
                  }
                }}
                aria-pressed={activeSelectedRoute === idx}
                aria-label={`Route option ${idx + 1}, safety ${route.safety_score} of 100`}
              >
                <CardHeader className="px-4 pt-3 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      {idx === 0 ? (
                        <>
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          Recommended
                        </>
                      ) : (
                        `Option ${idx + 1}`
                      )}
                    </span>
                    <Badge
                      variant={
                        route.color === 'green'
                          ? 'default'
                          : route.color === 'yellow'
                            ? 'secondary'
                            : 'destructive'
                      }
                      className="text-[11px]"
                    >
                      {route.safety_label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5 px-4 pb-3">
                  {/* Safety score bar */}
                  <div className="flex items-center gap-3">
                    <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${route.safety_score}%`,
                          backgroundColor: SCORE_COLORS[route.color],
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-semibold tabular-nums"
                      style={{ color: SCORE_COLORS[route.color] }}
                    >
                      {route.safety_score}/100
                    </span>
                  </div>

                  {/* Route stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Ruler className="h-3 w-3" />
                      {route.distance_km} km
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />~{route.duration_minutes}{' '}
                      min walk
                    </span>
                  </div>

                  {/* Passed Safe Spots — shown for the selected route only */}
                  {activeSelectedRoute === idx && route.passed_safe_spots && route.passed_safe_spots.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-border/50 flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground/80">
                        <Shield className="h-3 w-3 text-primary" />
                        Passes near:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {route.passed_safe_spots.slice(0, 5).map((spot, i) => (
                          <span key={i} className="text-[10px] bg-secondary/60 text-secondary-foreground px-1.5 py-0.5 rounded-md border border-border/50 truncate max-w-[140px]">
                            {spot}
                          </span>
                        ))}
                        {route.passed_safe_spots.length > 5 && (
                          <span className="text-[10px] bg-secondary/60 text-secondary-foreground px-1.5 py-0.5 rounded-md border border-border/50">
                            +{route.passed_safe_spots.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            <BuddyAlert routeContext={routeContext} disabled={!routeContext} />

            {/* Railway Status Section */}
            {schedules.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm font-semibold text-foreground">Railway Status & Alerts</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/30">Live Updates</Badge>
                </div>
                
                {/* Special Holy Week Alert - High Visibility */}
                {schedules.some(s => s.notes.includes('Holy Week')) && (
                  <Card className="border-red-500/50 bg-red-500/5 shadow-sm overflow-hidden border-2">
                    <CardHeader className="py-2 px-3 bg-red-500/10 flex flex-row items-center gap-2">
                      <div className="bg-red-500 p-1 rounded-full">
                        <Clock className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Holy Week Maintenance</span>
                    </CardHeader>
                    <CardContent className="py-2.5 px-3">
                      <p className="text-[11px] font-medium text-red-600 leading-normal">
                        LRT-1, LRT-2, and MRT-3 will be <span className="font-bold underline">CLOSED</span> from April 2 to 5, 2026. Please plan your travel accordingly.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Grouped Statuses */}
                <div className="grid grid-cols-1 gap-2">
                  {['LRT-1', 'LRT-2', 'MRT-3'].map(line => {
                    const lineSchedules = schedules.filter(s => s.line === line && !s.notes.includes('Holy Week'))
                    const isClosedSoon = schedules.some(s => s.line === line && s.notes.includes('Holy Week'))
                    if (lineSchedules.length === 0) return null
                    
                    return (
                      <Card key={line} className="border-border/60 bg-muted/20">
                        <CardContent className="py-2.5 px-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-foreground">{line} Status</span>
                            {isClosedSoon ? (
                              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-600/30">System Maintenance Tomorrow</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-green-600 border-green-600/30">Operational</Badge>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            {lineSchedules.map((s, i) => (
                              <div key={i} className="flex flex-col border-l-2 border-primary/20 pl-2 py-0.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-medium text-foreground truncate max-w-[150px]">
                                    {s.origin} → {s.destination}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {s.first_train} – {s.last_train}
                                  </span>
                                </div>
                                <div className="text-[9px] text-muted-foreground italic">{s.schedule_type}</div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
