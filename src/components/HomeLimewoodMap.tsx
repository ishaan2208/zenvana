'use client'

import { useEffect, useRef, useState } from 'react'

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

const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#d1d5db' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111827' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#374151' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1f2937' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b1324' }] },
]

type HomeLimewoodMapProps = {
  latitude?: number
  longitude?: number
  mapPlaceUrl?: string
}

export function HomeLimewoodMap({ latitude, longitude, mapPlaceUrl }: HomeLimewoodMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [shouldLoadMap, setShouldLoadMap] = useState(false)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    const node = mapContainerRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadMap(true)
          observer.disconnect()
        }
      },
      { rootMargin: '250px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!shouldLoadMap) return
    if (latitude == null || longitude == null) return
    if (!apiKey) {
      setMapError('Map is unavailable right now.')
      return
    }
    if (!mapContainerRef.current) return

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
          zoomControl: true,
          styles: darkMapStyles,
        })

        const marker = new window.google.maps.Marker({
          position: center,
          map,
          title: 'Zenvana Limewood',
          label: {
            text: 'Zenvana Limewood',
            color: '#f9fafb',
            fontSize: '12px',
            fontWeight: '600',
          },
        })

        const infoWindow = new window.google.maps.InfoWindow({
          content:
            '<div style="font-size:13px;font-weight:600;line-height:1.35;color:#111827;">Zenvana Limewood</div>',
        })

        marker.addListener('click', () => {
          infoWindow.open({ map, anchor: marker })
        })
      })
      .catch(() => {
        if (isMounted) setMapError('Map is unavailable right now.')
      })

    return () => {
      isMounted = false
    }
  }, [apiKey, latitude, longitude, shouldLoadMap])

  const hasCoordinates = latitude != null && longitude != null
  const viewOnMapHref =
    mapPlaceUrl ||
    (hasCoordinates
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`
      : null)

  return (
    <div className="absolute inset-0">
      <div ref={mapContainerRef} className="h-full w-full" aria-label="Zenvana Limewood map" />

      {!hasCoordinates || mapError ? (
        <div className="absolute inset-0 grid place-items-center text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
          Map unavailable
        </div>
      ) : null}

      {viewOnMapHref ? (
        <a
          href={viewOnMapHref}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-5 right-5 rounded-full border border-white/20 bg-black/55 px-4 py-2 text-xs font-medium tracking-[0.08em] text-white backdrop-blur-md transition hover:bg-black/70"
        >
          View on Google Maps
        </a>
      ) : null}
    </div>
  )
}

