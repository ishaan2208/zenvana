import 'server-only'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const AUDIT_STATUS = {
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  DEDUPED: 'deduped',
  FAILED: 'failed',
} as const

export const AUDIT_REASON = {
  INVALID_EVENT_NAME: 'INVALID_EVENT_NAME',
  BOT_FILTERED: 'BOT_FILTERED',
  SESSION_UNAVAILABLE: 'SESSION_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED',
  ORIGIN_BLOCKED: 'ORIGIN_BLOCKED',
  PAYLOAD_INVALID: 'PAYLOAD_INVALID',
  DB_WRITE_FAILED: 'DB_WRITE_FAILED',
  DEDUPE_SUPPRESSED: 'DEDUPE_SUPPRESSED',
  PROPERTIES_TRUNCATED: 'PROPERTIES_TRUNCATED',
  EVENT_RECORDED: 'EVENT_RECORDED',
  RECORDER_EXCEPTION: 'RECORDER_EXCEPTION',
  AUDIT_WRITE_FAILED: 'AUDIT_WRITE_FAILED',
} as const

export type AuditStatus = (typeof AUDIT_STATUS)[keyof typeof AUDIT_STATUS]
export type AuditReason = (typeof AUDIT_REASON)[keyof typeof AUDIT_REASON]

type WriteAnalyticsAuditInput = {
  eventName: string
  source: 'client' | 'server' | 'system'
  status: AuditStatus
  reasonCode: AuditReason
  sessionId?: string | null
  eventId?: string | null
  bookingReference?: string | null
  propertySlug?: string | null
  occurredAt?: Date | null
  meta?: Prisma.InputJsonValue | Record<string, unknown>
}

/**
 * Writes analytics audit trails and never throws.
 */
export async function writeAnalyticsAudit(input: WriteAnalyticsAuditInput): Promise<void> {
  try {
    const meta = (input.meta ?? {}) as Prisma.InputJsonValue

    await prisma.analyticsEventAudit.create({
      data: {
        eventName: input.eventName,
        source: input.source,
        status: input.status,
        reasonCode: input.reasonCode,
        sessionId: input.sessionId ?? null,
        eventId: input.eventId ?? null,
        bookingReference: input.bookingReference ?? null,
        propertySlug: input.propertySlug ?? null,
        occurredAt: input.occurredAt ?? null,
        meta,
      },
    })
  } catch (error) {
    console.error('[analytics][audit] write failed', {
      reasonCode: AUDIT_REASON.AUDIT_WRITE_FAILED,
      eventName: input.eventName,
      source: input.source,
      status: input.status,
      error: error instanceof Error ? error.message : 'unknown',
    })
  }
}
