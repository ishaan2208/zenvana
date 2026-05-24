import 'server-only'

import { createHash, randomBytes } from 'crypto'
import { cookies, headers } from 'next/headers'

import { prisma } from '@/lib/prisma'
import { isAnalyticsEventName } from '@/lib/analytics/events'

export const ANON_SESSION_COOKIE = 'zenvana_anon_session'
export const ANON_BOOTSTRAP_COOKIE = 'zenvana_anon_bootstrap'
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

const MAX_PROPERTIES_BYTES = 8 * 1024
const BOT_UA_RE = /bot|crawl|spider|preview|lighthouse|headless|monitor|axios\/|curl\//i

function generateSessionId(): string {
  return `s_${Date.now().toString(36)}${randomBytes(8).toString('hex')}`
}

async function ensureSessionCookie(currentValue: string | null): Promise<string | null> {
  if (currentValue) return currentValue
  try {
    const cookieStore = await cookies()
    const fresh = generateSessionId()
    cookieStore.set(ANON_SESSION_COOKIE, fresh, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_COOKIE_MAX_AGE,
      secure: process.env.NODE_ENV === 'production',
    })
    return fresh
  } catch {
    // Server Components can't mutate cookies — this is expected.
    // The next client-side event (page_viewed, room_selected, etc.) will establish
    // the session via /api/track. Drop this event silently rather than spam logs.
    return null
  }
}

type Properties = Record<string, unknown>

type BootstrapPayload = {
  landingPath?: string
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  country?: string
  deviceType?: string
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return '{}'
  }
}

function capProperties(properties: Properties | undefined): { json: Properties; size: number } {
  const input = properties ?? {}
  const raw = safeJsonStringify(input)
  const size = Buffer.byteLength(raw, 'utf8')
  if (size <= MAX_PROPERTIES_BYTES) {
    return { json: input, size }
  }
  return {
    json: { __truncated: true, originalSize: size },
    size: Buffer.byteLength(safeJsonStringify({ __truncated: true, originalSize: size }), 'utf8'),
  }
}

function hashWithSalt(input: string | null | undefined): string | null {
  if (!input) return null
  const salt = process.env.ANALYTICS_SALT ?? ''
  if (!salt && process.env.NODE_ENV === 'production') {
    return null
  }
  return createHash('sha256').update(`${salt}:${input}`).digest('hex').slice(0, 32)
}

function detectDeviceType(userAgent: string | null): string | null {
  if (!userAgent) return null
  const ua = userAgent.toLowerCase()
  if (/ipad|tablet/.test(ua)) return 'tablet'
  if (/mobile|iphone|android.*mobile|phone/.test(ua)) return 'mobile'
  return 'desktop'
}

function parseBootstrapCookie(value: string | undefined): BootstrapPayload {
  if (!value) return {}
  try {
    const parsed = JSON.parse(decodeURIComponent(value))
    if (parsed && typeof parsed === 'object') return parsed as BootstrapPayload
  } catch {
    /* ignore corrupted cookie */
  }
  return {}
}

function fallbackBootstrapFromReferer(referer: string | null): BootstrapPayload {
  if (!referer) return {}
  try {
    const url = new URL(referer)
    return {
      landingPath: url.pathname + (url.search ? url.search : ''),
      referrer: referer,
      utmSource: url.searchParams.get('utm_source') ?? undefined,
      utmMedium: url.searchParams.get('utm_medium') ?? undefined,
      utmCampaign: url.searchParams.get('utm_campaign') ?? undefined,
      utmTerm: url.searchParams.get('utm_term') ?? undefined,
      utmContent: url.searchParams.get('utm_content') ?? undefined,
    }
  } catch {
    return {}
  }
}

async function readRequestContext() {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const userAgent = headerStore.get('user-agent')
  const sessionId = cookieStore.get(ANON_SESSION_COOKIE)?.value ?? null
  const cookieBootstrap = parseBootstrapCookie(cookieStore.get(ANON_BOOTSTRAP_COOKIE)?.value)
  // Fallback for when middleware didn't run (e.g. dev hot reload, edge skip).
  const refererBootstrap =
    Object.keys(cookieBootstrap).length === 0
      ? fallbackBootstrapFromReferer(headerStore.get('referer'))
      : {}
  const bootstrap: BootstrapPayload = { ...refererBootstrap, ...cookieBootstrap }
  const ip =
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerStore.get('x-real-ip') ||
    null
  return { cookieStore, headerStore, userAgent, sessionId, bootstrap, ip }
}

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return true
  return BOT_UA_RE.test(userAgent)
}

async function ensureSessionRow(
  sessionId: string,
  userAgent: string | null,
  ip: string | null,
  bootstrap: BootstrapPayload,
): Promise<void> {
  const utmSource = bootstrap.utmSource ?? null
  const landingPath = bootstrap.landingPath ?? '/'
  const deviceType = bootstrap.deviceType ?? detectDeviceType(userAgent)

  await prisma.analyticsSession.upsert({
    where: { id: sessionId },
    create: {
      id: sessionId,
      landingPath,
      referrer: bootstrap.referrer ?? null,
      utmSource,
      utmMedium: bootstrap.utmMedium ?? null,
      utmCampaign: bootstrap.utmCampaign ?? null,
      utmTerm: bootstrap.utmTerm ?? null,
      utmContent: bootstrap.utmContent ?? null,
      deviceType,
      country: bootstrap.country ?? null,
      userAgentHash: hashWithSalt(userAgent),
      ipHash: hashWithSalt(ip),
    },
    update: {
      lastSeenAt: new Date(),
    },
  })
}

async function clearBootstrapCookie() {
  try {
    const cookieStore = await cookies()
    if (cookieStore.get(ANON_BOOTSTRAP_COOKIE)) {
      cookieStore.delete(ANON_BOOTSTRAP_COOKIE)
    }
  } catch {
    /* ignore — may be read-only context */
  }
}

export type RecordEventInput = {
  name: string
  eventId?: string
  properties?: Properties
  propertySlug?: string | null
  source: 'client' | 'server'
  occurredAt?: Date
}

function deriveBookingReference(name: string, properties?: Properties): string | null {
  if (name !== 'booking_completed') return null
  const candidate = properties?.bookingReference
  if (typeof candidate !== 'string') return null
  const trimmed = candidate.trim()
  if (!trimmed) return null
  return trimmed.slice(0, 128)
}

/**
 * Records an analytics event. NEVER throws — analytics must not break the booking flow.
 */
export async function recordEvent(input: RecordEventInput): Promise<void> {
  try {
    if (!isAnalyticsEventName(input.name)) return
    const { sessionId: existing, userAgent, ip, bootstrap } = await readRequestContext()
    if (isBot(userAgent)) return

    const sessionId = await ensureSessionCookie(existing)
    if (!sessionId) return

    await ensureSessionRow(sessionId, userAgent, ip, bootstrap)
    await clearBootstrapCookie()

    const { json, size } = capProperties(input.properties)
    const bookingReference = deriveBookingReference(input.name, input.properties)
    if (bookingReference) {
      const exists = await prisma.analyticsEvent.findFirst({
        where: { name: 'booking_completed', bookingReference },
        select: { id: true },
      })
      if (exists) return
    }
    await prisma.analyticsEvent.create({
      data: {
        sessionId,
        name: input.name,
        eventId: input.eventId ?? null,
        occurredAt: input.occurredAt ?? new Date(),
        bookingReference,
        propertySlug: input.propertySlug ?? null,
        source: input.source,
        properties: json as never,
        propertiesSize: size,
        utmSource: bootstrap.utmSource ?? null,
      },
    })
  } catch (err) {
    console.error('[analytics] recordEvent failed:', err)
  }
}

export async function recordEventsBatch(inputs: RecordEventInput[]): Promise<void> {
  try {
    if (!inputs.length) return
    const validInputs = inputs.filter((input) => isAnalyticsEventName(input.name))
    if (!validInputs.length) return
    const { sessionId: existing, userAgent, ip, bootstrap } = await readRequestContext()
    if (isBot(userAgent)) return

    const sessionId = await ensureSessionCookie(existing)
    if (!sessionId) return

    await ensureSessionRow(sessionId, userAgent, ip, bootstrap)
    await clearBootstrapCookie()

    const bookingRefs = validInputs
      .map((input) => deriveBookingReference(input.name, input.properties))
      .filter((value): value is string => Boolean(value))
    const existingBookingRefs =
      bookingRefs.length > 0
        ? new Set(
            (
              await prisma.analyticsEvent.findMany({
                where: {
                  name: 'booking_completed',
                  bookingReference: { in: [...new Set(bookingRefs)] },
                },
                select: { bookingReference: true },
              })
            )
              .map((row) => row.bookingReference)
              .filter((value): value is string => Boolean(value)),
          )
        : new Set<string>()
    const seenBookingRefs = new Set<string>()
    const rows = validInputs.flatMap((input) => {
      const { json, size } = capProperties(input.properties)
      const bookingReference = deriveBookingReference(input.name, input.properties)
      if (bookingReference) {
        if (existingBookingRefs.has(bookingReference) || seenBookingRefs.has(bookingReference)) {
          return []
        }
        seenBookingRefs.add(bookingReference)
      }
      return {
        sessionId,
        name: input.name,
        eventId: input.eventId ?? null,
        occurredAt: input.occurredAt ?? new Date(),
        bookingReference,
        propertySlug: input.propertySlug ?? null,
        source: input.source,
        properties: json as never,
        propertiesSize: size,
        utmSource: bootstrap.utmSource ?? null,
      }
    })

    if (!rows.length) return
    await prisma.analyticsEvent.createMany({ data: rows, skipDuplicates: true })
  } catch (err) {
    console.error('[analytics] recordEventsBatch failed:', err)
  }
}
