import { NextResponse, type NextRequest } from 'next/server'

import { recordEventsBatch, type RecordEventInput } from '@/lib/analytics/recorder'
import { isAnalyticsEventName } from '@/lib/analytics/events'
import { AUDIT_REASON, AUDIT_STATUS, writeAnalyticsAudit } from '@/lib/analytics/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ClientEventPayload = {
  name?: unknown
  eventId?: unknown
  properties?: unknown
  propertySlug?: unknown
  occurredAt?: unknown
}

type TrackBody = {
  events?: ClientEventPayload[]
}

const MAX_BATCH = 50
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_EVENTS = 300
const rateLimitState = new Map<string, { count: number; windowStart: number }>()

type TrackAuditInput = {
  status: (typeof AUDIT_STATUS)[keyof typeof AUDIT_STATUS]
  reasonCode: (typeof AUDIT_REASON)[keyof typeof AUDIT_REASON]
  meta?: Record<string, unknown>
}

function cleanupRateLimitStore(now: number): void {
  for (const [key, value] of rateLimitState.entries()) {
    if (now - value.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitState.delete(key)
    }
  }
}

function identifyClient(request: NextRequest): string | null {
  const cookieSession = request.cookies.get('zenvana_anon_session')?.value
  if (cookieSession) return `session:${cookieSession}`
  const headerSession = request.headers.get('x-analytics-session')
  if (headerSession) return `header:${headerSession}`
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  if (ip) return `ip:${ip}`
  return null
}

function consumeRateLimit(request: NextRequest, requestedEvents: number): boolean {
  if (requestedEvents <= 0) return true
  const key = identifyClient(request)
  if (!key) return true
  const now = Date.now()
  cleanupRateLimitStore(now)
  const current = rateLimitState.get(key)
  if (!current || now - current.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitState.set(key, { count: requestedEvents, windowStart: now })
    return requestedEvents <= RATE_LIMIT_MAX_EVENTS
  }
  const nextCount = current.count + requestedEvents
  rateLimitState.set(key, { count: nextCount, windowStart: current.windowStart })
  return nextCount <= RATE_LIMIT_MAX_EVENTS
}

function isAllowedOrigin(request: NextRequest): boolean {
  const allowed = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!allowed) return true // dev fallback; no SITE_URL set
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  if (!origin && !referer) {
    // sendBeacon does not always set Origin; fall back to host match
    const host = request.headers.get('host')
    try {
      return new URL(allowed).host === host
    } catch {
      return false
    }
  }
  try {
    if (origin && new URL(origin).origin === new URL(allowed).origin) return true
    if (referer && new URL(referer).origin === new URL(allowed).origin) return true
  } catch {
    return false
  }
  return false
}

async function writeTrackAuditSafe(input: TrackAuditInput): Promise<void> {
  try {
    await writeAnalyticsAudit({
      eventName: 'track_batch',
      source: 'client',
      status: input.status,
      reasonCode: input.reasonCode,
      meta: input.meta,
    })
  } catch (error) {
    console.error('[analytics][track] audit write failed', {
      reasonCode: AUDIT_REASON.AUDIT_WRITE_FAILED,
      attemptedStatus: input.status,
      attemptedReasonCode: input.reasonCode,
      error: error instanceof Error ? error.message : 'unknown',
    })
  }
}

export async function POST(request: NextRequest) {
  const requestedCountFromBody = (() => {
    const contentLength = request.headers.get('content-length')
    if (!contentLength) return null
    const parsed = Number.parseInt(contentLength, 10)
    return Number.isNaN(parsed) ? null : parsed
  })()

  if (!isAllowedOrigin(request)) {
    console.warn('[analytics][track] blocked origin', {
      reasonCode: AUDIT_REASON.ORIGIN_BLOCKED,
      statusCode: 403,
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      host: request.headers.get('host'),
    })
    await writeTrackAuditSafe({
      status: AUDIT_STATUS.REJECTED,
      reasonCode: AUDIT_REASON.ORIGIN_BLOCKED,
      meta: {
        statusCode: 403,
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        host: request.headers.get('host'),
      },
    })
    return new NextResponse(null, { status: 403 })
  }

  let body: TrackBody | null = null
  try {
    body = (await request.json()) as TrackBody
  } catch {
    console.warn('[analytics][track] invalid payload', {
      reasonCode: AUDIT_REASON.PAYLOAD_INVALID,
      statusCode: 400,
      contentType: request.headers.get('content-type'),
      contentLength: requestedCountFromBody,
    })
    await writeTrackAuditSafe({
      status: AUDIT_STATUS.REJECTED,
      reasonCode: AUDIT_REASON.PAYLOAD_INVALID,
      meta: {
        statusCode: 400,
        contentType: request.headers.get('content-type'),
        contentLength: requestedCountFromBody,
      },
    })
    return new NextResponse(null, { status: 400 })
  }

  if (!body || !Array.isArray(body.events) || body.events.length === 0) {
    console.warn('[analytics][track] empty events payload', {
      reasonCode: AUDIT_REASON.PAYLOAD_INVALID,
      statusCode: 204,
      hasEventsArray: Array.isArray(body?.events),
      requestedCount: Array.isArray(body?.events) ? body.events.length : 0,
    })
    await writeTrackAuditSafe({
      status: AUDIT_STATUS.REJECTED,
      reasonCode: AUDIT_REASON.PAYLOAD_INVALID,
      meta: {
        statusCode: 204,
        hasEventsArray: Array.isArray(body?.events),
        requestedCount: Array.isArray(body?.events) ? body.events.length : 0,
      },
    })
    return new NextResponse(null, { status: 204 })
  }
  if (!consumeRateLimit(request, Math.min(body.events.length, MAX_BATCH))) {
    console.warn('[analytics][track] rate limited', {
      reasonCode: AUDIT_REASON.RATE_LIMITED,
      statusCode: 429,
      requestedCount: body.events.length,
      limitedCount: Math.min(body.events.length, MAX_BATCH),
    })
    await writeTrackAuditSafe({
      status: AUDIT_STATUS.REJECTED,
      reasonCode: AUDIT_REASON.RATE_LIMITED,
      meta: {
        statusCode: 429,
        requestedCount: body.events.length,
        limitedCount: Math.min(body.events.length, MAX_BATCH),
      },
    })
    return new NextResponse(null, { status: 429 })
  }

  const events: RecordEventInput[] = []
  for (const raw of body.events.slice(0, MAX_BATCH)) {
    if (!raw || typeof raw !== 'object') continue
    const name = typeof raw.name === 'string' ? raw.name : ''
    if (!isAnalyticsEventName(name)) continue
    const eventId =
      typeof raw.eventId === 'string' && /^[a-zA-Z0-9:_-]{8,128}$/.test(raw.eventId)
        ? raw.eventId
        : undefined
    const properties =
      raw.properties && typeof raw.properties === 'object'
        ? (raw.properties as Record<string, unknown>)
        : undefined
    const propertySlug =
      typeof raw.propertySlug === 'string' ? raw.propertySlug.slice(0, 128) : null
    const occurredAt =
      typeof raw.occurredAt === 'string' && !Number.isNaN(Date.parse(raw.occurredAt))
        ? new Date(raw.occurredAt)
        : undefined
    events.push({ name, eventId, properties, propertySlug, source: 'client', occurredAt })
  }
  const requestedCount = body.events.length
  const acceptedCount = events.length
  const droppedCount = Math.max(requestedCount - acceptedCount, 0)

  if (acceptedCount > 0) {
    console.info('[analytics][track] accepted batch summary', {
      reasonCode: AUDIT_REASON.EVENT_RECORDED,
      requestedCount,
      acceptedCount,
      droppedCount,
    })
    await writeTrackAuditSafe({
      status: AUDIT_STATUS.ACCEPTED,
      reasonCode: AUDIT_REASON.EVENT_RECORDED,
      meta: {
        requestedCount,
        acceptedCount,
        droppedCount,
      },
    })
  } else {
    console.warn('[analytics][track] rejected batch summary', {
      reasonCode: AUDIT_REASON.INVALID_EVENT_NAME,
      requestedCount,
      acceptedCount,
      droppedCount,
    })
    await writeTrackAuditSafe({
      status: AUDIT_STATUS.REJECTED,
      reasonCode: AUDIT_REASON.INVALID_EVENT_NAME,
      meta: {
        requestedCount,
        acceptedCount,
        droppedCount,
      },
    })
  }

  if (events.length > 0) {
    // Fire-and-forget; recorder never throws.
    await recordEventsBatch(events)
  }

  return new NextResponse(null, { status: 204 })
}

export async function GET() {
  return new NextResponse(null, { status: 405 })
}
