'use server'

import { timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

import {
  ANALYTICS_ADMIN_COOKIE,
  ANALYTICS_ADMIN_PASSWORD,
  createAnalyticsAdminSessionToken,
  getAnalyticsAdminCookieOptions,
  getAnalyticsAdminSession,
} from '@/lib/analyticsAdminAuth'
import {
  getActiveUsersSnapshot,
  getBlogAnalytics,
  getCampaignTable,
  getChannelTable,
  getDashboardSummary,
  getFunnel,
  getInsightCallouts,
  getLandingPages,
  getOverviewComparison,
  getTimeSeries,
  getTopPathTransitions,
  getTopProperties,
  getUtmTable,
  listRecentAuditEvents,
  listRecentEvents,
  type DashboardFilters,
  type DashboardRange,
} from '@/lib/analytics/queries'
import { rebuildDailyMetricsRollup } from '@/lib/analytics/rollup'

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
  if (ANALYTICS_ADMIN_PASSWORD.length === 0) {
    return {
      ok: false,
      error:
        'ANALYTICS_ADMIN_PASSWORD is not configured. Set ANALYTICS_ADMIN_PASSWORD and ANALYTICS_ADMIN_SESSION_SECRET.',
    }
  }

  const encoder = new TextEncoder()
  const input = encoder.encode(password)
  const expected = encoder.encode(ANALYTICS_ADMIN_PASSWORD)
  const valid = input.length === expected.length && timingSafeEqual(input, expected)
  if (!valid) {
    return { ok: false, error: 'Incorrect password' }
  }
  const token = createAnalyticsAdminSessionToken()
  if (!token) {
    return {
      ok: false,
      error:
        'ANALYTICS_ADMIN_SESSION_SECRET is missing. Set it to enable secure admin sessions.',
    }
  }

  const cookieStore = await cookies()
  cookieStore.set(
    ANALYTICS_ADMIN_COOKIE,
    token,
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

export async function fetchDashboardSummaryAction(range: DashboardRange, filters?: DashboardFilters) {
  await requireAdmin()
  return getDashboardSummary(range, filters)
}

export async function fetchOverviewComparisonAction(
  range: DashboardRange,
  filters?: DashboardFilters,
) {
  await requireAdmin()
  return getOverviewComparison(range, filters)
}

export async function fetchInsightCalloutsAction(
  range: DashboardRange,
  filters?: DashboardFilters,
) {
  await requireAdmin()
  return getInsightCallouts(range, filters)
}

export async function fetchActiveUsersSnapshotAction() {
  await requireAdmin()
  return getActiveUsersSnapshot()
}

export async function fetchFunnelAction(range: DashboardRange, filters?: DashboardFilters) {
  await requireAdmin()
  return getFunnel(range, filters)
}

export async function fetchTimeSeriesAction(range: DashboardRange, filters?: DashboardFilters) {
  await requireAdmin()
  return getTimeSeries(range, filters)
}

export async function fetchTopPropertiesAction(range: DashboardRange, filters?: DashboardFilters) {
  await requireAdmin()
  return getTopProperties(range, filters)
}

export async function fetchUtmTableAction(range: DashboardRange, filters?: DashboardFilters) {
  await requireAdmin()
  return getUtmTable(range, filters)
}

export async function fetchChannelTableAction(range: DashboardRange, filters?: DashboardFilters) {
  await requireAdmin()
  return getChannelTable(range, filters)
}

export async function fetchCampaignTableAction(range: DashboardRange, filters?: DashboardFilters) {
  await requireAdmin()
  return getCampaignTable(range, filters)
}

export async function fetchLandingPagesAction(range: DashboardRange, filters?: DashboardFilters) {
  await requireAdmin()
  return getLandingPages(range, filters)
}

export async function fetchPathTransitionsAction(
  range: DashboardRange,
  filters?: DashboardFilters,
) {
  await requireAdmin()
  return getTopPathTransitions(range, filters)
}

export async function fetchBlogAnalyticsAction(range: DashboardRange) {
  await requireAdmin()
  return getBlogAnalytics(range)
}

export async function fetchRecentEventsAction(
  range: DashboardRange,
  filters?: DashboardFilters,
  limit = 100,
) {
  await requireAdmin()
  return listRecentEvents(limit, range, filters)
}

export async function fetchRecentAuditEventsAction(limit = 40) {
  await requireAdmin()
  return listRecentAuditEvents(limit)
}

export async function rebuildAnalyticsRollupsAction(
  daysBack = 120,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  try {
    await rebuildDailyMetricsRollup(daysBack)
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to rebuild rollups',
    }
  }
}
