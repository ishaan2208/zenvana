-- AlterTable
ALTER TABLE "analytics"."event"
ADD COLUMN "eventId" TEXT,
ADD COLUMN "bookingReference" TEXT;

-- CreateIndex
CREATE INDEX "event_bookingReference_occurredAt_idx" ON "analytics"."event"("bookingReference", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_sessionId_eventId_key" ON "analytics"."event"("sessionId", "eventId");

-- Remove duplicate booking_completed rows before enforcing uniqueness.
DELETE FROM "analytics"."event" e
USING "analytics"."event" dup
WHERE e.id > dup.id
  AND e.name = 'booking_completed'
  AND dup.name = 'booking_completed'
  AND e."bookingReference" IS NOT NULL
  AND dup."bookingReference" IS NOT NULL
  AND e."bookingReference" = dup."bookingReference";

-- CreateIndex
CREATE UNIQUE INDEX "event_booking_completed_reference_unique"
ON "analytics"."event"("bookingReference")
WHERE name = 'booking_completed' AND "bookingReference" IS NOT NULL;
