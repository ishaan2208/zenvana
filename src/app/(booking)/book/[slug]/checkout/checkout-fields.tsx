'use client'

import type { ReactNode } from 'react'

/**
 * Shared leaf components + helpers for the three checkout forms
 * (CheckoutForm, MultiRoomCheckoutForm, HourlyCheckoutForm).
 *
 * These were previously duplicated near-verbatim per form; the richest
 * variants (h-14 inputs, eyebrow labels) are the canonical ones here.
 * Form shells, state machines, coupon logic and OTP wiring stay per-form.
 */

export const GUEST_REQUIRED_TOAST_ID = 'zenvana-checkout-guest-required'
export const OTP_REQUIRED_TOAST_ID = 'zenvana-checkout-otp-required'

export async function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return
  if (window.Razorpay) return
  await new Promise<void>((resolve, reject) => {
    const url = 'https://checkout.razorpay.com/v1/checkout.js'
    const existing = document.querySelector(`script[src="${url}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () =>
        reject(new Error('Razorpay script failed to load')),
      )
      return
    }
    const s = document.createElement('script')
    s.src = url
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Razorpay'))
    document.body.appendChild(s)
  })
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void
      on: (
        event: string,
        handler: (res: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) => void,
      ) => void
    }
  }
}

export function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Smooth-scroll a field into view and focus it (validation error UX). */
export function focusCheckoutField(fieldId: string) {
  requestAnimationFrame(() => {
    document.getElementById(fieldId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
    document.getElementById(fieldId)?.focus()
  })
}

export function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
}) {
  return (
    <div className="bg-background/72 rounded-[1.35rem] border border-border/60 p-4 backdrop-blur-xl dark:bg-background/35">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground dark:bg-background/45">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 text-sm font-medium leading-7 text-foreground">
            {value}
          </div>
        </div>
      </div>
    </div>
  )
}

export function InputField({
  id,
  label,
  type,
  value,
  onChange,
  required,
  autoComplete,
  icon,
  error,
}: {
  id: string
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  autoComplete?: string
  icon?: ReactNode
  error?: string
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-muted-foreground"
      >
        {label}
      </label>

      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted-foreground">
            {icon}
          </div>
        )}

        <input
          id={id}
          type={type}
          required={required}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className={`block h-14 w-full rounded-[1.1rem] border bg-background/70 text-foreground shadow-none outline-none transition placeholder:text-muted-foreground focus:ring-2 dark:bg-background/50 ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
              : 'border-border/70 focus:border-primary focus:ring-primary/15'
          } ${icon ? 'pl-11 pr-4' : 'px-4'}`}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}

export function PaymentOptionCard({
  checked,
  onSelect,
  title,
  description,
  icon,
  tone,
  badge,
}: {
  checked: boolean
  onSelect: () => void
  title: string
  description: ReactNode
  icon: ReactNode
  tone: 'primary' | 'neutral'
  badge?: string
}) {
  const activePrimary =
    checked && tone === 'primary'
      ? 'border-primary bg-primary/7 ring-1 ring-primary'
      : ''

  const activeNeutral =
    checked && tone === 'neutral'
      ? 'border-foreground/20 bg-foreground/[0.03] ring-1 ring-foreground/10'
      : ''

  return (
    <label
      className={`cursor-pointer rounded-[1.45rem] border p-4 transition-all ${
        checked
          ? `${activePrimary} ${activeNeutral}`
          : 'bg-background/72 border-border/60 hover:border-foreground/15 dark:bg-background/35'
      }`}
    >
      <input
        type="radio"
        name="paymentMode"
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />

      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            tone === 'primary'
              ? 'bg-primary text-primary-foreground'
              : 'bg-foreground text-background'
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-medium tracking-tight text-foreground">
              {title}
            </p>

            {badge && (
              <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-primary">
                {badge}
              </span>
            )}

            {checked && !badge && (
              <span className="rounded-full border border-foreground/15 bg-foreground/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-foreground/80">
                Selected
              </span>
            )}
          </div>

          <div className="mt-2 text-sm leading-7 text-muted-foreground">
            {description}
          </div>
        </div>
      </div>
    </label>
  )
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M19.05 4.94A9.86 9.86 0 0 0 12.03 2C6.55 2 2.09 6.45 2.09 11.94c0 1.76.46 3.48 1.34 5L2 22l5.2-1.36a9.92 9.92 0 0 0 4.82 1.23h.01c5.48 0 9.94-4.46 9.94-9.94a9.86 9.86 0 0 0-2.92-6.99Zm-7.02 15.25h-.01a8.25 8.25 0 0 1-4.2-1.15l-.3-.18-3.08.81.82-3-.2-.31a8.22 8.22 0 0 1-1.27-4.41c0-4.55 3.7-8.25 8.26-8.25 2.2 0 4.27.86 5.83 2.41a8.2 8.2 0 0 1 2.42 5.84c0 4.55-3.71 8.25-8.27 8.25Zm4.52-6.18c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.13-.57.12-.17.25-.65.8-.8.97-.15.17-.3.19-.55.06-.25-.12-1.06-.39-2.02-1.25-.74-.66-1.24-1.48-1.39-1.73-.15-.25-.02-.38.11-.5.11-.11.25-.3.37-.45.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.57-1.37-.78-1.88-.21-.5-.42-.43-.57-.44h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.43 1.02 2.6.12.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.52.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29Z" />
    </svg>
  )
}
