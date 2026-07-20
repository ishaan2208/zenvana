import 'server-only'

import {
  getPublicBookingVoucherDetailsByReference,
  getPublicWebsiteBookingStats,
  type PublicWebsiteBookingListItem,
} from '@/lib/api'
import {
  listCompletedBookingEvents,
  type CompletedBookingEvent,
  type DashboardFilters,
  type DashboardRange,
} from '@/lib/analytics/queries'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export type BookingDrilldownRow = {
  bookingReference: string
  propertySlug: string | null
  sessionId: string
  /** When analytics recorded the conversion (or PMS createdAt when analytics missing) */
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

function rangeStart(range: DashboardRange, from: Date = new Date()): Date {
  const days = range === '7d' ? 7 : range === '10d' ? 10 : range === '90d' ? 90 : 30
  const d = new Date(from)
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
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

type BookingAttribution = {
  sessionId: string
  channel: string | null
  utmSource: string | null
  utmCampaign: string | null
  amount: number | null
  occurredAt: string
}

async function attributionByReferences(
  refs: string[],
): Promise<Map<string, BookingAttribution>> {
  const out = new Map<string, BookingAttribution>()
  if (!refs.length) return out

  const rows = await prisma.$queryRaw<
    Array<{
      booking_reference: string
      session_id: string
      channel: string | null
      utm_source: string | null
      utm_campaign: string | null
      amount: number | null
      occurred_at: Date
    }>
  >`
    SELECT DISTINCT ON (e."bookingReference")
      e."bookingReference" AS booking_reference,
      e."sessionId" AS session_id,
      COALESCE(s."channel", 'direct') AS channel,
      s."utmSource" AS utm_source,
      s."utmCampaign" AS utm_campaign,
      CASE
        WHEN (e.properties->>'amount') ~ '^[0-9]+(\\.[0-9]+)?$'
        THEN (e.properties->>'amount')::float8
        ELSE NULL
      END AS amount,
      e."occurredAt" AS occurred_at
    FROM "analytics"."event" e
    INNER JOIN "analytics"."session" s ON s.id = e."sessionId"
    WHERE e.name = 'booking_completed'
      AND e."bookingReference" IN (${Prisma.join(refs)})
    ORDER BY e."bookingReference", e."occurredAt" DESC
  `

  for (const row of rows) {
    out.set(row.booking_reference, {
      sessionId: row.session_id,
      channel: row.channel,
      utmSource: row.utm_source,
      utmCampaign: row.utm_campaign,
      amount: row.amount == null ? null : Number(row.amount),
      occurredAt: row.occurred_at.toISOString(),
    })
  }
  return out
}

function rowFromPmsListItem(
  item: PublicWebsiteBookingListItem,
  attr?: BookingAttribution,
): BookingDrilldownRow {
  return {
    bookingReference: item.bookingReference,
    propertySlug: item.slug,
    sessionId: attr?.sessionId ?? 'pms',
    convertedAt: attr?.occurredAt ?? item.createdAt,
    channel: attr?.channel ?? null,
    utmSource: attr?.utmSource ?? null,
    utmCampaign: attr?.utmCampaign ?? null,
    analyticsAmount: attr?.amount ?? null,
    detail: {
      guestName: item.guestName,
      guestPhoneLast4: item.guestPhoneLast4,
      propertyName: item.propertyName,
      checkIn: item.checkIn,
      checkOut: item.checkOut,
      nights: item.nights,
      rooms: item.totalRooms,
      roomTypes: item.roomTypes,
      avgTariff: item.avgTariff,
      totalAmount: item.totalAmount,
      totalPaid: item.totalPaid,
      createdAt: item.createdAt,
      source: item.source,
    },
  }
}

/**
 * Bookings tab source of truth: PMS WEBSITE bookings in range.
 * Falls back to analytics→voucher enrichment when channel/UTM filters apply
 * or the PMS list endpoint is unavailable.
 */
export async function listBookingsDrilldown(
  range: DashboardRange,
  filters?: DashboardFilters,
  limit = 40,
): Promise<BookingDrilldownRow[]> {
  const propertySlug = filters?.propertySlug?.trim() || null
  const channel = filters?.channel?.trim() || null
  const utmSource = filters?.utmSource?.trim() || null
  const canUsePmsList =
    (!channel || channel === 'all') && (!utmSource || utmSource === 'all')

  if (canUsePmsList) {
    const pms = await getPublicWebsiteBookingStats({
      from: rangeStart(range),
      to: new Date(),
      slug: propertySlug && propertySlug !== 'all' ? propertySlug : null,
      list: true,
      limit,
    })
    if (pms?.list?.length) {
      const attrs = await attributionByReferences(
        pms.list.map((b) => b.bookingReference).filter((r) => r && r !== 'N/A'),
      )
      return pms.list.map((item) => rowFromPmsListItem(item, attrs.get(item.bookingReference)))
    }
  }

  const events = await listCompletedBookingEvents(range, filters, limit)
  return enrichBookingsWithPmsDetails(events)
}
