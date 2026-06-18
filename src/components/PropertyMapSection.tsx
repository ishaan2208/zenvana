'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, MapPin, Navigation } from 'lucide-react'

declare global {
  interface Window {
    google?: any
  }
}

let googleMapsScriptPromise: Promise<void> | null = null

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is unavailable'))
  }

  if (window.google?.maps) return Promise.resolve()
  if (googleMapsScriptPromise) return googleMapsScriptPromise

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-maps-js-sdk') as HTMLScriptElement | null

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Google Maps failed to load')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.id = 'google-maps-js-sdk'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google Maps failed to load'))
    document.head.appendChild(script)
  })

  return googleMapsScriptPromise
}

type PropertyMapSectionProps = {
  propertyName: string
  latitude?: number
  longitude?: number
  mapPlaceUrl?: string
  fullAddress?: string
}

export function PropertyMapSection({
  propertyName,
  latitude,
  longitude,
  mapPlaceUrl,
  fullAddress,
}: PropertyMapSectionProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const directionsUrl =
    latitude != null && longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        `${latitude},${longitude}`
      )}&travelmode=driving`
      : null

  useEffect(() => {
    if (latitude == null || longitude == null) return
    if (!apiKey) {
      setMapError('Map is unavailable right now.')
      return
    }
    const container = mapContainerRef.current
    if (!container) return

    let isMounted = true
    let started = false

    const initMap = () => {
      if (started) return
      started = true
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
    }

    // Defer the heavy Google Maps JS until the map is near the viewport. The map
    // sits below the fold, so this keeps ~170KB of Maps script off the initial
    // critical path where it was competing with LCP.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect()
          initMap()
        }
      },
      { rootMargin: '300px' }
    )
    observer.observe(container)

    return () => {
      isMounted = false
      observer.disconnect()
    }
  }, [apiKey, latitude, longitude, propertyName])

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
          <div
            ref={mapContainerRef}
            className="h-[340px] w-full sm:h-[420px]"
            aria-label={`${propertyName} map`}
          />

          <div className="pointer-events-none absolute left-4 top-4">
            <div className="rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs font-medium text-white backdrop-blur-xl">
              {propertyName}
            </div>
          </div>
        </div>
      </div>

      {(mapPlaceUrl || directionsUrl || mapError) && (
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

          {mapError && <span className="text-sm text-muted-foreground">{mapError}</span>}
        </div>
      )}
    </section>
  )
}