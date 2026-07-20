'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
  fetchActiveUsersSnapshotAction,
  fetchBlogAnalyticsAction,
  fetchBookingsDrilldownAction,
  fetchCampaignTableAction,
  fetchChannelTableAction,
  fetchFunnelAction,
  fetchInsightCalloutsAction,
  fetchLandingPagesAction,
  fetchOverviewComparisonAction,
  fetchPathTransitionsAction,
  fetchRecentAuditEventsAction,
  fetchRecentEventsAction,
  fetchTimeSeriesAction,
  fetchTopPropertiesAction,
  fetchUtmTableAction,
  getAnalyticsAdminSessionAction,
  loginAnalyticsAdmin,
  logoutAnalyticsAdmin,
  rebuildAnalyticsRollupsAction,
} from './actions'
import { Dashboard } from './Dashboard'

type Props = { authorized: boolean }

export function AnalyticsAdminClient({ authorized: initialAuthorized }: Props) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(initialAuthorized)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [rollupMessage, setRollupMessage] = useState<string | null>(null)
  const [submitting, startTransition] = useTransition()
  const [rollupPending, startRollupTransition] = useTransition()

  function handleLogin(event: React.FormEvent) {
    event.preventDefault()
    setLoginError(null)
    startTransition(async () => {
      const result = await loginAnalyticsAdmin(password)
      if (!result.ok) {
        setLoginError(result.error ?? 'Login failed')
        return
      }
      const sessionOk = await getAnalyticsAdminSessionAction()
      if (!sessionOk) {
        setLoginError('Session was not established. Try again from the same host URL.')
        return
      }
      setAuthorized(true)
      setPassword('')
      router.refresh()
    })
  }

  async function handleLogout() {
    await logoutAnalyticsAdmin()
    setAuthorized(false)
    router.refresh()
  }

  function handleRebuildRollups() {
    setRollupMessage(null)
    startRollupTransition(async () => {
      const result = await rebuildAnalyticsRollupsAction()
      if (!result.ok) {
        setRollupMessage(result.error ?? 'Failed to rebuild rollups')
        return
      }
      setRollupMessage('Rollups rebuilt successfully.')
      router.refresh()
    })
  }

  if (!authorized) {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Analytics Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="analytics-admin-password">Password</Label>
                <Input
                  id="analytics-admin-password"
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              {loginError ? (
                <p className="text-sm text-red-600" role="alert">
                  {loginError}
                </p>
              ) : null}
              <Button type="submit" disabled={submitting || !password}>
                {submitting ? 'Unlocking…' : 'Unlock'}
              </Button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground">
              For internal use only. Set <code>ANALYTICS_ADMIN_PASSWORD</code> and{' '}
              <code>ANALYTICS_ADMIN_SESSION_SECRET</code> in your environment.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          onClick={handleRebuildRollups}
          variant="outline"
          size="sm"
          disabled={rollupPending}
        >
          {rollupPending ? 'Rebuilding…' : 'Rebuild rollups'}
        </Button>
        <Button onClick={handleLogout} variant="outline" size="sm">
          <LogOut className="mr-1 h-4 w-4" />
          Logout
        </Button>
      </div>
      {rollupMessage ? (
        <p className="text-sm text-muted-foreground">{rollupMessage}</p>
      ) : null}

      <Dashboard
        loaders={{
          activeUsers: fetchActiveUsersSnapshotAction,
          overview: fetchOverviewComparisonAction,
          insights: fetchInsightCalloutsAction,
          funnel: fetchFunnelAction,
          timeSeries: fetchTimeSeriesAction,
          topProperties: fetchTopPropertiesAction,
          utm: fetchUtmTableAction,
          channels: fetchChannelTableAction,
          campaigns: fetchCampaignTableAction,
          landings: fetchLandingPagesAction,
          paths: fetchPathTransitionsAction,
          blog: fetchBlogAnalyticsAction,
          bookings: fetchBookingsDrilldownAction,
          recent: fetchRecentEventsAction,
          audit: fetchRecentAuditEventsAction,
        }}
      />
    </div>
  )
}
