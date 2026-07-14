'use client'

import { type ReactNode, useState } from 'react'
import { Send } from 'lucide-react'

import { useAppRouter } from '@/hooks/useAppRouter'
import { cn } from '@/lib/utils'

type PlaneButtonProps = {
  children: ReactNode
  /** Navigate here on activate (the plane takes off, then we route). */
  href?: string
  /** Extra side-effect on activate (analytics, form submit prep). */
  onActivate?: () => void | Promise<void>
  /** Prefetch hook fired on hover/focus. */
  onHoverPrefetch?: () => void
  /** Label that slides in behind the plane once it lifts off. */
  sentLabel?: string
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit'
  /**
   * Controlled take-off state. When provided, the plane flies only while this
   * is true (e.g. a form's `submitting` state) instead of latching on click —
   * so a failed validation never strands the button in its "sent" state.
   */
  flying?: boolean
  'aria-label'?: string
}

/**
 * CTA that confirms "off you go" with a paper-plane take-off the moment it's
 * pressed — so even a fast route change feels acknowledged. The plane lifts and
 * arcs away, a vapor trail streaks behind it, and the label is replaced by a
 * "Taking you there" line. Under `prefers-reduced-motion` the plane simply
 * fades and the sent-label crossfades in (handled in globals.css).
 */
export function PlaneButton({
  children,
  href,
  onActivate,
  onHoverPrefetch,
  sentLabel = 'Taking you there',
  className,
  disabled,
  type = 'button',
  flying: flyingProp,
  ...rest
}: PlaneButtonProps) {
  const router = useAppRouter()
  const [flyingState, setFlyingState] = useState(false)
  const flying = flyingProp ?? flyingState

  const activate = () => {
    if (disabled || flying) return
    if (flyingProp === undefined) setFlyingState(true)
    void onActivate?.()
    if (href) router.push(href)
  }

  return (
    <button
      type={type}
      disabled={disabled}
      data-flying={flying ? 'true' : 'false'}
      onClick={activate}
      onMouseEnter={onHoverPrefetch}
      onFocus={onHoverPrefetch}
      className={cn(
        'plane-button pressable inline-flex items-center justify-center gap-2',
        className,
      )}
      {...rest}
    >
      <span className="plane-button__label inline-flex items-center justify-center gap-2">
        {children}
      </span>
      <span className="plane-button__plane" aria-hidden>
        <Send className="h-4 w-4" />
      </span>
      <span className="plane-button__sent" aria-hidden={!flying}>
        <Send className="h-4 w-4" />
        {sentLabel}
      </span>
      <span className="plane-button__trail" aria-hidden />
    </button>
  )
}
