'use client'

import { MapPin } from 'lucide-react'
import { useState, type ReactNode } from 'react'

type MapViewGateProps = {
  className?: string
  ariaLabel?: string
  title?: string
  subtitle?: string
  children: ReactNode
}

/**
 * Click-to-load gate for embedded Google Maps. Avoids billing until the user
 * explicitly opts in — external Google Maps links remain free outside this gate.
 */
export function MapViewGate({
  className = 'h-full w-full',
  ariaLabel = 'Map',
  title = 'View location on map',
  subtitle,
  children,
}: MapViewGateProps) {
  const [mapRequested, setMapRequested] = useState(false)

  if (!mapRequested) {
    return (
      <div
        className={`relative grid place-items-center bg-muted/40 ${className}`}
        aria-label={ariaLabel}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(8,17,31,0.04),transparent_70%)]" />
        <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-background/90 shadow-sm">
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{title}</p>
            {subtitle ? (
              <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setMapRequested(true)}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
          >
            <MapPin className="h-4 w-4" />
            View map
          </button>
        </div>
      </div>
    )
  }

  return <div className={`relative ${className}`}>{children}</div>
}
