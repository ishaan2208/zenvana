'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

export type CountUpStatProps = {
  value: number
  decimals?: number
  suffix?: string
  prefix?: string
  durationMs?: number
  delayMs?: number
  /** Parent sets true when the stat block has been scrolled into view */
  active?: boolean
  className?: string
}

function formatValue(n: number, decimals: number): string {
  if (decimals > 0) return n.toFixed(decimals)
  return Math.round(n).toLocaleString('en-IN')
}

export function CountUpStat({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  durationMs = 1800,
  delayMs = 0,
  active = false,
  className,
}: CountUpStatProps) {
  const [displayed, setDisplayed] = useState(0)
  const startedRef = useRef(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) return
    if (startedRef.current) return
    startedRef.current = true

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setDisplayed(value)
      return
    }

    const from = 0
    const startAt = performance.now() + delayMs

    const tick = (now: number) => {
      const elapsed = now - startAt
      if (elapsed < 0) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      const t = Math.min(1, elapsed / durationMs)
      const eased = easeOutQuart(t)
      setDisplayed(from + (value - from) * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else setDisplayed(value)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [active, value, durationMs, delayMs])

  return (
    <span
      className={cn(
        'inline-flex tabular-nums transition-opacity duration-300',
        active ? 'opacity-100' : 'opacity-40',
        className,
      )}
      style={{ fontVariantNumeric: 'tabular-nums' }}
      aria-hidden={!active}
    >
      {prefix}
      {formatValue(active ? displayed : 0, decimals)}
      {suffix}
    </span>
  )
}
