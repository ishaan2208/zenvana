'use client'

import dynamic from 'next/dynamic'

import { MapViewGate } from '@/components/MapViewGate'

const HomeLimewoodMap = dynamic(() => import('@/components/HomeLimewoodMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 animate-pulse bg-muted/50" aria-hidden />
  ),
})

type DeferredLocationMapProps = {
  latitude?: number
  longitude?: number
  mapPlaceUrl?: string
}

export function DeferredLocationMap({ latitude, longitude, mapPlaceUrl }: DeferredLocationMapProps) {
  return (
    <MapViewGate
      className="absolute inset-0"
      ariaLabel="Zenvana Limewood map"
      title="Zenvana Limewood"
      subtitle="Rajpur Road, Dehradun"
    >
      <HomeLimewoodMap latitude={latitude} longitude={longitude} mapPlaceUrl={mapPlaceUrl} />
    </MapViewGate>
  )
}
