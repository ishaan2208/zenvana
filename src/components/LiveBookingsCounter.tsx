'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Live, animated bookings count for the homepage trust strip.
 *
 * Behaviour:
 * - On mount: animates 0 → initialValue (count-up entrance flourish).
 * - Polls `endpoint` every `pollIntervalMs` (default 60s).
 * - On each successful fetch with a higher value: animates old → new with a
 *   brief gold pulse to draw attention to the rise.
 * - Pauses polling when the browser tab is hidden, fires once when it becomes
 *   visible again — saves backend load without losing freshness.
 * - Falls back to `fallbackLabel` when no value is ever loaded (initial render
 *   on the server, or every fetch fails).
 *
 * The endpoint is expected to return JSON with one of:
 *   { count: number }
 *   { bookingCount: number }
 *   { data: { count: number } }
 */

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)
const ANIMATION_MS = 1200

type Props = {
  initialValue: number | null
  endpoint: string
  pollIntervalMs?: number
  fallbackLabel?: string
  /** Optional className applied to the outer span */
  className?: string
}

function pickCount(json: unknown): number | null {
  if (!json || typeof json !== 'object') return null
  const j = json as Record<string, unknown>
  if (typeof j.count === 'number') return j.count
  if (typeof j.bookingCount === 'number') return j.bookingCount
  if (j.data && typeof j.data === 'object') {
    const d = j.data as Record<string, unknown>
    if (typeof d.count === 'number') return d.count
    if (typeof d.bookingCount === 'number') return d.bookingCount
  }
  return null
}

export function LiveBookingsCounter({
  initialValue,
  endpoint,
  pollIntervalMs = 60_000,
  fallbackLabel = '1,200+',
  className,
}: Props) {
  const [target, setTarget] = useState<number | null>(initialValue)
  const [displayed, setDisplayed] = useState<number | null>(
    initialValue == null ? null : 0,
  )
  const [pulsing, setPulsing] = useState(false)

  const fromRef = useRef(0)
  const toRef = useRef(initialValue ?? 0)
  const startRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  // ── Polling loop ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | null = null

    const poll = async () => {
      try {
        const res = await fetch(endpoint, { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        const next = pickCount(json)
        if (next == null || cancelled) return
        setTarget((prev) => {
          if (prev === next) return prev
          fromRef.current = prev ?? 0
          toRef.current = next
          startRef.current = performance.now()
          // Pulse gold only on rises (the "scoreboard" feel)
          if ((prev ?? 0) < next) {
            setPulsing(true)
            window.setTimeout(() => setPulsing(false), ANIMATION_MS + 200)
          }
          return next
        })
      } catch {
        // silent: keep last known value
      }
    }

    const start = () => {
      void poll()
      timer = setInterval(poll, pollIntervalMs)
    }
    const stop = () => {
      if (timer) clearInterval(timer)
      timer = null
    }

    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      start()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (!timer) start()
      } else {
        stop()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [endpoint, pollIntervalMs])

  // ── Count-up animation ────────────────────────────────────────
  useEffect(() => {
    if (target == null) return

    // Entrance: from 0 → initial on first mount
    if (startRef.current === 0) {
      fromRef.current = 0
      toRef.current = target
      startRef.current = performance.now()
    }

    const tick = (now: number) => {
      const elapsed = now - startRef.current
      const t = Math.min(1, elapsed / ANIMATION_MS)
      const eased = easeOutQuart(t)
      const v = Math.round(fromRef.current + (toRef.current - fromRef.current) * eased)
      setDisplayed(v)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else rafRef.current = null
    }

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [target])

  if (displayed == null) {
    return <span className={className}>{fallbackLabel}</span>
  }

  return (
    <span
      className={[
        'inline-flex items-baseline tabular-nums transition-all duration-300 ease-out',
        pulsing ? '-translate-y-0.5 text-gold-400' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ fontVariantNumeric: 'tabular-nums' }}
      aria-live="polite"
      aria-atomic="true"
    >
      {displayed.toLocaleString('en-IN')}
    </span>
  )
}
