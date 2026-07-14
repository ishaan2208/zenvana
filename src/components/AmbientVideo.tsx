'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

/** True when this device/user should never receive ambient video bytes. */
export function shouldSkipAmbientVideo(): boolean {
  if (typeof window === 'undefined') return true
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const conn = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
    }
  ).connection
  const saveData =
    Boolean(conn?.saveData) || /(^|-)2g$/.test(conn?.effectiveType || '')
  return reduce || saveData
}

/**
 * Muted, looping ambience layer (property walkthrough behind a hero).
 * Decorative only — never blocks render, never plays audio, never mounts for
 * reduced-motion / Save-Data / 2G users. The <video> element is created after
 * an idle tick, fades in on first frame, and pauses whenever it scrolls out
 * of view so budget phones aren't decoding pixels nobody sees.
 *
 * Pass a cost-capped rendition from deriveVideoPreviewUrl, never the full
 * 720p playback URL.
 */
export type AmbientVideoSource = {
  src: string
  /** e.g. "(min-width: 768px)" — order sources mobile-first. */
  media?: string
}

export function AmbientVideo({
  src,
  sources,
  className,
  videoClassName,
}: {
  /** Single rendition. Ignored when `sources` is provided. */
  src?: string
  /** Responsive renditions; browsers pick the first matching `media`. */
  sources?: AmbientVideoSource[]
  className?: string
  videoClassName?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (shouldSkipAmbientVideo()) return

    const start = () => setMounted(true)
    if ('requestIdleCallback' in window) {
      const w = window as Window & {
        requestIdleCallback?: (
          callback: IdleRequestCallback,
          options?: IdleRequestOptions,
        ) => number
      }
      w.requestIdleCallback?.(start, { timeout: 2500 })
    } else {
      const t = setTimeout(start, 1500)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    if (!mounted || !videoRef.current) return
    const video = videoRef.current
    // No load(): src is a direct attribute, and load() aborts an in-flight
    // play() (AbortError), leaving the ambience frozen on its first frame.
    const tryPlay = () => video.play().catch(() => {})
    tryPlay()
    video.addEventListener('canplay', tryPlay, { once: true })
    return () => video.removeEventListener('canplay', tryPlay)
  }, [mounted])

  // Resume after tab switches — some browsers pause hidden-page media and
  // don't reliably restart loops on return.
  useEffect(() => {
    if (!mounted) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        videoRef.current?.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [mounted])

  // Pause off-screen; resume when the hero scrolls back into view.
  useEffect(() => {
    if (!mounted || !hostRef.current) return
    const video = videoRef.current
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!video) return
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.05 },
    )
    io.observe(hostRef.current)
    return () => io.disconnect()
  }, [mounted])

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
    >
      {mounted && (
        <video
          ref={videoRef}
          src={sources ? undefined : src}
          muted
          loop
          playsInline
          preload="none"
          disablePictureInPicture
          onCanPlay={() => setReady(true)}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 motion-reduce:transition-none',
            ready ? 'opacity-100' : 'opacity-0',
            videoClassName,
          )}
        >
          {sources?.map((source) => (
            <source key={source.src} src={source.src} media={source.media} />
          ))}
        </video>
      )}
    </div>
  )
}
