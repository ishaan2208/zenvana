// src/app/internal/analytics/Dashboard.tsx
'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import Link from 'next/link'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  ChevronRight,
  CircleDot,
  Download,
  ExternalLink,
  Filter,
  Globe,
  Layers,
  Minus,
  MousePointerClick,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Waypoints,
  X,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import type {
  DashboardFilters,
  DashboardRange,
  DashboardSummary,
  FunnelStep,
  RecentEventRow,
  TimeSeriesPoint,
  TopProperty,
  UtmRow,
} from '@/lib/analytics/queries'

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type Loaders = {
  summary: (range: DashboardRange, filters?: DashboardFilters) => Promise<DashboardSummary>
  funnel: (range: DashboardRange, filters?: DashboardFilters) => Promise<FunnelStep[]>
  timeSeries: (range: DashboardRange, filters?: DashboardFilters) => Promise<TimeSeriesPoint[]>
  topProperties: (range: DashboardRange, filters?: DashboardFilters) => Promise<TopProperty[]>
  utm: (range: DashboardRange, filters?: DashboardFilters) => Promise<UtmRow[]>
  recent: (range: DashboardRange, filters?: DashboardFilters, limit?: number) => Promise<RecentEventRow[]>
}

type KpiKey = 'sessions' | 'bookings' | 'conversion' | 'events'
type TrendDir = 'up' | 'down' | 'flat'
type Trend = { pct: number; dir: TrendDir }

/* -------------------------------------------------------------------------- */
/*  Design tokens                                                             */
/* -------------------------------------------------------------------------- */

const C = {
  sapphire: '#4f6bed',
  indigo: '#6366f1',
  emerald: '#10b981',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  rose: '#f43f5e',
} as const

const FUNNEL_COLORS = ['#312e81', '#4338ca', '#4f6bed', '#6366f1', '#10b981']

const RANGE_OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
]

/* -------------------------------------------------------------------------- */
/*  Formatting + math helpers                                                 */
/* -------------------------------------------------------------------------- */

const nfIN = new Intl.NumberFormat('en-IN')
const nfCompact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })

function formatNumber(value: number): string {
  return nfIN.format(value)
}
function formatCompact(value: number): string {
  return nfCompact.format(value)
}
function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}
function prettifyEventName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const min = Math.round(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  return `${day}d ago`
}
function trendOf(values: number[]): Trend {
  if (values.length < 2) return { pct: 0, dir: 'flat' }
  const mid = Math.floor(values.length / 2)
  const first = values.slice(0, mid).reduce((a, b) => a + b, 0)
  const last = values.slice(mid).reduce((a, b) => a + b, 0)
  if (first === 0) return { pct: last > 0 ? 1 : 0, dir: last > 0 ? 'up' : 'flat' }
  const pct = (last - first) / first
  const dir: TrendDir = Math.abs(pct) < 0.01 ? 'flat' : pct > 0 ? 'up' : 'down'
  return { pct, dir }
}
function groupCount<T>(items: T[], key: (t: T) => string | null | undefined): [string, number][] {
  const m = new Map<string, number>()
  for (const it of items) {
    const k = key(it) ?? '—'
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}
function distinct<T>(items: T[], key: (t: T) => string | null | undefined): number {
  const s = new Set<string>()
  for (const it of items) {
    const k = key(it)
    if (k) s.add(k)
  }
  return s.size
}
function toCsv(rows: RecentEventRow[]): string {
  const head = ['occurredAt', 'name', 'propertySlug', 'source', 'utmSource', 'sessionId', 'id']
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [head.join(',')]
  for (const r of rows) {
    lines.push([r.occurredAt, r.name, r.propertySlug, r.source, r.utmSource, r.sessionId, r.id].map(esc).join(','))
  }
  return lines.join('\n')
}

/* -------------------------------------------------------------------------- */
/*  Primitive UI pieces                                                       */
/* -------------------------------------------------------------------------- */

function TrendChip({ trend, invert = false }: { trend: Trend; invert?: boolean }) {
  if (trend.dir === 'flat') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        <Minus className="h-3 w-3" />
        flat
      </span>
    )
  }
  const good = invert ? trend.dir === 'down' : trend.dir === 'up'
  const Icon = trend.dir === 'up' ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${good
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
        }`}
    >
      <Icon className="h-3 w-3" />
      {formatPct(Math.abs(trend.pct))}
    </span>
  )
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const chart = data.map((v, i) => ({ i, v }))
  const id = useMemo(() => `spark-${Math.random().toString(36).slice(2, 8)}`, [])
  if (data.length < 2) return <div className="h-10" />
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chart} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} fill={`url(#${id})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function ShareBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{children}</p>
  )
}

function DetailRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-right text-sm font-medium ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string; dataKey?: string }[]
  label?: string | number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background/95 px-3 py-2 shadow-xl backdrop-blur">
      {label !== undefined ? (
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      ) : null}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="capitalize text-muted-foreground">{p.dataKey ?? p.name}</span>
          <span className="ml-auto font-semibold tabular-nums">{formatNumber(Number(p.value ?? 0))}</span>
        </div>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Skeletons                                                                 */
/* -------------------------------------------------------------------------- */

function Block({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-3 py-5">
              <Block className="h-3 w-20" />
              <Block className="h-8 w-24" />
              <Block className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardContent className="py-6"><Block className="h-[280px] w-full" /></CardContent></Card>
        <Card><CardContent className="py-6"><Block className="h-[280px] w-full" /></CardContent></Card>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                            */
/* -------------------------------------------------------------------------- */

export function Dashboard({ loaders }: { loaders: Loaders }) {
  const [range, setRange] = useState<DashboardRange>('30d')
  const [refreshKey, setRefreshKey] = useState(0)
  const [propertyFilter, setPropertyFilter] = useState<string>('all')
  const [utmFilter, setUtmFilter] = useState<string>('all')

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [funnel, setFunnel] = useState<FunnelStep[]>([])
  const [series, setSeries] = useState<TimeSeriesPoint[]>([])
  const [topProperties, setTopProperties] = useState<TopProperty[]>([])
  const [utm, setUtm] = useState<UtmRow[]>([])
  const [recent, setRecent] = useState<RecentEventRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [loading, startTransition] = useTransition()
  const hasData = summary !== null
  const filters = useMemo<DashboardFilters>(
    () => ({
      propertySlug: propertyFilter === 'all' ? null : propertyFilter,
      utmSource: utmFilter === 'all' ? null : utmFilter,
    }),
    [propertyFilter, utmFilter],
  )

  // Drilldown state
  const [activeKpi, setActiveKpi] = useState<KpiKey | null>(null)
  const [activeProperty, setActiveProperty] = useState<string | null>(null)
  const [activeUtm, setActiveUtm] = useState<string | null>(null)
  const [activeEvent, setActiveEvent] = useState<RecentEventRow | null>(null)
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<FunnelStep | null>(null)

  // keep loaders stable across internal re-renders
  const loadersRef = useRef(loaders)
  loadersRef.current = loaders

  useEffect(() => {
    startTransition(async () => {
      try {
        setError(null)
        const L = loadersRef.current
        const [s, f, t, p, u, r] = await Promise.all([
          L.summary(range, filters),
          L.funnel(range, filters),
          L.timeSeries(range, filters),
          L.topProperties(range, filters),
          L.utm(range, filters),
          L.recent(range, filters, 100),
        ])
        setSummary(s)
        setFunnel(f)
        setSeries(t)
        setTopProperties(p)
        setUtm(u)
        setRecent(r)
        setUpdatedAt(new Date())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      }
    })
  }, [range, refreshKey, filters])

  const exportCsv = useCallback(() => {
    const blob = new Blob([toCsv(recent)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zenvana-events-${range}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [recent, range])

  // derived series
  const sessionsSeries = useMemo(() => series.map((p) => p.sessions), [series])
  const bookingsSeries = useMemo(() => series.map((p) => p.bookings), [series])
  const convSeries = useMemo(
    () => series.map((p) => (p.sessions > 0 ? p.bookings / p.sessions : 0)),
    [series],
  )
  const eventMix = useMemo(() => groupCount(recent, (e) => e.name).slice(0, 3), [recent])
  const propertyOptions = useMemo(
    () =>
      topProperties
        .map((row) => row.propertySlug)
        .filter((value, idx, arr) => arr.indexOf(value) === idx),
    [topProperties],
  )
  const utmOptions = useMemo(
    () =>
      utm
        .map((row) => row.utmSource)
        .filter((value, idx, arr) => arr.indexOf(value) === idx),
    [utm],
  )

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Tabs value={range} onValueChange={(v) => setRange(v as DashboardRange)}>
            <TabsList className="h-9">
              {RANGE_OPTIONS.map((o) => (
                <TabsTrigger key={o.value} value={o.value} className="px-3 text-xs font-semibold">
                  {o.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {loading ? 'Syncing…' : updatedAt ? `Updated ${relativeTime(updatedAt.toISOString())}` : 'Live'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue placeholder="Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All properties</SelectItem>
              {propertyOptions.map((slug) => (
                <SelectItem key={slug} value={slug}>
                  {slug.replace(/-/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={utmFilter} onValueChange={setUtmFilter}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue placeholder="UTM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All UTM</SelectItem>
              {utmOptions.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!recent.length}>
            <Download className="mr-1.5 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-rose-500/30">
          <CardContent className="flex items-center gap-2 py-4 text-sm text-rose-600 dark:text-rose-400">
            <X className="h-4 w-4" /> {error}
          </CardContent>
        </Card>
      ) : null}

      {!hasData && loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard
              index={0}
              icon={<Users className="h-4 w-4" />}
              label="Sessions"
              value={summary ? formatNumber(summary.sessions) : '–'}
              trend={trendOf(sessionsSeries)}
              accent={C.sapphire}
              onClick={() => setActiveKpi('sessions')}
              visual={<Sparkline data={sessionsSeries} color={C.sapphire} />}
            />
            <KpiCard
              index={1}
              icon={<Sparkles className="h-4 w-4" />}
              label="Bookings"
              hint="server-confirmed"
              value={summary ? formatNumber(summary.bookings) : '–'}
              trend={trendOf(bookingsSeries)}
              accent={C.emerald}
              onClick={() => setActiveKpi('bookings')}
              visual={<Sparkline data={bookingsSeries} color={C.emerald} />}
            />
            <KpiCard
              index={2}
              icon={<TrendingUp className="h-4 w-4" />}
              label="Conversion"
              value={summary ? formatPct(summary.conversionRate) : '–'}
              trend={trendOf(convSeries)}
              accent={C.amber}
              onClick={() => setActiveKpi('conversion')}
              visual={<Sparkline data={convSeries} color={C.amber} />}
            />
            <KpiCard
              index={3}
              icon={<MousePointerClick className="h-4 w-4" />}
              label="Events / session"
              value={summary ? summary.avgEventsPerSession.toFixed(1) : '–'}
              accent={C.violet}
              onClick={() => setActiveKpi('events')}
              visual={
                <div className="space-y-1.5 pt-1">
                  {eventMix.length ? (
                    eventMix.map(([name, count]) => (
                      <div key={name} className="flex items-center gap-2">
                        <span className="w-20 shrink-0 truncate text-[11px] text-muted-foreground">
                          {prettifyEventName(name)}
                        </span>
                        <ShareBar value={count} max={eventMix[0][1]} color={C.violet} />
                      </div>
                    ))
                  ) : (
                    <div className="h-10" />
                  )}
                </div>
              }
            />
          </div>

          {/* Row: funnel + time series */}
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Waypoints className="h-4 w-4 text-muted-foreground" />
                  Booking funnel
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">tap a stage</Badge>
              </CardHeader>
              <CardContent>
                <FunnelChart funnel={funnel} onPick={setActiveStep} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Sessions vs bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TimeSeriesChart series={series} />
              </CardContent>
            </Card>
          </div>

          {/* Row: top properties + utm */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Top properties
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">by bookings</Badge>
              </CardHeader>
              <CardContent>
                <TopPropertiesChart rows={topProperties} onPick={setActiveProperty} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  UTM sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UtmPanel rows={utm} onPick={setActiveUtm} />
              </CardContent>
            </Card>
          </div>

          {/* Recent events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4 text-muted-foreground" />
                Recent events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecentEventsTable rows={recent} onPick={setActiveEvent} />
            </CardContent>
          </Card>
        </>
      )}

      {/* ----------------------------- Drilldowns ----------------------------- */}

      <KpiSheet
        kpi={activeKpi}
        onClose={() => setActiveKpi(null)}
        summary={summary}
        series={series}
        utm={utm}
        topProperties={topProperties}
        recent={recent}
      />

      <PropertySheet
        slug={activeProperty}
        onClose={() => setActiveProperty(null)}
        topProperties={topProperties}
        recent={recent}
        onPickEvent={(e) => setActiveEvent(e)}
      />

      <UtmSheet
        source={activeUtm}
        onClose={() => setActiveUtm(null)}
        utm={utm}
        recent={recent}
        onPickEvent={(e) => setActiveEvent(e)}
      />

      <EventSheet
        event={activeEvent}
        onClose={() => setActiveEvent(null)}
        recent={recent}
        onOpenSession={(sid) => setActiveSession(sid)}
      />

      <SessionSheet
        sessionId={activeSession}
        onClose={() => setActiveSession(null)}
        recent={recent}
        onPickEvent={(e) => setActiveEvent(e)}
      />

      <FunnelDrawer step={activeStep} funnel={funnel} onClose={() => setActiveStep(null)} recent={recent} />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  KPI card                                                                  */
/* -------------------------------------------------------------------------- */

function KpiCard({
  index,
  icon,
  label,
  hint,
  value,
  trend,
  accent,
  visual,
  onClick,
}: {
  index: number
  icon: React.ReactNode
  label: string
  hint?: string
  value: string
  trend?: Trend
  accent: string
  visual: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${index * 60}ms` }}
      className="group relative animate-in fade-in-50 slide-in-from-bottom-2 text-left duration-500 fill-mode-both"
    >
      <Card className="relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
        <span
          className="absolute inset-x-0 top-0 h-0.5 opacity-70 transition-opacity group-hover:opacity-100"
          style={{ backgroundColor: accent }}
        />
        <CardContent className="py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="grid h-7 w-7 place-items-center rounded-md" style={{ backgroundColor: `${accent}1a`, color: accent }}>
                {icon}
              </span>
              <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
          </div>

          <div className="mt-3 flex items-end justify-between gap-2">
            <p className="text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
            {trend ? <TrendChip trend={trend} invert={false} /> : null}
          </div>
          {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}

          <div className="mt-3">{visual}</div>
        </CardContent>
      </Card>
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*  Charts                                                                    */
/* -------------------------------------------------------------------------- */

function FunnelChart({ funnel, onPick }: { funnel: FunnelStep[]; onPick: (s: FunnelStep) => void }) {
  if (!funnel.length) return <EmptyHint>No funnel data yet.</EmptyHint>
  const top = funnel[0]?.sessions || 1
  const data = funnel.map((step, i) => ({
    step: prettifyEventName(step.name),
    sessions: step.sessions,
    fromTop: top > 0 ? step.sessions / top : 0,
    drop: i === 0 ? 0 : step.dropFromPrev,
    fill: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
    raw: step,
  }))
  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/60" />
          <XAxis type="number" allowDecimals={false} hide />
          <YAxis dataKey="step" type="category" width={120} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Bar
            dataKey="sessions"
            radius={[0, 6, 6, 0]}
            cursor="pointer"
            onClick={(d: any) => {
              const s = (d?.raw ?? d?.payload?.raw) as FunnelStep | undefined
              if (s) onPick(s)
            }}
          >
            {data.map((row, i) => (
              <Cell key={i} fill={row.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="space-y-1.5">
        {data.map((row, i) => (
          <button
            key={row.step}
            onClick={() => onPick(row.raw)}
            className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-xs transition-colors hover:bg-muted"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.fill }} />
              {row.step}
            </span>
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="tabular-nums">{formatNumber(row.sessions)}</span>
              <span className="tabular-nums">({formatPct(row.fromTop)})</span>
              {i > 0 && row.drop > 0 ? (
                <span className="rounded bg-rose-500/10 px-1 text-[10px] font-semibold text-rose-500">
                  −{formatPct(row.drop)}
                </span>
              ) : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function TimeSeriesChart({ series }: { series: TimeSeriesPoint[] }) {
  if (!series.length) return <EmptyHint>No time-series data yet.</EmptyHint>
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: C.sapphire }} /> Sessions
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: C.emerald }} /> Bookings
        </span>
      </div>
      <ResponsiveContainer width="100%" height={232}>
        <LineChart data={series} margin={{ left: -16, right: 8, top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
          <RechartsTooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
          <Line type="monotone" dataKey="sessions" stroke={C.sapphire} strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="bookings" stroke={C.emerald} strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function TopPropertiesChart({ rows, onPick }: { rows: TopProperty[]; onPick: (slug: string) => void }) {
  if (!rows.length) return <EmptyHint>No bookings yet.</EmptyHint>
  const max = Math.max(...rows.map((r) => r.bookings), 1)
  return (
    <div className="space-y-2.5">
      {rows.map((row, i) => (
        <button
          key={row.propertySlug}
          onClick={() => onPick(row.propertySlug)}
          style={{ animationDelay: `${i * 40}ms` }}
          className="group flex w-full animate-in fade-in-50 items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors duration-300 hover:bg-muted fill-mode-both"
        >
          <span className="w-32 shrink-0 truncate text-sm font-medium capitalize">
            {row.propertySlug.replace(/-/g, ' ')}
          </span>
          <div className="flex-1">
            <ShareBar value={row.bookings} max={max} color={C.emerald} />
          </div>
          <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums">{formatNumber(row.bookings)}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
        </button>
      ))}
    </div>
  )
}

function UtmPanel({ rows, onPick }: { rows: UtmRow[]; onPick: (source: string) => void }) {
  if (!rows.length) return <EmptyHint>No traffic yet.</EmptyHint>
  const maxSessions = Math.max(...rows.map((r) => r.sessions), 1)
  return (
    <div className="overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Source</span>
        <span className="text-right">Sessions</span>
        <span className="text-right">Bookings</span>
        <span className="text-right">Conv</span>
      </div>
      <div className="space-y-0.5">
        {rows.map((row) => (
          <button
            key={row.utmSource}
            onClick={() => onPick(row.utmSource)}
            className="grid w-full grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{row.utmSource}</span>
              <span className="mt-1 block">
                <ShareBar value={row.sessions} max={maxSessions} color={C.sapphire} />
              </span>
            </span>
            <span className="text-right tabular-nums">{formatNumber(row.sessions)}</span>
            <span className="text-right tabular-nums">{formatNumber(row.bookings)}</span>
            <span className="text-right">
              <Badge variant="secondary" className="tabular-nums">{formatPct(row.conversionRate)}</Badge>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Recent events table                                                       */
/* -------------------------------------------------------------------------- */

function RecentEventsTable({ rows, onPick }: { rows: RecentEventRow[]; onPick: (e: RecentEventRow) => void }) {
  const [query, setQuery] = useState('')
  const [nameFilter, setNameFilter] = useState<string>('all')

  const names = useMemo(() => groupCount(rows, (r) => r.name).map(([n]) => n), [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (nameFilter !== 'all' && r.name !== nameFilter) return false
      if (!q) return true
      return [r.name, r.propertySlug, r.source, r.utmSource, r.sessionId]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [rows, query, nameFilter])

  if (!rows.length) return <EmptyHint>No events yet.</EmptyHint>

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search property, source, session…"
            className="h-9 pl-8"
          />
        </div>
        <Select value={nameFilter} onValueChange={setNameFilter}>
          <SelectTrigger className="h-9 w-44">
            <Filter className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            {names.map((n) => (
              <SelectItem key={n} value={n}>{prettifyEventName(n)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground tabular-nums">{filtered.length} of {rows.length}</span>
      </div>

      <ScrollArea className="h-[360px] rounded-md border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2.5 font-semibold">When</th>
              <th className="px-3 py-2.5 font-semibold">Event</th>
              <th className="px-3 py-2.5 font-semibold">Property</th>
              <th className="px-3 py-2.5 font-semibold">Source</th>
              <th className="px-3 py-2.5 font-semibold">UTM</th>
              <th className="px-3 py-2.5 text-right font-semibold">Session</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                onClick={() => onPick(row)}
                className="cursor-pointer border-t transition-colors hover:bg-muted/60"
              >
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground" title={new Date(row.occurredAt).toLocaleString()}>
                  {relativeTime(row.occurredAt)}
                </td>
                <td className="px-3 py-2.5">
                  <span className="font-medium">{prettifyEventName(row.name)}</span>
                </td>
                <td className="px-3 py-2.5 capitalize text-muted-foreground">{row.propertySlug?.replace(/-/g, ' ') ?? '—'}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{row.source}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{row.utmSource ?? '—'}</td>
                <td className="px-3 py-2.5 text-right">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{row.sessionId.slice(0, 8)}…</code>
                </td>
              </tr>
            ))}
            {!filtered.length ? (
              <tr>
                <td colSpan={6}><EmptyHint>Nothing matches that filter.</EmptyHint></td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Drilldown — KPI Sheet                                                     */
/* -------------------------------------------------------------------------- */

const KPI_META: Record<KpiKey, { title: string; accent: string; line: 'sessions' | 'bookings' | 'conv' }> = {
  sessions: { title: 'Sessions', accent: C.sapphire, line: 'sessions' },
  bookings: { title: 'Bookings', accent: C.emerald, line: 'bookings' },
  conversion: { title: 'Conversion rate', accent: C.amber, line: 'conv' },
  events: { title: 'Events per session', accent: C.violet, line: 'sessions' },
}

function KpiSheet({
  kpi,
  onClose,
  summary,
  series,
  utm,
  topProperties,
  recent,
}: {
  kpi: KpiKey | null
  onClose: () => void
  summary: DashboardSummary | null
  series: TimeSeriesPoint[]
  utm: UtmRow[]
  topProperties: TopProperty[]
  recent: RecentEventRow[]
}) {
  const meta = kpi ? KPI_META[kpi] : null
  const lineData = useMemo(
    () => series.map((p) => ({ date: p.date, value: meta?.line === 'bookings' ? p.bookings : meta?.line === 'conv' ? (p.sessions ? p.bookings / p.sessions : 0) : p.sessions })),
    [series, meta],
  )
  const eventCounts = useMemo(() => groupCount(recent, (e) => e.name), [recent])

  return (
    <Sheet open={!!kpi} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {meta ? (
          <>
            <SheetHeader className="space-y-1">
              <SheetTitle className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.accent }} />
                {meta.title}
              </SheetTitle>
              <SheetDescription>Breakdown for the selected range.</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <div className="rounded-lg border p-4">
                <p className="text-3xl font-semibold tabular-nums">
                  {kpi === 'conversion' && summary ? formatPct(summary.conversionRate)
                    : kpi === 'events' && summary ? summary.avgEventsPerSession.toFixed(1)
                      : kpi === 'bookings' && summary ? formatNumber(summary.bookings)
                        : summary ? formatNumber(summary.sessions) : '–'}
                </p>
                <div className="mt-3 h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={lineData} margin={{ left: -24, right: 4 }}>
                      <defs>
                        <linearGradient id="kpiGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={meta.accent} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={meta.accent} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Area type="monotone" dataKey="value" stroke={meta.accent} strokeWidth={2} fill="url(#kpiGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {kpi === 'events' ? (
                <div>
                  <SectionLabel>Event distribution (last 100)</SectionLabel>
                  <div className="mt-3 space-y-2">
                    {eventCounts.map(([name, count]) => (
                      <div key={name} className="flex items-center gap-3">
                        <span className="w-40 shrink-0 truncate text-sm">{prettifyEventName(name)}</span>
                        <ShareBar value={count} max={eventCounts[0][1]} color={C.violet} />
                        <span className="w-8 text-right text-sm tabular-nums text-muted-foreground">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <SectionLabel>By UTM source</SectionLabel>
                  <div className="mt-3 space-y-1">
                    {utm.length ? utm.map((u) => (
                      <div key={u.utmSource} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                        <span className="font-medium">{u.utmSource}</span>
                        <span className="flex items-center gap-3 text-muted-foreground tabular-nums">
                          <span>{formatNumber(kpi === 'bookings' ? u.bookings : u.sessions)}</span>
                          {kpi === 'conversion' ? <Badge variant="secondary">{formatPct(u.conversionRate)}</Badge> : null}
                        </span>
                      </div>
                    )) : <EmptyHint>No source data.</EmptyHint>}
                  </div>
                </div>
              )}

              {kpi === 'bookings' ? (
                <div>
                  <SectionLabel>By property</SectionLabel>
                  <div className="mt-3 space-y-1">
                    {topProperties.map((p) => (
                      <div key={p.propertySlug} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                        <span className="font-medium capitalize">{p.propertySlug.replace(/-/g, ' ')}</span>
                        <span className="tabular-nums text-muted-foreground">{formatNumber(p.bookings)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

/* -------------------------------------------------------------------------- */
/*  Drilldown — Property Sheet                                                */
/* -------------------------------------------------------------------------- */

function PropertySheet({
  slug,
  onClose,
  topProperties,
  recent,
  onPickEvent,
}: {
  slug: string | null
  onClose: () => void
  topProperties: TopProperty[]
  recent: RecentEventRow[]
  onPickEvent: (e: RecentEventRow) => void
}) {
  const events = useMemo(() => recent.filter((e) => e.propertySlug === slug), [recent, slug])
  const bookings = topProperties.find((p) => p.propertySlug === slug)?.bookings ?? 0
  const totalBookings = topProperties.reduce((a, b) => a + b.bookings, 0)
  const sources = useMemo(() => groupCount(events, (e) => e.utmSource ?? e.source), [events])

  return (
    <Sheet open={!!slug} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {slug ? (
          <>
            <SheetHeader className="space-y-1">
              <SheetTitle className="flex items-center gap-2 capitalize">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {slug.replace(/-/g, ' ')}
              </SheetTitle>
              <SheetDescription>Property performance & activity.</SheetDescription>
            </SheetHeader>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <StatTile label="Bookings" value={formatNumber(bookings)} sub={totalBookings ? `${formatPct(bookings / totalBookings)} share` : undefined} accent={C.emerald} />
              <StatTile label="Sessions" value={formatNumber(distinct(events, (e) => e.sessionId))} sub="touched" accent={C.sapphire} />
              <StatTile label="Events" value={formatNumber(events.length)} sub={`${distinct(events, (e) => e.name)} types`} accent={C.violet} />
            </div>

            <Separator className="my-6" />

            <SectionLabel>Top sources</SectionLabel>
            <div className="mt-3 space-y-1">
              {sources.length ? sources.slice(0, 6).map(([src, count]) => (
                <div key={src} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 truncate text-muted-foreground">{src}</span>
                  <ShareBar value={count} max={sources[0][1]} color={C.sapphire} />
                  <span className="w-8 text-right tabular-nums text-muted-foreground">{count}</span>
                </div>
              )) : <EmptyHint>No source activity in recent events.</EmptyHint>}
            </div>

            <Separator className="my-6" />

            <SectionLabel>Activity ({events.length})</SectionLabel>
            <EventTimeline events={events} onPickEvent={onPickEvent} />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function StatTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums" style={{ color: accent }}>{value}</p>
      {sub ? <p className="text-[11px] text-muted-foreground">{sub}</p> : null}
    </div>
  )
}

function EventTimeline({ events, onPickEvent }: { events: RecentEventRow[]; onPickEvent: (e: RecentEventRow) => void }) {
  if (!events.length) return <EmptyHint>No recent activity.</EmptyHint>
  const sorted = [...events].sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt))
  return (
    <div className="mt-3 space-y-1">
      {sorted.slice(0, 40).map((e) => (
        <button
          key={e.id}
          onClick={() => onPickEvent(e)}
          className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted"
        >
          <span className="flex items-center gap-2">
            <CircleDot className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="font-medium">{prettifyEventName(e.name)}</span>
          </span>
          <span className="text-xs text-muted-foreground">{relativeTime(e.occurredAt)}</span>
        </button>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Drilldown — UTM Sheet                                                     */
/* -------------------------------------------------------------------------- */

function UtmSheet({
  source,
  onClose,
  utm,
  recent,
  onPickEvent,
}: {
  source: string | null
  onClose: () => void
  utm: UtmRow[]
  recent: RecentEventRow[]
  onPickEvent: (e: RecentEventRow) => void
}) {
  const row = utm.find((u) => u.utmSource === source)
  const events = useMemo(() => recent.filter((e) => (e.utmSource ?? '—') === source), [recent, source])
  const props = useMemo(() => groupCount(events, (e) => e.propertySlug), [events])
  const maxSessions = Math.max(...utm.map((u) => u.sessions), 1)

  return (
    <Sheet open={!!source} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {source ? (
          <>
            <SheetHeader className="space-y-1">
              <SheetTitle className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                {source}
              </SheetTitle>
              <SheetDescription>Acquisition channel breakdown.</SheetDescription>
            </SheetHeader>

            {row ? (
              <>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <StatTile label="Sessions" value={formatNumber(row.sessions)} sub={`${formatPct(row.sessions / maxSessions)} of top`} accent={C.sapphire} />
                  <StatTile label="Bookings" value={formatNumber(row.bookings)} accent={C.emerald} />
                  <StatTile label="Conversion" value={formatPct(row.conversionRate)} accent={C.amber} />
                </div>
                <Separator className="my-6" />
              </>
            ) : null}

            <SectionLabel>Properties driven</SectionLabel>
            <div className="mt-3 space-y-1">
              {props.length ? props.slice(0, 8).map(([p, count]) => (
                <div key={p} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 truncate capitalize text-muted-foreground">{p.replace(/-/g, ' ')}</span>
                  <ShareBar value={count} max={props[0][1]} color={C.emerald} />
                  <span className="w-8 text-right tabular-nums text-muted-foreground">{count}</span>
                </div>
              )) : <EmptyHint>No property activity recorded.</EmptyHint>}
            </div>

            <Separator className="my-6" />
            <SectionLabel>Recent events ({events.length})</SectionLabel>
            <EventTimeline events={events} onPickEvent={onPickEvent} />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

/* -------------------------------------------------------------------------- */
/*  Drilldown — Event Sheet                                                   */
/* -------------------------------------------------------------------------- */

function EventSheet({
  event,
  onClose,
  recent,
  onOpenSession,
}: {
  event: RecentEventRow | null
  onClose: () => void
  recent: RecentEventRow[]
  onOpenSession: (sid: string) => void
}) {
  const siblings = useMemo(
    () => (event ? recent.filter((e) => e.sessionId === event.sessionId && e.id !== event.id) : []),
    [recent, event],
  )

  return (
    <Sheet open={!!event} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {event ? (
          <>
            <SheetHeader className="space-y-2">
              <Badge variant="secondary" className="w-fit">{event.source}</Badge>
              <SheetTitle>{prettifyEventName(event.name)}</SheetTitle>
              <SheetDescription>{new Date(event.occurredAt).toLocaleString()}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 divide-y rounded-lg border px-4">
              <DetailRow label="Event" value={event.name} mono />
              <DetailRow label="Property" value={event.propertySlug ? <span className="capitalize">{event.propertySlug.replace(/-/g, ' ')}</span> : '—'} />
              <DetailRow label="Source" value={event.source} />
              <DetailRow label="UTM source" value={event.utmSource ?? '—'} />
              <DetailRow label="Session" value={`${event.sessionId.slice(0, 12)}…`} mono />
              <DetailRow label="Event ID" value={`${event.id.slice(0, 12)}…`} mono />
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Button variant="secondary" size="sm" onClick={() => onOpenSession(event.sessionId)}>
                <Waypoints className="mr-1.5 h-4 w-4" />
                View session timeline ({siblings.length + 1})
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/internal/analytics/sessions/${event.sessionId}`} prefetch={false}>
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  Open full session page
                </Link>
              </Button>
            </div>

            {siblings.length ? (
              <>
                <Separator className="my-6" />
                <SectionLabel>Same session</SectionLabel>
                <EventTimeline events={siblings} onPickEvent={() => { }} />
              </>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

/* -------------------------------------------------------------------------- */
/*  Drilldown — Session Sheet                                                 */
/* -------------------------------------------------------------------------- */

function SessionSheet({
  sessionId,
  onClose,
  recent,
  onPickEvent,
}: {
  sessionId: string | null
  onClose: () => void
  recent: RecentEventRow[]
  onPickEvent: (e: RecentEventRow) => void
}) {
  const events = useMemo(
    () =>
      (sessionId ? recent.filter((e) => e.sessionId === sessionId) : []).sort(
        (a, b) => +new Date(a.occurredAt) - +new Date(b.occurredAt),
      ),
    [recent, sessionId],
  )
  const first = events[0]
  const converted = events.some((e) => /book|purchase|confirm|payment/i.test(e.name))
  const props = distinct(events, (e) => e.propertySlug)

  return (
    <Sheet open={!!sessionId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {sessionId ? (
          <>
            <SheetHeader className="space-y-1">
              <SheetTitle className="flex items-center gap-2">
                <Waypoints className="h-4 w-4 text-muted-foreground" />
                Session
              </SheetTitle>
              <SheetDescription className="font-mono text-xs">{sessionId}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <StatTile label="Events" value={formatNumber(events.length)} accent={C.violet} />
              <StatTile label="Properties" value={formatNumber(props)} accent={C.sapphire} />
              <StatTile label="Outcome" value={converted ? '✓' : '—'} sub={converted ? 'booked' : 'no booking'} accent={converted ? C.emerald : C.amber} />
            </div>

            {first ? (
              <div className="mt-4 rounded-lg border px-4">
                <DetailRow label="Entry source" value={first.source} />
                <DetailRow label="Entry UTM" value={first.utmSource ?? '—'} />
              </div>
            ) : null}

            <Separator className="my-6" />
            <SectionLabel>Timeline</SectionLabel>
            {events.length ? (
              <ol className="mt-4 space-y-0">
                {events.map((e, i) => (
                  <li key={e.id} className="relative pl-6">
                    <span className="absolute left-1.5 top-1 h-2 w-2 rounded-full bg-primary" />
                    {i < events.length - 1 ? <span className="absolute left-[0.6rem] top-3 h-full w-px bg-border" /> : null}
                    <button
                      onClick={() => onPickEvent(e)}
                      className="mb-3 w-full rounded-md px-2 py-1 text-left transition-colors hover:bg-muted"
                    >
                      <p className="text-sm font-medium">{prettifyEventName(e.name)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(e.occurredAt).toLocaleTimeString()} · {e.propertySlug?.replace(/-/g, ' ') ?? 'no property'}
                      </p>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyHint>No events captured for this session in the recent window.</EmptyHint>
            )}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

/* -------------------------------------------------------------------------- */
/*  Drilldown — Funnel Drawer (bottom)                                        */
/* -------------------------------------------------------------------------- */

function FunnelDrawer({
  step,
  funnel,
  onClose,
  recent,
}: {
  step: FunnelStep | null
  funnel: FunnelStep[]
  onClose: () => void
  recent: RecentEventRow[]
}) {
  const idx = step ? funnel.findIndex((f) => f.name === step.name) : -1
  const top = funnel[0]?.sessions || 1
  const fromTop = step ? step.sessions / top : 0
  const events = useMemo(() => (step ? recent.filter((e) => e.name === step.name) : []), [recent, step])

  return (
    <Drawer open={!!step} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: FUNNEL_COLORS[idx % FUNNEL_COLORS.length] }}
              />
              {step ? prettifyEventName(step.name) : ''}
            </DrawerTitle>
            <DrawerDescription>Funnel stage {idx + 1} of {funnel.length}</DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-8">
            <div className="grid grid-cols-3 gap-3">
              <StatTile label="Sessions" value={step ? formatNumber(step.sessions) : '–'} accent={C.sapphire} />
              <StatTile label="From entry" value={formatPct(fromTop)} sub="of top of funnel" accent={C.indigo} />
              <StatTile
                label="Drop from prev"
                value={step && idx > 0 ? `−${formatPct(step.dropFromPrev)}` : '—'}
                accent={C.rose}
              />
            </div>

            <Separator className="my-5" />

            <SectionLabel>Full funnel</SectionLabel>
            <div className="mt-3 space-y-1.5">
              {funnel.map((f, i) => {
                const pct = top > 0 ? f.sessions / top : 0
                const active = step?.name === f.name
                return (
                  <div
                    key={f.name}
                    className={`flex items-center gap-3 rounded-md px-2 py-1.5 text-sm ${active ? 'bg-muted' : ''}`}
                  >
                    <span className="w-36 shrink-0 truncate">{prettifyEventName(f.name)}</span>
                    <div className="flex-1">
                      <ShareBar value={f.sessions} max={top} color={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                    </div>
                    <span className="w-12 text-right tabular-nums text-muted-foreground">{formatPct(pct)}</span>
                    <span className="w-12 text-right tabular-nums font-medium">{formatCompact(f.sessions)}</span>
                  </div>
                )
              })}
            </div>

            {events.length ? (
              <>
                <Separator className="my-5" />
                <SectionLabel>Recent at this stage ({events.length})</SectionLabel>
                <ScrollArea className="mt-3 h-40 rounded-md border">
                  <div className="divide-y">
                    {events.slice(0, 30).map((e) => (
                      <div key={e.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="capitalize text-muted-foreground">{e.propertySlug?.replace(/-/g, ' ') ?? '—'}</span>
                        <span className="text-xs text-muted-foreground">{relativeTime(e.occurredAt)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : null}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}