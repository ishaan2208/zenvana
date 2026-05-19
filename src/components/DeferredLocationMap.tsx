'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

const HomeLimewoodMap = dynamic(() => import('@/components/HomeLimewoodMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full min-h-[12rem] animate-pulse bg-muted/50" aria-hidden />
  ),
})

type DeferredLocationMapProps = {
  latitude?: number
  longitude?: number
  mapPlaceUrl?: string
}

export function DeferredLocationMap({ latitude, longitude, mapPlaceUrl }: DeferredLocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = containerRef.current
    if (!node || isVisible) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [isVisible])

  return (
    <div ref={containerRef} className="absolute inset-0">
      {isVisible ? (
        <HomeLimewoodMap
          latitude={latitude}
          longitude={longitude}
          mapPlaceUrl={mapPlaceUrl}
        />
      ) : null}
    </div>
  )
}
