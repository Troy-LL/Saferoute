import { useState } from 'react'
import { ChevronDown, ChevronRight, Layers, Map as MapIcon, Satellite, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OverlayPanelProps {
  showHeatmap: boolean
  onShowHeatmapChange: (v: boolean) => void
  showSpots: boolean
  onShowSpotsChange: (v: boolean) => void
  baseMapMode: string
  onBaseMapModeChange: (mode: string) => void
}

interface SectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function Section({ title, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {title}
      </button>
      {open && <div className="mt-1 space-y-2">{children}</div>}
    </div>
  )
}

interface PillToggleProps {
  label: string
  active: boolean
  onChange: (v: boolean) => void
  color: string
}

function PillToggle({ label, active, onChange, color }: PillToggleProps) {
  return (
    <button
      onClick={() => onChange(!active)}
      className={cn(
        'flex items-center gap-2 w-full rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer',
        active
          ? 'text-white shadow-sm'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted',
      )}
      style={active ? { backgroundColor: color } : undefined}
      role="switch"
      aria-checked={active}
    >
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: active ? 'white' : color }}
      />
      {label}
    </button>
  )
}

export default function MapOverlayPanel({
  showHeatmap,
  onShowHeatmapChange,
  showSpots,
  onShowSpotsChange,
  baseMapMode,
  onBaseMapModeChange,
}: OverlayPanelProps) {
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(false)}
        className="h-10 w-10 rounded-xl map-glass-card shadow-lg cursor-pointer"
        aria-label="Open layer controls"
      >
        <Layers className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <div className="map-glass-card rounded-2xl shadow-lg w-56 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Layers className="h-3.5 w-3.5 text-primary" />
          Layers
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="rounded-md p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          aria-label="Collapse layer panel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-3 pb-3 space-y-2.5">
        {/* Safety section */}
        <Section title="Safety">
          <PillToggle
            label="Crime Heatmap"
            active={showHeatmap}
            onChange={onShowHeatmapChange}
            color="#E74C3C"
          />
          <PillToggle
            label="Safe Spots"
            active={showSpots}
            onChange={onShowSpotsChange}
            color="#2ECC71"
          />
        </Section>

        {/* Base map section */}
        <Section title="Base Map">
          <div className="flex gap-1.5">
            <button
              onClick={() => onBaseMapModeChange('transit')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-all duration-200 cursor-pointer',
                baseMapMode === 'transit'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted',
              )}
            >
              <MapIcon className="h-3 w-3" /> Transit
            </button>
            <button
              onClick={() => onBaseMapModeChange('satellite')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-all duration-200 cursor-pointer',
                baseMapMode === 'satellite'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted',
              )}
            >
              <Satellite className="h-3 w-3" /> Satellite
            </button>
          </div>
        </Section>
      </div>
    </div>
  )
}
