'use server'

import { recordEvent } from '@/lib/analytics/recorder'
import { isAnalyticsEventName } from '@/lib/analytics/events'
import {
  recordBookingCompleted,
  recordPaymentFailed,
  recordPaymentInitiated,
} from '@/lib/analytics/bookingOutcome'

/**
 * Server-side event logger for use in trusted server paths (e.g. after Razorpay
 * verify succeeds, log `booking_completed` so the conversion number is never
 * corrupted by ad blockers).
 *
 * NEVER throws. Callers should still wrap with `.catch(() => {})` for safety.
 */
export async function trackEventAction(
  name: string,
  properties?: Record<string, unknown>,
  propertySlug?: string | null,
): Promise<void> {
  if (!isAnalyticsEventName(name)) return
  await recordEvent({
    name,
    properties,
    propertySlug: propertySlug ?? null,
    source: 'server',
  })
}

type BookingOutcomeInput = {
  bookingReference?: string | null
  propertySlug: string
  amount: number
  paymentMode: 'pay_now' | 'pay_later' | 'pay_at_property'
  meta?: Record<string, unknown>
}

export async function trackBookingCompletedAction(input: BookingOutcomeInput): Promise<void> {
  await recordBookingCompleted(input)
}

export async function trackPaymentInitiatedAction(input: BookingOutcomeInput): Promise<void> {
  await recordPaymentInitiated(input)
}

export async function trackPaymentFailedAction(input: BookingOutcomeInput): Promise<void> {
  await recordPaymentFailed(input)
}
