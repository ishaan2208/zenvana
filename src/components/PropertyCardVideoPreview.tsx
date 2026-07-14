'use client'

import { useEffect, useRef, useState } from 'react'

import { shouldSkipAmbientVideo } from '@/components/AmbientVideo'
import { cn } from '@/lib/utils'

/** Desktop: hover this long before spending video bytes. */
const HOVER_DWELL_MS = 800
/** Touch: card must stay mostly on screen this long ("looking for too long"). */
const VIEW_DWELL_MS = 1800
/** Card must be at least this visible to count as being looked at. */
const VIEW_THRESHOLD = 0.75

/** Only one card preview decodes at a time — the newest wins. */
let pauseActivePreview: (() => void) | null = null

/**
 * Dwell-triggered walkthrough preview for property cards. Sits over the card's
 * hero image (pointer-events: none, so the card link keeps working) and fades
 * in a tiny muted loop only after the guest has lingered — hover on desktop,
 * sustained visibility on touch. Skipped entirely for reduced-motion /
 * Save-Data / 2G users.
 *
 * `src` must be a cost-capped rendition (deriveVideoPreviewUrl: small height,
 * du_ duration cap, ac_none) — never the full playback URL.
 */
export function PropertyCardVideoPreview({
  src,
  className,
}: {
  src: string
  className?: string
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mounted, setMounted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [eligible, setEligible] = useState(false)

  useEffect(() => {
    setEligible(!shouldSkipAmbientVideo())
  }, [])

  useEffect(() => {
    return () => {
      if (dwellTimer.current) clearTimeout(dwellTimer.current)
      if (pauseActivePreview === pause) pauseActivePreview = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function play() {
    setMounted(true)
    setPlaying(true)
    // Newest preview wins; pause whichever card was playing before.
    if (pauseActivePreview && pauseActivePreview !== pause) pauseActivePreview()
    pauseActivePreview = pause
    // Mount and play on the next frame so the src is set before play().
    requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => {})
    })
  }

  function pause() {
    setPlaying(false)
    videoRef.current?.pause()
  }

  function armDwell(delayMs: number) {
    if (dwellTimer.current) clearTimeout(dwellTimer.current)
    dwellTimer.current = setTimeout(play, delayMs)
  }

  function disarmDwell() {
    if (dwellTimer.current) clearTimeout(dwellTimer.current)
    dwellTimer.current = null
    pause()
  }

  // Touch dwell: sustained near-full visibility reads as attention.
  useEffect(() => {
    if (!eligible || !hostRef.current) return
    // Hover devices use the pointer handlers instead.
    if (window.matchMedia('(hover: hover)').matches) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= VIEW_THRESHOLD) armDwell(VIEW_DWELL_MS)
        else disarmDwell()
      },
      { threshold: [VIEW_THRESHOLD, 0.25] },
    )
    io.observe(hostRef.current)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible])

  if (!eligible) return null

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
      // Hover dwell is attached to the parent card via these bubbling events:
      // the wrapper is pointer-events-none, so listen on capture at mount time.
    >
      {mounted && (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="none"
          disablePictureInPicture
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-700 motion-reduce:transition-none',
            playing ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}
      <HoverDwellBinder
        onDwell={() => armDwell(HOVER_DWELL_MS)}
        onLeave={disarmDwell}
        hostRef={hostRef}
      />
    </div>
  )
}

/**
 * Binds hover dwell to the nearest positioned ancestor (the card image frame)
 * since the preview layer itself is pointer-events-none.
 */
function HoverDwellBinder({
  onDwell,
  onLeave,
  hostRef,
}: {
  onDwell: () => void
  onLeave: () => void
  hostRef: React.RefObject<HTMLDivElement | null>
}) {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return
    const parent = hostRef.current?.parentElement
    if (!parent) return
    parent.addEventListener('mouseenter', onDwell)
    parent.addEventListener('mouseleave', onLeave)
    return () => {
      parent.removeEventListener('mouseenter', onDwell)
      parent.removeEventListener('mouseleave', onLeave)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
