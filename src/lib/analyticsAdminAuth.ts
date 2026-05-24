import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

export const ANALYTICS_ADMIN_PASSWORD = process.env.ANALYTICS_ADMIN_PASSWORD?.trim() ?? ''
export const ANALYTICS_ADMIN_COOKIE = 'zenvana_analytics_admin'
const ANALYTICS_ADMIN_MAX_AGE_SECONDS = 60 * 60 * 8
const ANALYTICS_ADMIN_SESSION_SECRET = process.env.ANALYTICS_ADMIN_SESSION_SECRET?.trim() ?? ''

function canUseAdminSessionToken(): boolean {
  if (ANALYTICS_ADMIN_PASSWORD.length === 0) return false
  if (ANALYTICS_ADMIN_SESSION_SECRET.length === 0) return false
  return true
}

function computeSignature(timestamp: string): string {
  return createHmac('sha256', ANALYTICS_ADMIN_SESSION_SECRET).update(timestamp).digest('hex')
}

export function createAnalyticsAdminSessionToken(now = Date.now()): string | null {
  if (!canUseAdminSessionToken()) return null
  const timestamp = String(now)
  const signature = computeSignature(timestamp)
  return `${timestamp}.${signature}`
}

export function isAnalyticsAdminAuthorized(cookieValue: string | undefined): boolean {
  if (!cookieValue || !canUseAdminSessionToken()) return false
  const [timestamp, signature] = cookieValue.split('.')
  if (!timestamp || !signature) return false
  const tsNumber = Number(timestamp)
  if (!Number.isFinite(tsNumber)) return false
  if (Date.now() - tsNumber > ANALYTICS_ADMIN_MAX_AGE_SECONDS * 1000) return false
  const expected = computeSignature(timestamp)
  try {
    const encoder = new TextEncoder()
    const actualBytes = encoder.encode(signature)
    const expectedBytes = encoder.encode(expected)
    return (
      actualBytes.length === expectedBytes.length &&
      timingSafeEqual(actualBytes, expectedBytes)
    )
  } catch {
    return false
  }
}

export function shouldUseSecureAnalyticsAdminCookie(): boolean {
  if (process.env.ANALYTICS_ADMIN_COOKIE_SECURE === 'false') return false
  if (process.env.ANALYTICS_ADMIN_COOKIE_SECURE === 'true') return true
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  if (siteUrl.startsWith('https://')) return true
  return process.env.VERCEL === '1'
}

export function getAnalyticsAdminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: ANALYTICS_ADMIN_MAX_AGE_SECONDS,
    secure: shouldUseSecureAnalyticsAdminCookie(),
  }
}

export async function getAnalyticsAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  return isAnalyticsAdminAuthorized(cookieStore.get(ANALYTICS_ADMIN_COOKIE)?.value)
}
