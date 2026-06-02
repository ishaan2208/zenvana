'use client'

import { useEffect, useRef, useState } from 'react'

const VIDEO_START_DELAY_MS = 4000

type HeroVideoProps = {
  className?: string
}

export function HeroVideo({ className = '' }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let timeoutId: number | null = null

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    if (reduce || !isDesktop) return

    timeoutId = window.setTimeout(() => setMounted(true), VIDEO_START_DELAY_MS)

    return () => {
      if (timeoutId != null) window.clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    if (!mounted || !videoRef.current) return

    videoRef.current.load()
    videoRef.current.play().catch(() => { })
  }, [mounted])

  return (
    <div aria-hidden="true" className={`absolute inset-0 overflow-hidden ${className}`}>
      <picture className="absolute inset-0 block h-full w-full">
        <source media="(min-width: 768px)" srcSet="/hero/hero-poster.webp" />
        <img
          src="/images/dehradun/Gemini_Generated_Image_jps3jcjps3jcjps3.png"
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
          poster="/hero/hero-poster.webp"
          onCanPlay={() => setReady(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'
            }`}
        >
          <source src="/hero/hero-1920.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  )
}
