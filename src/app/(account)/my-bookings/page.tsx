'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Clock,
  Hash,
  Lock,
  MapPin,
  MessageCircle,
  Luggage,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton'
import { MyBookingsLoadingSkeleton } from '@/components/skeletons/AccountSkeletons'
import {
  getZenvanaGuestBookings,
  getZenvanaGuestMe,
  type ZenvanaGuestBookingRow,
} from '@/lib/zenvanaGuestApi'

type Filter = 'all' | 'upcoming' | 'past' | 'cancelled'

export default function MyBookingsPage() {
  const [rows, setRows] = useState<ZenvanaGuestBookingRow[] | null>(null)
  const [auth, setAuth] = useState<boolean | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    void (async () => {
      const me = await getZenvanaGuestMe()
      if (!me) {
        setAuth(false)
        return
      }
      setAuth(true)
      try {
        const b = await getZenvanaGuestBookings()
        setRows(b)
      } catch {
        setRows([])
      }
    })()
  }, [])

  const buckets = useMemo(() => {
    if (!rows) return { all: [], upcoming: [], past: [], cancelled: [] }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const upcoming: ZenvanaGuestBookingRow[] = []
    const past: ZenvanaGuestBookingRow[] = []
    const cancelled: ZenvanaGuestBookingRow[] = []
    for (const r of rows) {
      const status = (r.bookingStatus || '').toLowerCase()
      if (status.includes('cancel')) {
        cancelled.push(r)
        continue
      }
      const checkOut = new Date(r.checkOut)
      if (!isNaN(+checkOut) && checkOut >= today) upcoming.push(r)
      else past.push(r)
    }
    return { all: rows, upcoming, past, cancelled }
  }, [rows])

  if (auth === false) return <SignedOutState />
  if (auth === null || rows === null) return <LoadingState />

  const filtered = buckets[filter]

  return (
    <div>
      <BookingsHero
        totalCount={rows.length}
        upcomingCount={buckets.upcoming.length}
      />

      <section className="container-shell py-10 sm:py-14">
        <FilterTabs
          filter={filter}
          onChange={setFilter}
          counts={{
            all: buckets.all.length,
            upcoming: buckets.upcoming.length,
            past: buckets.past.length,
            cancelled: buckets.cancelled.length,
          }}
        />

        {filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <motion.ul
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.05 } },
            }}
            className="mt-8 grid gap-5 lg:grid-cols-2"
          >
            {filtered.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </motion.ul>
        )}
      </section>
    </div>
  )
}

function BookingsHero({
  totalCount,
  upcomingCount,
}: {
  totalCount: number
  upcomingCount: number
}) {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="brand-gradient absolute inset-0 opacity-95" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(219,230,76,0.18),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-soft-light bg-[repeating-linear-gradient(135deg,_rgba(255,255,255,0.09),_rgba(255,255,255,0.09)_1px,_transparent_1px,_transparent_10px)]" />

      <div className="container-shell relative z-10 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-white/85 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            Your stays
          </div>
          <h1 className="mt-5 font-serif text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
            My bookings
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
            Every direct booking you&rsquo;ve made with Zenvana, kept in one place — past stays for
            memory, and what&rsquo;s next on the way.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <StatPill label="Total" value={totalCount} />
            <StatPill label="Upcoming" value={upcomingCount} accent />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div
      className={[
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 backdrop-blur-md',
        accent
          ? 'border-accent/40 bg-accent/15 text-white'
          : 'border-white/20 bg-white/10 text-white/90',
      ].join(' ')}
    >
      <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/70">
        {label}
      </span>
      <span className="text-base font-semibold tabular-nums">{value}</span>
    </div>
  )
}

function FilterTabs({
  filter,
  onChange,
  counts,
}: {
  filter: Filter
  onChange: (f: Filter) => void
  counts: Record<Filter, number>
}) {
  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' },
  ]
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full border border-border/60 bg-card/70 p-1 shadow-sm backdrop-blur sm:w-fit">
      {tabs.map((t) => {
        const active = t.key === filter
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={[
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            <span>{t.label}</span>
            <span
              className={[
                'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums',
                active
                  ? 'bg-primary-foreground/15 text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              ].join(' ')}
            >
              {counts[t.key]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function BookingCard({ booking }: { booking: ZenvanaGuestBookingRow }) {
  const checkIn = formatDate(booking.checkIn)
  const checkOut = formatDate(booking.checkOut)
  const nights = nightsBetween(booking.checkIn, booking.checkOut)
  const status = (booking.bookingStatus || '').trim()

  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 },
      }}
      className="quiet-card group overflow-hidden transition-shadow hover:shadow-xl"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {booking.propertyName}
            </div>
            <h3 className="mt-2 font-serif text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
              {nights > 0 ? `${nights}-night stay` : 'Stay reserved'}
            </h3>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 sm:grid-cols-3">
          <DateBlock label="Check-in" date={checkIn} />
          <DateBlock label="Check-out" date={checkOut} />
          <div className="col-span-2 flex flex-col justify-center sm:col-span-1">
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Total
            </div>
            <div className="mt-1 font-serif text-lg font-semibold tracking-[-0.02em] text-foreground">
              ₹
              {booking.totalAmount.toLocaleString('en-IN', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Hash className="h-3.5 w-3.5" />
            <span className="font-mono tabular-nums">{booking.bookingReference}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={`/guest/stay?bookingId=${booking.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Get help
              <MessageCircle className="h-3.5 w-3.5" />
            </Link>
            {booking.slug ? (
              <Link
                href={`/hotels/${booking.slug}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                View property
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <span className="text-xs text-muted-foreground">Direct booking</span>
            )}
          </div>
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-primary/30 via-accent/25 to-primary/30 opacity-0 transition group-hover:opacity-100" />
    </motion.li>
  )
}

function DateBlock({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
        <CalendarDays className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 truncate text-sm font-semibold text-foreground">{date}</div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  let cfg: { icon: React.ReactNode; className: string; label: string }
  if (s.includes('cancel')) {
    cfg = {
      icon: <XCircle className="h-3.5 w-3.5" />,
      className: 'border-destructive/30 bg-destructive/10 text-destructive',
      label: status || 'Cancelled',
    }
  } else if (s.includes('confirm') || s.includes('paid') || s.includes('complete')) {
    cfg = {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      className: 'border-success/30 bg-success/10 text-success',
      label: status || 'Confirmed',
    }
  } else if (s.includes('pend') || s.includes('hold')) {
    cfg = {
      icon: <Clock className="h-3.5 w-3.5" />,
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300',
      label: status || 'Pending',
    }
  } else {
    cfg = {
      icon: <BedDouble className="h-3.5 w-3.5" />,
      className: 'border-border/60 bg-muted text-muted-foreground',
      label: status || 'Booked',
    }
  }
  return (
    <span
      className={[
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em]',
        cfg.className,
      ].join(' ')}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

function EmptyState({ filter }: { filter: Filter }) {
  const copy: Record<Filter, { title: string; body: string }> = {
    all: {
      title: 'No bookings yet.',
      body: 'When you book a stay with Zenvana, it shows up here — neat, in order, easy to find.',
    },
    upcoming: {
      title: 'Nothing on the calendar.',
      body: 'Plan your next quiet stay in Dehradun. Direct bookings always get our best rates.',
    },
    past: {
      title: 'No past stays here.',
      body: 'Once you check out of a stay, it’ll be archived in this view.',
    },
    cancelled: {
      title: 'Nothing cancelled.',
      body: 'Plans change, sometimes. If a stay is cancelled, you’ll see it here.',
    },
  }
  const c = copy[filter]
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="quiet-card mt-8 flex flex-col items-center gap-5 px-6 py-12 text-center"
    >
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-accent/20 text-accent-foreground">
        <Luggage className="h-6 w-6" />
      </div>
      <div className="max-w-md">
        <h2 className="font-serif text-2xl font-semibold tracking-[-0.02em] text-foreground">
          {c.title}
        </h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{c.body}</p>
      </div>
      <Link
        href="/hotels"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-[0_12px_28px_-16px_rgba(0,0,0,0.45)] transition-transform hover:-translate-y-0.5"
      >
        <BedDouble className="h-4 w-4" />
        Browse stays
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  )
}

function LoadingState() {
  return <MyBookingsLoadingSkeleton />
}

function SignedOutState() {
  return (
    <div className="container-shell flex min-h-[60vh] items-center justify-center py-16">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="quiet-card max-w-md p-8 text-center"
      >
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-accent/20 text-accent-foreground">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="mt-5 font-serif text-2xl font-semibold tracking-[-0.02em] text-foreground">
          Sign in to view your bookings.
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          A quick WhatsApp OTP and you&rsquo;re in. No password to remember.
        </p>
        <div className="mt-6">
          <Link href="/login" className="inline-block w-full">
            <AuthPrimaryButton
              type="button"
              trailing={<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
            >
              Sign in
            </AuthPrimaryButton>
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground/80">
          New to Zenvana?{' '}
          <Link href="/guest/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
            Create a guest account
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(+d)) return iso
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn)
  const b = new Date(checkOut)
  if (isNaN(+a) || isNaN(+b)) return 0
  const ms = +b - +a
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)))
}
