'use client'

import { cn } from '@/lib/utils'
import { Clock, MoonStar } from 'lucide-react'

export type StayMode = 'overnight' | 'hourly'

type StayModeToggleProps = {
  value: StayMode
  onChange: (mode: StayMode) => void
  className?: string
  /** Larger marketing treatment for decision pages */
  prominent?: boolean
}

export function StayModeToggle({
  value,
  onChange,
  className,
  prominent = false,
}: StayModeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Stay type"
      className={cn(
        'flex w-full overflow-hidden rounded-full border border-border/70 bg-muted/50 p-1',
        prominent && 'rounded-[1.15rem] p-1.5',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange('overnight')}
        className={cn(
          'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 font-medium transition',
          prominent ? 'min-h-11 text-sm' : 'min-h-9 text-sm',
          value === 'overnight'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <MoonStar className="h-3.5 w-3.5 shrink-0" />
        Overnight
      </button>
      <button
        type="button"
        onClick={() => onChange('hourly')}
        className={cn(
          'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 font-medium transition',
          prominent ? 'min-h-11 text-sm' : 'min-h-9 text-sm',
          value === 'hourly'
            ? 'bg-foreground text-background shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <Clock className="h-3.5 w-3.5 shrink-0" />
        Hourly stay
      </button>
    </div>
  )
}

type HourlyStayCalloutProps = {
  durationsHours?: number[]
  windowStart?: string
  windowEnd?: string
  className?: string
}

/** Compact marketing strip for listing/sidebar when hourly is available. */
export function HourlyStayCallout({
  durationsHours = [3, 6, 9],
  windowStart = '10:00',
  windowEnd = '21:00',
  className,
}: HourlyStayCalloutProps) {
  const durationLabel = durationsHours.map((h) => `${h}h`).join(' · ')
  return (
    <div
      className={cn(
        'rounded-[1.25rem] border border-amber-500/25 bg-amber-500/[0.08] px-4 py-3 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-50',
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-800 dark:bg-amber-300/15 dark:text-amber-100">
          <Clock className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]">
            Hourly stays available
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-950/80 dark:text-amber-50/85">
            {durationLabel} packages · bookable {windowStart}–{windowEnd}
          </p>
        </div>
      </div>
    </div>
  )
}
