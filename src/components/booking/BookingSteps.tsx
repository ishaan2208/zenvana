import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

const STEPS = ['Search', 'Choose room', 'Your details', 'Done'] as const

/**
 * Plain-language progress trail for the booking funnel — always shows where
 * the guest is and what comes next. Server component, zero JS.
 *
 * Fixed height (h-8) so mounting it never shifts layout. All four steps must
 * fit a 360px viewport — sizes are compressed below `sm`.
 */
export function BookingSteps({
  current,
  className,
}: {
  /** 1 = Search, 2 = Choose room, 3 = Your details, 4 = Done. */
  current: 1 | 2 | 3 | 4
  className?: string
}) {
  return (
    <nav
      aria-label="Booking progress"
      className={cn('flex h-8 items-center', className)}
    >
      <ol className="flex min-w-0 items-center gap-1 sm:gap-2">
        {STEPS.map((label, i) => {
          const step = i + 1
          const isCurrent = step === current
          const isDone = step < current || (step === 4 && current === 4)

          return (
            <li
              key={label}
              className="flex min-w-0 items-center gap-1 sm:gap-2"
            >
              {i > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    'h-px w-1.5 shrink-0 sm:w-5',
                    isDone || isCurrent ? 'bg-foreground/40' : 'bg-border',
                  )}
                />
              )}

              <span
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-1 whitespace-nowrap text-[9px] uppercase tracking-[0.08em] sm:text-[10px] sm:tracking-[0.18em]',
                  isCurrent
                    ? 'rounded-full border border-border/70 bg-card/70 px-2 py-1 font-semibold text-foreground sm:px-2.5'
                    : isDone
                      ? 'font-medium text-foreground/80'
                      : 'text-muted-foreground/70',
                )}
              >
                {isDone ? (
                  <Check
                    className="h-3 w-3 shrink-0 text-primary"
                    aria-hidden
                  />
                ) : isCurrent ? (
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  />
                ) : null}
                {label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
