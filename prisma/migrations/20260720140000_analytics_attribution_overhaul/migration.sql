-- Analytics overhaul: click IDs, channel, last-touch, rollup revenue/channel

ALTER TABLE "analytics"."session"
  ADD COLUMN IF NOT EXISTS "gclid" TEXT,
  ADD COLUMN IF NOT EXISTS "fbclid" TEXT,
  ADD COLUMN IF NOT EXISTS "wbraid" TEXT,
  ADD COLUMN IF NOT EXISTS "msclkid" TEXT,
  ADD COLUMN IF NOT EXISTS "channel" TEXT,
  ADD COLUMN IF NOT EXISTS "lastUtmSource" TEXT,
  ADD COLUMN IF NOT EXISTS "lastUtmMedium" TEXT,
  ADD COLUMN IF NOT EXISTS "lastUtmCampaign" TEXT,
  ADD COLUMN IF NOT EXISTS "lastTouchAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "session_utmCampaign_createdAt_idx"
  ON "analytics"."session"("utmCampaign", "createdAt");

CREATE INDEX IF NOT EXISTS "session_channel_createdAt_idx"
  ON "analytics"."session"("channel", "createdAt");

-- Rebuild daily_metrics PK to include channel + add revenue
ALTER TABLE "analytics"."daily_metrics"
  ADD COLUMN IF NOT EXISTS "channel" TEXT NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Drop old composite PK and recreate with channel
ALTER TABLE "analytics"."daily_metrics" DROP CONSTRAINT IF EXISTS "daily_metrics_pkey";

-- Collapse any duplicate (date, propertySlug, utmSource, channel) rows before re-adding PK
CREATE TEMP TABLE daily_metrics_deduped AS
SELECT
  "date",
  "propertySlug",
  "utmSource",
  "channel",
  SUM("sessions")::int AS "sessions",
  SUM("bookings")::int AS "bookings",
  SUM("events")::int AS "events",
  SUM("revenue")::float8 AS "revenue",
  MAX("updatedAt") AS "updatedAt"
FROM "analytics"."daily_metrics"
GROUP BY "date", "propertySlug", "utmSource", "channel";

TRUNCATE "analytics"."daily_metrics";

INSERT INTO "analytics"."daily_metrics"
  ("date", "propertySlug", "utmSource", "channel", "sessions", "bookings", "events", "revenue", "updatedAt")
SELECT * FROM daily_metrics_deduped;

DROP TABLE daily_metrics_deduped;

ALTER TABLE "analytics"."daily_metrics"
  ADD CONSTRAINT "daily_metrics_pkey"
  PRIMARY KEY ("date", "propertySlug", "utmSource", "channel");

CREATE INDEX IF NOT EXISTS "daily_metrics_channel_date_idx"
  ON "analytics"."daily_metrics"("channel", "date");
