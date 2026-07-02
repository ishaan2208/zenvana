'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, MapPin, Navigation } from 'lucide-react'

import { MapViewGate } from '@/components/MapViewGate'
import { loadGoogleMapsScript } from '@/lib/googleMapsLoader'

type PropertyMapSectionProps = {
  propertyName: string
  latitude?: number
  longitude?: number
  mapPlaceUrl?: string
  fullAddress?: string
}

function PropertyMapCanvas({
  propertyName,
  latitude,
  longitude,
}: {
  propertyName: string
  latitude: number
  longitude: number
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!apiKey) {
      setMapError('Map is unavailable right now.')
      return
    }
    const container = mapContainerRef.current
    if (!container) return

    let isMounted = true

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (!isMounted || !mapContainerRef.current || !window.google?.maps) return

        const center = { lat: latitude, lng: longitude }

        const map = new window.google.maps.Map(mapContainerRef.current, {
          center,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        })

        new window.google.maps.Marker({
          position: center,
          map,
          title: propertyName,
        })
      })
      .catch(() => {
        if (isMounted) setMapError('Map is unavailable right now.')
      })

    return () => {
      isMounted = false
    }
  }, [apiKey, latitude, longitude, propertyName])

  if (mapError) {
    return (
      <div className="grid h-full min-h-[340px] place-items-center text-sm text-muted-foreground sm:min-h-[420px]">
        {mapError}
      </div>
    )
  }

  return (
    <div
      ref={mapContainerRef}
      className="h-[340px] w-full sm:h-[420px]"
      aria-label={`${propertyName} map`}
    />
  )
}

export function PropertyMapSection({
  propertyName,
  latitude,
  longitude,
  mapPlaceUrl,
  fullAddress,
}: PropertyMapSectionProps) {
  const directionsUrl =
    latitude != null && longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          `${latitude},${longitude}`,
        )}&travelmode=driving`
      : null

  if (latitude == null || longitude == null) {
    return null
  }

  return (
    <section id="location" className="scroll-mt-28">
      <div className="max-w-2xl">
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Location
        </div>
        <h2 className="mt-4 font-serif text-3xl leading-[0.96] tracking-[-0.04em] text-foreground sm:text-4xl">
          Easy to find, simple to plan around.
        </h2>

        {fullAddress && (
          <p className="mt-4 flex items-start gap-2 text-sm leading-7 text-muted-foreground">
            <MapPin className="mt-1 h-4 w-4 shrink-0" />
            <span>{fullAddress}</span>
          </p>
        )}
      </div>

      <div className="mt-8 overflow-hidden rounded-[2rem] border border-border/60 bg-card/70 shadow-[0_16px_40px_rgba(8,17,31,0.05)] dark:bg-card/55">
        <div className="relative">
          <MapViewGate
            className="h-[340px] w-full sm:h-[420px]"
            ariaLabel={`${propertyName} map`}
            title={propertyName}
            subtitle={fullAddress}
          >
            <PropertyMapCanvas
              propertyName={propertyName}
              latitude={latitude}
              longitude={longitude}
            />
          </MapViewGate>

          <div className="pointer-events-none absolute left-4 top-4">
            <div className="rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs font-medium text-white backdrop-blur-xl">
              {propertyName}
            </div>
          </div>
        </div>
      </div>

      {(mapPlaceUrl || directionsUrl) && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <Navigation className="h-4 w-4" />
              Get directions
            </a>
          )}

          {mapPlaceUrl && (
            <a
              href={mapPlaceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <ArrowUpRight className="h-4 w-4" />
              Open in Google Maps
            </a>
          )}
        </div>
      )}
    </section>
  )
}
