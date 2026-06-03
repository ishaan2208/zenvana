'use client'

import { useEffect, useRef, useState } from 'react'

type HeroVideoProps = {
  className?: string
}

export function HeroVideo({ className = '' }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const conn = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
    }).connection
    const saveData = Boolean(conn?.saveData) || /(^|-)2g$/.test(conn?.effectiveType || '')
    if (reduce || saveData) return

    const start = () => setMounted(true)
    if ('requestIdleCallback' in window) {
      ;(window as Window & {
        requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
      }).requestIdleCallback?.(start, { timeout: 2000 })
    } else {
      setTimeout(start, 1200)
    }
  }, [])

  useEffect(() => {
    if (!mounted || !videoRef.current) return

    videoRef.current.load()
    videoRef.current.play().catch(() => {})
  }, [mounted])

  return (
    <div aria-hidden="true" className={`absolute inset-0 overflow-hidden ${className}`}>
      <picture className="absolute inset-0 block h-full w-full">
        <source media="(min-width: 768px)" srcSet="/hero/hero-poster.webp" />
        <img
          src="/hero/hero-mobile-poster.webp"
          alt=""
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>

      {mounted && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          onCanPlay={() => setReady(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source media="(min-width: 768px)" src="/hero/hero-1920.mp4" type="video/mp4" />
          <source src="/hero/hero-mobile.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  )
}
