'use client'

import type { ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'

import { PlaneButton } from '@/components/PlaneButton'

/**
 * Docked mobile action bar for the checkout forms — the primary CTA is always
 * on screen instead of five scrolls down. Rendered as the LAST CHILD inside
 * each checkout <form> so `type="submit"` needs zero extra wiring.
 *
 * Chrome mirrors PropertyMobileBookingBar (hotels/[slug]) so the docked-bar
 * pattern reads as one system across the funnel. Hidden on xl+ where the
 * sticky sidebar owns the summary and the in-flow submit stays visible.
 *
 * Forms rendering this must reserve space with `pb-28 xl:pb-0` on their root
 * so no content hides behind the bar (zero layout shift — always mounted).
 */
export function CheckoutDockBar({
  children,
  ctaLabel,
  sentLabel = 'Confirming…',
  submitting = false,
  disabled = false,
  microline,
}: {
  /** Left slot — the live or static booking total. */
  children: ReactNode
  ctaLabel: ReactNode
  sentLabel?: string
  /** Drives the plane take-off; wire to the form's submitting state. */
  submitting?: boolean
  disabled?: boolean
  /** One-line reassurance above the action row. */
  microline?: string
}) {
  // Bar opacity must stay on the default Tailwind scale — off-scale values
  // like /92 compile to no CSS and the bar turns transparent.
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-2.5 backdrop-blur-xl xl:hidden">
      <div className="mx-auto flex max-w-7xl flex-col gap-1.5">
        {microline ? (
          <div className="flex items-center gap-1.5 px-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{microline}</span>
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">{children}</div>

          <PlaneButton
            type="submit"
            flying={submitting}
            disabled={disabled || submitting}
            sentLabel={sentLabel}
            className="h-12 shrink-0 rounded-full bg-blue-600 px-6 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            {ctaLabel}
          </PlaneButton>
        </div>
      </div>
    </div>
  )
}
