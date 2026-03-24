import { useEffect, useState } from 'react'
import { X, Clock, Phone, MapPin, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SafeSpot } from '@/services/api'

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  police_station:    { label: 'Emergency Service', color: '#3498DB' },
  convenience_store: { label: 'Safe Zone',         color: '#2ECC71' },
  security_post:     { label: 'Safe Zone',         color: '#2ECC71' },
  hospital:          { label: 'Emergency Service', color: '#3498DB' },
  fire_station:      { label: 'Emergency Service', color: '#3498DB' },
  street_lamp:       { label: 'Caution Area',      color: '#F39C12' },
  surveillance:      { label: 'Community Resource', color: '#9B59B6' },
}

interface SpotDetailPanelProps {
  spot: SafeSpot | null
  onClose: () => void
  onRouteHere?: (spot: SafeSpot) => void
}

export default function SpotDetailPanel({ spot, onClose, onRouteHere }: SpotDetailPanelProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (spot) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [spot])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  if (!spot) return null

  const meta = CATEGORY_META[spot.type] || { label: 'Safe Spot', color: '#2ECC71' }

  return (
    <>
      {/* Desktop: right slide panel */}
      <div
        className={cn(
          'hidden md:flex absolute top-0 right-0 z-[1001] h-full w-80 flex-col map-glass-card border-l border-border',
          'transition-transform duration-[280ms] ease-out',
          visible ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Category color bar */}
        <div className="h-1.5 w-full shrink-0" style={{ background: meta.color }} />

        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer z-10"
          aria-label="Close detail panel"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 pt-4 space-y-4">
          <div>
            <h3 className="text-base font-bold text-foreground pr-6 leading-snug">{spot.name}</h3>
            <span
              className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
              style={{ background: meta.color }}
            >
              {meta.label}
            </span>
          </div>

          {spot.address && (
            <p className="text-sm text-muted-foreground leading-relaxed">{spot.address}</p>
          )}

          <div className="space-y-2.5">
            {spot.hours && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span>{spot.hours}</span>
              </div>
            )}
            {spot.city && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span>{spot.city}</span>
              </div>
            )}
            {spot.distance_km != null && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Navigation className="h-4 w-4 shrink-0 text-primary" />
                <span>{spot.distance_km} km away</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 border-t border-border p-4 space-y-2">
          <Button
            className="w-full cursor-pointer"
            onClick={() => onRouteHere?.(spot)}
          >
            <Navigation className="mr-2 h-4 w-4" />
            Route Here
          </Button>
        </div>
      </div>

      {/* Mobile: bottom drawer */}
      <div
        className={cn(
          'md:hidden fixed inset-x-0 bottom-0 z-[1001] max-h-[60vh] flex flex-col map-glass-card rounded-t-2xl border-t border-border',
          'transition-transform duration-[280ms] ease-out',
          visible ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Category color bar */}
        <div className="mx-4 h-1 rounded-full" style={{ background: meta.color }} />

        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          aria-label="Close detail panel"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pt-3 pb-2 space-y-3">
          <div>
            <h3 className="text-base font-bold text-foreground pr-6 leading-snug">{spot.name}</h3>
            <span
              className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
              style={{ background: meta.color }}
            >
              {meta.label}
            </span>
          </div>

          {spot.address && (
            <p className="text-xs text-muted-foreground">{spot.address}</p>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {spot.hours && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {spot.hours}
              </span>
            )}
            {spot.distance_km != null && (
              <span className="flex items-center gap-1">
                <Navigation className="h-3.5 w-3.5 text-primary" />
                {spot.distance_km} km
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 border-t border-border p-4">
          <Button
            className="w-full cursor-pointer"
            onClick={() => onRouteHere?.(spot)}
          >
            <Navigation className="mr-2 h-4 w-4" />
            Route Here
          </Button>
        </div>
      </div>
    </>
  )
}
