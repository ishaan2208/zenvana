'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, RefreshCcw, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
  fetchDashboardSummaryAction,
  fetchFunnelAction,
  fetchRecentEventsAction,
  fetchTimeSeriesAction,
  fetchTopPropertiesAction,
  fetchUtmTableAction,
  getAnalyticsAdminSessionAction,
  loginAnalyticsAdmin,
  logoutAnalyticsAdmin,
} from './actions'
import { Dashboard } from './Dashboard'
import type { DashboardRange } from '@/lib/analytics/queries'

type Props = { authorized: boolean }

export function AnalyticsAdminClient({ authorized: initialAuthorized }: Props) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(initialAuthorized)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [submitting, startTransition] = useTransition()

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
              For internal use only. Set <code>ANALYTICS_ADMIN_PASSWORD</code> in your environment.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Zenvana Analytics</h1>
          <p className="text-sm text-muted-foreground">
            First-party booking-funnel and conversion events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/internal/analytics"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            prefetch={false}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Link>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="mr-1 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <Dashboard
        loaders={{
          summary: fetchDashboardSummaryAction,
          funnel: fetchFunnelAction,
          timeSeries: fetchTimeSeriesAction,
          topProperties: fetchTopPropertiesAction,
          utm: fetchUtmTableAction,
          recent: fetchRecentEventsAction,
        }}
      />
    </div>
  )
}
