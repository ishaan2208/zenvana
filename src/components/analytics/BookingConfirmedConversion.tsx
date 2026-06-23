'use client'

import { useEffect } from 'react'

import { pushDataLayerEvent } from '@/lib/analytics/gtm'

type Props = {
  bookingReference?: string | null
  value?: number | null
  currency?: string
  propertyName?: string | null
  propertySlug?: string | null
  roomTypeName?: string | null
  checkIn?: string | null
  checkOut?: string | null
}

const DEDUPE_PREFIX = 'zenvana_booking_conversion_'

/**
 * Fires a `booking_confirmed` event on the confirmation page for GTM to map to
 * a Google Ads booking conversion. De-duplicated per booking (by reference, or
 * by the page params when no reference is present) so a refresh or back/forward
 * navigation does not double-count the conversion.
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
}: Props) {
  useEffect(() => {
    const transactionId = bookingReference?.trim() || null
    const dedupeKey =
      DEDUPE_PREFIX +
      (transactionId ??
        [propertySlug, checkIn, checkOut, roomTypeName, value]
          .map((v) => (v == null ? '' : String(v)))
          .join('|'))

    try {
      if (window.sessionStorage.getItem(dedupeKey)) return
      window.sessionStorage.setItem(dedupeKey, '1')
    } catch {
      /* private mode / quota — fall through and still fire once per mount */
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
