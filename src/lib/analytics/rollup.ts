import 'server-only'

import { prisma } from '@/lib/prisma'

/**
 * Rebuilds daily analytics aggregates from raw events.
 * Intended for cron/background jobs to keep dashboard queries fast at scale.
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
      INSERT INTO "analytics"."daily_metrics" ("date", "propertySlug", "utmSource", "sessions", "bookings", "events")
      WITH source_events AS (
        SELECT
          date_trunc('day', e."occurredAt") AS day,
          COALESCE(e."propertySlug", 'unknown') AS property_slug,
          COALESCE(e."utmSource", 'direct') AS utm_source,
          e."sessionId" AS session_id,
          e.name AS event_name
        FROM "analytics"."event" e
        WHERE e."occurredAt" >= ${since}
      )
      SELECT
        se.day,
        se.property_slug,
        se.utm_source,
        COUNT(DISTINCT se.session_id)::int AS sessions,
        COUNT(*) FILTER (WHERE se.event_name = 'booking_completed')::int AS bookings,
        COUNT(*)::int AS events
      FROM source_events se
      GROUP BY se.day, se.property_slug, se.utm_source
    `
  })
}
