import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { recordEventsBatch, writeAnalyticsAudit, isAnalyticsEventName } = vi.hoisted(() => ({
  recordEventsBatch: vi.fn(),
  writeAnalyticsAudit: vi.fn(),
  isAnalyticsEventName: vi.fn((name: string) => name === 'page_viewed' || name === 'booking_completed'),
}))

vi.mock('@/lib/analytics/recorder', () => ({
  recordEventsBatch,
}))

vi.mock('@/lib/analytics/events', () => ({
  isAnalyticsEventName,
}))

vi.mock('@/lib/analytics/audit', () => ({
  AUDIT_STATUS: {
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
  },
  AUDIT_REASON: {
    RATE_LIMITED: 'RATE_LIMITED',
    ORIGIN_BLOCKED: 'ORIGIN_BLOCKED',
    PAYLOAD_INVALID: 'PAYLOAD_INVALID',
    INVALID_EVENT_NAME: 'INVALID_EVENT_NAME',
    EVENT_RECORDED: 'EVENT_RECORDED',
    AUDIT_WRITE_FAILED: 'AUDIT_WRITE_FAILED',
  },
  writeAnalyticsAudit,
}))

function createTrackRequest(body: unknown, init?: { headers?: HeadersInit }): NextRequest {
  return new NextRequest('http://localhost:3009/api/track', {
    method: 'POST',
    headers: {
      origin: 'https://zenvana.com',
      'content-type': 'application/json',
      ...init?.headers,
    },
    body: JSON.stringify(body),
  })
}

async function loadPostHandler() {
  const route = await import('@/app/api/track/route')
  return route.POST
}

describe('POST /api/track observability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.NEXT_PUBLIC_SITE_URL = 'https://zenvana.com'
  })

  it('returns 403 for blocked origin and writes rejected audit', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const POST = await loadPostHandler()
    const request = createTrackRequest(
      { events: [{ name: 'page_viewed', eventId: 'evt_12345678' }] },
      { headers: { origin: 'https://evil.example' } },
    )

    const response = await POST(request)

    expect(response.status).toBe(403)
    expect(warnSpy).toHaveBeenCalledWith(
      '[analytics][track] blocked origin',
      expect.objectContaining({
        reasonCode: 'ORIGIN_BLOCKED',
        statusCode: 403,
      }),
    )
    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'track_batch',
        source: 'client',
        status: 'rejected',
        reasonCode: 'ORIGIN_BLOCKED',
      }),
    )
    expect(recordEventsBatch).not.toHaveBeenCalled()
  })

  it('returns 400 for invalid JSON payload and writes rejected audit', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const POST = await loadPostHandler()
    const request = new NextRequest('http://localhost:3009/api/track', {
      method: 'POST',
      headers: {
        origin: 'https://zenvana.com',
        'content-type': 'application/json',
      },
      body: '{bad-json',
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(warnSpy).toHaveBeenCalledWith(
      '[analytics][track] invalid payload',
      expect.objectContaining({
        reasonCode: 'PAYLOAD_INVALID',
        statusCode: 400,
      }),
    )
    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'track_batch',
        status: 'rejected',
        reasonCode: 'PAYLOAD_INVALID',
      }),
    )
    expect(recordEventsBatch).not.toHaveBeenCalled()
  })

  it('returns 204 for empty events payload and writes rejected observability audit', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const POST = await loadPostHandler()

    const response = await POST(createTrackRequest({ events: [] }))

    expect(response.status).toBe(204)
    expect(warnSpy).toHaveBeenCalledWith(
      '[analytics][track] empty events payload',
      expect.objectContaining({
        reasonCode: 'PAYLOAD_INVALID',
        statusCode: 204,
        hasEventsArray: true,
        requestedCount: 0,
      }),
    )
    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'track_batch',
        source: 'client',
        status: 'rejected',
        reasonCode: 'PAYLOAD_INVALID',
        meta: expect.objectContaining({
          statusCode: 204,
          hasEventsArray: true,
          requestedCount: 0,
        }),
      }),
    )
    expect(recordEventsBatch).not.toHaveBeenCalled()
  })

  it('returns 429 when rate-limited and writes rejected audit', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const POST = await loadPostHandler()

    for (let i = 0; i < 6; i += 1) {
      const okResponse = await POST(
        createTrackRequest(
          { events: Array.from({ length: 50 }, () => ({ name: 'page_viewed', eventId: 'evt_12345678' })) },
          { headers: { 'x-analytics-session': 's_rate_limit' } },
        ),
      )
      expect(okResponse.status).toBe(204)
    }

    const blockedResponse = await POST(
      createTrackRequest(
        { events: [{ name: 'page_viewed', eventId: 'evt_12345678' }] },
        { headers: { 'x-analytics-session': 's_rate_limit' } },
      ),
    )

    expect(blockedResponse.status).toBe(429)
    expect(warnSpy).toHaveBeenCalledWith(
      '[analytics][track] rate limited',
      expect.objectContaining({
        reasonCode: 'RATE_LIMITED',
        statusCode: 429,
      }),
    )
    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'track_batch',
        status: 'rejected',
        reasonCode: 'RATE_LIMITED',
      }),
    )
  })

  it('logs accepted vs dropped summary and writes accepted batch audit', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const POST = await loadPostHandler()
    const response = await POST(
      createTrackRequest({
        events: [
          { name: 'page_viewed', eventId: 'evt_12345678' },
          { name: 'invalid_event', eventId: 'evt_abcdefgh' },
          { name: 'booking_completed', eventId: 'evt_87654321' },
        ],
      }),
    )

    expect(response.status).toBe(204)
    expect(recordEventsBatch).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'page_viewed' }),
      expect.objectContaining({ name: 'booking_completed' }),
    ])
    expect(infoSpy).toHaveBeenCalledWith(
      '[analytics][track] accepted batch summary',
      expect.objectContaining({
        requestedCount: 3,
        acceptedCount: 2,
        droppedCount: 1,
      }),
    )
    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'track_batch',
        status: 'accepted',
        reasonCode: 'EVENT_RECORDED',
        meta: expect.objectContaining({
          requestedCount: 3,
          acceptedCount: 2,
          droppedCount: 1,
        }),
      }),
    )
  })

  it('keeps 403 when blocked-origin audit write throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    writeAnalyticsAudit.mockRejectedValueOnce(new Error('audit offline'))
    const POST = await loadPostHandler()
    const request = createTrackRequest(
      { events: [{ name: 'page_viewed', eventId: 'evt_12345678' }] },
      { headers: { origin: 'https://evil.example' } },
    )

    const response = await POST(request)

    expect(response.status).toBe(403)
    expect(errorSpy).toHaveBeenCalledWith(
      '[analytics][track] audit write failed',
      expect.objectContaining({
        reasonCode: 'AUDIT_WRITE_FAILED',
        attemptedStatus: 'rejected',
        attemptedReasonCode: 'ORIGIN_BLOCKED',
      }),
    )
  })

  it('keeps 204 and records events when accepted-path audit write throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    writeAnalyticsAudit.mockRejectedValueOnce(new Error('audit offline'))
    const POST = await loadPostHandler()
    const response = await POST(
      createTrackRequest({
        events: [{ name: 'page_viewed', eventId: 'evt_12345678' }],
      }),
    )

    expect(response.status).toBe(204)
    expect(recordEventsBatch).toHaveBeenCalledWith([expect.objectContaining({ name: 'page_viewed' })])
    expect(errorSpy).toHaveBeenCalledWith(
      '[analytics][track] audit write failed',
      expect.objectContaining({
        reasonCode: 'AUDIT_WRITE_FAILED',
        attemptedStatus: 'accepted',
        attemptedReasonCode: 'EVENT_RECORDED',
      }),
    )
  })

  it('writes rejected summary for all-invalid batch and skips recorder', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const POST = await loadPostHandler()

    const response = await POST(
      createTrackRequest({
        events: [
          { name: 'invalid_event', eventId: 'evt_abcdefgh' },
          { name: 'also_invalid', eventId: 'evt_87654321' },
        ],
      }),
    )

    expect(response.status).toBe(204)
    expect(warnSpy).toHaveBeenCalledWith(
      '[analytics][track] rejected batch summary',
      expect.objectContaining({
        reasonCode: 'INVALID_EVENT_NAME',
        requestedCount: 2,
        acceptedCount: 0,
        droppedCount: 2,
      }),
    )
    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'track_batch',
        status: 'rejected',
        reasonCode: 'INVALID_EVENT_NAME',
        meta: expect.objectContaining({
          requestedCount: 2,
          acceptedCount: 0,
          droppedCount: 2,
        }),
      }),
    )
    expect(recordEventsBatch).not.toHaveBeenCalled()
  })
})
