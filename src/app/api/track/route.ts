import { NextResponse, type NextRequest } from 'next/server'

import { recordEventsBatch, type RecordEventInput } from '@/lib/analytics/recorder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ClientEventPayload = {
  name?: unknown
  properties?: unknown
  propertySlug?: unknown
  occurredAt?: unknown
}

type TrackBody = {
  events?: ClientEventPayload[]
}

const MAX_BATCH = 50
const ALLOWED_EVENT_NAME = /^[a-z0-9_]{1,64}$/

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

  const events: RecordEventInput[] = []
  for (const raw of body.events.slice(0, MAX_BATCH)) {
    if (!raw || typeof raw !== 'object') continue
    const name = typeof raw.name === 'string' ? raw.name : ''
    if (!ALLOWED_EVENT_NAME.test(name)) continue
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
    events.push({ name, properties, propertySlug, source: 'client', occurredAt })
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
