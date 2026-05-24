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
  CartesianGrid,
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
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Compass,
  Download,
  ExternalLink,
  Filter,
  Flame,
  Globe,
  Info,
  Layers,
  Lightbulb,
  Minus,
  MousePointerClick,
  RefreshCw,
  Search,
  Sparkles,
  TrendingDown,
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
  ActiveUsersSnapshot,
  DashboardFilters,
  DashboardRange,
  DashboardSummary,
  FunnelStep,
  RecentAuditRow,
  RecentEventRow,
  TimeSeriesPoint,
  TopProperty,
  UtmRow,
} from '@/lib/analytics/queries'

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type Loaders = {
  activeUsers: () => Promise<ActiveUsersSnapshot>
  summary: (range: DashboardRange, filters?: DashboardFilters) => Promise<DashboardSummary>
  funnel: (range: DashboardRange, filters?: DashboardFilters) => Promise<FunnelStep[]>
  timeSeries: (range: DashboardRange, filters?: DashboardFilters) => Promise<TimeSeriesPoint[]>
  topProperties: (range: DashboardRange, filters?: DashboardFilters) => Promise<TopProperty[]>
  utm: (range: DashboardRange, filters?: DashboardFilters) => Promise<UtmRow[]>
  recent: (range: DashboardRange, filters?: DashboardFilters, limit?: number) => Promise<RecentEventRow[]>
  audit: (limit?: number) => Promise<RecentAuditRow[]>
}

type KpiKey = 'visitors' | 'bookings' | 'conversion' | 'engagement'
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

const RANGE_OPTIONS: { value: DashboardRange; label: string; short: string }[] = [
  { value: '7d', label: 'Last 7 days', short: '7D' },
  { value: '30d', label: 'Last 30 days', short: '30D' },
  { value: '90d', label: 'Last 90 days', short: '90D' },
]

/* -------------------------------------------------------------------------- */
/*  Plain-English translators                                                 */
/* -------------------------------------------------------------------------- */

const FUNNEL_LABELS: Record<string, { short: string; long: string }> = {
  property_viewed:       { short: 'Saw a property',       long: 'Visited a property page' },
  dates_selected:        { short: 'Picked dates',         long: 'Picked check-in / check-out dates' },
  availability_checked:  { short: 'Checked availability', long: 'Checked if dates were available' },
  room_selected:         { short: 'Picked a room',        long: 'Chose a specific room or package' },
  checkout_viewed:       { short: 'Opened checkout',      long: 'Reached the checkout page' },
  payment_initiated:     { short: 'Started payment',      long: 'Started the payment flow' },
  booking_completed:     { short: 'Booked!',              long: 'Completed the booking' },
}

const EVENT_LABELS: Record<string, string> = {
  page_viewed:          'Viewed a page',
  property_viewed:      'Looked at a property',
  dates_selected:       'Picked their dates',
  availability_checked: 'Checked availability',
  room_selected:        'Picked a room',
  checkout_viewed:      'Opened checkout',
  coupon_applied:       'Applied a coupon',
  coupon_failed:        'Tried a coupon (failed)',
  payment_initiated:    'Started paying',
  payment_failed:       'Payment failed',
  booking_completed:    'Booked a stay',
  cta_clicked:          'Clicked a button',
}

function friendlyFunnelStep(name: string, short = false): string {
  const m = FUNNEL_LABELS[name]
  if (m) return short ? m.short : m.long
  return prettifyEventName(name)
}

function friendlyEvent(name: string): string {
  return EVENT_LABELS[name] ?? prettifyEventName(name)
}

function friendlySource(raw: string | null | undefined): string {
  if (!raw) return 'Direct visit'
  const v = raw.toLowerCase()
  if (v === 'direct') return 'Direct visit'
  if (v.includes('google')) return 'Google Search'
  if (v.includes('bing')) return 'Bing Search'
  if (v.includes('duckduckgo')) return 'DuckDuckGo'
  if (v === 'fb' || v.includes('facebook')) return 'Facebook'
  if (v === 'ig' || v.includes('instagram')) return 'Instagram'
  if (v === 'x' || v.includes('twitter')) return 'Twitter / X'
  if (v.includes('linkedin')) return 'LinkedIn'
  if (v.includes('youtube')) return 'YouTube'
  if (v.includes('whatsapp')) return 'WhatsApp'
  if (v.includes('email') || v.includes('newsletter')) return 'Email / Newsletter'
  if (v.includes('referral')) return 'Other websites'
  // Title-case fallback
  return raw.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function friendlyProperty(slug: string | null | undefined): string {
  if (!slug) return 'Unknown property'
  return slug.replace(/-/g, ' ')
}

/* -------------------------------------------------------------------------- */
/*  Formatting + math helpers                                                 */
/* -------------------------------------------------------------------------- */

const nfIN = new Intl.NumberFormat('en-IN')
const nfCompact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })

function formatNumber(value: number): string { return nfIN.format(value) }
function formatCompact(value: number): string { return nfCompact.format(value) }
function formatPct(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '0%'
  return `${(value * 100).toFixed(digits)}%`
}
function prettifyEventName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const min = Math.round(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} hr ago`
  const day = Math.round(hr / 24)
  return `${day} day${day === 1 ? '' : 's'} ago`
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
function oneInN(rate: number): string {
  if (rate <= 0 || !Number.isFinite(rate)) return '—'
  const n = Math.round(1 / rate)
  return n <= 1 ? 'almost every visitor' : `1 in ${formatNumber(n)} visitors`
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
        steady
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
      {formatPct(Math.abs(trend.pct), 0)}
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
  renameMap,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string; dataKey?: string }[]
  label?: string | number
  renameMap?: Record<string, string>
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background/95 px-3 py-2 shadow-xl backdrop-blur">
      {label !== undefined ? (
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      ) : null}
      {payload.map((p, i) => {
        const key = p.dataKey ?? p.name ?? ''
        const niceName = renameMap?.[key] ?? key
        return (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="capitalize text-muted-foreground">{niceName}</span>
            <span className="ml-auto font-semibold tabular-nums">{formatNumber(Number(p.value ?? 0))}</span>
          </div>
        )
      })}
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
      <Card><CardContent className="py-6"><Block className="h-20 w-full" /></CardContent></Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardContent className="py-5"><Block className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
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
/*  Insights generator                                                        */
/* -------------------------------------------------------------------------- */

type Insight = {
  kind: 'good' | 'bad' | 'neutral'
  icon: 'leak' | 'star' | 'trend-up' | 'trend-down' | 'flat' | 'tip'
  title: string
  body: string
  cta?: { label: string; onClick: () => void }
}

function biggestFunnelLeak(funnel: FunnelStep[]): { fromIdx: number; toIdx: number; dropPct: number } | null {
  if (funnel.length < 2) return null
  let best = { fromIdx: 0, toIdx: 1, dropPct: 0, lost: 0 }
  for (let i = 1; i < funnel.length; i++) {
    const prev = funnel[i - 1].sessions
    const curr = funnel[i].sessions
    const lost = Math.max(0, prev - curr)
    const drop = prev > 0 ? lost / prev : 0
    // Prefer absolute-lost magnitude weighted by drop %, so we don't flag a 100% drop on tiny tail volumes.
    if (lost * drop > best.lost * best.dropPct || best.lost === 0) {
      best = { fromIdx: i - 1, toIdx: i, dropPct: drop, lost }
    }
  }
  if (best.lost === 0) return null
  return { fromIdx: best.fromIdx, toIdx: best.toIdx, dropPct: best.dropPct }
}

function buildInsights({
  summary,
  funnel,
  utm,
  topProperties,
  series,
  openFunnelStep,
  openUtm,
  openProperty,
}: {
  summary: DashboardSummary | null
  funnel: FunnelStep[]
  utm: UtmRow[]
  topProperties: TopProperty[]
  series: TimeSeriesPoint[]
  openFunnelStep: (s: FunnelStep) => void
  openUtm: (s: string) => void
  openProperty: (s: string) => void
}): Insight[] {
  const out: Insight[] = []

  // 1. Bookings trend (first half vs second half of range)
  const bookingsTrend = trendOf(series.map((p) => p.bookings))
  if (summary && series.length >= 4) {
    if (bookingsTrend.dir === 'up') {
      out.push({
        kind: 'good',
        icon: 'trend-up',
        title: `Bookings up ${formatPct(Math.abs(bookingsTrend.pct), 0)}`,
        body: 'More bookings in the second half of this window than the first. Keep doing what you’re doing.',
      })
    } else if (bookingsTrend.dir === 'down') {
      out.push({
        kind: 'bad',
        icon: 'trend-down',
        title: `Bookings down ${formatPct(Math.abs(bookingsTrend.pct), 0)}`,
        body: 'Fewer bookings recently than earlier in the window. Check your traffic source and funnel below.',
      })
    } else {
      out.push({
        kind: 'neutral',
        icon: 'flat',
        title: 'Bookings are steady',
        body: 'No meaningful change versus earlier in this window.',
      })
    }
  }

  // 2. Biggest funnel leak
  const leak = biggestFunnelLeak(funnel)
  if (leak && leak.dropPct > 0.05) {
    const from = friendlyFunnelStep(funnel[leak.fromIdx].name, true)
    const to = friendlyFunnelStep(funnel[leak.toIdx].name, true)
    out.push({
      kind: 'bad',
      icon: 'leak',
      title: `Biggest drop-off: ${formatPct(leak.dropPct, 0)}`,
      body: `Between "${from}" and "${to}" you lose the most people. Worth investigating.`,
      cta: { label: 'See the step', onClick: () => openFunnelStep(funnel[leak.toIdx]) },
    })
  }

  // 3. Best source by bookings (or by sessions if no bookings)
  const bestByBookings = [...utm].sort((a, b) => b.bookings - a.bookings)[0]
  const bestBySessions = [...utm].sort((a, b) => b.sessions - a.sessions)[0]
  const bestSource = bestByBookings && bestByBookings.bookings > 0 ? bestByBookings : bestBySessions
  if (bestSource) {
    const friendly = friendlySource(bestSource.utmSource)
    out.push({
      kind: 'good',
      icon: 'star',
      title: `Best source: ${friendly}`,
      body: bestSource.bookings > 0
        ? `${formatNumber(bestSource.bookings)} booking${bestSource.bookings === 1 ? '' : 's'} from ${formatNumber(bestSource.sessions)} visitor${bestSource.sessions === 1 ? '' : 's'} (${formatPct(bestSource.conversionRate, 1)} convert).`
        : `${formatNumber(bestSource.sessions)} visitor${bestSource.sessions === 1 ? '' : 's'} but no bookings yet.`,
      cta: { label: 'Open source', onClick: () => openUtm(bestSource.utmSource) },
    })
  }

  // 4. Top property highlight (only if we have room and a clear leader)
  if (out.length < 4 && topProperties.length) {
    const top = topProperties[0]
    if (top.bookings > 0) {
      out.push({
        kind: 'good',
        icon: 'tip',
        title: `Top property: ${friendlyProperty(top.propertySlug)}`,
        body: `${formatNumber(top.bookings)} booking${top.bookings === 1 ? '' : 's'} in this window.`,
        cta: { label: 'See property', onClick: () => openProperty(top.propertySlug) },
      })
    }
  }

  return out.slice(0, 3)
}

function InsightIcon({ kind }: { kind: Insight['icon'] }) {
  const cls = 'h-4 w-4'
  switch (kind) {
    case 'leak': return <TrendingDown className={cls} />
    case 'star': return <Flame className={cls} />
    case 'trend-up': return <TrendingUp className={cls} />
    case 'trend-down': return <TrendingDown className={cls} />
    case 'flat': return <Minus className={cls} />
    case 'tip': return <Lightbulb className={cls} />
  }
}

function InsightCard({ insight }: { insight: Insight }) {
  const palette = {
    good:    { ring: 'ring-emerald-500/20', bg: 'bg-emerald-500/10', fg: 'text-emerald-600 dark:text-emerald-400' },
    bad:     { ring: 'ring-rose-500/20',    bg: 'bg-rose-500/10',    fg: 'text-rose-600 dark:text-rose-400' },
    neutral: { ring: 'ring-border',         bg: 'bg-muted',          fg: 'text-muted-foreground' },
  }[insight.kind]
  return (
    <Card className={`relative overflow-hidden ring-1 ${palette.ring}`}>
      <CardContent className="space-y-2 py-4">
        <div className="flex items-center gap-2">
          <span className={`grid h-7 w-7 place-items-center rounded-md ${palette.bg} ${palette.fg}`}>
            <InsightIcon kind={insight.icon} />
          </span>
          <p className="text-sm font-semibold">{insight.title}</p>
        </div>
        <p className="text-sm text-muted-foreground">{insight.body}</p>
        {insight.cta ? (
          <Button variant="ghost" size="sm" className="-ml-2 h-7 text-xs" onClick={insight.cta.onClick}>
            {insight.cta.label}
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        ) : null}
      </CardContent>
    </Card>
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
  const [activeUsers, setActiveUsers] = useState<ActiveUsersSnapshot | null>(null)
  const [funnel, setFunnel] = useState<FunnelStep[]>([])
  const [series, setSeries] = useState<TimeSeriesPoint[]>([])
  const [topProperties, setTopProperties] = useState<TopProperty[]>([])
  const [utm, setUtm] = useState<UtmRow[]>([])
  const [recent, setRecent] = useState<RecentEventRow[]>([])
  const [recentAudit, setRecentAudit] = useState<RecentAuditRow[]>([])
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
        const [a, s, f, t, p, u, r, ra] = await Promise.all([
          L.activeUsers(),
          L.summary(range, filters),
          L.funnel(range, filters),
          L.timeSeries(range, filters),
          L.topProperties(range, filters),
          L.utm(range, filters),
          L.recent(range, filters, 100),
          L.audit(40),
        ])
        setActiveUsers(a)
        setSummary(s)
        setFunnel(f)
        setSeries(t)
        setTopProperties(p)
        setUtm(u)
        setRecent(r)
        setRecentAudit(ra)
        setUpdatedAt(new Date())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      }
    })
  }, [range, refreshKey, filters])

  useEffect(() => {
    let cancelled = false
    const loadActiveUsers = async () => {
      try {
        const snapshot = await loadersRef.current.activeUsers()
        if (!cancelled) setActiveUsers(snapshot)
      } catch { /* keep existing value */ }
    }
    const intervalId = setInterval(() => { void loadActiveUsers() }, 30_000)
    return () => { cancelled = true; clearInterval(intervalId) }
  }, [])

  const exportCsv = useCallback(() => {
    const blob = new Blob([toCsv(recent)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zenvana-events-${range}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [recent, range])

  // derived
  const sessionsSeries = useMemo(() => series.map((p) => p.sessions), [series])
  const bookingsSeries = useMemo(() => series.map((p) => p.bookings), [series])
  const convSeries = useMemo(
    () => series.map((p) => (p.sessions > 0 ? p.bookings / p.sessions : 0)),
    [series],
  )
  const eventMix = useMemo(() => groupCount(recent, (e) => e.name).slice(0, 3), [recent])
  const propertyOptions = useMemo(
    () => topProperties.map((row) => row.propertySlug).filter((v, i, a) => a.indexOf(v) === i),
    [topProperties],
  )
  const utmOptions = useMemo(
    () => utm.map((row) => row.utmSource).filter((v, i, a) => a.indexOf(v) === i),
    [utm],
  )

  const insights = useMemo(
    () => buildInsights({
      summary, funnel, utm, topProperties, series,
      openFunnelStep: setActiveStep,
      openUtm: setActiveUtm,
      openProperty: setActiveProperty,
    }),
    [summary, funnel, utm, topProperties, series],
  )

  const rangeLabel = RANGE_OPTIONS.find((r) => r.value === range)?.label ?? 'this window'

  return (
    <div className="space-y-6">
      {/* ------------------------------ Toolbar ------------------------------ */}
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
            {loading ? 'Refreshing…' : updatedAt ? `Updated ${relativeTime(updatedAt.toISOString())}` : 'Live'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="h-9 w-44">
              <Building2 className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All properties</SelectItem>
              {propertyOptions.map((slug) => (
                <SelectItem key={slug} value={slug}>
                  <span className="capitalize">{friendlyProperty(slug)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={utmFilter} onValueChange={setUtmFilter}>
            <SelectTrigger className="h-9 w-44">
              <Globe className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {utmOptions.map((source) => (
                <SelectItem key={source} value={source}>
                  {friendlySource(source)}
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
          {/* ---------------------- HEADLINE STORY CARD --------------------- */}
          <HeadlineStory
            summary={summary}
            rangeLabel={rangeLabel}
            activeUsers={activeUsers}
            bookingsTrend={trendOf(bookingsSeries)}
          />

          {/* --------------------------- INSIGHTS --------------------------- */}
          {insights.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {insights.map((i, idx) => <InsightCard key={idx} insight={i} />)}
            </div>
          ) : null}

          {/* ------------------------------ KPIs ----------------------------- */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard
              index={0}
              icon={<Users className="h-4 w-4" />}
              label="Visitors"
              caption="People who visited your site"
              value={summary ? formatNumber(summary.sessions) : '–'}
              trend={trendOf(sessionsSeries)}
              accent={C.sapphire}
              onClick={() => setActiveKpi('visitors')}
              visual={<Sparkline data={sessionsSeries} color={C.sapphire} />}
            />
            <KpiCard
              index={1}
              icon={<Sparkles className="h-4 w-4" />}
              label="Bookings"
              caption="Confirmed by the server"
              value={summary ? formatNumber(summary.bookings) : '–'}
              trend={trendOf(bookingsSeries)}
              accent={C.emerald}
              onClick={() => setActiveKpi('bookings')}
              visual={<Sparkline data={bookingsSeries} color={C.emerald} />}
            />
            <KpiCard
              index={2}
              icon={<TrendingUp className="h-4 w-4" />}
              label="Booking rate"
              caption={summary ? oneInN(summary.conversionRate) : 'Share of visitors who book'}
              value={summary ? formatPct(summary.conversionRate) : '–'}
              trend={trendOf(convSeries)}
              accent={C.amber}
              onClick={() => setActiveKpi('conversion')}
              visual={<Sparkline data={convSeries} color={C.amber} />}
            />
            <KpiCard
              index={3}
              icon={<MousePointerClick className="h-4 w-4" />}
              label="Engagement"
              caption="Actions per visitor"
              value={summary ? summary.avgEventsPerSession.toFixed(1) : '–'}
              accent={C.violet}
              onClick={() => setActiveKpi('engagement')}
              visual={
                <div className="space-y-1.5 pt-1">
                  {eventMix.length ? (
                    eventMix.map(([name, count]) => (
                      <div key={name} className="flex items-center gap-2">
                        <span className="w-24 shrink-0 truncate text-[11px] text-muted-foreground">
                          {friendlyEvent(name)}
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

          {/* ----------------- Funnel + Time series row ----------------- */}
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Waypoints className="h-4 w-4 text-muted-foreground" />
                    The booking journey
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px]">tap a step</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  How many people make it through each step from browsing to booking.
                </p>
              </CardHeader>
              <CardContent>
                <FunnelStory funnel={funnel} onPick={setActiveStep} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Visitors and bookings over time
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Each point is one day. Blue is visitors, green is bookings.
                </p>
              </CardHeader>
              <CardContent>
                <TimeSeriesChart series={series} />
              </CardContent>
            </Card>
          </div>

          {/* ----------------- Properties + Sources row ----------------- */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Which properties are booking
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px]">by bookings</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Top properties by completed bookings.</p>
              </CardHeader>
              <CardContent>
                <TopPropertiesChart rows={topProperties} onPick={setActiveProperty} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Compass className="h-4 w-4 text-muted-foreground" />
                  Where visitors come from
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Visitors, bookings, and how well each source converts.
                </p>
              </CardHeader>
              <CardContent>
                <UtmPanel rows={utm} onPick={setActiveUtm} />
              </CardContent>
            </Card>
          </div>

          {/* ------------------------- Activity feed ------------------------ */}
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4 text-muted-foreground" />
                What people are doing right now
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                A live feed of the latest actions on your site. Click any row to dig in.
              </p>
            </CardHeader>
            <CardContent>
              <RecentEventsTable rows={recent} onPick={setActiveEvent} />
            </CardContent>
          </Card>

          {/* Recent audit events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CircleDot className="h-4 w-4 text-muted-foreground" />
                Recent audit signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecentAuditTable rows={recentAudit} />
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
        rangeLabel={rangeLabel}
        onOpenUtm={setActiveUtm}
        onOpenProperty={setActiveProperty}
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
/*  Headline story — the "one sentence that says it all"                      */
/* -------------------------------------------------------------------------- */

function HeadlineStory({
  summary,
  rangeLabel,
  activeUsers,
  bookingsTrend,
}: {
  summary: DashboardSummary | null
  rangeLabel: string
  activeUsers: ActiveUsersSnapshot | null
  bookingsTrend: Trend
}) {
  return (
    <Card className="relative overflow-hidden">
      <span
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, ${C.sapphire}, ${C.emerald})` }}
      />
      <CardContent className="grid gap-6 py-6 md:grid-cols-[1fr_auto] md:items-center">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            The big picture · {rangeLabel}
          </p>
          {summary ? (
            <p className="text-lg leading-relaxed sm:text-xl">
              <span className="font-semibold">{formatNumber(summary.sessions)}</span>{' '}
              {summary.sessions === 1 ? 'person visited' : 'people visited'} your site.{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatNumber(summary.bookings)}
              </span>{' '}
              {summary.bookings === 1 ? 'booked a stay' : 'booked a stay'} —{' '}
              <span className="font-semibold">{oneInN(summary.conversionRate)}</span>.
            </p>
          ) : (
            <p className="text-lg text-muted-foreground">No traffic recorded yet.</p>
          )}
          {summary ? (
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Booking trend vs the first half of this window:</span>
              <TrendChip trend={bookingsTrend} />
              <span className="ml-2 inline-flex items-center gap-1">
                <Info className="h-3.5 w-3.5" />
                Click any number below to dig deeper.
              </span>
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-4 rounded-lg border bg-muted/40 px-4 py-3">
          <div className="relative grid h-10 w-10 place-items-center rounded-full bg-emerald-500/15">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />
            <Users className="relative h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Right now</p>
            <p className="text-2xl font-semibold tabular-nums leading-none">
              {activeUsers ? formatNumber(activeUsers.active5m) : '–'}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              on the site in the last 5 minutes
              {activeUsers ? <> · {activeUsers.active1m} in the last minute</> : null}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  KPI card                                                                  */
/* -------------------------------------------------------------------------- */

function KpiCard({
  index,
  icon,
  label,
  caption,
  value,
  trend,
  accent,
  visual,
  onClick,
}: {
  index: number
  icon: React.ReactNode
  label: string
  caption?: string
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
          {caption ? <p className="mt-0.5 text-[11px] text-muted-foreground">{caption}</p> : null}

          <div className="mt-3">{visual}</div>
        </CardContent>
      </Card>
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*  Funnel — vertical story view                                              */
/* -------------------------------------------------------------------------- */

function FunnelStory({ funnel, onPick }: { funnel: FunnelStep[]; onPick: (s: FunnelStep) => void }) {
  if (!funnel.length || funnel[0].sessions === 0) {
    return <EmptyHint>No journey data yet. Once people start browsing, you’ll see each step here.</EmptyHint>
  }
  const top = funnel[0].sessions
  const leak = biggestFunnelLeak(funnel)

  return (
    <div className="space-y-1.5">
      {funnel.map((step, i) => {
        const pctOfTop = top > 0 ? step.sessions / top : 0
        const widthPct = Math.max(8, Math.round(pctOfTop * 100))
        const dropPct = step.dropFromPrev
        const lost = i > 0 ? Math.max(0, funnel[i - 1].sessions - step.sessions) : 0
        const isLeak = leak && leak.toIdx === i
        const isFinal = i === funnel.length - 1

        return (
          <div key={step.name}>
            <button
              onClick={() => onPick(step)}
              className={`group relative w-full overflow-hidden rounded-lg border bg-card text-left transition-all hover:-translate-y-px hover:shadow-sm ${isLeak ? 'ring-1 ring-rose-500/30' : ''}`}
            >
              <div
                className="absolute inset-y-0 left-0 transition-all"
                style={{
                  width: `${widthPct}%`,
                  background: isFinal
                    ? `linear-gradient(90deg, ${C.emerald}33, ${C.emerald}11)`
                    : `linear-gradient(90deg, ${C.sapphire}22, ${C.sapphire}08)`,
                }}
              />
              <div className="relative flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold"
                    style={{
                      backgroundColor: isFinal ? `${C.emerald}1a` : `${C.sapphire}1a`,
                      color: isFinal ? C.emerald : C.sapphire,
                    }}
                  >
                    {isFinal ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="truncate text-sm font-medium">{friendlyFunnelStep(step.name)}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <span className="tabular-nums font-semibold">{formatNumber(step.sessions)}</span>
                  <span className="text-muted-foreground tabular-nums">({formatPct(pctOfTop, 0)})</span>
                </div>
              </div>
            </button>

            {/* Drop-off indicator between steps */}
            {i < funnel.length - 1 && step.sessions > 0 ? (() => {
              const next = funnel[i + 1]
              const nextDrop = next.sessions === 0 ? 1 : 1 - next.sessions / step.sessions
              const nextLost = step.sessions - next.sessions
              if (nextLost <= 0) return null
              const isBig = nextDrop > 0.4
              return (
                <div className="flex items-center justify-end gap-2 py-1 pr-2 text-[11px] text-muted-foreground">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${isBig ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-muted'}`}>
                    <ArrowDownRight className="h-3 w-3" />
                    {formatNumber(nextLost)} dropped off ({formatPct(nextDrop, 0)})
                  </span>
                </div>
              )
            })() : null}
          </div>
        )
      })}

      {/* Footer summary */}
      <div className="mt-3 flex items-start gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          {leak ? (
            <>
              The biggest leak is at <span className="font-semibold text-foreground">"{friendlyFunnelStep(funnel[leak.toIdx].name, true)}"</span> — you lose <span className="font-semibold text-foreground">{formatPct(leak.dropPct, 0)}</span> of people there.
            </>
          ) : (
            <>Numbers show how many visitors reached each step. Percentages are compared to the first step.</>
          )}
        </span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Time series chart                                                         */
/* -------------------------------------------------------------------------- */

function TimeSeriesChart({ series }: { series: TimeSeriesPoint[] }) {
  if (!series.length) return <EmptyHint>No daily data yet.</EmptyHint>
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: C.sapphire }} /> Visitors
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
          <RechartsTooltip
            content={<ChartTooltip renameMap={{ sessions: 'Visitors', bookings: 'Bookings' }} />}
            cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
          />
          <Line type="monotone" dataKey="sessions" stroke={C.sapphire} strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="bookings" stroke={C.emerald} strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Top properties                                                            */
/* -------------------------------------------------------------------------- */

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
            {friendlyProperty(row.propertySlug)}
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

/* -------------------------------------------------------------------------- */
/*  UTM / Source panel                                                        */
/* -------------------------------------------------------------------------- */

function UtmPanel({ rows, onPick }: { rows: UtmRow[]; onPick: (source: string) => void }) {
  if (!rows.length) return <EmptyHint>No traffic yet.</EmptyHint>
  const maxSessions = Math.max(...rows.map((r) => r.sessions), 1)
  return (
    <div className="overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Source</span>
        <span className="text-right">Visitors</span>
        <span className="text-right">Bookings</span>
        <span className="text-right">Convert</span>
      </div>
      <div className="space-y-0.5">
        {rows.map((row) => (
          <button
            key={row.utmSource}
            onClick={() => onPick(row.utmSource)}
            className="grid w-full grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{friendlySource(row.utmSource)}</span>
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
/*  Recent events / activity table                                            */
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

  if (!rows.length) return <EmptyHint>No activity yet. Once someone visits, you’ll see them here.</EmptyHint>

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by property, source, or session…"
            className="h-9 pl-8"
          />
        </div>
        <Select value={nameFilter} onValueChange={setNameFilter}>
          <SelectTrigger className="h-9 w-48">
            <Filter className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {names.map((n) => (
              <SelectItem key={n} value={n}>{friendlyEvent(n)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground tabular-nums">
          Showing {filtered.length} of {rows.length}
        </span>
      </div>

      <ScrollArea className="h-[360px] rounded-md border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2.5 font-semibold">When</th>
              <th className="px-3 py-2.5 font-semibold">What they did</th>
              <th className="px-3 py-2.5 font-semibold">Property</th>
              <th className="px-3 py-2.5 font-semibold">Came from</th>
              <th className="px-3 py-2.5 text-right font-semibold">Visitor</th>
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
                  <span className="font-medium">{friendlyEvent(row.name)}</span>
                </td>
                <td className="px-3 py-2.5 capitalize text-muted-foreground">
                  {row.propertySlug ? friendlyProperty(row.propertySlug) : '—'}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{friendlySource(row.utmSource)}</td>
                <td className="px-3 py-2.5 text-right">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{row.sessionId.slice(0, 8)}…</code>
                </td>
              </tr>
            ))}
            {!filtered.length ? (
              <tr>
                <td colSpan={5}><EmptyHint>Nothing matches that filter.</EmptyHint></td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  )
}

function RecentAuditTable({ rows }: { rows: RecentAuditRow[] }) {
  if (!rows.length) return <EmptyHint>No audit events yet.</EmptyHint>

  return (
    <ScrollArea className="h-[280px] rounded-md border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
          <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2.5 font-semibold">When</th>
            <th className="px-3 py-2.5 font-semibold">Event</th>
            <th className="px-3 py-2.5 font-semibold">Status</th>
            <th className="px-3 py-2.5 font-semibold">Reason</th>
            <th className="px-3 py-2.5 font-semibold">Property</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t">
              <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground" title={new Date(row.recordedAt).toLocaleString()}>
                {relativeTime(row.recordedAt)}
              </td>
              <td className="px-3 py-2.5">
                <span className="font-medium">{prettifyEventName(row.eventName)}</span>
              </td>
              <td className="px-3 py-2.5">
                <Badge variant={row.status === 'accepted' ? 'secondary' : 'destructive'} className="text-[10px]">
                  {row.status}
                </Badge>
              </td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">{row.reasonCode}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{row.propertySlug ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  )
}

/* -------------------------------------------------------------------------- */
/*  Drilldown — KPI Sheet                                                     */
/* -------------------------------------------------------------------------- */

const KPI_META: Record<KpiKey, { title: string; tagline: string; accent: string; line: 'sessions' | 'bookings' | 'conv' }> = {
  visitors:   { title: 'Visitors',     tagline: 'People who landed on your site',         accent: C.sapphire, line: 'sessions' },
  bookings:   { title: 'Bookings',     tagline: 'Successful bookings completed',          accent: C.emerald,  line: 'bookings' },
  conversion: { title: 'Booking rate', tagline: 'Share of visitors who book',             accent: C.amber,    line: 'conv'     },
  engagement: { title: 'Engagement',   tagline: 'Average actions per visitor',            accent: C.violet,   line: 'sessions' },
}

function KpiSheet({
  kpi,
  onClose,
  summary,
  series,
  utm,
  topProperties,
  recent,
  rangeLabel,
  onOpenUtm,
  onOpenProperty,
}: {
  kpi: KpiKey | null
  onClose: () => void
  summary: DashboardSummary | null
  series: TimeSeriesPoint[]
  utm: UtmRow[]
  topProperties: TopProperty[]
  recent: RecentEventRow[]
  rangeLabel: string
  onOpenUtm: (s: string) => void
  onOpenProperty: (s: string) => void
}) {
  const meta = kpi ? KPI_META[kpi] : null
  const lineData = useMemo(
    () =>
      series.map((p) => ({
        date: p.date,
        value: meta?.line === 'bookings' ? p.bookings
          : meta?.line === 'conv' ? (p.sessions ? p.bookings / p.sessions : 0)
          : p.sessions,
      })),
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
              <SheetDescription>{meta.tagline} · {rangeLabel}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <div className="rounded-lg border p-4">
                <p className="text-3xl font-semibold tabular-nums">
                  {kpi === 'conversion' && summary ? formatPct(summary.conversionRate)
                    : kpi === 'engagement' && summary ? summary.avgEventsPerSession.toFixed(1)
                      : kpi === 'bookings' && summary ? formatNumber(summary.bookings)
                        : summary ? formatNumber(summary.sessions) : '–'}
                </p>
                {kpi === 'conversion' && summary ? (
                  <p className="mt-1 text-xs text-muted-foreground">That’s {oneInN(summary.conversionRate)} who book.</p>
                ) : null}
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

              {kpi === 'engagement' ? (
                <div>
                  <SectionLabel>What people did most (last 100 actions)</SectionLabel>
                  <div className="mt-3 space-y-2">
                    {eventCounts.length ? eventCounts.map(([name, count]) => (
                      <div key={name} className="flex items-center gap-3">
                        <span className="w-40 shrink-0 truncate text-sm">{friendlyEvent(name)}</span>
                        <ShareBar value={count} max={eventCounts[0][1]} color={C.violet} />
                        <span className="w-8 text-right text-sm tabular-nums text-muted-foreground">{count}</span>
                      </div>
                    )) : <EmptyHint>No actions to show.</EmptyHint>}
                  </div>
                </div>
              ) : (
                <div>
                  <SectionLabel>Where these visitors came from</SectionLabel>
                  <div className="mt-3 space-y-1">
                    {utm.length ? utm.map((u) => (
                      <button
                        key={u.utmSource}
                        onClick={() => onOpenUtm(u.utmSource)}
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                      >
                        <span className="font-medium">{friendlySource(u.utmSource)}</span>
                        <span className="flex items-center gap-3 text-muted-foreground tabular-nums">
                          <span>{formatNumber(kpi === 'bookings' ? u.bookings : u.sessions)}</span>
                          {kpi === 'conversion' ? <Badge variant="secondary">{formatPct(u.conversionRate)}</Badge> : null}
                        </span>
                      </button>
                    )) : <EmptyHint>No source data.</EmptyHint>}
                  </div>
                </div>
              )}

              {kpi === 'bookings' ? (
                <div>
                  <SectionLabel>By property</SectionLabel>
                  <div className="mt-3 space-y-1">
                    {topProperties.map((p) => (
                      <button
                        key={p.propertySlug}
                        onClick={() => onOpenProperty(p.propertySlug)}
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                      >
                        <span className="font-medium capitalize">{friendlyProperty(p.propertySlug)}</span>
                        <span className="tabular-nums text-muted-foreground">{formatNumber(p.bookings)}</span>
                      </button>
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
  const sources = useMemo(() => groupCount(events, (e) => e.utmSource ?? 'direct'), [events])

  return (
    <Sheet open={!!slug} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {slug ? (
          <>
            <SheetHeader className="space-y-1">
              <SheetTitle className="flex items-center gap-2 capitalize">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {friendlyProperty(slug)}
              </SheetTitle>
              <SheetDescription>How this property is performing.</SheetDescription>
            </SheetHeader>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <StatTile
                label="Bookings"
                value={formatNumber(bookings)}
                sub={totalBookings ? `${formatPct(bookings / totalBookings, 0)} of all bookings` : undefined}
                accent={C.emerald}
              />
              <StatTile
                label="Visitors"
                value={formatNumber(distinct(events, (e) => e.sessionId))}
                sub="who saw this property"
                accent={C.sapphire}
              />
              <StatTile
                label="Actions"
                value={formatNumber(events.length)}
                sub={`${distinct(events, (e) => e.name)} kinds`}
                accent={C.violet}
              />
            </div>

            <Separator className="my-6" />

            <SectionLabel>Top sources for this property</SectionLabel>
            <div className="mt-3 space-y-1">
              {sources.length ? sources.slice(0, 6).map(([src, count]) => (
                <div key={src} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 truncate text-muted-foreground">{friendlySource(src)}</span>
                  <ShareBar value={count} max={sources[0][1]} color={C.sapphire} />
                  <span className="w-8 text-right tabular-nums text-muted-foreground">{count}</span>
                </div>
              )) : <EmptyHint>No source activity in recent events.</EmptyHint>}
            </div>

            <Separator className="my-6" />

            <SectionLabel>Recent activity on this property ({events.length})</SectionLabel>
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
            <span className="font-medium">{friendlyEvent(e.name)}</span>
          </span>
          <span className="text-xs text-muted-foreground">{relativeTime(e.occurredAt)}</span>
        </button>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Drilldown — UTM / Source Sheet                                            */
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
  const events = useMemo(() => recent.filter((e) => (e.utmSource ?? 'direct') === source), [recent, source])
  const props = useMemo(() => groupCount(events, (e) => e.propertySlug), [events])
  const maxSessions = Math.max(...utm.map((u) => u.sessions), 1)

  return (
    <Sheet open={!!source} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {source ? (
          <>
            <SheetHeader className="space-y-1">
              <SheetTitle className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-muted-foreground" />
                {friendlySource(source)}
              </SheetTitle>
              <SheetDescription>Where these visitors found you.</SheetDescription>
            </SheetHeader>

            {row ? (
              <>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <StatTile label="Visitors" value={formatNumber(row.sessions)} sub={`${formatPct(row.sessions / maxSessions, 0)} of top source`} accent={C.sapphire} />
                  <StatTile label="Bookings" value={formatNumber(row.bookings)} accent={C.emerald} />
                  <StatTile label="Booking rate" value={formatPct(row.conversionRate)} sub={oneInN(row.conversionRate)} accent={C.amber} />
                </div>
                <Separator className="my-6" />
              </>
            ) : null}

            <SectionLabel>Properties they viewed</SectionLabel>
            <div className="mt-3 space-y-1">
              {props.length ? props.slice(0, 8).map(([p, count]) => (
                <div key={p} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 truncate capitalize text-muted-foreground">{friendlyProperty(p)}</span>
                  <ShareBar value={count} max={props[0][1]} color={C.emerald} />
                  <span className="w-8 text-right tabular-nums text-muted-foreground">{count}</span>
                </div>
              )) : <EmptyHint>No property activity recorded.</EmptyHint>}
            </div>

            <Separator className="my-6" />
            <SectionLabel>Recent activity from this source ({events.length})</SectionLabel>
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
              <Badge variant="secondary" className="w-fit">{event.source === 'server' ? 'Server-confirmed' : 'From the browser'}</Badge>
              <SheetTitle>{friendlyEvent(event.name)}</SheetTitle>
              <SheetDescription>{new Date(event.occurredAt).toLocaleString()}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 divide-y rounded-lg border px-4">
              <DetailRow label="Action" value={friendlyEvent(event.name)} />
              <DetailRow label="Property" value={event.propertySlug ? <span className="capitalize">{friendlyProperty(event.propertySlug)}</span> : '—'} />
              <DetailRow label="Came from" value={friendlySource(event.utmSource)} />
              <DetailRow label="Recorded by" value={event.source} />
              <DetailRow label="Visitor ID" value={`${event.sessionId.slice(0, 12)}…`} mono />
              <DetailRow label="Action ID" value={`${event.id.slice(0, 12)}…`} mono />
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Button variant="secondary" size="sm" onClick={() => onOpenSession(event.sessionId)}>
                <Waypoints className="mr-1.5 h-4 w-4" />
                See this visitor’s full journey ({siblings.length + 1})
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
                <SectionLabel>Other things they did</SectionLabel>
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
  const converted = events.some((e) => e.name === 'booking_completed')
  const props = distinct(events, (e) => e.propertySlug)

  return (
    <Sheet open={!!sessionId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {sessionId ? (
          <>
            <SheetHeader className="space-y-1">
              <SheetTitle className="flex items-center gap-2">
                <Waypoints className="h-4 w-4 text-muted-foreground" />
                One visitor’s journey
              </SheetTitle>
              <SheetDescription className="font-mono text-xs">{sessionId}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <StatTile label="Actions" value={formatNumber(events.length)} accent={C.violet} />
              <StatTile label="Properties seen" value={formatNumber(props)} accent={C.sapphire} />
              <StatTile
                label="Did they book?"
                value={converted ? 'Yes' : 'No'}
                sub={converted ? 'completed a booking' : 'still browsing or left'}
                accent={converted ? C.emerald : C.amber}
              />
            </div>

            {first ? (
              <div className="mt-4 rounded-lg border px-4">
                <DetailRow label="First seen" value={relativeTime(first.occurredAt)} />
                <DetailRow label="Came from" value={friendlySource(first.utmSource)} />
              </div>
            ) : null}

            <Separator className="my-6" />
            <SectionLabel>Step-by-step timeline</SectionLabel>
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
                      <p className="text-sm font-medium">{friendlyEvent(e.name)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(e.occurredAt).toLocaleTimeString()} · {e.propertySlug ? friendlyProperty(e.propertySlug) : 'no property'}
                      </p>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyHint>No actions captured for this visitor in the recent window.</EmptyHint>
            )}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

/* -------------------------------------------------------------------------- */
/*  Drilldown — Funnel Drawer                                                 */
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
                className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold"
                style={{ backgroundColor: `${C.sapphire}1a`, color: C.sapphire }}
              >
                {idx + 1}
              </span>
              {step ? friendlyFunnelStep(step.name) : ''}
            </DrawerTitle>
            <DrawerDescription>Step {idx + 1} of {funnel.length} in the booking journey</DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-8">
            <div className="grid grid-cols-3 gap-3">
              <StatTile
                label="Reached this step"
                value={step ? formatNumber(step.sessions) : '–'}
                sub="visitors"
                accent={C.sapphire}
              />
              <StatTile
                label="Of all who started"
                value={formatPct(fromTop, 0)}
                sub="kept going to this point"
                accent={C.indigo}
              />
              <StatTile
                label="Dropped from previous"
                value={step && idx > 0 ? formatPct(step.dropFromPrev, 0) : '—'}
                sub={step && idx > 0 ? 'left before this step' : 'first step'}
                accent={C.rose}
              />
            </div>

            <Separator className="my-5" />

            <SectionLabel>Full journey, top to bottom</SectionLabel>
            <div className="mt-3 space-y-1.5">
              {funnel.map((f, i) => {
                const pct = top > 0 ? f.sessions / top : 0
                const active = step?.name === f.name
                const isFinal = i === funnel.length - 1
                return (
                  <div
                    key={f.name}
                    className={`flex items-center gap-3 rounded-md px-2 py-1.5 text-sm ${active ? 'bg-muted' : ''}`}
                  >
                    <span className="w-44 shrink-0 truncate">{friendlyFunnelStep(f.name)}</span>
                    <div className="flex-1">
                      <ShareBar value={f.sessions} max={top} color={isFinal ? C.emerald : C.sapphire} />
                    </div>
                    <span className="w-12 text-right tabular-nums text-muted-foreground">{formatPct(pct, 0)}</span>
                    <span className="w-12 text-right tabular-nums font-medium">{formatCompact(f.sessions)}</span>
                  </div>
                )
              })}
            </div>

            {events.length ? (
              <>
                <Separator className="my-5" />
                <SectionLabel>Visitors who hit this step recently ({events.length})</SectionLabel>
                <ScrollArea className="mt-3 h-40 rounded-md border">
                  <div className="divide-y">
                    {events.slice(0, 30).map((e) => (
                      <div key={e.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="capitalize text-muted-foreground">{e.propertySlug ? friendlyProperty(e.propertySlug) : '—'}</span>
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
