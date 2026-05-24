import { cookies } from 'next/headers'

export const ANALYTICS_ADMIN_PASSWORD =
  process.env.ANALYTICS_ADMIN_PASSWORD?.trim() || 'admin123'
export const ANALYTICS_ADMIN_COOKIE = 'zenvana_analytics_admin'
export const ANALYTICS_ADMIN_COOKIE_VALUE = 'authorized'
const ANALYTICS_ADMIN_MAX_AGE_SECONDS = 60 * 60 * 8

export function isAnalyticsAdminAuthorized(cookieValue: string | undefined): boolean {
  return cookieValue === ANALYTICS_ADMIN_COOKIE_VALUE
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
