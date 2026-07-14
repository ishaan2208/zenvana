import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Clock,
  Hotel,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react'

import {
  getPublicHourlyAvailability,
  getPublicHourlyQuote,
  getPublicPropertyBySlug,
  type PublicPropertyDetail,
} from '@/lib/api'
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { SoldOutTag } from '@/components/SoldOutTag'
import { PriceWithTax } from '@/components/PriceWithTax'
import { sanitizeReturnTo } from '@/lib/book-rooms-url'
import { TrackOnMount } from '@/components/analytics/TrackOnMount'

function roomsBackLabel(returnTo: string | null): string {
  if (!returnTo) return 'Back to stay details'
  if (returnTo === '/') return 'Back to home'
  if (returnTo === '/hotels') return 'Back to hotels'
  if (returnTo.startsWith('/hotels/')) return 'Back to property'
  return 'Back'
}

type HourlyRoomsProps = {
  slug: string
  date: string
  startTime: string
  durationHours: number
  guests: number
  returnTo: string | null
}

export async function HourlyRoomsView({
  slug,
  date,
  startTime,
  durationHours,
  guests,
  returnTo,
}: HourlyRoomsProps) {
  const property = await getPublicPropertyBySlug(slug)
  if (!property) notFound()

  const backHref = returnTo ?? `/hotels/${slug}`
  const backLabel = roomsBackLabel(returnTo)

  if (!property.hourlyStayEnabled) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(120,119,198,0.10),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_28%)]" />
        <Container className="relative py-6 sm:py-8 lg:py-12">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm font-medium text-foreground/80 backdrop-blur-xl transition hover:text-foreground dark:bg-background/40"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
          <section className="mt-5 overflow-hidden rounded-[2rem] border border-border/60 bg-background/55 shadow-[0_24px_70px_rgba(8,17,31,0.08)] backdrop-blur-2xl dark:bg-background/30">
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[10px] uppercase tracking-[0.26em] text-muted-foreground dark:bg-background/40">
                <Sparkles className="h-3.5 w-3.5" />
                Hourly stay
              </div>
              <h1 className="mt-4 font-serif text-[clamp(2rem,5vw,3.5rem)] leading-[0.95] tracking-[-0.05em] text-foreground">
                Hourly stay is not available
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                This property is not offering hourly stays right now. Try an overnight booking
                or pick another hotel.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href={backHref} variant="outline" color="slate" className="dark:text-white">
                  Go back
                </Button>
                <Button href="/hotels" color="blue">
                  View all properties
                </Button>
              </div>
            </div>
          </section>
        </Container>
      </main>
    )
  }

  const availability = await getPublicHourlyAvailability(
    slug,
    date,
    startTime,
    durationHours
  )

  const roomTypesWithQuotes = await Promise.all(
    (property.roomTypes ?? []).map(async (rt) => {
      const avail =
        availability?.roomTypes.find((a) => a.roomTypeId === rt.id)?.available ??
        0
      const quote =
        avail > 0
          ? await getPublicHourlyQuote(slug, {
              date,
              startTime,
              durationHours,
              roomTypeId: rt.id,
            })
          : null
      return { rt, avail, quote }
    })
  )

  const bookable = roomTypesWithQuotes.filter(
    (r) => r.avail > 0 && r.quote?.price != null
  )
  const allSoldOut =
    (property.roomTypes?.length ?? 0) > 0 && bookable.length === 0

  return (
    <main className="min-h-screen bg-background text-foreground">
      <TrackOnMount
        name="availability_checked"
        propertySlug={slug}
        properties={{
          stayKind: 'hourly',
          date,
          startTime,
          durationHours,
          guests,
          roomTypeCount: property.roomTypes?.length ?? 0,
          anyAvailable: bookable.length > 0,
        }}
        dedupeKey={`hourly_availability:${slug}:${date}:${startTime}:${durationHours}`}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(120,119,198,0.10),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_28%)]" />

      <Container className="relative py-5 sm:py-6 lg:py-10">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm font-medium text-foreground/80 backdrop-blur-xl transition hover:text-foreground dark:bg-background/40"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-8">
          <div className="min-w-0 space-y-5">
            {allSoldOut ? (
              <section className="relative overflow-hidden rounded-[2rem] border border-rose-200/70 bg-gradient-to-br from-rose-50/95 via-background/85 to-background/60 shadow-[0_28px_80px_rgba(190,18,60,0.12)] backdrop-blur-2xl dark:border-rose-900/50 dark:from-rose-950/40 dark:via-background/40 dark:to-background/25">
                <div className="relative p-6 sm:p-8 lg:p-10">
                  <div className="inline-flex flex-wrap items-center gap-3">
                    <SoldOutTag
                      className="px-4 py-2 text-xs tracking-[0.18em]"
                      label="Unavailable"
                    />
                    <span className="text-[11px] uppercase tracking-[0.24em] text-rose-800/80 dark:text-rose-200/80">
                      {property.publicName}
                    </span>
                  </div>
                  <h1 className="mt-5 max-w-xl font-serif text-[clamp(1.75rem,4.5vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-foreground">
                    No rooms free for this hourly slot
                  </h1>
                  <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
                    Try another start time or duration, or book overnight instead.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Button href={backHref} variant="outline" color="slate" className="dark:text-white">
                      Change slot
                    </Button>
                    <Button href="/hotels" color="blue">
                      <Hotel className="mr-2 h-4 w-4" />
                      View all properties
                    </Button>
                  </div>
                </div>
              </section>
            ) : (
              roomTypesWithQuotes.map(({ rt, avail, quote }) => (
                <HourlyRoomRow
                  key={rt.id}
                  slug={slug}
                  roomType={rt}
                  available={avail}
                  price={quote?.price ?? null}
                  date={date}
                  startTime={startTime}
                  durationHours={durationHours}
                  guests={guests}
                  returnTo={returnTo}
                />
              ))
            )}
          </div>

          <aside className="min-w-0">
            <div className="rounded-[1.8rem] border border-border/60 bg-card/70 p-5 text-card-foreground shadow-[0_14px_35px_rgba(8,17,31,0.04)] backdrop-blur-xl dark:bg-card/50 xl:sticky xl:top-8">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Slot summary
              </div>
              <h2 className="mt-3 font-serif text-2xl tracking-[-0.04em] text-foreground">
                {property.publicName}
              </h2>
              {(property.city || property.state) && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{[property.city, property.state].filter(Boolean).join(', ')}</span>
                </div>
              )}
              <div className="mt-5 space-y-3 border-t border-border/60 pt-5">
                <SummaryRow label="Date" value={date} />
                <SummaryRow label="Start" value={startTime} />
                <SummaryRow label="Duration" value={`${durationHours} hours`} />
                <SummaryRow
                  label="Guests"
                  value={`${guests} guest${guests !== 1 ? 's' : ''}`}
                />
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  )
}

function HourlyRoomRow(props: {
  slug: string
  roomType: PublicPropertyDetail['roomTypes'][number]
  available: number
  price: number | null
  date: string
  startTime: string
  durationHours: number
  guests: number
  returnTo: string | null
}) {
  const {
    slug,
    roomType,
    available,
    price,
    date,
    startTime,
    durationHours,
    guests,
    returnTo,
  } = props
  const soldOut = available < 1 || price == null

  const checkoutParams = new URLSearchParams({
    stayKind: 'hourly',
    date,
    startTime,
    durationHours: String(durationHours),
    roomTypeId: String(roomType.id),
    roomTypeName: roomType.name,
    totalAmount: String(price ?? 0),
    occupancy: String(guests),
    checkIn: date,
    checkOut: date,
  })
  const safeReturnTo = sanitizeReturnTo(returnTo)
  if (safeReturnTo) checkoutParams.set('returnTo', safeReturnTo)

  return (
    <article className="overflow-hidden rounded-[2rem] border border-border/60 bg-background/55 shadow-[0_18px_45px_rgba(8,17,31,0.04)] backdrop-blur-2xl dark:bg-background/30">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-xl tracking-[-0.03em] text-foreground sm:text-2xl">
              {roomType.name}
            </h2>
            {soldOut ? <SoldOutTag /> : null}
          </div>
          {roomType.shortDescription ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-2">
              {roomType.shortDescription}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {durationHours}h · {startTime}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {guests} guest{guests !== 1 ? 's' : ''}
            </span>
            {!soldOut ? (
              <span>
                {available} room{available === 1 ? '' : 's'} free
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:min-w-[11rem] sm:items-end">
          {!soldOut && price != null ? (
            <div className="text-right">
              <PriceWithTax amount={price} size="default" />
              <p className="mt-0.5 text-xs text-muted-foreground">for {durationHours} hours</p>
            </div>
          ) : null}
          {soldOut ? (
            <Button disabled variant="outline" color="slate" className="dark:text-white">
              Unavailable
            </Button>
          ) : (
            <Button href={`/book/${slug}/checkout?${checkoutParams.toString()}`}>
              Continue to checkout
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
