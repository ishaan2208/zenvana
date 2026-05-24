import { NextResponse, type NextRequest } from 'next/server'

import { recordEventsBatch, type RecordEventInput } from '@/lib/analytics/recorder'
import { isAnalyticsEventName } from '@/lib/analytics/events'

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

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return new NextResponse(null, { status: 403 })
  }

  let body: TrackBody | null = null
  try {
    body = (await request.json()) as TrackBody
  } catch {
    return new NextResponse(null, { status: 400 })
  }

  if (!body || !Array.isArray(body.events) || body.events.length === 0) {
    return new NextResponse(null, { status: 204 })
  }
  if (!consumeRateLimit(request, Math.min(body.events.length, MAX_BATCH))) {
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

  if (events.length > 0) {
    // Fire-and-forget; recorder never throws.
    await recordEventsBatch(events)
  }

  return new NextResponse(null, { status: 204 })
}

export async function GET() {
  return new NextResponse(null, { status: 405 })
}
