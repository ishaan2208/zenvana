import { NextRequest, NextResponse } from 'next/server'

const ANON_SESSION_COOKIE = 'zenvana_anon_session'
const ANON_BOOTSTRAP_COOKIE = 'zenvana_anon_bootstrap'
const ANON_TOUCH_COOKIE = 'zenvana_anon_touch'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days
const BOOTSTRAP_MAX_AGE_SECONDS = 60 * 10 // 10 minutes — consumed by first event
const TOUCH_MAX_AGE_SECONDS = 60 * 10

function generateSessionId(): string {
  const time = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 10)
  return `s_${time}${rand}`
}

function detectDevice(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  if (/ipad|tablet/.test(ua)) return 'tablet'
  if (/mobile|iphone|android.*mobile|phone/.test(ua)) return 'mobile'
  return 'desktop'
}

function readCampaignParams(url: URL) {
  return {
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
}

function hasCampaignParams(params: ReturnType<typeof readCampaignParams>): boolean {
  return Boolean(
    params.utmSource ||
      params.utmMedium ||
      params.utmCampaign ||
      params.gclid ||
      params.fbclid ||
      params.wbraid ||
      params.msclkid,
  )
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const existing = request.cookies.get(ANON_SESSION_COOKIE)?.value
  const url = request.nextUrl
  const campaign = readCampaignParams(url)
  const userAgent = request.headers.get('user-agent') ?? ''
  const referrer = request.headers.get('referer') ?? undefined
  const country =
    request.headers.get('x-vercel-ip-country') ||
    (request as unknown as { geo?: { country?: string } }).geo?.country ||
    undefined

  if (!existing) {
    const newId = generateSessionId()
    response.cookies.set(ANON_SESSION_COOKIE, newId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
      secure: process.env.NODE_ENV === 'production',
    })

    const bootstrap = {
      landingPath: url.pathname + (url.search ? url.search : ''),
      referrer,
      ...campaign,
      country,
      deviceType: detectDevice(userAgent),
    }

    response.cookies.set(ANON_BOOTSTRAP_COOKIE, encodeURIComponent(JSON.stringify(bootstrap)), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: BOOTSTRAP_MAX_AGE_SECONDS,
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  }

  // Returning visitor with new campaign params → last-touch cookie for the recorder.
  if (hasCampaignParams(campaign)) {
    const touch = {
      ...campaign,
      referrer,
      path: url.pathname + (url.search ? url.search : ''),
    }
    response.cookies.set(ANON_TOUCH_COOKIE, encodeURIComponent(JSON.stringify(touch)), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: TOUCH_MAX_AGE_SECONDS,
      secure: process.env.NODE_ENV === 'production',
    })
  }

  return response
}

export const config = {
  // Skip static assets, Next internals, image optimizer, and the analytics
  // ingestion endpoints (which don't need bootstrap-on-first-hit).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|_vercel|api/track|api/zv|.*\\.(?:png|jpg|jpeg|svg|gif|ico|webp|avif|woff2?|ttf|otf|map|txt|xml|json)$).*)',
  ],
}
