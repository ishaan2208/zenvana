-- CreateTable
CREATE TABLE "analytics"."daily_metrics" (
    "date" TIMESTAMP(3) NOT NULL,
    "propertySlug" TEXT NOT NULL,
    "utmSource" TEXT NOT NULL,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "bookings" INTEGER NOT NULL DEFAULT 0,
    "events" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("date","propertySlug","utmSource")
);

-- CreateIndex
CREATE INDEX "daily_metrics_date_idx" ON "analytics"."daily_metrics"("date");

-- CreateIndex
CREATE INDEX "daily_metrics_propertySlug_date_idx" ON "analytics"."daily_metrics"("propertySlug", "date");

-- CreateIndex
CREATE INDEX "daily_metrics_utmSource_date_idx" ON "analytics"."daily_metrics"("utmSource", "date");
