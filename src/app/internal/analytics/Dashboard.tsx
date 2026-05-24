'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type {
  DashboardRange,
  DashboardSummary,
  FunnelStep,
  RecentEventRow,
  TimeSeriesPoint,
  TopProperty,
  UtmRow,
} from '@/lib/analytics/queries'

type Loaders = {
  summary: (range: DashboardRange) => Promise<DashboardSummary>
  funnel: (range: DashboardRange) => Promise<FunnelStep[]>
  timeSeries: (range: DashboardRange) => Promise<TimeSeriesPoint[]>
  topProperties: (range: DashboardRange) => Promise<TopProperty[]>
  utm: (range: DashboardRange) => Promise<UtmRow[]>
  recent: (limit?: number) => Promise<RecentEventRow[]>
}

const FUNNEL_COLORS = ['#4338ca', '#6366f1', '#8b5cf6', '#a855f7', '#22c55e']

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value)
}

function prettifyEventName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function Dashboard({ loaders }: { loaders: Loaders }) {
  const [range, setRange] = useState<DashboardRange>('30d')
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [funnel, setFunnel] = useState<FunnelStep[]>([])
  const [series, setSeries] = useState<TimeSeriesPoint[]>([])
  const [topProperties, setTopProperties] = useState<TopProperty[]>([])
  const [utm, setUtm] = useState<UtmRow[]>([])
  const [recent, setRecent] = useState<RecentEventRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      try {
        setError(null)
        const [s, f, t, p, u, r] = await Promise.all([
          loaders.summary(range),
          loaders.funnel(range),
          loaders.timeSeries(range),
          loaders.topProperties(range),
          loaders.utm(range),
          loaders.recent(100),
        ])
        setSummary(s)
        setFunnel(f)
        setSeries(t)
        setTopProperties(p)
        setUtm(u)
        setRecent(r)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      }
    })
  }, [range, loaders])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Select value={range} onValueChange={(value) => setRange(value as DashboardRange)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        {loading ? <span className="text-xs text-muted-foreground">Loading…</span> : null}
      </div>

      {error ? (
        <Card>
          <CardContent className="py-4 text-sm text-red-600">{error}</CardContent>
        </Card>
      ) : null}

      <KpiStrip summary={summary} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart funnel={funnel} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sessions vs bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <TimeSeriesChart series={series} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top properties (bookings)</CardTitle>
          </CardHeader>
          <CardContent>
            <TopPropertiesChart rows={topProperties} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>UTM sources</CardTitle>
          </CardHeader>
          <CardContent>
            <UtmTable rows={utm} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent events</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentEventsTable rows={recent} />
        </CardContent>
      </Card>
    </div>
  )
}

function KpiStrip({ summary }: { summary: DashboardSummary | null }) {
  const items = [
    { label: 'Sessions', value: summary ? formatNumber(summary.sessions) : '–' },
    { label: 'Bookings (server-confirmed)', value: summary ? formatNumber(summary.bookings) : '–' },
    { label: 'Conversion rate', value: summary ? formatPct(summary.conversionRate) : '–' },
    {
      label: 'Avg events / session',
      value: summary ? summary.avgEventsPerSession.toFixed(1) : '–',
    },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="py-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function FunnelChart({ funnel }: { funnel: FunnelStep[] }) {
  if (!funnel.length) {
    return <p className="text-sm text-muted-foreground">No funnel data yet.</p>
  }
  const data = funnel.map((step, i) => ({
    step: prettifyEventName(step.name),
    sessions: step.sessions,
    drop: i === 0 ? 0 : step.dropFromPrev,
    fill: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
  }))
  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 24, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis dataKey="step" type="category" width={140} />
          <Tooltip
            formatter={(value, _name, item) => [
              `${formatNumber(Number(value))} sessions`,
              (item?.payload as { step?: string } | undefined)?.step ?? '',
            ]}
          />
          <Bar dataKey="sessions" radius={[0, 4, 4, 0]}>
            {data.map((row, i) => (
              <Cell key={i} fill={row.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ul className="space-y-1 text-xs text-muted-foreground">
        {data.map((row, i) => (
          <li key={row.step} className="flex justify-between">
            <span>{row.step}</span>
            <span>
              {formatNumber(row.sessions)}
              {i > 0 && row.drop > 0 ? ` (-${formatPct(row.drop)})` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TimeSeriesChart({ series }: { series: TimeSeriesPoint[] }) {
  if (!series.length) {
    return <p className="text-sm text-muted-foreground">No time-series data yet.</p>
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={series} margin={{ left: 0, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="sessions" stroke="#6366f1" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="bookings" stroke="#22c55e" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function TopPropertiesChart({ rows }: { rows: TopProperty[] }) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">No bookings yet.</p>
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} layout="vertical" margin={{ left: 32, right: 24 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} />
        <YAxis dataKey="propertySlug" type="category" width={140} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="bookings" fill="#22c55e" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function UtmTable({ rows }: { rows: UtmRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">No traffic yet.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="py-2">Source</th>
            <th className="py-2 text-right">Sessions</th>
            <th className="py-2 text-right">Bookings</th>
            <th className="py-2 text-right">Conv %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.utmSource} className="border-t">
              <td className="py-2">{row.utmSource}</td>
              <td className="py-2 text-right">{formatNumber(row.sessions)}</td>
              <td className="py-2 text-right">{formatNumber(row.bookings)}</td>
              <td className="py-2 text-right">{formatPct(row.conversionRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RecentEventsTable({ rows }: { rows: RecentEventRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">No events yet.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="py-2">When</th>
            <th className="py-2">Event</th>
            <th className="py-2">Property</th>
            <th className="py-2">Source</th>
            <th className="py-2">UTM</th>
            <th className="py-2">Session</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t">
              <td className="py-2 whitespace-nowrap text-xs text-muted-foreground">
                {new Date(row.occurredAt).toLocaleString()}
              </td>
              <td className="py-2 font-medium">{row.name}</td>
              <td className="py-2 text-muted-foreground">{row.propertySlug ?? '—'}</td>
              <td className="py-2 text-muted-foreground">{row.source}</td>
              <td className="py-2 text-muted-foreground">{row.utmSource ?? '—'}</td>
              <td className="py-2 text-xs">
                <Link
                  href={`/internal/analytics/sessions/${row.sessionId}`}
                  className="text-indigo-600 hover:underline"
                  prefetch={false}
                >
                  {row.sessionId.slice(0, 8)}…
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
