import 'server-only'

import { createHash, randomBytes } from 'crypto'
import { cookies, headers } from 'next/headers'

import { prisma } from '@/lib/prisma'
import { AUDIT_REASON, AUDIT_STATUS, writeAnalyticsAudit } from '@/lib/analytics/audit'
import { deriveChannel, hasCampaignSignals } from '@/lib/analytics/channel'
import { isAnalyticsEventName } from '@/lib/analytics/events'

export const ANON_SESSION_COOKIE = 'zenvana_anon_session'
export const ANON_BOOTSTRAP_COOKIE = 'zenvana_anon_bootstrap'
export const ANON_TOUCH_COOKIE = 'zenvana_anon_touch'
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

const MAX_PROPERTIES_BYTES = 8 * 1024
const BOT_UA_RE = /bot|crawl|spider|preview|lighthouse|headless|monitor|axios\/|curl\//i

function generateSessionId(): string {
  return `s_${Date.now().toString(36)}${randomBytes(8).toString('hex')}`
}

/**
 * Ensure we have a session id. Prefer setting the cookie; if cookies are
 * read-only (some Server Action / RSC contexts), fall back to a synthetic id
 * so critical events like booking_completed are never dropped.
 */
async function resolveSessionId(currentValue: string | null): Promise<string> {
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
    return generateSessionId()
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
  gclid?: string
  fbclid?: string
  wbraid?: string
  msclkid?: string
  country?: string
  deviceType?: string
}

type TouchPayload = {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  gclid?: string
  fbclid?: string
  wbraid?: string
  msclkid?: string
  referrer?: string
  path?: string
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return '{}'
  }
}

function capProperties(properties: Properties | undefined): {
  json: Properties
  size: number
  truncated: boolean
  originalSize: number
} {
  const input = properties ?? {}
  const raw = safeJsonStringify(input)
  const size = Buffer.byteLength(raw, 'utf8')
  if (size <= MAX_PROPERTIES_BYTES) {
    return { json: input, size, truncated: false, originalSize: size }
  }
  return {
    json: { __truncated: true, originalSize: size },
    size: Buffer.byteLength(safeJsonStringify({ __truncated: true, originalSize: size }), 'utf8'),
    truncated: true,
    originalSize: size,
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

function parseJsonCookie<T extends object>(value: string | undefined): T | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(value))
    if (parsed && typeof parsed === 'object') return parsed as T
  } catch {
    /* ignore corrupted cookie */
  }
  return null
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
      gclid: url.searchParams.get('gclid') ?? undefined,
      fbclid: url.searchParams.get('fbclid') ?? undefined,
      wbraid: url.searchParams.get('wbraid') ?? undefined,
      msclkid: url.searchParams.get('msclkid') ?? undefined,
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
  const cookieBootstrap = parseJsonCookie<BootstrapPayload>(
    cookieStore.get(ANON_BOOTSTRAP_COOKIE)?.value,
  )
  const touch = parseJsonCookie<TouchPayload>(cookieStore.get(ANON_TOUCH_COOKIE)?.value)
  const refererBootstrap =
    !cookieBootstrap || Object.keys(cookieBootstrap).length === 0
      ? fallbackBootstrapFromReferer(headerStore.get('referer'))
      : {}
  const bootstrap: BootstrapPayload = { ...refererBootstrap, ...(cookieBootstrap ?? {}) }
  const ip =
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerStore.get('x-real-ip') ||
    null
  return { cookieStore, headerStore, userAgent, sessionId, bootstrap, touch, ip }
}

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return true
  return BOT_UA_RE.test(userAgent)
}

type SessionAttribution = {
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  channel: string | null
}

async function ensureSessionRow(
  sessionId: string,
  userAgent: string | null,
  ip: string | null,
  bootstrap: BootstrapPayload,
): Promise<SessionAttribution> {
  const utmSource = bootstrap.utmSource ?? null
  const utmMedium = bootstrap.utmMedium ?? null
  const utmCampaign = bootstrap.utmCampaign ?? null
  const landingPath = bootstrap.landingPath ?? '/'
  const deviceType = bootstrap.deviceType ?? detectDeviceType(userAgent)
  const channel = deriveChannel({
    utmSource,
    utmMedium,
    utmCampaign,
    gclid: bootstrap.gclid,
    fbclid: bootstrap.fbclid,
    wbraid: bootstrap.wbraid,
    msclkid: bootstrap.msclkid,
    referrer: bootstrap.referrer,
  })

  const existing = await prisma.analyticsSession.findUnique({
    where: { id: sessionId },
    select: {
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      channel: true,
    },
  })

  if (existing) {
    await prisma.analyticsSession.update({
      where: { id: sessionId },
      data: { lastSeenAt: new Date() },
    })
    return {
      utmSource: existing.utmSource,
      utmMedium: existing.utmMedium,
      utmCampaign: existing.utmCampaign,
      channel: existing.channel,
    }
  }

  await prisma.analyticsSession.create({
    data: {
      id: sessionId,
      landingPath,
      referrer: bootstrap.referrer ?? null,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm: bootstrap.utmTerm ?? null,
      utmContent: bootstrap.utmContent ?? null,
      gclid: bootstrap.gclid ?? null,
      fbclid: bootstrap.fbclid ?? null,
      wbraid: bootstrap.wbraid ?? null,
      msclkid: bootstrap.msclkid ?? null,
      channel,
      lastUtmSource: utmSource,
      lastUtmMedium: utmMedium,
      lastUtmCampaign: utmCampaign,
      lastTouchAt: utmSource || utmCampaign ? new Date() : null,
      deviceType,
      country: bootstrap.country ?? null,
      userAgentHash: hashWithSalt(userAgent),
      ipHash: hashWithSalt(ip),
    },
  })

  return { utmSource, utmMedium, utmCampaign, channel }
}

/**
 * Apply last-touch campaign params from the touch cookie (returning visitor
 * arrived with new UTMs / click IDs). First-touch fields stay unchanged.
 */
async function applyLastTouch(
  sessionId: string,
  touch: TouchPayload | null,
): Promise<{ attribution: SessionAttribution; touched: boolean }> {
  const session = await prisma.analyticsSession.findUnique({
    where: { id: sessionId },
    select: {
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      channel: true,
      lastUtmSource: true,
      lastUtmCampaign: true,
    },
  })

  const baseAttribution: SessionAttribution = {
    utmSource: session?.utmSource ?? null,
    utmMedium: session?.utmMedium ?? null,
    utmCampaign: session?.utmCampaign ?? null,
    channel: session?.channel ?? null,
  }

  if (!touch || !hasCampaignSignals(touch)) {
    return { attribution: baseAttribution, touched: false }
  }

  const nextSource = touch.utmSource ?? null
  const nextMedium = touch.utmMedium ?? null
  const nextCampaign = touch.utmCampaign ?? null

  // Skip no-op touch (same as last touch already recorded)
  if (
    nextSource === (session?.lastUtmSource ?? null) &&
    nextCampaign === (session?.lastUtmCampaign ?? null) &&
    nextSource === (session?.utmSource ?? null) &&
    nextCampaign === (session?.utmCampaign ?? null)
  ) {
    return { attribution: baseAttribution, touched: false }
  }

  const lastChannel = deriveChannel({
    utmSource: nextSource,
    utmMedium: nextMedium,
    utmCampaign: nextCampaign,
    gclid: touch.gclid,
    fbclid: touch.fbclid,
    wbraid: touch.wbraid,
    msclkid: touch.msclkid,
    referrer: touch.referrer,
  })

  await prisma.analyticsSession.update({
    where: { id: sessionId },
    data: {
      lastUtmSource: nextSource,
      lastUtmMedium: nextMedium,
      lastUtmCampaign: nextCampaign,
      lastTouchAt: new Date(),
      lastSeenAt: new Date(),
      // Keep first-touch channel; last-touch lives in lastUtm* fields.
      // If first-touch was empty/direct, upgrade first-touch attribution.
      ...(!session?.utmSource && nextSource
        ? {
            utmSource: nextSource,
            utmMedium: nextMedium,
            utmCampaign: nextCampaign,
            channel: lastChannel,
            gclid: touch.gclid ?? undefined,
            fbclid: touch.fbclid ?? undefined,
            wbraid: touch.wbraid ?? undefined,
            msclkid: touch.msclkid ?? undefined,
          }
        : {}),
    },
  })

  return {
    attribution: {
      utmSource: session?.utmSource ?? nextSource,
      utmMedium: session?.utmMedium ?? nextMedium,
      utmCampaign: session?.utmCampaign ?? nextCampaign,
      channel: session?.channel ?? lastChannel,
    },
    touched: true,
  }
}

async function clearCookie(name: string) {
  try {
    const cookieStore = await cookies()
    if (cookieStore.get(name)) {
      cookieStore.delete(name)
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

function hasUnknownArgError(err: unknown, arg: 'eventId' | 'bookingReference'): boolean {
  if (!(err instanceof Error)) return false
  const message = err.message ?? ''
  return message.includes(`Unknown argument \`${arg}\``)
}

type RecorderAuditInput = {
  eventName: string
  source: RecordEventInput['source'] | 'system'
  status: (typeof AUDIT_STATUS)[keyof typeof AUDIT_STATUS]
  reasonCode: (typeof AUDIT_REASON)[keyof typeof AUDIT_REASON]
  sessionId?: string | null
  eventId?: string | null
  bookingReference?: string | null
  propertySlug?: string | null
  occurredAt?: Date | null
  meta?: Record<string, unknown>
}

async function writeRecorderAudit(input: RecorderAuditInput): Promise<void> {
  await writeAnalyticsAudit({
    eventName: input.eventName,
    source: input.source,
    status: input.status,
    reasonCode: input.reasonCode,
    sessionId: input.sessionId ?? null,
    eventId: input.eventId ?? null,
    bookingReference: input.bookingReference ?? null,
    propertySlug: input.propertySlug ?? null,
    occurredAt: input.occurredAt ?? null,
    meta: input.meta ?? {},
  })
}

type PreparedSession = {
  sessionId: string
  attribution: SessionAttribution
  touch: TouchPayload | null
  touched: boolean
}

async function prepareSession(): Promise<{
  ok: true
  prepared: PreparedSession
  userAgent: string | null
} | { ok: false; reason: 'bot'; sessionId: string | null }> {
  const { sessionId: existing, userAgent, ip, bootstrap, touch } = await readRequestContext()
  if (isBot(userAgent)) {
    return { ok: false, reason: 'bot', sessionId: existing }
  }

  const sessionId = await resolveSessionId(existing)
  const attribution = await ensureSessionRow(sessionId, userAgent, ip, bootstrap)
  await clearCookie(ANON_BOOTSTRAP_COOKIE)

  const touchResult = await applyLastTouch(sessionId, touch)
  await clearCookie(ANON_TOUCH_COOKIE)

  return {
    ok: true,
    userAgent,
    prepared: {
      sessionId,
      attribution: touchResult.attribution,
      touch,
      touched: touchResult.touched,
    },
  }
}

async function maybeRecordCampaignTouch(
  prepared: PreparedSession,
  source: 'client' | 'server',
): Promise<void> {
  if (!prepared.touched || !prepared.touch) return
  const { json, size } = capProperties({
    utmSource: prepared.touch.utmSource ?? null,
    utmMedium: prepared.touch.utmMedium ?? null,
    utmCampaign: prepared.touch.utmCampaign ?? null,
    path: prepared.touch.path ?? null,
    gclid: prepared.touch.gclid ?? null,
    fbclid: prepared.touch.fbclid ?? null,
  })
  try {
    await prisma.analyticsEvent.create({
      data: {
        sessionId: prepared.sessionId,
        name: 'campaign_touch',
        eventId: `touch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        occurredAt: new Date(),
        propertySlug: null,
        source,
        properties: json as never,
        propertiesSize: size,
        utmSource: prepared.touch.utmSource ?? prepared.attribution.utmSource,
      },
    })
  } catch {
    /* ignore — best-effort touch marker */
  }
}

/**
 * Records an analytics event. NEVER throws — analytics must not break the booking flow.
 */
export async function recordEvent(input: RecordEventInput): Promise<void> {
  const occurredAt = input.occurredAt ?? new Date()
  let sessionIdForAudit: string | null = null
  const bookingReference = deriveBookingReference(input.name, input.properties)
  try {
    if (!isAnalyticsEventName(input.name)) {
      await writeRecorderAudit({
        eventName: input.name,
        source: input.source,
        status: AUDIT_STATUS.REJECTED,
        reasonCode: AUDIT_REASON.INVALID_EVENT_NAME,
        eventId: input.eventId ?? null,
        propertySlug: input.propertySlug ?? null,
        occurredAt,
      })
      return
    }

    const preparedResult = await prepareSession()
    if (!preparedResult.ok) {
      await writeRecorderAudit({
        eventName: input.name,
        source: input.source,
        status: AUDIT_STATUS.REJECTED,
        reasonCode: AUDIT_REASON.BOT_FILTERED,
        sessionId: preparedResult.sessionId,
        eventId: input.eventId ?? null,
        bookingReference,
        propertySlug: input.propertySlug ?? null,
        occurredAt,
      })
      return
    }

    const { prepared } = preparedResult
    const sessionId = prepared.sessionId
    sessionIdForAudit = sessionId
    await maybeRecordCampaignTouch(prepared, input.source)

    const { json, size, truncated, originalSize } = capProperties(input.properties)
    if (truncated) {
      await writeRecorderAudit({
        eventName: input.name,
        source: input.source,
        status: AUDIT_STATUS.ACCEPTED,
        reasonCode: AUDIT_REASON.PROPERTIES_TRUNCATED,
        sessionId,
        eventId: input.eventId ?? null,
        bookingReference,
        propertySlug: input.propertySlug ?? null,
        occurredAt,
        meta: { originalSize, truncatedSize: size },
      })
    }
    if (bookingReference) {
      const exists = await prisma.analyticsEvent.findFirst({
        where: { name: 'booking_completed', bookingReference },
        select: { id: true },
      })
      if (exists) {
        await writeRecorderAudit({
          eventName: input.name,
          source: input.source,
          status: AUDIT_STATUS.DEDUPED,
          reasonCode: AUDIT_REASON.DEDUPE_SUPPRESSED,
          sessionId,
          eventId: input.eventId ?? null,
          bookingReference,
          propertySlug: input.propertySlug ?? null,
          occurredAt,
        })
        return
      }
    }

    // Always denormalize session first-touch UTM onto the event so bookings
    // stay attributable after the bootstrap cookie is cleared.
    const eventUtm = prepared.attribution.utmSource
    const dataWithOptionalFields = {
      sessionId,
      name: input.name,
      eventId: input.eventId ?? null,
      occurredAt,
      bookingReference,
      propertySlug: input.propertySlug ?? null,
      source: input.source,
      properties: json as never,
      propertiesSize: size,
      utmSource: eventUtm,
    }
    try {
      await prisma.analyticsEvent.create({ data: dataWithOptionalFields })
    } catch (err) {
      if (!hasUnknownArgError(err, 'eventId') && !hasUnknownArgError(err, 'bookingReference')) {
        await writeRecorderAudit({
          eventName: input.name,
          source: input.source,
          status: AUDIT_STATUS.FAILED,
          reasonCode: AUDIT_REASON.DB_WRITE_FAILED,
          sessionId,
          eventId: input.eventId ?? null,
          bookingReference,
          propertySlug: input.propertySlug ?? null,
          occurredAt,
          meta: {
            stage: 'create',
            error: err instanceof Error ? err.message : 'unknown',
          },
        })
        return
      }
      const fallbackData = {
        sessionId,
        name: input.name,
        occurredAt,
        propertySlug: input.propertySlug ?? null,
        source: input.source,
        properties: json as never,
        propertiesSize: size,
        utmSource: eventUtm,
      }
      try {
        await prisma.analyticsEvent.create({ data: fallbackData })
      } catch (fallbackErr) {
        await writeRecorderAudit({
          eventName: input.name,
          source: input.source,
          status: AUDIT_STATUS.FAILED,
          reasonCode: AUDIT_REASON.DB_WRITE_FAILED,
          sessionId,
          eventId: input.eventId ?? null,
          bookingReference,
          propertySlug: input.propertySlug ?? null,
          occurredAt,
          meta: {
            stage: 'fallback_create',
            error: fallbackErr instanceof Error ? fallbackErr.message : 'unknown',
          },
        })
        return
      }
    }
    await writeRecorderAudit({
      eventName: input.name,
      source: input.source,
      status: AUDIT_STATUS.ACCEPTED,
      reasonCode: AUDIT_REASON.EVENT_RECORDED,
      sessionId,
      eventId: input.eventId ?? null,
      bookingReference,
      propertySlug: input.propertySlug ?? null,
      occurredAt,
      meta: { outcome: 'success', channel: prepared.attribution.channel },
    })
  } catch (err) {
    console.error('[analytics] recordEvent failed:', err)
    await writeRecorderAudit({
      eventName: input.name,
      source: input.source,
      status: AUDIT_STATUS.FAILED,
      reasonCode: AUDIT_REASON.RECORDER_EXCEPTION,
      sessionId: sessionIdForAudit,
      eventId: input.eventId ?? null,
      bookingReference,
      propertySlug: input.propertySlug ?? null,
      occurredAt,
      meta: {
        stage: 'record_event',
        error: err instanceof Error ? err.message : 'unknown',
      },
    })
  }
}

export async function recordEventsBatch(inputs: RecordEventInput[]): Promise<void> {
  const occurredAt = new Date()
  let sessionIdForAudit: string | null = null
  try {
    if (!inputs.length) return
    const validInputs = inputs.filter((input) => isAnalyticsEventName(input.name))
    const invalidCount = inputs.length - validInputs.length
    if (!validInputs.length) {
      await writeRecorderAudit({
        eventName: 'batch',
        source: 'system',
        status: AUDIT_STATUS.REJECTED,
        reasonCode: AUDIT_REASON.INVALID_EVENT_NAME,
        occurredAt,
        meta: { totalInputs: inputs.length, invalidCount },
      })
      return
    }

    const preparedResult = await prepareSession()
    if (!preparedResult.ok) {
      await writeRecorderAudit({
        eventName: 'batch',
        source: 'system',
        status: AUDIT_STATUS.REJECTED,
        reasonCode: AUDIT_REASON.BOT_FILTERED,
        sessionId: preparedResult.sessionId,
        occurredAt,
        meta: {
          totalInputs: inputs.length,
          validCount: validInputs.length,
          invalidCount,
        },
      })
      return
    }

    const { prepared } = preparedResult
    const sessionId = prepared.sessionId
    sessionIdForAudit = sessionId
    await maybeRecordCampaignTouch(prepared, 'client')

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
    let dedupedCount = 0
    let truncatedCount = 0
    const eventUtm = prepared.attribution.utmSource
    const rows = validInputs.flatMap((input) => {
      const { json, size, truncated } = capProperties(input.properties)
      if (truncated) truncatedCount += 1
      const bookingReference = deriveBookingReference(input.name, input.properties)
      if (bookingReference) {
        if (existingBookingRefs.has(bookingReference) || seenBookingRefs.has(bookingReference)) {
          dedupedCount += 1
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
        utmSource: eventUtm,
      }
    })

    if (!rows.length) {
      await writeRecorderAudit({
        eventName: 'batch',
        source: 'system',
        status: AUDIT_STATUS.DEDUPED,
        reasonCode: AUDIT_REASON.DEDUPE_SUPPRESSED,
        sessionId,
        occurredAt,
        meta: {
          totalInputs: inputs.length,
          validCount: validInputs.length,
          invalidCount,
          dedupedCount,
          acceptedCount: 0,
        },
      })
      return
    }
    try {
      await prisma.analyticsEvent.createMany({ data: rows, skipDuplicates: true })
    } catch (err) {
      if (!hasUnknownArgError(err, 'eventId') && !hasUnknownArgError(err, 'bookingReference')) {
        await writeRecorderAudit({
          eventName: 'batch',
          source: 'system',
          status: AUDIT_STATUS.FAILED,
          reasonCode: AUDIT_REASON.DB_WRITE_FAILED,
          sessionId,
          occurredAt,
          meta: {
            stage: 'createMany',
            totalInputs: inputs.length,
            validCount: validInputs.length,
            invalidCount,
            dedupedCount,
            acceptedCount: rows.length,
            error: err instanceof Error ? err.message : 'unknown',
          },
        })
        return
      }
      const fallbackRows = rows.map((row) => ({
        sessionId: row.sessionId,
        name: row.name,
        occurredAt: row.occurredAt,
        propertySlug: row.propertySlug,
        source: row.source,
        properties: row.properties,
        propertiesSize: row.propertiesSize,
        utmSource: row.utmSource,
      }))
      try {
        await prisma.analyticsEvent.createMany({ data: fallbackRows as never, skipDuplicates: true })
      } catch (fallbackErr) {
        await writeRecorderAudit({
          eventName: 'batch',
          source: 'system',
          status: AUDIT_STATUS.FAILED,
          reasonCode: AUDIT_REASON.DB_WRITE_FAILED,
          sessionId,
          occurredAt,
          meta: {
            stage: 'fallbackCreateMany',
            totalInputs: inputs.length,
            validCount: validInputs.length,
            invalidCount,
            dedupedCount,
            acceptedCount: rows.length,
            error: fallbackErr instanceof Error ? fallbackErr.message : 'unknown',
          },
        })
        return
      }
    }

    if (dedupedCount > 0) {
      await writeRecorderAudit({
        eventName: 'batch',
        source: 'system',
        status: AUDIT_STATUS.DEDUPED,
        reasonCode: AUDIT_REASON.DEDUPE_SUPPRESSED,
        sessionId,
        occurredAt,
        meta: { dedupedCount, totalInputs: inputs.length },
      })
    }

    if (truncatedCount > 0) {
      await writeRecorderAudit({
        eventName: 'batch',
        source: 'system',
        status: AUDIT_STATUS.ACCEPTED,
        reasonCode: AUDIT_REASON.PROPERTIES_TRUNCATED,
        sessionId,
        occurredAt,
        meta: { truncatedCount, totalInputs: inputs.length },
      })
    }
    await writeRecorderAudit({
      eventName: 'batch',
      source: 'system',
      status: AUDIT_STATUS.ACCEPTED,
      reasonCode: AUDIT_REASON.EVENT_RECORDED,
      sessionId,
      occurredAt,
      meta: {
        totalInputs: inputs.length,
        validCount: validInputs.length,
        invalidCount,
        dedupedCount,
        acceptedCount: rows.length,
        channel: prepared.attribution.channel,
      },
    })
  } catch (err) {
    console.error('[analytics] recordEventsBatch failed:', err)
    await writeRecorderAudit({
      eventName: 'batch',
      source: 'system',
      status: AUDIT_STATUS.FAILED,
      reasonCode: AUDIT_REASON.RECORDER_EXCEPTION,
      sessionId: sessionIdForAudit,
      occurredAt,
      meta: {
        stage: 'recordEventsBatch',
        error: err instanceof Error ? err.message : 'unknown',
      },
    })
  }
}
