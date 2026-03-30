'use client'

import { useEffect, useRef, useState } from 'react'

type GoogleMapsNamespace = any

type Place = {
  name: string
  lat: number
  lng: number
}

const nearbyPlaces: Place[] = [
  { name: "Robber's Cave", lat: 30.3876, lng: 78.1035 },
  { name: 'Mindrolling Monastery', lat: 30.2695, lng: 78.0621 },
  { name: 'Dehradun Zoo', lat: 30.3845, lng: 78.0892 },
]

let mapsPromise: Promise<GoogleMapsNamespace> | null = null

function loadGoogleMaps(apiKey: string): Promise<GoogleMapsNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps is only available in the browser.'))
  }

  if ((window as any).google?.maps) {
    return Promise.resolve((window as any).google.maps)
  }

  if (mapsPromise) {
    return mapsPromise
  }

  mapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-maps-script') as HTMLScriptElement | null
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve((window as any).google.maps), { once: true })
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Failed to load Google Maps script.')),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`
    script.async = true
    script.defer = true
    script.onload = () => resolve((window as any).google.maps)
    script.onerror = () => reject(new Error('Failed to load Google Maps script.'))
    document.head.appendChild(script)
  })

  return mapsPromise
}

export function NearbyHighlightsMap() {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const [shouldLoadMap, setShouldLoadMap] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)

  useEffect(() => {
    const node = mapRef.current
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
    if (!shouldLoadMap || !mapRef.current) return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    let isDisposed = false

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (isDisposed || !mapRef.current) return

        const map = new maps.Map(mapRef.current, {
          center: { lat: 30.3165, lng: 78.0322 },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'cooperative',
        })

        const bounds = new maps.LatLngBounds()
        const infoWindow = new maps.InfoWindow()

        nearbyPlaces.forEach((place) => {
          const marker = new maps.Marker({
            position: { lat: place.lat, lng: place.lng },
            map,
            title: place.name,
          })

          marker.addListener('click', () => {
            infoWindow.setContent(
              `<div style="font-size:13px;font-weight:600;line-height:1.3;">${place.name}</div>`,
            )
            infoWindow.open({ map, anchor: marker })
          })

          bounds.extend(marker.getPosition())
        })

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, 70)
          maps.event.addListenerOnce(map, 'idle', () => {
            const currentZoom = map.getZoom()
            if (typeof currentZoom === 'number' && currentZoom > 14) {
              map.setZoom(14)
            }
          })
        }

        setIsMapReady(true)
      })
      .catch(() => {
        // Keep fallback layer if map script fails.
      })

    return () => {
      isDisposed = true
    }
  }, [shouldLoadMap])

  return (
    <div className="absolute inset-0">
      <div ref={mapRef} className="h-full w-full" />
      {!isMapReady ? (
        <div className="absolute inset-0 grid place-items-center text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
          Map placeholder
        </div>
      ) : null}
    </div>
  )
}

