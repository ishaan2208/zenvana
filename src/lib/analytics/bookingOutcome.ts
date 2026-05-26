import 'server-only'

import { recordEvent } from '@/lib/analytics/recorder'

type PaymentMode = 'pay_now' | 'pay_later' | 'pay_at_property'

type SharedBookingPayload = {
  propertySlug: string
  amount: number
  paymentMode: PaymentMode
  bookingReference?: string | null
  meta?: Record<string, unknown>
}

export async function recordBookingCompleted(input: SharedBookingPayload): Promise<void> {
  await recordEvent({
    name: 'booking_completed',
    source: 'server',
    propertySlug: input.propertySlug,
    properties: {
      bookingReference: input.bookingReference ?? null,
      amount: input.amount,
      paymentMode: input.paymentMode,
      ...(input.meta ?? {}),
    },
  })
}

export async function recordPaymentInitiated(input: SharedBookingPayload): Promise<void> {
  await recordEvent({
    name: 'payment_initiated',
    source: 'server',
    propertySlug: input.propertySlug,
    properties: {
      bookingReference: input.bookingReference ?? null,
      amount: input.amount,
      paymentMode: input.paymentMode,
      ...(input.meta ?? {}),
    },
  })
}

export async function recordPaymentFailed(input: SharedBookingPayload): Promise<void> {
  await recordEvent({
    name: 'payment_failed',
    source: 'server',
    propertySlug: input.propertySlug,
    properties: {
      bookingReference: input.bookingReference ?? null,
      amount: input.amount,
      paymentMode: input.paymentMode,
      ...(input.meta ?? {}),
    },
  })
}
