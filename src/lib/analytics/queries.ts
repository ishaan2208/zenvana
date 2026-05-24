import 'server-only'

import { prisma } from '@/lib/prisma'

export type DashboardRange = '7d' | '30d' | '90d'

const RANGE_DAYS: Record<DashboardRange, number> = { '7d': 7, '30d': 30, '90d': 90 }

const FUNNEL_STEPS = [
  'property_viewed',
  'room_selected',
  'checkout_viewed',
  'payment_initiated',
  'booking_completed',
] as const

function rangeStart(range: DashboardRange): Date {
  const days = RANGE_DAYS[range]
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

export type DashboardSummary = {
  sessions: number
  bookings: number
  conversionRate: number
  avgEventsPerSession: number
}

export async function getDashboardSummary(range: DashboardRange): Promise<DashboardSummary> {
  const since = rangeStart(range)

  const [sessions, bookings, eventCount] = await Promise.all([
    prisma.analyticsSession.count({ where: { createdAt: { gte: since } } }),
    prisma.analyticsEvent.count({
      where: { name: 'booking_completed', occurredAt: { gte: since } },
    }),
    prisma.analyticsEvent.count({ where: { occurredAt: { gte: since } } }),
  ])

  const conversionRate = sessions === 0 ? 0 : bookings / sessions
  const avgEventsPerSession = sessions === 0 ? 0 : eventCount / sessions

  return { sessions, bookings, conversionRate, avgEventsPerSession }
}

export type FunnelStep = {
  name: string
  sessions: number
  dropFromPrev: number
}

export async function getFunnel(range: DashboardRange): Promise<FunnelStep[]> {
  const since = rangeStart(range)

  const rows: FunnelStep[] = []
  let prevCount = 0

  for (let i = 0; i < FUNNEL_STEPS.length; i++) {
    const name = FUNNEL_STEPS[i]
    const distinct = await prisma.analyticsEvent.findMany({
      where: { name, occurredAt: { gte: since } },
      select: { sessionId: true },
      distinct: ['sessionId'],
    })
    const count = distinct.length
    const drop = i === 0 ? 0 : prevCount === 0 ? 0 : 1 - count / prevCount
    rows.push({ name, sessions: count, dropFromPrev: drop })
    prevCount = count
  }

  return rows
}

export type TimeSeriesPoint = {
  date: string
  sessions: number
  bookings: number
}

type TimeSeriesRow = { day: Date; bookings: bigint; sessions: bigint }

export async function getTimeSeries(range: DashboardRange): Promise<TimeSeriesPoint[]> {
  const since = rangeStart(range)

  const rows = await prisma.$queryRaw<TimeSeriesRow[]>`
    WITH days AS (
      SELECT generate_series(
        date_trunc('day', ${since}::timestamp),
        date_trunc('day', now()),
        '1 day'::interval
      ) AS day
    ),
    bookings AS (
      SELECT date_trunc('day', "occurredAt") AS day, count(*) AS bookings
      FROM "analytics"."event"
      WHERE name = 'booking_completed' AND "occurredAt" >= ${since}
      GROUP BY 1
    ),
    sessions AS (
      SELECT date_trunc('day', "createdAt") AS day, count(*) AS sessions
      FROM "analytics"."session"
      WHERE "createdAt" >= ${since}
      GROUP BY 1
    )
    SELECT days.day,
           COALESCE(bookings.bookings, 0) AS bookings,
           COALESCE(sessions.sessions, 0) AS sessions
    FROM days
    LEFT JOIN bookings ON days.day = bookings.day
    LEFT JOIN sessions ON days.day = sessions.day
    ORDER BY days.day ASC
  `

  return rows.map((row) => ({
    date: row.day.toISOString().slice(0, 10),
    sessions: Number(row.sessions),
    bookings: Number(row.bookings),
  }))
}

export type TopProperty = { propertySlug: string; bookings: number }

export async function getTopProperties(range: DashboardRange): Promise<TopProperty[]> {
  const since = rangeStart(range)

  const grouped = await prisma.analyticsEvent.groupBy({
    by: ['propertySlug'],
    where: {
      name: 'booking_completed',
      occurredAt: { gte: since },
      propertySlug: { not: null },
    },
    _count: { _all: true },
    orderBy: { _count: { propertySlug: 'desc' } },
    take: 10,
  })

  return grouped.map((row) => ({
    propertySlug: row.propertySlug ?? 'unknown',
    bookings: row._count._all,
  }))
}

export type UtmRow = {
  utmSource: string
  sessions: number
  bookings: number
  conversionRate: number
}

type UtmRawRow = { utm_source: string | null; sessions: bigint; bookings: bigint }

export async function getUtmTable(range: DashboardRange): Promise<UtmRow[]> {
  const since = rangeStart(range)

  const rows = await prisma.$queryRaw<UtmRawRow[]>`
    SELECT s."utmSource" AS utm_source,
           count(DISTINCT s.id) AS sessions,
           count(DISTINCT CASE WHEN e.name = 'booking_completed' THEN e.id END) AS bookings
    FROM "analytics"."session" s
    LEFT JOIN "analytics"."event" e
      ON e."sessionId" = s.id AND e."occurredAt" >= ${since}
    WHERE s."createdAt" >= ${since}
    GROUP BY s."utmSource"
    ORDER BY sessions DESC
    LIMIT 25
  `

  return rows.map((row) => {
    const sessions = Number(row.sessions)
    const bookings = Number(row.bookings)
    return {
      utmSource: row.utm_source ?? 'direct',
      sessions,
      bookings,
      conversionRate: sessions === 0 ? 0 : bookings / sessions,
    }
  })
}

export type RecentEventRow = {
  id: string
  sessionId: string
  name: string
  occurredAt: string
  propertySlug: string | null
  source: string
  utmSource: string | null
}

export async function listRecentEvents(limit: number): Promise<RecentEventRow[]> {
  const rows = await prisma.analyticsEvent.findMany({
    orderBy: { occurredAt: 'desc' },
    take: Math.min(limit, 500),
    select: {
      id: true,
      sessionId: true,
      name: true,
      occurredAt: true,
      propertySlug: true,
      source: true,
      utmSource: true,
    },
  })

  return rows.map((row) => ({
    id: row.id.toString(),
    sessionId: row.sessionId,
    name: row.name,
    occurredAt: row.occurredAt.toISOString(),
    propertySlug: row.propertySlug,
    source: row.source,
    utmSource: row.utmSource,
  }))
}

export type SessionDetail = {
  id: string
  createdAt: string
  lastSeenAt: string
  landingPath: string
  referrer: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  deviceType: string | null
  country: string | null
  events: Array<{
    id: string
    name: string
    occurredAt: string
    propertySlug: string | null
    source: string
    properties: unknown
  }>
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetail | null> {
  const session = await prisma.analyticsSession.findUnique({
    where: { id: sessionId },
    include: {
      events: { orderBy: { occurredAt: 'asc' } },
    },
  })
  if (!session) return null

  return {
    id: session.id,
    createdAt: session.createdAt.toISOString(),
    lastSeenAt: session.lastSeenAt.toISOString(),
    landingPath: session.landingPath,
    referrer: session.referrer,
    utmSource: session.utmSource,
    utmMedium: session.utmMedium,
    utmCampaign: session.utmCampaign,
    deviceType: session.deviceType,
    country: session.country,
    events: session.events.map((e) => ({
      id: e.id.toString(),
      name: e.name,
      occurredAt: e.occurredAt.toISOString(),
      propertySlug: e.propertySlug,
      source: e.source,
      properties: e.properties,
    })),
  }
}
