'use client'

import { useEffect } from 'react'

import { track } from '@/lib/analytics/client'
import { pushDataLayerEvent } from '@/lib/analytics/gtm'

/**
 * Safety-net first-party booking_completed on the confirmation page.
 * Deduped by bookingReference in the recorder, so either the checkout
 * server action OR this page landing is enough to record the conversion.
 */
export function BookingConfirmedConversion({
  bookingReference,
  value,
  currency = 'INR',
  propertyName,
  propertySlug,
  roomTypeName,
  checkIn,
  checkOut,
}: {
  bookingReference?: string | null
  value?: number | null
  currency?: string
  propertyName?: string | null
  propertySlug?: string | null
  roomTypeName?: string | null
  checkIn?: string | null
  checkOut?: string | null
}) {
  useEffect(() => {
    const transactionId = bookingReference?.trim() || null
    const dedupeKey =
      'zenvana_booking_conversion_' +
      (transactionId ??
        [propertySlug, checkIn, checkOut, roomTypeName, value]
          .map((v) => (v == null ? '' : String(v)))
          .join('|'))

    let alreadyFired = false
    try {
      if (window.sessionStorage.getItem(dedupeKey)) {
        alreadyFired = true
      } else {
        window.sessionStorage.setItem(dedupeKey, '1')
      }
    } catch {
      /* private mode / quota — fall through */
    }

    if (alreadyFired) return

    // First-party conversion safety net (server-deduped by bookingReference).
    if (transactionId || propertySlug) {
      track(
        'booking_completed',
        {
          bookingReference: transactionId,
          amount: typeof value === 'number' && !Number.isNaN(value) ? value : null,
          paymentMode: 'confirmation_page',
          surface: 'confirmation_safety_net',
          roomTypeName: roomTypeName ?? null,
          checkIn: checkIn ?? null,
          checkOut: checkOut ?? null,
        },
        propertySlug ?? null,
      )
    }

    pushDataLayerEvent({
      event: 'booking_confirmed',
      confirmation_type: transactionId ? 'confirmed' : 'request_received',
      transaction_id: transactionId ?? undefined,
      value: typeof value === 'number' && !Number.isNaN(value) ? value : undefined,
      currency,
      property_name: propertyName ?? undefined,
      property_slug: propertySlug ?? undefined,
      room_type: roomTypeName ?? undefined,
      check_in: checkIn ?? undefined,
      check_out: checkOut ?? undefined,
    })
  }, [
    bookingReference,
    value,
    currency,
    propertyName,
    propertySlug,
    roomTypeName,
    checkIn,
    checkOut,
  ])

  return null
}
