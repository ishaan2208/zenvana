'use client'

import { useCallback, useEffect, useMemo, useState, useTransition, type ReactNode } from 'react'
import Link from 'next/link'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarRange,
  Compass,
  Filter,
  Flame,
  Lightbulb,
  MousePointerClick,
  Receipt,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  Waypoints,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { friendlyChannel } from '@/lib/analytics/channel'
import type { BookingDrilldownRow } from '@/lib/analytics/bookingDrilldown'
import type {
  ActiveUsersSnapshot,
  BlogAnalytics,
  CampaignRow,
  ChannelRow,
  DashboardFilters,
  DashboardRange,
  FunnelResult,
  InsightCallout,
  LandingPageRow,
  OverviewComparison,
  PathTransition,
  RecentAuditRow,
  RecentEventRow,
  TimeSeriesPoint,
  TopProperty,
  UtmRow,
} from '@/lib/analytics/queries'
import { AnalyticsDashboardSkeleton } from './AnalyticsDashboardSkeleton'

type Loaders = {
  activeUsers: () => Promise<ActiveUsersSnapshot>
  overview: (range: DashboardRange, filters?: DashboardFilters) => Promise<OverviewComparison>
  insights: (range: DashboardRange, filters?: DashboardFilters) => Promise<InsightCallout[]>
  funnel: (range: DashboardRange, filters?: DashboardFilters) => Promise<FunnelResult>
  timeSeries: (range: DashboardRange, filters?: DashboardFilters) => Promise<TimeSeriesPoint[]>
  topProperties: (range: DashboardRange, filters?: DashboardFilters) => Promise<TopProperty[]>
  utm: (range: DashboardRange, filters?: DashboardFilters) => Promise<UtmRow[]>
  channels: (range: DashboardRange, filters?: DashboardFilters) => Promise<ChannelRow[]>
  campaigns: (range: DashboardRange, filters?: DashboardFilters) => Promise<CampaignRow[]>
  landings: (range: DashboardRange, filters?: DashboardFilters) => Promise<LandingPageRow[]>
  paths: (range: DashboardRange, filters?: DashboardFilters) => Promise<PathTransition[]>
  blog: (range: DashboardRange) => Promise<BlogAnalytics>
  bookings: (range: DashboardRange, filters?: DashboardFilters, limit?: number) => Promise<BookingDrilldownRow[]>
  recent: (range: DashboardRange, filters?: DashboardFilters, limit?: number) => Promise<RecentEventRow[]>
  audit: (limit?: number) => Promise<RecentAuditRow[]>
}

const RANGE_OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '10d', label: '10 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
]

const FUNNEL_LABELS: Record<string, string> = {
  property_viewed: 'Saw property',
  dates_selected: 'Picked dates',
  availability_checked: 'Checked availability',
  room_selected: 'Picked room',
  checkout_viewed: 'Opened checkout',
  payment_initiated: 'Started payment',
  booking_completed: 'Booked',
}

const nfIN = new Intl.NumberFormat('en-IN')
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function formatNumber(value: number): string {
  return nfIN.format(Math.round(value))
}
function formatMoney(value: number): string {
  return inr.format(value || 0)
}
function formatPct(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '0%'
  return `${(value * 100).toFixed(digits)}%`
}
function formatDelta(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${(value * 100).toFixed(0)}%`
}
function friendlyProperty(slug: string): string {
  return slug.replace(/-/g, ' ')
}
function friendlySource(raw: string | null | undefined): string {
  if (!raw || raw === 'direct') return 'Direct'
  if (raw.includes('whatsapp')) return 'WhatsApp'
  if (raw.includes('google')) return 'Google'
  if (raw.includes('instagram') || raw === 'ig') return 'Instagram'
  if (raw.includes('facebook') || raw === 'fb') return 'Facebook'
  return raw
}

function DeltaBadge({ value, invert = false }: { value: number; invert?: boolean }) {
  const good = invert ? value < 0 : value > 0
  const bad = invert ? value > 0 : value < 0
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : null
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
        good
          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
          : bad
            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
            : 'bg-muted text-muted-foreground'
      }`}
    >
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {formatDelta(value)}
    </span>
  )
}

function KpiCard({
  label,
  value,
  hint,
  delta,
  invertDelta,
}: {
  label: string
  value: string
  hint?: string
  delta?: number
  invertDelta?: boolean
}) {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          {typeof delta === 'number' ? <DeltaBadge value={delta} invert={invertDelta} /> : null}
        </div>
        <p className="mt-2 font-sans text-3xl font-semibold tabular-nums tracking-tight text-foreground">
          {value}
        </p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

function formatStayDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatChartDay(isoDate: string): string {
  // isoDate is YYYY-MM-DD in local calendar; parse as local noon to avoid TZ shift
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate.slice(5)
  const date = new Date(y, m - 1, d, 12)
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 text-sm text-muted-foreground">
      {message}
    </div>
  )
}

function DataTable({
  headers,
  rows,
  empty = 'No data for this period',
}: {
  headers: string[]
  rows: Array<Array<ReactNode>>
  empty?: string
}) {
  if (!rows.length) return <EmptyState message={empty} />
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-t border-border/50 hover:bg-muted/20">
              {cells.map((cell, j) => (
                <td key={j} className="px-3 py-2.5 align-middle">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Dashboard({ loaders }: { loaders: Loaders }) {
  const [range, setRange] = useState<DashboardRange>('30d')
  const [propertySlug, setPropertySlug] = useState<string>('all')
  const [channel, setChannel] = useState<string>('all')
  const [tab, setTab] = useState('overview')
  const [initialLoading, setInitialLoading] = useState(true)
  const [pending, startTransition] = useTransition()

  const [activeUsers, setActiveUsers] = useState<ActiveUsersSnapshot | null>(null)
  const [overview, setOverview] = useState<OverviewComparison | null>(null)
  const [insights, setInsights] = useState<InsightCallout[]>([])
  const [funnel, setFunnel] = useState<FunnelResult | null>(null)
  const [series, setSeries] = useState<TimeSeriesPoint[]>([])
  const [properties, setProperties] = useState<TopProperty[]>([])
  const [utm, setUtm] = useState<UtmRow[]>([])
  const [channels, setChannels] = useState<ChannelRow[]>([])
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [landings, setLandings] = useState<LandingPageRow[]>([])
  const [paths, setPaths] = useState<PathTransition[]>([])
  const [blog, setBlog] = useState<BlogAnalytics | null>(null)
  const [bookings, setBookings] = useState<BookingDrilldownRow[]>([])
  const [selectedBooking, setSelectedBooking] = useState<BookingDrilldownRow | null>(null)
  const [recent, setRecent] = useState<RecentEventRow[]>([])
  const [audit, setAudit] = useState<RecentAuditRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const filters: DashboardFilters = useMemo(
    () => ({
      propertySlug: propertySlug === 'all' ? null : propertySlug,
      channel: channel === 'all' ? null : channel,
    }),
    [propertySlug, channel],
  )

  const refresh = useCallback(() => {
    startTransition(async () => {
      setError(null)
      try {
        const [
          activeUsersData,
          overviewData,
          insightsData,
          funnelData,
          seriesData,
          propertiesData,
          utmData,
          channelsData,
          campaignsData,
          landingsData,
          pathsData,
          blogData,
          bookingsData,
          recentData,
          auditData,
        ] = await Promise.all([
          loaders.activeUsers(),
          loaders.overview(range, filters),
          loaders.insights(range, filters),
          loaders.funnel(range, filters),
          loaders.timeSeries(range, filters),
          loaders.topProperties(range, filters),
          loaders.utm(range, filters),
          loaders.channels(range, filters),
          loaders.campaigns(range, filters),
          loaders.landings(range, filters),
          loaders.paths(range, filters),
          loaders.blog(range),
          loaders.bookings(range, filters, 40),
          loaders.recent(range, filters, 40),
          loaders.audit(30),
        ])
        setActiveUsers(activeUsersData)
        setOverview(overviewData)
        setInsights(insightsData)
        setFunnel(funnelData ?? null)
        setSeries(seriesData)
        setProperties(propertiesData)
        setUtm(utmData)
        setChannels(channelsData)
        setCampaigns(campaignsData)
        setLandings(landingsData)
        setPaths(pathsData)
        setBlog(blogData)
        setBookings(bookingsData)
        setRecent(recentData)
        setAudit(auditData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setInitialLoading(false)
      }
    })
  }, [loaders, range, filters])

  useEffect(() => {
    refresh()
  }, [refresh])

  const propertyOptions = useMemo(() => {
    const set = new Set(properties.map((p) => p.propertySlug))
    return ['all', ...[...set].sort()]
  }, [properties])

  const channelOptions = useMemo(() => {
    const set = new Set(channels.map((c) => c.channel))
    return ['all', ...[...set].sort()]
  }, [channels])

  const current = overview?.current
  if (initialLoading) {
    return <AnalyticsDashboardSkeleton />
  }

  return (
    <div className="relative space-y-6" aria-busy={pending}>
      {pending ? (
        <div
          className="absolute inset-x-0 -top-3 h-0.5 overflow-hidden rounded-full bg-muted"
          role="status"
          aria-label="Refreshing analytics"
        >
          <div className="h-full w-full animate-pulse bg-primary/70 motion-reduce:animate-none" />
        </div>
      ) : null}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
              Analytics
            </h1>
            {activeUsers ? (
              <Badge variant="outline" className="gap-1.5 px-2.5 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {activeUsers.active5m} active · 5m
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Decision views for acquisition, funnel drop-offs, property performance, on-site flow,
            and blog author output. Conversions = completed bookings.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end">
          <Select
            value={range}
            onValueChange={(v) => setRange(v as DashboardRange)}
            disabled={pending}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={propertySlug} onValueChange={setPropertySlug} disabled={pending}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              <SelectValue placeholder="Property" />
            </SelectTrigger>
            <SelectContent>
              {propertyOptions.map((slug) => (
                <SelectItem key={slug} value={slug}>
                  {slug === 'all' ? 'All properties' : friendlyProperty(slug)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={channel} onValueChange={setChannel} disabled={pending}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              {channelOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === 'all' ? 'All channels' : friendlyChannel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={refresh}
            disabled={pending}
            aria-label={pending ? 'Refreshing analytics' : 'Refresh analytics'}
            title={pending ? 'Refreshing analytics' : 'Refresh analytics'}
          >
            <RefreshCw className={`h-4 w-4 ${pending ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={setTab} className="space-y-5">
        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto bg-muted/40 p-1">
          <TabsTrigger value="overview" className="shrink-0 gap-1 px-2 text-[13px] xl:gap-1.5 xl:px-3 xl:text-sm">
            <Flame className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="acquisition" className="shrink-0 gap-1 px-2 text-[13px] xl:gap-1.5 xl:px-3 xl:text-sm">
            <Compass className="h-3.5 w-3.5" /> Acquisition
          </TabsTrigger>
          <TabsTrigger value="funnel" className="shrink-0 gap-1 px-2 text-[13px] xl:gap-1.5 xl:px-3 xl:text-sm">
            <TrendingDown className="h-3.5 w-3.5" /> Funnel
          </TabsTrigger>
          <TabsTrigger value="properties" className="shrink-0 gap-1 px-2 text-[13px] xl:gap-1.5 xl:px-3 xl:text-sm">
            <Building2 className="h-3.5 w-3.5" /> Properties
          </TabsTrigger>
          <TabsTrigger value="bookings" className="shrink-0 gap-1 px-2 text-[13px] xl:gap-1.5 xl:px-3 xl:text-sm">
            <Receipt className="h-3.5 w-3.5" /> Bookings
          </TabsTrigger>
          <TabsTrigger value="behavior" className="shrink-0 gap-1 px-2 text-[13px] xl:gap-1.5 xl:px-3 xl:text-sm">
            <Waypoints className="h-3.5 w-3.5" /> Behavior
          </TabsTrigger>
          <TabsTrigger value="blog" className="shrink-0 gap-1 px-2 text-[13px] xl:gap-1.5 xl:px-3 xl:text-sm">
            <BookOpen className="h-3.5 w-3.5" /> Blog
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ───────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Visitors"
              value={formatNumber(current?.sessions ?? 0)}
              hint="Distinct sessions"
              delta={overview?.deltas.sessions}
            />
            <button
              type="button"
              className="text-left"
              onClick={() => setTab('bookings')}
              title="View booking details"
            >
              <KpiCard
                label="Bookings"
                value={formatNumber(current?.bookings ?? 0)}
                hint={
                  overview?.pms.current
                    ? `Website PMS · tracked ${formatNumber(overview.pms.trackedCurrent.bookings)} →`
                    : 'Tracked events · click to drill down →'
                }
                delta={overview?.deltas.bookings}
              />
            </button>
            <KpiCard
              label="Conversion"
              value={formatPct(current?.conversionRate ?? 0)}
              hint="Bookings ÷ sessions"
              delta={overview?.deltas.conversionRate}
            />
            <KpiCard
              label="Revenue"
              value={formatMoney(current?.revenue ?? 0)}
              hint={
                overview?.pms.current
                  ? `Website PMS · tracked ${formatMoney(overview.pms.trackedCurrent.revenue)}`
                  : 'From tracked booking amounts'
              }
              delta={overview?.deltas.revenue}
            />
          </div>

          {overview?.pms.current &&
          (overview.pms.current.bookings !== overview.pms.trackedCurrent.bookings ||
            Math.abs(overview.pms.current.revenue - overview.pms.trackedCurrent.revenue) > 1) ? (
            <p className="text-xs text-muted-foreground">
              PMS website bookings ({formatNumber(overview.pms.current.bookings)} ·{' '}
              {formatMoney(overview.pms.current.revenue)}) are the money source of truth.
              Tracked analytics ({formatNumber(overview.pms.trackedCurrent.bookings)} ·{' '}
              {formatMoney(overview.pms.trackedCurrent.revenue)}) undercount when{' '}
              <code className="text-[11px]">booking_completed</code> did not fire.
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <KpiCard
              label="WhatsApp clicks"
              value={formatNumber(current?.whatsappClicks ?? 0)}
              hint="Outbound wa.me intent"
            />
            <KpiCard
              label="Phone clicks"
              value={formatNumber(current?.phoneClicks ?? 0)}
              hint="tel: link taps"
            />
            <KpiCard
              label="Engagement"
              value={(current?.avgEventsPerSession ?? 0).toFixed(1)}
              hint="Events per session"
            />
          </div>

          {insights.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  What changed — act on these
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                {insights.map((insight, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border px-3 py-3 ${
                      insight.kind === 'up'
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : insight.kind === 'down'
                          ? 'border-rose-500/30 bg-rose-500/5'
                          : 'border-border/60 bg-muted/20'
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">{insight.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{insight.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Visitors & bookings trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              {series.length === 0 ? (
                <EmptyState message="No trend data yet" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series}>
                    <defs>
                      <linearGradient id="sess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
                    <YAxis tick={{ fontSize: 11 }} width={36} />
                    <RechartsTooltip />
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      name="Sessions"
                      stroke="#6366f1"
                      fill="url(#sess)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="bookings"
                      name="Bookings"
                      stroke="#10b981"
                      fill="transparent"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Acquisition ────────────────────────────────────── */}
        <TabsContent value="acquisition" className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Channels — where should you spend?</CardTitle>
              <p className="text-xs text-muted-foreground">
                First-touch channel derived from UTM, click IDs (gclid/fbclid), and referrer.
                Bookings here are tracked events (for attribution); Overview/Properties use website
                PMS for money totals. Interakt campaigns: use{' '}
                <code className="rounded bg-muted px-1">
                  ?utm_source=whatsapp&utm_medium=interakt&utm_campaign=NAME
                </code>
              </p>
            </CardHeader>
            <CardContent>
              <DataTable
                headers={['Channel', 'Sessions', 'Bookings', 'Revenue', 'Conv.', 'WA clicks']}
                rows={channels.map((row) => [
                  <span key="c" className="font-medium">
                    {friendlyChannel(row.channel)}
                  </span>,
                  formatNumber(row.sessions),
                  formatNumber(row.bookings),
                  formatMoney(row.revenue),
                  formatPct(row.conversionRate),
                  formatNumber(row.whatsappClicks),
                ])}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Campaigns (UTM) — Interakt & ads</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                headers={['Campaign', 'Source', 'Medium', 'Channel', 'Sessions', 'Bookings', 'Revenue', 'Conv.']}
                rows={campaigns.map((row) => [
                  <span key="c" className="font-medium">
                    {row.campaign}
                  </span>,
                  friendlySource(row.source),
                  row.medium,
                  friendlyChannel(row.channel),
                  formatNumber(row.sessions),
                  formatNumber(row.bookings),
                  formatMoney(row.revenue),
                  formatPct(row.conversionRate),
                ])}
                empty="No campaign-tagged traffic yet. Add UTMs to WhatsApp / ad links."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">UTM sources</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                headers={['Source', 'Sessions', 'Bookings', 'Revenue', 'Conv.']}
                rows={utm.map((row) => [
                  friendlySource(row.utmSource),
                  formatNumber(row.sessions),
                  formatNumber(row.bookings),
                  formatMoney(row.revenue),
                  formatPct(row.conversionRate),
                ])}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Funnel ─────────────────────────────────────────── */}
        <TabsContent value="funnel" className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Booking funnel — where guests drop off</CardTitle>
              <p className="text-xs text-muted-foreground">
                Bars = sessions that reached each step (any order). Ordered path = full sequence
                without skipping. &quot;Booked&quot; is not total revenue — use Overview / Bookings for that.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!funnel || funnel.steps.length === 0 ? (
                <EmptyState message="No funnel activity" />
              ) : (
                <>
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    Website bookings (PMS when available):{' '}
                    <span className="font-medium text-foreground">
                      {formatNumber(funnel.totalBookings)}
                    </span>
                    {' · '}
                    Ordered path completions:{' '}
                    <span className="font-medium text-foreground">
                      {formatNumber(
                        funnel.steps[funnel.steps.length - 1]?.orderedSessions ?? 0,
                      )}
                    </span>
                    {' · '}
                    Sessions that reached Booked:{' '}
                    <span className="font-medium text-foreground">
                      {formatNumber(funnel.steps[funnel.steps.length - 1]?.sessions ?? 0)}
                    </span>
                  </div>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={funnel.steps.map((s) => ({
                          ...s,
                          label: FUNNEL_LABELS[s.name] ?? s.name,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10 }}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 11 }} width={40} />
                        <RechartsTooltip />
                        <Bar
                          dataKey="sessions"
                          name="Reached"
                          fill="#6366f1"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <DataTable
                    headers={['Step', 'Reached', 'Ordered path', 'Drop (reached)']}
                    rows={funnel.steps.map((step, i) => [
                      <span key="n" className="font-medium">
                        {i + 1}. {FUNNEL_LABELS[step.name] ?? step.name}
                      </span>,
                      formatNumber(step.sessions),
                      formatNumber(step.orderedSessions),
                      i === 0 ? (
                        '—'
                      ) : (
                        <span
                          className={
                            step.dropFromPrev > 0.4 ? 'font-medium text-rose-600' : ''
                          }
                        >
                          {formatPct(step.dropFromPrev)}
                        </span>
                      ),
                    ])}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Properties ─────────────────────────────────────── */}
        <TabsContent value="properties" className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Property comparison — what to change
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Bookings &amp; revenue from website PMS. Views/sessions from on-site tracking.
              </p>
            </CardHeader>
            <CardContent>
              <DataTable
                headers={['Property', 'Views', 'Sessions', 'Bookings', 'Revenue', 'Conv.']}
                rows={properties.map((row) => [
                  <span key="p" className="font-medium capitalize">
                    {friendlyProperty(row.propertySlug)}
                  </span>,
                  formatNumber(row.views),
                  formatNumber(row.sessions),
                  formatNumber(row.bookings),
                  formatMoney(row.revenue),
                  <span
                    key="c"
                    className={
                      row.conversionRate >= 0.05
                        ? 'font-medium text-emerald-600'
                        : row.views > 20 && row.conversionRate < 0.01
                          ? 'font-medium text-rose-600'
                          : ''
                    }
                  >
                    {formatPct(row.conversionRate)}
                  </span>,
                ])}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Bookings drill-down ─────────────────────────────── */}
        <TabsContent value="bookings" className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarRange className="h-4 w-4" />
                Booking details — from StaySystems PMS
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                All WEBSITE bookings from StaySystems PMS in this range (source of truth). Channel
                shown when a matching analytics event exists. Click a row for detail.
              </p>
            </CardHeader>
            <CardContent>
              <DataTable
                headers={[
                  'Guest',
                  'Property',
                  'Stay',
                  'Nights',
                  'Avg tariff',
                  'Total',
                  'Created',
                  'Channel',
                  'Ref',
                ]}
                rows={bookings.map((row) => {
                  const d = row.detail
                  return [
                    <button
                      key="g"
                      type="button"
                      className="text-left font-medium hover:underline"
                      onClick={() => setSelectedBooking(row)}
                    >
                      {d?.guestName ?? '—'}
                      {d?.guestPhoneLast4 ? (
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                          ···{d.guestPhoneLast4}
                        </span>
                      ) : null}
                    </button>,
                    <span key="p" className="capitalize">
                      {d?.propertyName ??
                        (row.propertySlug ? friendlyProperty(row.propertySlug) : '—')}
                    </span>,
                    <span key="s" className="whitespace-nowrap text-xs sm:text-sm">
                      {formatStayDate(d?.checkIn)} → {formatStayDate(d?.checkOut)}
                    </span>,
                    d ? formatNumber(d.nights) : '—',
                    d?.avgTariff != null ? formatMoney(d.avgTariff) : '—',
                    formatMoney(d?.totalAmount ?? row.analyticsAmount ?? 0),
                    <span key="c" className="whitespace-nowrap text-xs sm:text-sm">
                      {formatDateTime(d?.createdAt ?? row.convertedAt)}
                    </span>,
                    friendlyChannel(row.channel),
                    <button
                      key="r"
                      type="button"
                      className="font-mono text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                      onClick={() => setSelectedBooking(row)}
                    >
                      {row.bookingReference}
                    </button>,
                  ]
                })}
                empty="No completed bookings in this period"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Behavior ───────────────────────────────────────── */}
        <TabsContent value="behavior" className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top landing pages</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  headers={['Path', 'Sessions', 'Bookings', 'Conv.']}
                  rows={landings.map((row) => [
                    <code key="p" className="text-xs">
                      {row.path}
                    </code>,
                    formatNumber(row.sessions),
                    formatNumber(row.bookings),
                    formatPct(row.conversionRate),
                  ])}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Waypoints className="h-4 w-4" />
                  Top path transitions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  headers={['From', '', 'To', 'Count']}
                  rows={paths.map((row) => [
                    <code key="f" className="text-xs">
                      {row.from}
                    </code>,
                    <ArrowRight key="a" className="h-3.5 w-3.5 text-muted-foreground" />,
                    <code key="t" className="text-xs">
                      {row.to}
                    </code>,
                    formatNumber(row.count),
                  ])}
                  empty="Not enough page_viewed sequences yet"
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MousePointerClick className="h-4 w-4" />
                Recent events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                headers={['When', 'Event', 'Property', 'UTM', 'Session']}
                rows={recent.map((row) => [
                  new Date(row.occurredAt).toLocaleString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  row.name.replace(/_/g, ' '),
                  row.propertySlug ? friendlyProperty(row.propertySlug) : '—',
                  friendlySource(row.utmSource),
                  <Link
                    key="s"
                    href={`/internal/analytics/sessions/${row.sessionId}`}
                    className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {row.sessionId.slice(0, 10)}…
                  </Link>,
                ])}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ingestion audit (debug)</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                headers={['When', 'Event', 'Status', 'Reason', 'Booking']}
                rows={audit.map((row) => [
                  new Date(row.recordedAt).toLocaleString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  row.eventName,
                  <Badge
                    key="st"
                    variant="outline"
                    className={
                      row.status === 'accepted'
                        ? 'border-emerald-500/40 text-emerald-700'
                        : row.status === 'rejected'
                          ? 'border-rose-500/40 text-rose-700'
                          : ''
                    }
                  >
                    {row.status}
                  </Badge>,
                  row.reasonCode,
                  row.bookingReference ?? '—',
                ])}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Blog ───────────────────────────────────────────── */}
        <TabsContent value="blog" className="space-y-5">
          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Last 10 days</h3>
                <p className="text-xs text-muted-foreground">
                  Fixed window for ops — independent of the range picker above.
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                Rolling 10d
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Published"
                value={formatNumber(blog?.last10Days.published ?? 0)}
                hint="Went live"
              />
              <KpiCard
                label="Created"
                value={formatNumber(blog?.last10Days.created ?? 0)}
                hint="Drafts + published"
              />
              <KpiCard
                label="Post views"
                value={formatNumber(blog?.last10Days.views ?? 0)}
              />
              <KpiCard
                label="Unique readers"
                value={formatNumber(blog?.last10Days.readers ?? 0)}
              />
              <KpiCard
                label="Comments"
                value={formatNumber(blog?.last10Days.comments ?? 0)}
              />
              <KpiCard
                label="Blog → hotel CTAs"
                value={formatNumber(blog?.last10Days.ctaClicks ?? 0)}
              />
              <KpiCard
                label="Newsletter"
                value={formatNumber(blog?.last10Days.newsletterSignups ?? 0)}
              />
              <KpiCard
                label="Assisted bookings"
                value={formatNumber(blog?.last10Days.assistedBookings ?? 0)}
                hint="Viewed a post → booked"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              label="Published"
              value={formatNumber(blog?.totals.published ?? 0)}
              hint={`In selected ${range}`}
            />
            <KpiCard label="Post views" value={formatNumber(blog?.totals.views ?? 0)} />
            <KpiCard label="Unique readers" value={formatNumber(blog?.totals.readers ?? 0)} />
            <KpiCard label="Comments" value={formatNumber(blog?.totals.comments ?? 0)} />
            <KpiCard
              label="Newsletter"
              value={formatNumber(blog?.newsletterSignups ?? 0)}
              hint="Signups this period"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarRange className="h-4 w-4" />
                  Posts uploaded by day
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Published = went live. Created = any new post (including drafts) in the selected
                  range.
                </p>
              </CardHeader>
              <CardContent className="h-[280px]">
                {(blog?.uploadsByDate ?? []).every((d) => d.published === 0 && d.created === 0) ? (
                  <EmptyState message="No posts created or published in this range" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(blog?.uploadsByDate ?? []).map((d) => ({
                        ...d,
                        label: formatChartDay(d.date),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={16} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                      <RechartsTooltip />
                      <Bar dataKey="published" name="Published" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="created" name="Created" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Last 10 days — upload cadence</CardTitle>
                <p className="text-xs text-muted-foreground">
                  How consistently content is shipping day by day.
                </p>
              </CardHeader>
              <CardContent className="h-[280px]">
                {(blog?.last10Days.uploadsByDate ?? []).every(
                  (d) => d.published === 0 && d.created === 0,
                ) ? (
                  <EmptyState message="No posts in the last 10 days" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(blog?.last10Days.uploadsByDate ?? []).map((d) => ({
                        ...d,
                        label: formatChartDay(d.date),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={12} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                      <RechartsTooltip />
                      <Bar dataKey="published" name="Published" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="created" name="Created" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Author performance
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Track your blog employee: posts published, reach, engagement, and bookings assisted.
              </p>
            </CardHeader>
            <CardContent>
              <DataTable
                headers={[
                  'Author',
                  'Posts',
                  'Views',
                  'Readers',
                  'Comments',
                  'CTAs',
                  'Assisted bookings',
                ]}
                rows={(blog?.authors ?? []).map((row) => [
                  <span key="a" className="font-medium">
                    {row.authorName}
                  </span>,
                  formatNumber(row.posts),
                  formatNumber(row.views),
                  formatNumber(row.readers),
                  formatNumber(row.comments),
                  formatNumber(row.ctaClicks),
                  formatNumber(row.assistedBookings),
                ])}
                empty="No author activity yet — publish posts and set the Author field"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Post performance</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                headers={[
                  'Post',
                  'Author',
                  'Views',
                  'Readers',
                  'Avg read %',
                  'Comments',
                  'CTAs',
                  'Assisted bookings',
                ]}
                rows={(blog?.posts ?? []).map((row) => [
                  <Link
                    key="s"
                    href={`/blog/${row.slug}`}
                    className="font-medium hover:underline"
                    target="_blank"
                  >
                    {row.slug}
                  </Link>,
                  row.authorName ?? '—',
                  formatNumber(row.views),
                  formatNumber(row.readers),
                  `${Math.round(row.avgReadDepth)}%`,
                  formatNumber(row.comments),
                  formatNumber(row.ctaClicks),
                  formatNumber(row.assistedBookings),
                ])}
                empty="No blog views recorded yet"
              />
            </CardContent>
          </Card>

          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            <TrendingUp className="mr-1.5 inline h-3.5 w-3.5" />
            Assisted bookings = sessions that viewed the post and later completed a booking. Use this
            to decide which topics and authors drive revenue, not just traffic.
          </div>
        </TabsContent>
      </Tabs>

      <Sheet
        open={Boolean(selectedBooking)}
        onOpenChange={(open) => {
          if (!open) setSelectedBooking(null)
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selectedBooking ? (
            <>
              <SheetHeader>
                <SheetTitle>{selectedBooking.detail?.guestName ?? 'Booking'}</SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  {selectedBooking.bookingReference}
                </SheetDescription>
              </SheetHeader>
              <dl className="mt-6 space-y-3 text-sm">
                <DetailRow
                  label="Property"
                  value={
                    selectedBooking.detail?.propertyName ??
                    selectedBooking.propertySlug ??
                    '—'
                  }
                />
                <DetailRow
                  label="Stay"
                  value={`${formatStayDate(selectedBooking.detail?.checkIn)} → ${formatStayDate(selectedBooking.detail?.checkOut)}`}
                />
                <DetailRow
                  label="Nights / rooms"
                  value={
                    selectedBooking.detail
                      ? `${selectedBooking.detail.nights} night(s) · ${selectedBooking.detail.rooms} room(s)`
                      : '—'
                  }
                />
                <DetailRow
                  label="Room type(s)"
                  value={selectedBooking.detail?.roomTypes || '—'}
                />
                <DetailRow
                  label="Avg tariff / night"
                  value={
                    selectedBooking.detail?.avgTariff != null
                      ? formatMoney(selectedBooking.detail.avgTariff)
                      : '—'
                  }
                />
                <DetailRow
                  label="Total / paid"
                  value={
                    selectedBooking.detail
                      ? `${formatMoney(selectedBooking.detail.totalAmount)} / ${formatMoney(selectedBooking.detail.totalPaid)}`
                      : formatMoney(selectedBooking.analyticsAmount ?? 0)
                  }
                />
                <DetailRow
                  label="Created (PMS)"
                  value={formatDateTime(selectedBooking.detail?.createdAt)}
                />
                <DetailRow
                  label="Converted (analytics)"
                  value={formatDateTime(selectedBooking.convertedAt)}
                />
                <DetailRow
                  label="Channel / campaign"
                  value={`${friendlyChannel(selectedBooking.channel)}${selectedBooking.utmCampaign ? ` · ${selectedBooking.utmCampaign}` : ''}`}
                />
                <DetailRow
                  label="PMS source"
                  value={selectedBooking.detail?.source ?? '—'}
                />
                {selectedBooking.detailError ? (
                  <DetailRow label="PMS note" value={selectedBooking.detailError} />
                ) : null}
              </dl>
              <div className="mt-6">
                <Link
                  href={`/internal/analytics/sessions/${selectedBooking.sessionId}`}
                  className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Open analytics session →
                </Link>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/40 pb-2">
      <dt className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  )
}
