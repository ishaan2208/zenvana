import 'server-only'

import { getPublicBookingVoucherDetailsByReference } from '@/lib/api'
import type { CompletedBookingEvent } from '@/lib/analytics/queries'

export type BookingDrilldownRow = {
  bookingReference: string
  propertySlug: string | null
  sessionId: string
  /** When analytics recorded the conversion */
  convertedAt: string
  channel: string | null
  utmSource: string | null
  utmCampaign: string | null
  /** Analytics event amount (fallback if PMS fetch fails) */
  analyticsAmount: number | null
  /** Enriched from StaySystems PMS — null if fetch failed */
  detail: {
    guestName: string
    guestPhoneLast4: string | null
    propertyName: string
    checkIn: string | null
    checkOut: string | null
    nights: number
    rooms: number
    roomTypes: string
    avgTariff: number | null
    totalAmount: number
    totalPaid: number
    createdAt: string
    source: string
  } | null
  detailError?: string
}

function phoneLast4(phone: string | null | undefined): string | null {
  const digits = String(phone ?? '').replace(/\D/g, '')
  if (digits.length < 4) return null
  return digits.slice(-4)
}

function enrichFromVoucher(
  event: CompletedBookingEvent,
  voucher: Awaited<ReturnType<typeof getPublicBookingVoucherDetailsByReference>>,
): BookingDrilldownRow {
  const rooms = voucher.BookingRoom ?? []
  const nights = rooms.reduce((sum, r) => sum + (Number(r.totalNight) || 0), 0)
  const checkIn = rooms[0]?.checkInDate ?? rooms[0]?.checkIn ?? null
  const checkOut =
    rooms.length > 0
      ? rooms.reduce((latest, r) => {
          const d = r.checkOutDate ?? r.checkOut
          if (!d) return latest
          if (!latest) return d
          return new Date(d) > new Date(latest) ? d : latest
        }, null as string | null)
      : null

  const tariffSum = rooms.reduce((sum, r) => {
    const tariff = Number(r.tariff) || 0
    const n = Number(r.totalNight) || 1
    return sum + tariff * n
  }, 0)
  const avgTariff =
    nights > 0
      ? tariffSum / nights
      : rooms.length > 0
        ? rooms.reduce((s, r) => s + (Number(r.tariff) || 0), 0) / rooms.length
        : null

  const roomTypes = [...new Set(rooms.map((r) => r.room_type?.name).filter(Boolean))].join(', ')

  return {
    bookingReference: event.bookingReference,
    propertySlug: event.propertySlug,
    sessionId: event.sessionId,
    convertedAt: event.occurredAt,
    channel: event.channel,
    utmSource: event.utmSource,
    utmCampaign: event.utmCampaign,
    analyticsAmount: event.amount,
    detail: {
      guestName: voucher.guestName,
      guestPhoneLast4: phoneLast4(voucher.guestPhoneNumber),
      propertyName: voucher.property?.name ?? event.propertySlug ?? '—',
      checkIn,
      checkOut,
      nights,
      rooms: voucher.totalRooms || rooms.length,
      roomTypes,
      avgTariff,
      totalAmount: Number(voucher.totalAmount) || 0,
      totalPaid: Number(voucher.totalPaid) || 0,
      createdAt: voucher.createdAt,
      source: voucher.source,
    },
  }
}

/**
 * Enrich analytics booking_completed events with PMS voucher details
 * (guest name, stay dates, tariff, createdAt). Failures are soft —
 * the row still appears with analytics-only fields.
 */
export async function enrichBookingsWithPmsDetails(
  events: CompletedBookingEvent[],
): Promise<BookingDrilldownRow[]> {
  if (!events.length) return []

  const results = await Promise.all(
    events.map(async (event) => {
      try {
        const voucher = await getPublicBookingVoucherDetailsByReference(event.bookingReference)
        return enrichFromVoucher(event, voucher)
      } catch (err) {
        return {
          bookingReference: event.bookingReference,
          propertySlug: event.propertySlug,
          sessionId: event.sessionId,
          convertedAt: event.occurredAt,
          channel: event.channel,
          utmSource: event.utmSource,
          utmCampaign: event.utmCampaign,
          analyticsAmount: event.amount,
          detail: null,
          detailError: err instanceof Error ? err.message : 'Failed to load booking',
        } satisfies BookingDrilldownRow
      }
    }),
  )

  return results
}
