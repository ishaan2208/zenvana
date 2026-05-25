-- CreateTable
CREATE TABLE "analytics"."event_audit" (
    "id" BIGSERIAL NOT NULL,
    "eventName" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "sessionId" TEXT,
    "eventId" TEXT,
    "bookingReference" TEXT,
    "propertySlug" TEXT,
    "occurredAt" TIMESTAMP(3),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB NOT NULL,

    CONSTRAINT "event_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_audit_status_recordedAt_idx" ON "analytics"."event_audit"("status", "recordedAt");

-- CreateIndex
CREATE INDEX "event_audit_reasonCode_recordedAt_idx" ON "analytics"."event_audit"("reasonCode", "recordedAt");

-- CreateIndex
CREATE INDEX "event_audit_eventName_recordedAt_idx" ON "analytics"."event_audit"("eventName", "recordedAt");

-- CreateIndex
CREATE INDEX "event_audit_bookingReference_recordedAt_idx" ON "analytics"."event_audit"("bookingReference", "recordedAt");
