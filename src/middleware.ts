import { NextRequest, NextResponse } from 'next/server'

const ANON_SESSION_COOKIE = 'zenvana_anon_session'
const ANON_BOOTSTRAP_COOKIE = 'zenvana_anon_bootstrap'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days
const BOOTSTRAP_MAX_AGE_SECONDS = 60 * 10 // 10 minutes — consumed by first event

// cuid-lite: not collision-proof at server scale but fine for an anon cookie.
// Avoids pulling in cuid into the Edge bundle.
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

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const existing = request.cookies.get(ANON_SESSION_COOKIE)?.value

  if (existing) return response

  const newId = generateSessionId()
  response.cookies.set(ANON_SESSION_COOKIE, newId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === 'production',
  })

  // Capture first-touch context for the recorder to consume on first event.
  const url = request.nextUrl
  const userAgent = request.headers.get('user-agent') ?? ''
  const bootstrap = {
    landingPath: url.pathname + (url.search ? url.search : ''),
    referrer: request.headers.get('referer') ?? undefined,
    utmSource: url.searchParams.get('utm_source') ?? undefined,
    utmMedium: url.searchParams.get('utm_medium') ?? undefined,
    utmCampaign: url.searchParams.get('utm_campaign') ?? undefined,
    utmTerm: url.searchParams.get('utm_term') ?? undefined,
    utmContent: url.searchParams.get('utm_content') ?? undefined,
    country:
      request.headers.get('x-vercel-ip-country') ||
      (request as unknown as { geo?: { country?: string } }).geo?.country ||
      undefined,
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

export const config = {
  // Skip static assets, Next internals, image optimizer, and the track endpoint
  // itself (which doesn't need the bootstrap-on-first-hit branch since the
  // cookie would already be set on any meaningful prior nav).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|_vercel|api/track|.*\\.(?:png|jpg|jpeg|svg|gif|ico|webp|avif|woff2?|ttf|otf|map|txt|xml|json)$).*)',
  ],
}
