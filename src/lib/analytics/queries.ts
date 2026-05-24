import 'server-only'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type DashboardRange = '7d' | '30d' | '90d'

const RANGE_DAYS: Record<DashboardRange, number> = { '7d': 7, '30d': 30, '90d': 90 }

const FUNNEL_STEPS = [
  'property_viewed',
  'dates_selected',
  'availability_checked',
  'room_selected',
  'checkout_viewed',
  'payment_initiated',
  'booking_completed',
] as const

export type DashboardFilters = {
  propertySlug?: string | null
  utmSource?: string | null
}

function rangeStart(range: DashboardRange): Date {
  const days = RANGE_DAYS[range]
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

function normalizeFilter(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed === 'all') return null
  return trimmed.slice(0, 128)
}

function normalizeFilters(filters?: DashboardFilters): DashboardFilters {
  const propertySlug = normalizeFilter(filters?.propertySlug)
  const utmSource = normalizeFilter(filters?.utmSource)
  return { propertySlug, utmSource }
}

function eventWhere(since: Date, filters?: DashboardFilters): Prisma.AnalyticsEventWhereInput {
  const normalized = normalizeFilters(filters)
  return {
    occurredAt: { gte: since },
    ...(normalized.propertySlug ? { propertySlug: normalized.propertySlug } : {}),
    ...(normalized.utmSource
      ? normalized.utmSource === 'direct'
        ? { utmSource: null }
        : { utmSource: normalized.utmSource }
      : {}),
  }
}

export type DashboardSummary = {
  sessions: number
  bookings: number
  conversionRate: number
  avgEventsPerSession: number
}

export async function getDashboardSummary(
  range: DashboardRange,
  filters?: DashboardFilters,
): Promise<DashboardSummary> {
  const since = rangeStart(range)
  const where = eventWhere(since, filters)

  const [distinctSessions, bookings, eventCount] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where,
      select: { sessionId: true },
      distinct: ['sessionId'],
    }),
    prisma.analyticsEvent.count({
      where: { ...where, name: 'booking_completed' },
    }),
    prisma.analyticsEvent.count({ where }),
  ])
  const sessions = distinctSessions.length

  const conversionRate = sessions === 0 ? 0 : bookings / sessions
  const avgEventsPerSession = sessions === 0 ? 0 : eventCount / sessions

  return { sessions, bookings, conversionRate, avgEventsPerSession }
}

export type FunnelStep = {
  name: string
  sessions: number
  dropFromPrev: number
}

type FunnelRawRow = {
  step1: bigint
  step2: bigint
  step3: bigint
  step4: bigint
  step5: bigint
  step6: bigint
  step7: bigint
}

export async function getFunnel(range: DashboardRange, filters?: DashboardFilters): Promise<FunnelStep[]> {
  const since = rangeStart(range)
  const normalized = normalizeFilters(filters)

  const propertyFilter = normalized.propertySlug
    ? Prisma.sql`AND e."propertySlug" = ${normalized.propertySlug}`
    : Prisma.sql``
  const utmFilter = normalized.utmSource
    ? normalized.utmSource === 'direct'
      ? Prisma.sql`AND e."utmSource" IS NULL`
      : Prisma.sql`AND e."utmSource" = ${normalized.utmSource}`
    : Prisma.sql``

  const rows = await prisma.$queryRaw<FunnelRawRow[]>`
    WITH first_steps AS (
      SELECT
        e."sessionId",
        MIN(e."occurredAt") FILTER (WHERE e.name = 'property_viewed') AS s1,
        MIN(e."occurredAt") FILTER (WHERE e.name = 'dates_selected') AS s2,
        MIN(e."occurredAt") FILTER (WHERE e.name = 'availability_checked') AS s3,
        MIN(e."occurredAt") FILTER (WHERE e.name = 'room_selected') AS s4,
        MIN(e."occurredAt") FILTER (WHERE e.name = 'checkout_viewed') AS s5,
        MIN(e."occurredAt") FILTER (WHERE e.name = 'payment_initiated') AS s6,
        MIN(e."occurredAt") FILTER (WHERE e.name = 'booking_completed') AS s7
      FROM "analytics"."event" e
      WHERE e."occurredAt" >= ${since}
      ${propertyFilter}
      ${utmFilter}
      GROUP BY e."sessionId"
    )
    SELECT
      COUNT(*) FILTER (WHERE s1 IS NOT NULL) AS step1,
      COUNT(*) FILTER (WHERE s1 IS NOT NULL AND s2 IS NOT NULL AND s2 >= s1) AS step2,
      COUNT(*) FILTER (WHERE s1 IS NOT NULL AND s2 IS NOT NULL AND s3 IS NOT NULL AND s2 >= s1 AND s3 >= s2) AS step3,
      COUNT(*) FILTER (WHERE s1 IS NOT NULL AND s2 IS NOT NULL AND s3 IS NOT NULL AND s4 IS NOT NULL AND s2 >= s1 AND s3 >= s2 AND s4 >= s3) AS step4,
      COUNT(*) FILTER (WHERE s1 IS NOT NULL AND s2 IS NOT NULL AND s3 IS NOT NULL AND s4 IS NOT NULL AND s5 IS NOT NULL AND s2 >= s1 AND s3 >= s2 AND s4 >= s3 AND s5 >= s4) AS step5,
      COUNT(*) FILTER (WHERE s1 IS NOT NULL AND s2 IS NOT NULL AND s3 IS NOT NULL AND s4 IS NOT NULL AND s5 IS NOT NULL AND s6 IS NOT NULL AND s2 >= s1 AND s3 >= s2 AND s4 >= s3 AND s5 >= s4 AND s6 >= s5) AS step6,
      COUNT(*) FILTER (WHERE s1 IS NOT NULL AND s2 IS NOT NULL AND s3 IS NOT NULL AND s4 IS NOT NULL AND s5 IS NOT NULL AND s6 IS NOT NULL AND s7 IS NOT NULL AND s2 >= s1 AND s3 >= s2 AND s4 >= s3 AND s5 >= s4 AND s6 >= s5 AND s7 >= s6) AS step7
    FROM first_steps
  `
  const row = rows[0]
  const counts = row
    ? [
        Number(row.step1),
        Number(row.step2),
        Number(row.step3),
        Number(row.step4),
        Number(row.step5),
        Number(row.step6),
        Number(row.step7),
      ]
    : [0, 0, 0, 0, 0, 0, 0]

  const output: FunnelStep[] = []
  let prevCount = 0

  for (let i = 0; i < FUNNEL_STEPS.length; i++) {
    const name = FUNNEL_STEPS[i]
    const count = counts[i] ?? 0
    const drop = i === 0 ? 0 : prevCount === 0 ? 0 : 1 - count / prevCount
    output.push({ name, sessions: count, dropFromPrev: drop })
    prevCount = count
  }

  return output
}

export type TimeSeriesPoint = {
  date: string
  sessions: number
  bookings: number
}

type TimeSeriesRow = { day: Date; bookings: bigint; sessions: bigint }

export async function getTimeSeries(
  range: DashboardRange,
  filters?: DashboardFilters,
): Promise<TimeSeriesPoint[]> {
  const since = rangeStart(range)
  const normalized = normalizeFilters(filters)
  const propertyFilter = normalized.propertySlug
    ? Prisma.sql`AND e."propertySlug" = ${normalized.propertySlug}`
    : Prisma.sql``
  const utmFilter = normalized.utmSource
    ? normalized.utmSource === 'direct'
      ? Prisma.sql`AND e."utmSource" IS NULL`
      : Prisma.sql`AND e."utmSource" = ${normalized.utmSource}`
    : Prisma.sql``

  const rows = await prisma.$queryRaw<TimeSeriesRow[]>`
    WITH days AS (
      SELECT generate_series(
        date_trunc('day', ${since}::timestamp),
        date_trunc('day', now()),
        '1 day'::interval
      ) AS day
    ),
    filtered_events AS (
      SELECT e."sessionId", e.name, e."occurredAt"
      FROM "analytics"."event" e
      WHERE e."occurredAt" >= ${since}
      ${propertyFilter}
      ${utmFilter}
    ),
    bookings AS (
      SELECT date_trunc('day', "occurredAt") AS day, count(*) AS bookings
      FROM filtered_events
      WHERE name = 'booking_completed'
      GROUP BY 1
    ),
    sessions AS (
      SELECT date_trunc('day', MIN("occurredAt")) AS day, count(*) AS sessions
      FROM filtered_events
      GROUP BY "sessionId"
    ),
    sessions_by_day AS (
      SELECT day, count(*) AS sessions
      FROM sessions
      GROUP BY 1
    )
    SELECT days.day,
           COALESCE(bookings.bookings, 0) AS bookings,
           COALESCE(sessions_by_day.sessions, 0) AS sessions
    FROM days
    LEFT JOIN bookings ON days.day = bookings.day
    LEFT JOIN sessions_by_day ON days.day = sessions_by_day.day
    ORDER BY days.day ASC
  `

  return rows.map((row) => ({
    date: row.day.toISOString().slice(0, 10),
    sessions: Number(row.sessions),
    bookings: Number(row.bookings),
  }))
}

export type TopProperty = { propertySlug: string; bookings: number }

export async function getTopProperties(
  range: DashboardRange,
  filters?: DashboardFilters,
): Promise<TopProperty[]> {
  const since = rangeStart(range)
  const where = eventWhere(since, filters)

  const grouped = await prisma.analyticsEvent.groupBy({
    by: ['propertySlug'],
    where: {
      ...where,
      name: 'booking_completed',
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

export async function getUtmTable(range: DashboardRange, filters?: DashboardFilters): Promise<UtmRow[]> {
  const since = rangeStart(range)
  const normalized = normalizeFilters(filters)
  const propertyFilter = normalized.propertySlug
    ? Prisma.sql`AND e."propertySlug" = ${normalized.propertySlug}`
    : Prisma.sql``
  const utmFilter = normalized.utmSource
    ? normalized.utmSource === 'direct'
      ? Prisma.sql`AND e."utmSource" IS NULL`
      : Prisma.sql`AND e."utmSource" = ${normalized.utmSource}`
    : Prisma.sql``

  const rows = await prisma.$queryRaw<UtmRawRow[]>`
    SELECT e."utmSource" AS utm_source,
           count(DISTINCT e."sessionId") AS sessions,
           count(*) FILTER (WHERE e.name = 'booking_completed') AS bookings
    FROM "analytics"."event" e
    WHERE e."occurredAt" >= ${since}
      ${propertyFilter}
      ${utmFilter}
    GROUP BY e."utmSource"
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

export async function listRecentEvents(
  limit: number,
  range: DashboardRange,
  filters?: DashboardFilters,
): Promise<RecentEventRow[]> {
  const since = rangeStart(range)
  const where = eventWhere(since, filters)
  const rows = await prisma.analyticsEvent.findMany({
    where,
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
