import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Clock,
  Hotel,
  MapPin,
  Sparkles,
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

  if (!property.hourlyStayEnabled) {
    return (
      <HourlyEmptyState
        slug={slug}
        returnTo={returnTo}
        title="Hourly stay not available"
        message="This property is not offering hourly stays right now."
      />
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

  const backHref = returnTo ?? `/hotels/${slug}`
  const backLabel = roomsBackLabel(returnTo)

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
            <h1 className="mt-4 font-serif text-3xl tracking-tight sm:text-4xl">
              {property.publicName}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {property.fullAddress ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {property.fullAddress}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {date} · {startTime} · {durationHours} hours
              </span>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-4">
          {roomTypesWithQuotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No room types available.</p>
          ) : (
            roomTypesWithQuotes.map(({ rt, avail, quote }) => (
              <HourlyRoomRow
                key={rt.id}
                slug={slug}
                property={property}
                roomType={rt}
                available={avail}
                price={quote?.price ?? null}
                date={date}
                startTime={startTime}
                durationHours={durationHours}
                guests={guests}
              />
            ))
          )}
        </div>
      </Container>
    </main>
  )
}

function HourlyEmptyState(props: {
  slug: string
  returnTo: string | null
  title: string
  message: string
}) {
  const backHref = props.returnTo ?? `/hotels/${props.slug}`
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Container className="py-12">
        <h1 className="font-serif text-3xl">{props.title}</h1>
        <p className="mt-2 text-muted-foreground">{props.message}</p>
        <Button href={backHref} className="mt-6">
          Go back
        </Button>
      </Container>
    </main>
  )
}

function HourlyRoomRow(props: {
  slug: string
  property: PublicPropertyDetail
  roomType: PublicPropertyDetail['roomTypes'][number]
  available: number
  price: number | null
  date: string
  startTime: string
  durationHours: number
  guests: number
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

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/60 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Hotel className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-serif text-xl">{roomType.name}</h2>
          {soldOut ? <SoldOutTag /> : null}
        </div>
        {roomType.shortDescription ? (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {roomType.shortDescription}
          </p>
        ) : null}
        {!soldOut ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {available} room{available === 1 ? '' : 's'} free for this slot
          </p>
        ) : null}
      </div>
      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        {!soldOut && price != null ? (
          <p className="text-2xl font-semibold tracking-tight">
            ₹{price.toLocaleString('en-IN')}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              / {durationHours}h
            </span>
          </p>
        ) : null}
        {soldOut ? (
          <Button disabled variant="outline" color="slate">
            Unavailable
          </Button>
        ) : (
          <Button href={`/book/${slug}/checkout?${checkoutParams.toString()}`}>
            Continue to checkout
          </Button>
        )}
      </div>
    </article>
  )
}
