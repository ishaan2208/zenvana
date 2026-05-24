'use server'

import { recordEvent } from '@/lib/analytics/recorder'

/**
 * Server-side event logger for use in trusted server paths (e.g. after Razorpay
 * verify succeeds, log `booking_completed` so the conversion number is never
 * corrupted by ad blockers).
 *
 * NEVER throws. Callers should still wrap with `.catch(() => {})` for safety.
 */
export async function trackEventAction(
  name: string,
  properties?: Record<string, unknown>,
  propertySlug?: string | null,
): Promise<void> {
  await recordEvent({
    name,
    properties,
    propertySlug: propertySlug ?? null,
    source: 'server',
  })
}
