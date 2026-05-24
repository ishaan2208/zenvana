'use server'

import { cookies } from 'next/headers'

import {
  ANALYTICS_ADMIN_COOKIE,
  ANALYTICS_ADMIN_COOKIE_VALUE,
  ANALYTICS_ADMIN_PASSWORD,
  getAnalyticsAdminCookieOptions,
  getAnalyticsAdminSession,
} from '@/lib/analyticsAdminAuth'
import {
  getDashboardSummary,
  getFunnel,
  getTimeSeries,
  getTopProperties,
  getUtmTable,
  listRecentEvents,
  type DashboardRange,
} from '@/lib/analytics/queries'

async function requireAdmin() {
  const authorized = await getAnalyticsAdminSession()
  if (!authorized) throw new Error('Unauthorized')
}

export async function getAnalyticsAdminSessionAction(): Promise<boolean> {
  return getAnalyticsAdminSession()
}

export async function loginAnalyticsAdmin(
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  if (password !== ANALYTICS_ADMIN_PASSWORD) {
    return { ok: false, error: 'Incorrect password' }
  }

  const cookieStore = await cookies()
  cookieStore.set(
    ANALYTICS_ADMIN_COOKIE,
    ANALYTICS_ADMIN_COOKIE_VALUE,
    getAnalyticsAdminCookieOptions(),
  )

  const sessionOk = await getAnalyticsAdminSession()
  if (!sessionOk) {
    return {
      ok: false,
      error:
        'Login cookie could not be set. Use the same host for every visit (e.g. always localhost:3009, not 127.0.0.1), and use HTTPS in production.',
    }
  }

  return { ok: true }
}

export async function logoutAnalyticsAdmin(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ANALYTICS_ADMIN_COOKIE)
}

export async function fetchDashboardSummaryAction(range: DashboardRange) {
  await requireAdmin()
  return getDashboardSummary(range)
}

export async function fetchFunnelAction(range: DashboardRange) {
  await requireAdmin()
  return getFunnel(range)
}

export async function fetchTimeSeriesAction(range: DashboardRange) {
  await requireAdmin()
  return getTimeSeries(range)
}

export async function fetchTopPropertiesAction(range: DashboardRange) {
  await requireAdmin()
  return getTopProperties(range)
}

export async function fetchUtmTableAction(range: DashboardRange) {
  await requireAdmin()
  return getUtmTable(range)
}

export async function fetchRecentEventsAction(limit = 100) {
  await requireAdmin()
  return listRecentEvents(limit)
}
