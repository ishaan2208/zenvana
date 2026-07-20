import 'server-only'

import { prisma } from '@/lib/prisma'

/**
 * Rebuilds daily analytics aggregates from raw events + session attribution.
 * Uses session-level UTM/channel (source of truth) and booking revenue.
 */
export async function rebuildDailyMetricsRollup(daysBack = 120): Promise<void> {
  const safeDays = Math.max(1, Math.min(daysBack, 365))
  const since = new Date()
  since.setDate(since.getDate() - safeDays)
  since.setHours(0, 0, 0, 0)

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      DELETE FROM "analytics"."daily_metrics"
      WHERE "date" >= ${since}
    `
    await tx.$executeRaw`
      INSERT INTO "analytics"."daily_metrics"
        ("date", "propertySlug", "utmSource", "channel", "sessions", "bookings", "events", "revenue")
      WITH source_events AS (
        SELECT
          date_trunc('day', e."occurredAt") AS day,
          COALESCE(e."propertySlug", 'unknown') AS property_slug,
          COALESCE(s."utmSource", 'direct') AS utm_source,
          COALESCE(s."channel", 'direct') AS channel,
          e."sessionId" AS session_id,
          e.name AS event_name,
          CASE
            WHEN e.name = 'booking_completed'
              AND (e.properties->>'amount') ~ '^[0-9]+(\\.[0-9]+)?$'
            THEN (e.properties->>'amount')::float8
            ELSE 0
          END AS amount
        FROM "analytics"."event" e
        INNER JOIN "analytics"."session" s ON s.id = e."sessionId"
        WHERE e."occurredAt" >= ${since}
      )
      SELECT
        se.day,
        se.property_slug,
        se.utm_source,
        se.channel,
        COUNT(DISTINCT se.session_id)::int AS sessions,
        COUNT(*) FILTER (WHERE se.event_name = 'booking_completed')::int AS bookings,
        COUNT(*)::int AS events,
        COALESCE(SUM(se.amount), 0)::float8 AS revenue
      FROM source_events se
      GROUP BY se.day, se.property_slug, se.utm_source, se.channel
    `
  })
}
