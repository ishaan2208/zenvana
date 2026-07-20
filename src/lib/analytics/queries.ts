import 'server-only'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getPublicWebsiteBookingStats } from '@/lib/api'

export type DashboardRange = '7d' | '10d' | '30d' | '90d'

const RANGE_DAYS: Record<DashboardRange, number> = { '7d': 7, '10d': 10, '30d': 30, '90d': 90 }

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
  channel?: string | null
}

export type ActiveUsersSnapshot = {
  active1m: number
  active5m: number
  active15m: number
  measuredAt: string
}

function rangeStart(range: DashboardRange, from: Date = new Date()): Date {
  const days = RANGE_DAYS[range]
  const d = new Date(from)
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

function previousRangeWindow(range: DashboardRange): { since: Date; until: Date } {
  const until = rangeStart(range)
  const since = rangeStart(range, until)
  return { since, until }
}

function minutesAgo(minutes: number): Date {
  const d = new Date()
  d.setMinutes(d.getMinutes() - minutes)
  return d
}

export async function getActiveUsersSnapshot(): Promise<ActiveUsersSnapshot> {
  const [active1m, active5m, active15m] = await Promise.all([
    prisma.analyticsSession.count({ where: { lastSeenAt: { gte: minutesAgo(1) } } }),
    prisma.analyticsSession.count({ where: { lastSeenAt: { gte: minutesAgo(5) } } }),
    prisma.analyticsSession.count({ where: { lastSeenAt: { gte: minutesAgo(15) } } }),
  ])
  return {
    active1m,
    active5m,
    active15m,
    measuredAt: new Date().toISOString(),
  }
}

function normalizeFilter(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed === 'all') return null
  return trimmed.slice(0, 128)
}

function normalizeFilters(filters?: DashboardFilters): DashboardFilters {
  return {
    propertySlug: normalizeFilter(filters?.propertySlug),
    utmSource: normalizeFilter(filters?.utmSource),
    channel: normalizeFilter(filters?.channel),
  }
}

function canQueryPms(filters?: DashboardFilters): boolean {
  const normalized = normalizeFilters(filters)
  return !normalized.utmSource && !normalized.channel
}

/** SQL fragments joining events → sessions for attribution. */
function sessionJoinFilters(normalized: DashboardFilters) {
  const propertyFilter = normalized.propertySlug
    ? Prisma.sql`AND e."propertySlug" = ${normalized.propertySlug}`
    : Prisma.sql``
  // Attribute via session first-touch UTM (source of truth), not event column.
  const utmFilter = normalized.utmSource
    ? normalized.utmSource === 'direct'
      ? Prisma.sql`AND s."utmSource" IS NULL`
      : Prisma.sql`AND s."utmSource" = ${normalized.utmSource}`
    : Prisma.sql``
  const channelFilter = normalized.channel
    ? normalized.channel === 'direct'
      ? Prisma.sql`AND (s."channel" IS NULL OR s."channel" = 'direct')`
      : Prisma.sql`AND s."channel" = ${normalized.channel}`
    : Prisma.sql``
  return { propertyFilter, utmFilter, channelFilter }
}

export type DashboardSummary = {
  sessions: number
  bookings: number
  conversionRate: number
  avgEventsPerSession: number
  revenue: number
  whatsappClicks: number
  phoneClicks: number
}

type SummaryRaw = {
  sessions: bigint
  bookings: bigint
  events: bigint
  revenue: number | null
  whatsapp: bigint
  phone: bigint
}

async function summarizeWindow(
  since: Date,
  until: Date | null,
  filters?: DashboardFilters,
): Promise<DashboardSummary> {
  const normalized = normalizeFilters(filters)
  const { propertyFilter, utmFilter, channelFilter } = sessionJoinFilters(normalized)
  const untilFilter = until ? Prisma.sql`AND e."occurredAt" < ${until}` : Prisma.sql``

  const rows = await prisma.$queryRaw<SummaryRaw[]>`
    SELECT
      COUNT(DISTINCT e."sessionId") AS sessions,
      COUNT(*) FILTER (WHERE e.name = 'booking_completed') AS bookings,
      COUNT(*) AS events,
      COALESCE(SUM(
        CASE
          WHEN e.name = 'booking_completed'
            AND (e.properties->>'amount') ~ '^[0-9]+(\\.[0-9]+)?$'
          THEN (e.properties->>'amount')::float8
          ELSE 0
        END
      ), 0) AS revenue,
      COUNT(*) FILTER (WHERE e.name = 'whatsapp_clicked') AS whatsapp,
      COUNT(*) FILTER (
        WHERE e.name = 'cta_clicked'
          AND COALESCE(e.properties->>'type', '') = 'phone_call'
      ) AS phone
    FROM "analytics"."event" e
    INNER JOIN "analytics"."session" s ON s.id = e."sessionId"
    WHERE e."occurredAt" >= ${since}
    ${untilFilter}
    ${propertyFilter}
    ${utmFilter}
    ${channelFilter}
  `
  const row = rows[0]
  const sessions = Number(row?.sessions ?? 0)
  const bookings = Number(row?.bookings ?? 0)
  const events = Number(row?.events ?? 0)
  return {
    sessions,
    bookings,
    conversionRate: sessions === 0 ? 0 : bookings / sessions,
    avgEventsPerSession: sessions === 0 ? 0 : events / sessions,
    revenue: Number(row?.revenue ?? 0),
    whatsappClicks: Number(row?.whatsapp ?? 0),
    phoneClicks: Number(row?.phone ?? 0),
  }
}

export async function getDashboardSummary(
  range: DashboardRange,
  filters?: DashboardFilters,
): Promise<DashboardSummary> {
  return summarizeWindow(rangeStart(range), null, filters)
}

export type OverviewComparison = {
  /** KPI numbers (PMS-backed when available) */
  current: DashboardSummary
  previous: DashboardSummary
  /** Website PMS vs tracked undercount diagnostics */
  pms: {
    current: { bookings: number; revenue: number } | null
    previous: { bookings: number; revenue: number } | null
    trackedCurrent: { bookings: number; revenue: number }
    trackedPrevious: { bookings: number; revenue: number }
  }
  deltas: {
    sessions: number
    bookings: number
    conversionRate: number
    revenue: number
  }
}

export async function getOverviewComparison(
  range: DashboardRange,
  filters?: DashboardFilters,
): Promise<OverviewComparison> {
  const since = rangeStart(range)
  const now = new Date()
  const { since: prevSince, until: prevUntil } = previousRangeWindow(range)
  const normalized = normalizeFilters(filters)
  // PMS can filter by property slug only — not channel/UTM.
  const canUsePms = canQueryPms(filters)

  const [current, previous, pmsCurrent, pmsPrevious] = await Promise.all([
    summarizeWindow(since, null, filters),
    summarizeWindow(prevSince, prevUntil, filters),
    canUsePms
      ? getPublicWebsiteBookingStats({
          from: since,
          to: now,
          slug: normalized.propertySlug,
        })
      : Promise.resolve(null),
    canUsePms
      ? getPublicWebsiteBookingStats({
          from: prevSince,
          to: prevUntil,
          slug: normalized.propertySlug,
        })
      : Promise.resolve(null),
  ])

  const pms = {
    current: pmsCurrent
      ? { bookings: pmsCurrent.bookings, revenue: pmsCurrent.totalAmount }
      : null,
    previous: pmsPrevious
      ? { bookings: pmsPrevious.bookings, revenue: pmsPrevious.totalAmount }
      : null,
  }

  const bookCur = pms.current?.bookings ?? current.bookings
  const bookPrev = pms.previous?.bookings ?? previous.bookings
  const revCur = pms.current?.revenue ?? current.revenue
  const revPrev = pms.previous?.revenue ?? previous.revenue
  const convCur = current.sessions === 0 ? 0 : bookCur / current.sessions
  const convPrev = previous.sessions === 0 ? 0 : bookPrev / previous.sessions

  const pct = (cur: number, prev: number) => (prev === 0 ? (cur > 0 ? 1 : 0) : (cur - prev) / prev)
  return {
    current: {
      ...current,
      bookings: bookCur,
      revenue: revCur,
      conversionRate: convCur,
    },
    previous: {
      ...previous,
      bookings: bookPrev,
      revenue: revPrev,
      conversionRate: convPrev,
    },
    pms: {
      current: pms.current,
      previous: pms.previous,
      /** Raw first-party tracked totals (for undercount callouts) */
      trackedCurrent: { bookings: current.bookings, revenue: current.revenue },
      trackedPrevious: { bookings: previous.bookings, revenue: previous.revenue },
    },
    deltas: {
      sessions: pct(current.sessions, previous.sessions),
      bookings: pct(bookCur, bookPrev),
      conversionRate: convCur - convPrev,
      revenue: pct(revCur, revPrev),
    },
  }
}

export type FunnelStep = {
  name: string
  /** Sessions that fired this event (any order) — use for volume */
  sessions: number
  /** Sessions that completed the full ordered path up to this step */
  orderedSessions: number
  dropFromPrev: number
  orderedDropFromPrev: number
}

type FunnelRawRow = {
  reached1: bigint
  reached2: bigint
  reached3: bigint
  reached4: bigint
  reached5: bigint
  reached6: bigint
  reached7: bigint
  ordered1: bigint
  ordered2: bigint
  ordered3: bigint
  ordered4: bigint
  ordered5: bigint
  ordered6: bigint
  ordered7: bigint
  totalBookings: bigint
}

export type FunnelResult = {
  steps: FunnelStep[]
  /** All booking_completed events in range (matches Overview Bookings) */
  totalBookings: number
}

export async function getFunnel(
  range: DashboardRange,
  filters?: DashboardFilters,
): Promise<FunnelResult> {
  const since = rangeStart(range)
  const normalized = normalizeFilters(filters)
  const { propertyFilter, utmFilter, channelFilter } = sessionJoinFilters(normalized)

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
        MIN(e."occurredAt") FILTER (WHERE e.name = 'booking_completed') AS s7,
        COUNT(*) FILTER (WHERE e.name = 'booking_completed') AS booking_events
      FROM "analytics"."event" e
      INNER JOIN "analytics"."session" s ON s.id = e."sessionId"
      WHERE e."occurredAt" >= ${since}
      ${propertyFilter}
      ${utmFilter}
      ${channelFilter}
      GROUP BY e."sessionId"
    )
    SELECT
      COUNT(*) FILTER (WHERE s1 IS NOT NULL) AS reached1,
      COUNT(*) FILTER (WHERE s2 IS NOT NULL) AS reached2,
      COUNT(*) FILTER (WHERE s3 IS NOT NULL) AS reached3,
      COUNT(*) FILTER (WHERE s4 IS NOT NULL) AS reached4,
      COUNT(*) FILTER (WHERE s5 IS NOT NULL) AS reached5,
      COUNT(*) FILTER (WHERE s6 IS NOT NULL) AS reached6,
      COUNT(*) FILTER (WHERE s7 IS NOT NULL) AS reached7,
      COUNT(*) FILTER (WHERE s1 IS NOT NULL) AS ordered1,
      COUNT(*) FILTER (WHERE s1 IS NOT NULL AND s2 IS NOT NULL AND s2 >= s1) AS ordered2,
      COUNT(*) FILTER (WHERE s1 IS NOT NULL AND s2 IS NOT NULL AND s3 IS NOT NULL AND s2 >= s1 AND s3 >= s2) AS ordered3,
      COUNT(*) FILTER (WHERE s1 IS NOT NULL AND s2 IS NOT NULL AND s3 IS NOT NULL AND s4 IS NOT NULL AND s2 >= s1 AND s3 >= s2 AND s4 >= s3) AS ordered4,
      COUNT(*) FILTER (WHERE s1 IS NOT NULL AND s2 IS NOT NULL AND s3 IS NOT NULL AND s4 IS NOT NULL AND s5 IS NOT NULL AND s2 >= s1 AND s3 >= s2 AND s4 >= s3 AND s5 >= s4) AS ordered5,
      COUNT(*) FILTER (WHERE s1 IS NOT NULL AND s2 IS NOT NULL AND s3 IS NOT NULL AND s4 IS NOT NULL AND s5 IS NOT NULL AND s6 IS NOT NULL AND s2 >= s1 AND s3 >= s2 AND s4 >= s3 AND s5 >= s4 AND s6 >= s5) AS ordered6,
      COUNT(*) FILTER (WHERE s1 IS NOT NULL AND s2 IS NOT NULL AND s3 IS NOT NULL AND s4 IS NOT NULL AND s5 IS NOT NULL AND s6 IS NOT NULL AND s7 IS NOT NULL AND s2 >= s1 AND s3 >= s2 AND s4 >= s3 AND s5 >= s4 AND s6 >= s5 AND s7 >= s6) AS ordered7,
      COALESCE(SUM(booking_events), 0) AS "totalBookings"
    FROM first_steps
  `
  const row = rows[0]
  const reached = row
    ? [
        Number(row.reached1),
        Number(row.reached2),
        Number(row.reached3),
        Number(row.reached4),
        Number(row.reached5),
        Number(row.reached6),
        Number(row.reached7),
      ]
    : [0, 0, 0, 0, 0, 0, 0]
  const ordered = row
    ? [
        Number(row.ordered1),
        Number(row.ordered2),
        Number(row.ordered3),
        Number(row.ordered4),
        Number(row.ordered5),
        Number(row.ordered6),
        Number(row.ordered7),
      ]
    : [0, 0, 0, 0, 0, 0, 0]

  const steps: FunnelStep[] = []
  let prevReached = 0
  let prevOrdered = 0
  for (let i = 0; i < FUNNEL_STEPS.length; i++) {
    const name = FUNNEL_STEPS[i]
    const sessions = reached[i] ?? 0
    const orderedSessions = ordered[i] ?? 0
    const dropFromPrev = i === 0 ? 0 : prevReached === 0 ? 0 : 1 - sessions / prevReached
    const orderedDropFromPrev =
      i === 0 ? 0 : prevOrdered === 0 ? 0 : 1 - orderedSessions / prevOrdered
    steps.push({ name, sessions, orderedSessions, dropFromPrev, orderedDropFromPrev })
    prevReached = sessions
    prevOrdered = orderedSessions
  }
  return {
    steps,
    totalBookings: Number(row?.totalBookings ?? 0),
  }
}

/** Prefer PMS website booking count when channel/UTM filters are not applied. */
export async function getFunnelWithPms(
  range: DashboardRange,
  filters?: DashboardFilters,
): Promise<FunnelResult> {
  const funnel = await getFunnel(range, filters)
  if (!canQueryPms(filters)) return funnel
  const normalized = normalizeFilters(filters)
  const pms = await getPublicWebsiteBookingStats({
    from: rangeStart(range),
    to: new Date(),
    slug: normalized.propertySlug,
  })
  if (!pms) return funnel
  return { ...funnel, totalBookings: pms.bookings }
}

export type TimeSeriesPoint = {
  date: string
  sessions: number
  bookings: number
  revenue: number
}

type TimeSeriesRow = { day: Date; bookings: bigint; sessions: bigint; revenue: number | null }

export async function getTimeSeries(
  range: DashboardRange,
  filters?: DashboardFilters,
): Promise<TimeSeriesPoint[]> {
  const since = rangeStart(range)
  const normalized = normalizeFilters(filters)
  const { propertyFilter, utmFilter, channelFilter } = sessionJoinFilters(normalized)

  const rows = await prisma.$queryRaw<TimeSeriesRow[]>`
    WITH days AS (
      SELECT generate_series(
        date_trunc('day', ${since}::timestamp),
        date_trunc('day', now()),
        '1 day'::interval
      ) AS day
    ),
    filtered_events AS (
      SELECT e."sessionId", e.name, e."occurredAt", e.properties
      FROM "analytics"."event" e
      INNER JOIN "analytics"."session" s ON s.id = e."sessionId"
      WHERE e."occurredAt" >= ${since}
      ${propertyFilter}
      ${utmFilter}
      ${channelFilter}
    ),
    bookings AS (
      SELECT
        date_trunc('day', "occurredAt") AS day,
        count(*) AS bookings,
        COALESCE(SUM(
          CASE
            WHEN (properties->>'amount') ~ '^[0-9]+(\\.[0-9]+)?$'
            THEN (properties->>'amount')::float8
            ELSE 0
          END
        ), 0) AS revenue
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
           COALESCE(sessions_by_day.sessions, 0) AS sessions,
           COALESCE(bookings.revenue, 0) AS revenue
    FROM days
    LEFT JOIN bookings ON days.day = bookings.day
    LEFT JOIN sessions_by_day ON days.day = sessions_by_day.day
    ORDER BY days.day ASC
  `

  const tracked = rows.map((row) => ({
    date: row.day.toISOString().slice(0, 10),
    sessions: Number(row.sessions),
    bookings: Number(row.bookings),
    revenue: Number(row.revenue ?? 0),
  }))

  if (!canQueryPms(filters)) return tracked

  const pms = await getPublicWebsiteBookingStats({
    from: since,
    to: new Date(),
    slug: normalized.propertySlug,
    groupBy: 'day',
  })
  if (!pms?.byDay?.length) return tracked

  const byDay = new Map(pms.byDay.map((d) => [d.date, d]))
  return tracked.map((point) => {
    const pmsDay = byDay.get(point.date)
    if (!pmsDay) {
      return { ...point, bookings: 0, revenue: 0 }
    }
    return {
      ...point,
      bookings: pmsDay.bookings,
      revenue: pmsDay.totalAmount,
    }
  })
}

export type TopProperty = {
  propertySlug: string
  views: number
  sessions: number
  bookings: number
  revenue: number
  conversionRate: number
}

type PropertyRaw = {
  property_slug: string
  views: bigint
  sessions: bigint
  bookings: bigint
  revenue: number | null
}

export async function getTopProperties(
  range: DashboardRange,
  filters?: DashboardFilters,
): Promise<TopProperty[]> {
  const since = rangeStart(range)
  const normalized = normalizeFilters(filters)
  const { utmFilter, channelFilter } = sessionJoinFilters(normalized)
  const propertyFilter = normalized.propertySlug
    ? Prisma.sql`AND e."propertySlug" = ${normalized.propertySlug}`
    : Prisma.sql`AND e."propertySlug" IS NOT NULL`

  const rows = await prisma.$queryRaw<PropertyRaw[]>`
    SELECT
      e."propertySlug" AS property_slug,
      COUNT(*) FILTER (WHERE e.name = 'property_viewed') AS views,
      COUNT(DISTINCT e."sessionId") AS sessions,
      COUNT(*) FILTER (WHERE e.name = 'booking_completed') AS bookings,
      COALESCE(SUM(
        CASE
          WHEN e.name = 'booking_completed'
            AND (e.properties->>'amount') ~ '^[0-9]+(\\.[0-9]+)?$'
          THEN (e.properties->>'amount')::float8
          ELSE 0
        END
      ), 0) AS revenue
    FROM "analytics"."event" e
    INNER JOIN "analytics"."session" s ON s.id = e."sessionId"
    WHERE e."occurredAt" >= ${since}
    ${propertyFilter}
    ${utmFilter}
    ${channelFilter}
    GROUP BY e."propertySlug"
    ORDER BY bookings DESC, views DESC
    LIMIT 25
  `

  const tracked = rows.map((row) => {
    const sessions = Number(row.sessions)
    const bookings = Number(row.bookings)
    return {
      propertySlug: row.property_slug,
      views: Number(row.views),
      sessions,
      bookings,
      revenue: Number(row.revenue ?? 0),
      conversionRate: sessions === 0 ? 0 : bookings / sessions,
    }
  })

  if (!canQueryPms(filters)) return tracked

  const pms = await getPublicWebsiteBookingStats({
    from: since,
    to: new Date(),
    slug: normalized.propertySlug,
    groupBy: 'property',
  })
  if (!pms?.byProperty?.length) return tracked

  const bySlug = new Map(pms.byProperty.map((p) => [p.slug, p]))
  const merged = new Map<string, TopProperty>()

  for (const row of tracked) {
    const pmsRow = bySlug.get(row.propertySlug)
    const bookings = pmsRow?.bookings ?? 0
    const revenue = pmsRow?.totalAmount ?? 0
    merged.set(row.propertySlug, {
      ...row,
      bookings,
      revenue,
      conversionRate: row.sessions === 0 ? 0 : bookings / row.sessions,
    })
    bySlug.delete(row.propertySlug)
  }

  // PMS properties with bookings but no tracked traffic in range
  for (const pmsRow of bySlug.values()) {
    if (pmsRow.slug === 'unknown') continue
    merged.set(pmsRow.slug, {
      propertySlug: pmsRow.slug,
      views: 0,
      sessions: 0,
      bookings: pmsRow.bookings,
      revenue: pmsRow.totalAmount,
      conversionRate: 0,
    })
  }

  return [...merged.values()].sort(
    (a, b) => b.bookings - a.bookings || b.revenue - a.revenue || b.views - a.views,
  )
}

export type UtmRow = {
  utmSource: string
  sessions: number
  bookings: number
  revenue: number
  conversionRate: number
}

type UtmRawRow = {
  utm_source: string | null
  sessions: bigint
  bookings: bigint
  revenue: number | null
}

export async function getUtmTable(range: DashboardRange, filters?: DashboardFilters): Promise<UtmRow[]> {
  const since = rangeStart(range)
  const normalized = normalizeFilters(filters)
  const { propertyFilter, channelFilter } = sessionJoinFilters(normalized)
  const utmFilter = normalized.utmSource
    ? normalized.utmSource === 'direct'
      ? Prisma.sql`AND s."utmSource" IS NULL`
      : Prisma.sql`AND s."utmSource" = ${normalized.utmSource}`
    : Prisma.sql``

  const rows = await prisma.$queryRaw<UtmRawRow[]>`
    SELECT
      s."utmSource" AS utm_source,
      count(DISTINCT e."sessionId") AS sessions,
      count(*) FILTER (WHERE e.name = 'booking_completed') AS bookings,
      COALESCE(SUM(
        CASE
          WHEN e.name = 'booking_completed'
            AND (e.properties->>'amount') ~ '^[0-9]+(\\.[0-9]+)?$'
          THEN (e.properties->>'amount')::float8
          ELSE 0
        END
      ), 0) AS revenue
    FROM "analytics"."event" e
    INNER JOIN "analytics"."session" s ON s.id = e."sessionId"
    WHERE e."occurredAt" >= ${since}
      ${propertyFilter}
      ${utmFilter}
      ${channelFilter}
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
      revenue: Number(row.revenue ?? 0),
      conversionRate: sessions === 0 ? 0 : bookings / sessions,
    }
  })
}

export type ChannelRow = {
  channel: string
  sessions: number
  bookings: number
  revenue: number
  conversionRate: number
  whatsappClicks: number
}

type ChannelRaw = {
  channel: string | null
  sessions: bigint
  bookings: bigint
  revenue: number | null
  whatsapp: bigint
}

export async function getChannelTable(
  range: DashboardRange,
  filters?: DashboardFilters,
): Promise<ChannelRow[]> {
  const since = rangeStart(range)
  const normalized = normalizeFilters(filters)
  const { propertyFilter, utmFilter } = sessionJoinFilters(normalized)

  const rows = await prisma.$queryRaw<ChannelRaw[]>`
    SELECT
      COALESCE(s."channel", 'direct') AS channel,
      count(DISTINCT e."sessionId") AS sessions,
      count(*) FILTER (WHERE e.name = 'booking_completed') AS bookings,
      COALESCE(SUM(
        CASE
          WHEN e.name = 'booking_completed'
            AND (e.properties->>'amount') ~ '^[0-9]+(\\.[0-9]+)?$'
          THEN (e.properties->>'amount')::float8
          ELSE 0
        END
      ), 0) AS revenue,
      count(*) FILTER (WHERE e.name = 'whatsapp_clicked') AS whatsapp
    FROM "analytics"."event" e
    INNER JOIN "analytics"."session" s ON s.id = e."sessionId"
    WHERE e."occurredAt" >= ${since}
      ${propertyFilter}
      ${utmFilter}
    GROUP BY COALESCE(s."channel", 'direct')
    ORDER BY sessions DESC
    LIMIT 25
  `

  return rows.map((row) => {
    const sessions = Number(row.sessions)
    const bookings = Number(row.bookings)
    return {
      channel: row.channel ?? 'direct',
      sessions,
      bookings,
      revenue: Number(row.revenue ?? 0),
      conversionRate: sessions === 0 ? 0 : bookings / sessions,
      whatsappClicks: Number(row.whatsapp),
    }
  })
}

export type CampaignRow = {
  campaign: string
  source: string
  medium: string
  channel: string
  sessions: number
  bookings: number
  revenue: number
  conversionRate: number
}

type CampaignRaw = {
  campaign: string | null
  source: string | null
  medium: string | null
  channel: string | null
  sessions: bigint
  bookings: bigint
  revenue: number | null
}

export async function getCampaignTable(
  range: DashboardRange,
  filters?: DashboardFilters,
): Promise<CampaignRow[]> {
  const since = rangeStart(range)
  const normalized = normalizeFilters(filters)
  const { propertyFilter, utmFilter, channelFilter } = sessionJoinFilters(normalized)

  const rows = await prisma.$queryRaw<CampaignRaw[]>`
    SELECT
      COALESCE(NULLIF(s."utmCampaign", ''), '(none)') AS campaign,
      COALESCE(s."utmSource", 'direct') AS source,
      COALESCE(s."utmMedium", '(none)') AS medium,
      COALESCE(s."channel", 'direct') AS channel,
      count(DISTINCT e."sessionId") AS sessions,
      count(*) FILTER (WHERE e.name = 'booking_completed') AS bookings,
      COALESCE(SUM(
        CASE
          WHEN e.name = 'booking_completed'
            AND (e.properties->>'amount') ~ '^[0-9]+(\\.[0-9]+)?$'
          THEN (e.properties->>'amount')::float8
          ELSE 0
        END
      ), 0) AS revenue
    FROM "analytics"."event" e
    INNER JOIN "analytics"."session" s ON s.id = e."sessionId"
    WHERE e."occurredAt" >= ${since}
      AND (s."utmCampaign" IS NOT NULL OR s."lastUtmCampaign" IS NOT NULL)
      ${propertyFilter}
      ${utmFilter}
      ${channelFilter}
    GROUP BY 1, 2, 3, 4
    ORDER BY bookings DESC, sessions DESC
    LIMIT 40
  `

  return rows.map((row) => {
    const sessions = Number(row.sessions)
    const bookings = Number(row.bookings)
    return {
      campaign: row.campaign ?? '(none)',
      source: row.source ?? 'direct',
      medium: row.medium ?? '(none)',
      channel: row.channel ?? 'direct',
      sessions,
      bookings,
      revenue: Number(row.revenue ?? 0),
      conversionRate: sessions === 0 ? 0 : bookings / sessions,
    }
  })
}

export type LandingPageRow = {
  path: string
  sessions: number
  bookings: number
  conversionRate: number
}

export async function getLandingPages(
  range: DashboardRange,
  filters?: DashboardFilters,
): Promise<LandingPageRow[]> {
  const since = rangeStart(range)
  const normalized = normalizeFilters(filters)
  const { utmFilter, channelFilter } = sessionJoinFilters(normalized)

  const rows = await prisma.$queryRaw<
    Array<{ path: string; sessions: bigint; bookings: bigint }>
  >`
    SELECT
      split_part(s."landingPath", '?', 1) AS path,
      count(DISTINCT s.id) AS sessions,
      count(*) FILTER (WHERE e.name = 'booking_completed') AS bookings
    FROM "analytics"."session" s
    LEFT JOIN "analytics"."event" e
      ON e."sessionId" = s.id AND e."occurredAt" >= ${since}
    WHERE s."createdAt" >= ${since}
      ${utmFilter}
      ${channelFilter}
    GROUP BY 1
    ORDER BY sessions DESC
    LIMIT 25
  `

  return rows.map((row) => {
    const sessions = Number(row.sessions)
    const bookings = Number(row.bookings)
    return {
      path: row.path || '/',
      sessions,
      bookings,
      conversionRate: sessions === 0 ? 0 : bookings / sessions,
    }
  })
}

export type PathTransition = {
  from: string
  to: string
  count: number
}

export async function getTopPathTransitions(
  range: DashboardRange,
  filters?: DashboardFilters,
): Promise<PathTransition[]> {
  const since = rangeStart(range)
  const normalized = normalizeFilters(filters)
  const { utmFilter, channelFilter } = sessionJoinFilters(normalized)

  const rows = await prisma.$queryRaw<
    Array<{ from_path: string; to_path: string; cnt: bigint }>
  >`
    WITH pageviews AS (
      SELECT
        e."sessionId",
        e."occurredAt",
        COALESCE(e.properties->>'path', e.properties->>'pathname', '/') AS path,
        ROW_NUMBER() OVER (PARTITION BY e."sessionId" ORDER BY e."occurredAt") AS rn
      FROM "analytics"."event" e
      INNER JOIN "analytics"."session" s ON s.id = e."sessionId"
      WHERE e.name = 'page_viewed'
        AND e."occurredAt" >= ${since}
        ${utmFilter}
        ${channelFilter}
    )
    SELECT
      a.path AS from_path,
      b.path AS to_path,
      count(*) AS cnt
    FROM pageviews a
    INNER JOIN pageviews b
      ON a."sessionId" = b."sessionId" AND b.rn = a.rn + 1
    WHERE a.path IS DISTINCT FROM b.path
    GROUP BY 1, 2
    ORDER BY cnt DESC
    LIMIT 20
  `

  return rows.map((row) => ({
    from: row.from_path,
    to: row.to_path,
    count: Number(row.cnt),
  }))
}

export type BlogPostStats = {
  slug: string
  authorName: string | null
  views: number
  readers: number
  avgReadDepth: number
  comments: number
  ctaClicks: number
  assistedBookings: number
}

export type BlogAuthorStats = {
  authorName: string
  posts: number
  views: number
  readers: number
  comments: number
  ctaClicks: number
  assistedBookings: number
}

export type BlogUploadDay = {
  date: string
  published: number
  created: number
}

export type BlogPeriodKpis = {
  published: number
  created: number
  views: number
  readers: number
  comments: number
  ctaClicks: number
  newsletterSignups: number
  assistedBookings: number
  uploadsByDate: BlogUploadDay[]
}

export type BlogAnalytics = {
  posts: BlogPostStats[]
  authors: BlogAuthorStats[]
  newsletterSignups: number
  totals: {
    views: number
    readers: number
    comments: number
    ctaClicks: number
    assistedBookings: number
    published: number
    created: number
  }
  /** Posts created/published per day for the selected dashboard range. */
  uploadsByDate: BlogUploadDay[]
  /** Fixed last-10-days snapshot for quick ops review (independent of range picker). */
  last10Days: BlogPeriodKpis
}

function dateKeyLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function eachDayKeys(since: Date, until: Date = new Date()): string[] {
  const keys: string[] = []
  const cursor = new Date(since)
  cursor.setHours(0, 0, 0, 0)
  const end = new Date(until)
  end.setHours(0, 0, 0, 0)
  while (cursor <= end) {
    keys.push(dateKeyLocal(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return keys
}

async function getBlogUploadSeries(since: Date): Promise<{
  uploadsByDate: BlogUploadDay[]
  published: number
  created: number
}> {
  const [publishedPosts, createdPosts] = await Promise.all([
    prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { publishedAt: { gte: since } },
          { publishedAt: null, createdAt: { gte: since } },
        ],
      },
      select: { publishedAt: true, createdAt: true },
    }),
    prisma.blogPost.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ])

  const publishedMap = new Map<string, number>()
  for (const post of publishedPosts) {
    const at = post.publishedAt ?? post.createdAt
    if (at < since) continue
    const key = dateKeyLocal(at)
    publishedMap.set(key, (publishedMap.get(key) ?? 0) + 1)
  }

  const createdMap = new Map<string, number>()
  for (const post of createdPosts) {
    const key = dateKeyLocal(post.createdAt)
    createdMap.set(key, (createdMap.get(key) ?? 0) + 1)
  }

  const uploadsByDate = eachDayKeys(since).map((date) => ({
    date,
    published: publishedMap.get(date) ?? 0,
    created: createdMap.get(date) ?? 0,
  }))

  return {
    uploadsByDate,
    published: uploadsByDate.reduce((n, d) => n + d.published, 0),
    created: uploadsByDate.reduce((n, d) => n + d.created, 0),
  }
}

async function getBlogEngagementTotals(since: Date): Promise<{
  views: number
  readers: number
  comments: number
  ctaClicks: number
  newsletterSignups: number
  assistedBookings: number
}> {
  const [engagement, newsletterSignups, assisted] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        views: bigint
        readers: bigint
        comments: bigint
        ctas: bigint
      }>
    >`
      SELECT
        COUNT(*) FILTER (WHERE e.name = 'blog_post_viewed') AS views,
        COUNT(DISTINCT e."sessionId") FILTER (WHERE e.name = 'blog_post_viewed') AS readers,
        COUNT(*) FILTER (WHERE e.name = 'blog_comment_submitted') AS comments,
        COUNT(*) FILTER (WHERE e.name = 'blog_cta_clicked') AS ctas
      FROM "analytics"."event" e
      WHERE e."occurredAt" >= ${since}
        AND e.name IN (
          'blog_post_viewed',
          'blog_comment_submitted',
          'blog_cta_clicked'
        )
    `,
    prisma.analyticsEvent.count({
      where: { name: 'newsletter_subscribed', occurredAt: { gte: since } },
    }),
    prisma.$queryRaw<Array<{ bookings: bigint }>>`
      WITH blog_sessions AS (
        SELECT e."sessionId", MIN(e."occurredAt") AS viewed_at
        FROM "analytics"."event" e
        WHERE e.name = 'blog_post_viewed'
          AND e."occurredAt" >= ${since}
        GROUP BY e."sessionId"
      )
      SELECT COUNT(*)::bigint AS bookings
      FROM blog_sessions bs
      INNER JOIN "analytics"."event" b
        ON b."sessionId" = bs."sessionId"
        AND b.name = 'booking_completed'
        AND b."occurredAt" >= bs.viewed_at
    `,
  ])

  const row = engagement[0]
  return {
    views: Number(row?.views ?? 0),
    readers: Number(row?.readers ?? 0),
    comments: Number(row?.comments ?? 0),
    ctaClicks: Number(row?.ctas ?? 0),
    newsletterSignups,
    assistedBookings: Number(assisted[0]?.bookings ?? 0),
  }
}

export async function getBlogAnalytics(range: DashboardRange): Promise<BlogAnalytics> {
  const since = rangeStart(range)
  const last10Since = rangeStart('10d')

  const [postRows, authorPosts, newsletterSignups, rangeUploads, last10Uploads, last10Engagement] =
    await Promise.all([
      prisma.$queryRaw<
        Array<{
          slug: string
          author: string | null
          views: bigint
          readers: bigint
          avg_depth: number | null
          comments: bigint
          ctas: bigint
        }>
      >`
        SELECT
          COALESCE(e.properties->>'slug', 'unknown') AS slug,
          MAX(e.properties->>'authorName') AS author,
          COUNT(*) FILTER (WHERE e.name = 'blog_post_viewed') AS views,
          COUNT(DISTINCT e."sessionId") FILTER (WHERE e.name = 'blog_post_viewed') AS readers,
          AVG(
            CASE
              WHEN e.name = 'blog_read_progress'
                AND (e.properties->>'percent') ~ '^[0-9]+$'
              THEN (e.properties->>'percent')::float8
              ELSE NULL
            END
          ) AS avg_depth,
          COUNT(*) FILTER (WHERE e.name = 'blog_comment_submitted') AS comments,
          COUNT(*) FILTER (WHERE e.name = 'blog_cta_clicked') AS ctas
        FROM "analytics"."event" e
        WHERE e."occurredAt" >= ${since}
          AND e.name IN (
            'blog_post_viewed',
            'blog_read_progress',
            'blog_comment_submitted',
            'blog_cta_clicked'
          )
        GROUP BY COALESCE(e.properties->>'slug', 'unknown')
        ORDER BY views DESC
        LIMIT 50
      `,
      prisma.blogPost.groupBy({
        by: ['authorName'],
        where: { status: 'PUBLISHED' },
        _count: { _all: true },
      }),
      prisma.analyticsEvent.count({
        where: { name: 'newsletter_subscribed', occurredAt: { gte: since } },
      }),
      getBlogUploadSeries(since),
      getBlogUploadSeries(last10Since),
      getBlogEngagementTotals(last10Since),
    ])

  // Blog-assisted bookings: sessions that viewed a blog then booked
  const assistedRows = await prisma.$queryRaw<
    Array<{ slug: string; bookings: bigint }>
  >`
    WITH blog_sessions AS (
      SELECT
        e."sessionId",
        COALESCE(e.properties->>'slug', 'unknown') AS slug,
        MIN(e."occurredAt") AS viewed_at
      FROM "analytics"."event" e
      WHERE e.name = 'blog_post_viewed'
        AND e."occurredAt" >= ${since}
      GROUP BY e."sessionId", COALESCE(e.properties->>'slug', 'unknown')
    )
    SELECT
      bs.slug,
      COUNT(*) AS bookings
    FROM blog_sessions bs
    INNER JOIN "analytics"."event" b
      ON b."sessionId" = bs."sessionId"
      AND b.name = 'booking_completed'
      AND b."occurredAt" >= bs.viewed_at
    GROUP BY bs.slug
  `
  const assistedBySlug = new Map(
    assistedRows.map((r) => [r.slug, Number(r.bookings)]),
  )

  const posts: BlogPostStats[] = postRows.map((row) => ({
    slug: row.slug,
    authorName: row.author,
    views: Number(row.views),
    readers: Number(row.readers),
    avgReadDepth: Number(row.avg_depth ?? 0),
    comments: Number(row.comments),
    ctaClicks: Number(row.ctas),
    assistedBookings: assistedBySlug.get(row.slug) ?? 0,
  }))

  const authorPostCount = new Map(
    authorPosts.map((a) => [a.authorName, a._count._all]),
  )

  const authorMap = new Map<string, BlogAuthorStats>()
  for (const post of posts) {
    const name = post.authorName || 'Unknown'
    const existing = authorMap.get(name) ?? {
      authorName: name,
      posts: authorPostCount.get(name) ?? 0,
      views: 0,
      readers: 0,
      comments: 0,
      ctaClicks: 0,
      assistedBookings: 0,
    }
    existing.views += post.views
    existing.readers += post.readers
    existing.comments += post.comments
    existing.ctaClicks += post.ctaClicks
    existing.assistedBookings += post.assistedBookings
    authorMap.set(name, existing)
  }
  // Include authors with published posts but no traffic yet
  for (const [name, count] of authorPostCount) {
    if (!authorMap.has(name)) {
      authorMap.set(name, {
        authorName: name,
        posts: count,
        views: 0,
        readers: 0,
        comments: 0,
        ctaClicks: 0,
        assistedBookings: 0,
      })
    } else {
      const a = authorMap.get(name)!
      a.posts = count
    }
  }

  const authors = [...authorMap.values()].sort((a, b) => b.views - a.views)
  const totals = posts.reduce(
    (acc, p) => {
      acc.views += p.views
      acc.readers += p.readers
      acc.comments += p.comments
      acc.ctaClicks += p.ctaClicks
      acc.assistedBookings += p.assistedBookings
      return acc
    },
    {
      views: 0,
      readers: 0,
      comments: 0,
      ctaClicks: 0,
      assistedBookings: 0,
      published: rangeUploads.published,
      created: rangeUploads.created,
    },
  )

  return {
    posts,
    authors,
    newsletterSignups,
    totals,
    uploadsByDate: rangeUploads.uploadsByDate,
    last10Days: {
      published: last10Uploads.published,
      created: last10Uploads.created,
      views: last10Engagement.views,
      readers: last10Engagement.readers,
      comments: last10Engagement.comments,
      ctaClicks: last10Engagement.ctaClicks,
      newsletterSignups: last10Engagement.newsletterSignups,
      assistedBookings: last10Engagement.assistedBookings,
      uploadsByDate: last10Uploads.uploadsByDate,
    },
  }
}

export type InsightCallout = {
  kind: 'up' | 'down' | 'info'
  title: string
  detail: string
}

export async function getInsightCallouts(
  range: DashboardRange,
  filters?: DashboardFilters,
): Promise<InsightCallout[]> {
  const [comparison, channels, properties, funnel] = await Promise.all([
    getOverviewComparison(range, filters),
    getChannelTable(range, filters),
    getTopProperties(range, filters),
    getFunnel(range, filters),
  ])

  const callouts: InsightCallout[] = []

  if (comparison.deltas.bookings !== 0) {
    const up = comparison.deltas.bookings > 0
    const cur = comparison.current.bookings
    const prev = comparison.previous.bookings
    const source = comparison.pms.current ? 'website PMS' : 'tracked'
    callouts.push({
      kind: up ? 'up' : 'down',
      title: up ? 'Bookings are up' : 'Bookings are down',
      detail: `${Math.abs(comparison.deltas.bookings * 100).toFixed(0)}% vs previous period (${prev} → ${cur}, ${source})`,
    })
  }

  const topChannel = channels[0]
  if (topChannel && topChannel.sessions > 0) {
    callouts.push({
      kind: 'info',
      title: `Top channel: ${topChannel.channel}`,
      detail: `${topChannel.sessions} sessions · ${topChannel.bookings} bookings · ${(topChannel.conversionRate * 100).toFixed(1)}% conversion`,
    })
  }

  const worstDrop = [...funnel.steps]
    .slice(1)
    .sort((a, b) => b.orderedDropFromPrev - a.orderedDropFromPrev)[0]
  if (worstDrop && worstDrop.orderedDropFromPrev > 0.4) {
    callouts.push({
      kind: 'down',
      title: `Biggest funnel drop before ${worstDrop.name.replace(/_/g, ' ')}`,
      detail: `${(worstDrop.orderedDropFromPrev * 100).toFixed(0)}% leave on the ordered path — focus UX here (not total bookings)`,
    })
  }

  const bestProp = properties.find((p) => p.bookings > 0)
  const worstProp = [...properties]
    .filter((p) => p.views >= 10)
    .sort((a, b) => a.conversionRate - b.conversionRate)[0]
  if (bestProp) {
    callouts.push({
      kind: 'up',
      title: `Best converting: ${bestProp.propertySlug}`,
      detail: `${(bestProp.conversionRate * 100).toFixed(1)}% conversion · ₹${Math.round(bestProp.revenue).toLocaleString('en-IN')} revenue`,
    })
  }
  if (worstProp && worstProp.propertySlug !== bestProp?.propertySlug) {
    callouts.push({
      kind: 'down',
      title: `Needs attention: ${worstProp.propertySlug}`,
      detail: `${worstProp.views} views but only ${(worstProp.conversionRate * 100).toFixed(1)}% convert — check pricing/photos/CTA`,
    })
  }

  return callouts.slice(0, 5)
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
  const normalized = normalizeFilters(filters)
  const rows = await prisma.analyticsEvent.findMany({
    where: {
      occurredAt: { gte: since },
      ...(normalized.propertySlug ? { propertySlug: normalized.propertySlug } : {}),
      ...(normalized.utmSource
        ? normalized.utmSource === 'direct'
          ? { session: { utmSource: null } }
          : { session: { utmSource: normalized.utmSource } }
        : {}),
      ...(normalized.channel
        ? normalized.channel === 'direct'
          ? { session: { OR: [{ channel: null }, { channel: 'direct' }] } }
          : { session: { channel: normalized.channel } }
        : {}),
    },
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
      session: { select: { utmSource: true } },
    },
  })

  return rows.map((row) => ({
    id: row.id.toString(),
    sessionId: row.sessionId,
    name: row.name,
    occurredAt: row.occurredAt.toISOString(),
    propertySlug: row.propertySlug,
    source: row.source,
    utmSource: row.session.utmSource ?? row.utmSource,
  }))
}

export type RecentAuditRow = {
  id: string
  eventName: string
  source: string
  status: string
  reasonCode: string
  bookingReference: string | null
  propertySlug: string | null
  recordedAt: string
}

export async function listRecentAuditEvents(limit = 50): Promise<RecentAuditRow[]> {
  const rows = await prisma.analyticsEventAudit.findMany({
    orderBy: { recordedAt: 'desc' },
    take: Math.min(limit, 200),
    select: {
      id: true,
      eventName: true,
      source: true,
      status: true,
      reasonCode: true,
      bookingReference: true,
      propertySlug: true,
      recordedAt: true,
    },
  })

  return rows.map((row) => ({
    id: row.id.toString(),
    eventName: row.eventName,
    source: row.source,
    status: row.status,
    reasonCode: row.reasonCode,
    bookingReference: row.bookingReference,
    propertySlug: row.propertySlug,
    recordedAt: row.recordedAt.toISOString(),
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
  channel: string | null
  lastUtmSource: string | null
  lastUtmCampaign: string | null
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
    channel: session.channel,
    lastUtmSource: session.lastUtmSource,
    lastUtmCampaign: session.lastUtmCampaign,
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

export type CompletedBookingEvent = {
  bookingReference: string
  propertySlug: string | null
  sessionId: string
  occurredAt: string
  amount: number | null
  utmSource: string | null
  channel: string | null
  utmCampaign: string | null
}

/**
 * Lists booking_completed events in range (analytics DB), newest first.
 * Join session for channel/UTM attribution.
 */
export async function listCompletedBookingEvents(
  range: DashboardRange,
  filters?: DashboardFilters,
  limit = 50,
): Promise<CompletedBookingEvent[]> {
  const since = rangeStart(range)
  const normalized = normalizeFilters(filters)
  const { propertyFilter, utmFilter, channelFilter } = sessionJoinFilters(normalized)
  const take = Math.min(Math.max(limit, 1), 100)

  const rows = await prisma.$queryRaw<
    Array<{
      booking_reference: string
      property_slug: string | null
      session_id: string
      occurred_at: Date
      amount: number | null
      utm_source: string | null
      channel: string | null
      utm_campaign: string | null
    }>
  >`
    SELECT
      e."bookingReference" AS booking_reference,
      e."propertySlug" AS property_slug,
      e."sessionId" AS session_id,
      e."occurredAt" AS occurred_at,
      CASE
        WHEN (e.properties->>'amount') ~ '^[0-9]+(\\.[0-9]+)?$'
        THEN (e.properties->>'amount')::float8
        ELSE NULL
      END AS amount,
      s."utmSource" AS utm_source,
      COALESCE(s."channel", 'direct') AS channel,
      s."utmCampaign" AS utm_campaign
    FROM "analytics"."event" e
    INNER JOIN "analytics"."session" s ON s.id = e."sessionId"
    WHERE e.name = 'booking_completed'
      AND e."bookingReference" IS NOT NULL
      AND e."occurredAt" >= ${since}
      ${propertyFilter}
      ${utmFilter}
      ${channelFilter}
    ORDER BY e."occurredAt" DESC
    LIMIT 100
  `

  return rows.slice(0, take).map((row) => ({
    bookingReference: row.booking_reference,
    propertySlug: row.property_slug,
    sessionId: row.session_id,
    occurredAt: row.occurred_at.toISOString(),
    amount: row.amount == null ? null : Number(row.amount),
    utmSource: row.utm_source,
    channel: row.channel,
    utmCampaign: row.utm_campaign,
  }))
}
