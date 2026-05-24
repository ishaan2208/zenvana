-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "analytics";

-- CreateTable
CREATE TABLE "analytics"."session" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "landingPath" TEXT NOT NULL,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "deviceType" TEXT,
    "country" TEXT,
    "userAgentHash" TEXT,
    "ipHash" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."event" (
    "id" BIGSERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "propertySlug" TEXT,
    "source" TEXT NOT NULL,
    "properties" JSONB NOT NULL,
    "propertiesSize" INTEGER,
    "utmSource" TEXT,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "session_createdAt_idx" ON "analytics"."session"("createdAt");

-- CreateIndex
CREATE INDEX "session_utmSource_createdAt_idx" ON "analytics"."session"("utmSource", "createdAt");

-- CreateIndex
CREATE INDEX "session_country_createdAt_idx" ON "analytics"."session"("country", "createdAt");

-- CreateIndex
CREATE INDEX "event_name_occurredAt_idx" ON "analytics"."event"("name", "occurredAt");

-- CreateIndex
CREATE INDEX "event_occurredAt_idx" ON "analytics"."event"("occurredAt");

-- CreateIndex
CREATE INDEX "event_sessionId_occurredAt_idx" ON "analytics"."event"("sessionId", "occurredAt");

-- CreateIndex
CREATE INDEX "event_propertySlug_name_occurredAt_idx" ON "analytics"."event"("propertySlug", "name", "occurredAt");

-- CreateIndex
CREATE INDEX "event_utmSource_name_occurredAt_idx" ON "analytics"."event"("utmSource", "name", "occurredAt");

-- AddForeignKey
ALTER TABLE "analytics"."event" ADD CONSTRAINT "event_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "analytics"."session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
