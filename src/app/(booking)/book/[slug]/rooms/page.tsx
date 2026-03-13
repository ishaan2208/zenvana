import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarRange,
  BedDouble,
  MapPin,
  Sparkles,
  Users,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react'

import {
  getPublicPropertyBySlug,
  getPublicAvailability,
  getPublicRatesBulk,
  getPublicRatesWithPlans,
} from '@/lib/api'
import type { PublicRatesWithPlansPlan } from '@/lib/api'
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { RoomCard } from './RoomCard'
import { getShareCombinations, filterPreferNoTriple } from './shareCombinations'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    checkIn?: string
    checkOut?: string
    occupancy?: string
    rooms?: string
    guests?: string
    guestsPerRoom?: string
  }>
}

export default async function BookRoomsPage({ params, searchParams }: Props) {
  const { slug } = await params
  const q = await searchParams
  const {
    checkIn,
    checkOut,
    occupancy: occupancyParam,
    rooms: roomsParam,
    guests: guestsParam,
    guestsPerRoom: guestsPerRoomParam,
  } = q

  if (!checkIn || !checkOut) {
    redirect(`/book/${slug}`)
  }

  const rooms = roomsParam ? parseInt(roomsParam, 10) : 1
  const guests = guestsParam ? parseInt(guestsParam, 10) : undefined
  const occupancy = guests ?? (occupancyParam ? parseInt(occupancyParam, 10) : undefined)
  const guestsPerRoom = guestsPerRoomParam ? parseInt(guestsPerRoomParam, 10) : undefined

  const [property, availability, ratesBulk] = await Promise.all([
    getPublicPropertyBySlug(slug),
    getPublicAvailability(slug, checkIn, checkOut),
    getPublicRatesBulk(slug, checkIn, checkOut, occupancy),
  ])

  if (!property) notFound()

  if (!availability) {
    return (
      <main className="bg-background text-foreground">
        <section className="relative overflow-hidden border-b border-border/60 bg-background">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(219,230,76,0.08),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(116,195,101,0.06),transparent_22%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(219,230,76,0.05),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(116,195,101,0.05),transparent_22%)] rounded-2xl" />
          <Container className="rounded-2xl relative py-6 sm:py-10 lg:py-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Room selection
              </div>

              <h1 className="mt-5 font-serif text-4xl leading-[0.95] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">
                We couldn’t load rooms for these dates.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Please check your stay dates and try again.
              </p>
            </div>
          </Container>
        </section>

        <Container className="py-10 sm:py-12 lg:py-16">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-[2rem] border border-border/60 bg-card/70 p-6 shadow-[0_18px_45px_rgba(8,17,31,0.04)] dark:bg-card/50 sm:p-7">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Availability unavailable
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                We were not able to load live room availability for your selected dates.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button href={`/book/${slug}`} variant="outline" color="slate" className=' dark:text-white'>
                  Change dates
                </Button>

                <Link
                  href={`/hotels/${slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to property
                </Link>
              </div>
            </div>

            <aside className="hidden min-w-0 xl:block">
              <div className="rounded-[1.8rem] border border-border/60 bg-card/70 p-5 text-card-foreground shadow-[0_14px_35px_rgba(8,17,31,0.04)] dark:bg-card/50 xl:sticky xl:top-8">
                <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Stay summary
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
              </div>
            </aside>
          </div>
        </Container>
      </main>
    )
  }

  const nights = availability.nights
  const ratesByRoomTypeId = new Map(
    ratesBulk?.roomTypes?.map((r) => [r.roomTypeId, r]) ?? []
  )

  const isMultiRoomWithGuests = rooms > 1 && occupancy != null
  const shareCombinations = isMultiRoomWithGuests
    ? filterPreferNoTriple(getShareCombinations(rooms, occupancy!))
    : []

  const plansPerType = await Promise.all(
    availability.roomTypes.map((av) =>
      isMultiRoomWithGuests
        ? Promise.all([
          getPublicRatesWithPlans(slug, av.roomTypeId, checkIn, checkOut, 1),
          getPublicRatesWithPlans(slug, av.roomTypeId, checkIn, checkOut, 2),
          getPublicRatesWithPlans(slug, av.roomTypeId, checkIn, checkOut, 3),
        ])
        : getPublicRatesWithPlans(
          slug,
          av.roomTypeId,
          checkIn,
          checkOut,
          occupancy ?? undefined
        )
    )
  )

  const roomTypesWithRates = availability.roomTypes.map((av, i) => {
    const rt = property.roomTypes.find((r) => r.id === av.roomTypeId)
    const rate = ratesByRoomTypeId.get(av.roomTypeId)
    const plansData = plansPerType[i]

    if (isMultiRoomWithGuests && Array.isArray(plansData)) {
      const [data1, data2, data3] = plansData as [
        Awaited<ReturnType<typeof getPublicRatesWithPlans>>,
        Awaited<ReturnType<typeof getPublicRatesWithPlans>>,
        Awaited<ReturnType<typeof getPublicRatesWithPlans>>,
      ]

      return {
        ...av,
        shortDescription: rt?.shortDescription ?? null,
        averagePricePerNight: rate?.averagePricePerNight ?? rt?.basePrice ?? 0,
        plans: [] as PublicRatesWithPlansPlan[],
        nightsForPlans: data1?.nights ?? nights,
        noRatePlanForOccupancy: false,
        multiRoomMode: true as const,
        totalGuests: occupancy!,
        totalRooms: rooms,
        shareCombinations,
        plansForOccupancy1: (data1?.plans ?? []) as PublicRatesWithPlansPlan[],
        plansForOccupancy2: (data2?.plans ?? []) as PublicRatesWithPlansPlan[],
        plansForOccupancy3: (data3?.plans ?? []) as PublicRatesWithPlansPlan[],
        plansForOccupancy4: [] as PublicRatesWithPlansPlan[],
        nightsForPlans1: data1?.nights ?? nights,
        nightsForPlans2: data2?.nights ?? nights,
        nightsForPlans3: data3?.nights ?? nights,
        nightsForPlans4: data1?.nights ?? nights,
      }
    }

    const single = plansData as Awaited<ReturnType<typeof getPublicRatesWithPlans>>

    return {
      ...av,
      shortDescription: rt?.shortDescription ?? null,
      averagePricePerNight: rate?.averagePricePerNight ?? rt?.basePrice ?? 0,
      plans: (single?.plans ?? []) as PublicRatesWithPlansPlan[],
      nightsForPlans: single?.nights ?? nights,
      noRatePlanForOccupancy: single?.noRatePlanForOccupancy ?? false,
      multiRoomMode: false as const,
      totalGuests: undefined as number | undefined,
      totalRooms: undefined as number | undefined,
      shareCombinations: undefined,
      plansForOccupancy1: undefined,
      plansForOccupancy2: undefined,
      plansForOccupancy3: undefined,
      plansForOccupancy4: undefined,
      nightsForPlans1: undefined,
      nightsForPlans2: undefined,
      nightsForPlans3: undefined,
      nightsForPlans4: undefined,
    }
  })

  const guestSummary =
    occupancy != null
      ? guestsPerRoom != null && rooms >= 6
        ? `${guestsPerRoom} guest${guestsPerRoom !== 1 ? 's' : ''} per room (${occupancy} total)`
        : `${occupancy} guest${occupancy !== 1 ? 's' : ''}`
      : null

  return (
    <main className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border/60 bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(219,230,76,0.08),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(116,195,101,0.06),transparent_22%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(219,230,76,0.05),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(116,195,101,0.05),transparent_22%)]" />

        <Container className="relative py-6 sm:py-10 lg:py-20">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-10 xl:items-start">
            <div className="max-w-4xl">
              <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Room selection
              </div>

              <h1 className="mt-3 font-serif text-3xl leading-[0.95] tracking-[-0.05em] text-foreground sm:mt-5 sm:text-5xl lg:text-6xl">
                Select your room
                <span className="block">{property.publicName}</span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:mt-5 sm:text-base sm:leading-8 lg:text-lg">
                Review available room types and choose the rate plan that suits your stay best.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 sm:mt-8 sm:gap-2.5">
                <SummaryChip
                  icon={<CalendarRange className="h-4 w-4" />}
                  text={`${checkIn} → ${checkOut}`}
                />
                <SummaryChip
                  icon={<BedDouble className="h-4 w-4" />}
                  text={`${nights} night${nights !== 1 ? 's' : ''} · ${rooms} room${rooms !== 1 ? 's' : ''}`}
                />
                {guestSummary && (
                  <SummaryChip
                    icon={<Users className="h-4 w-4" />}
                    text={guestSummary}
                  />
                )}
              </div>
            </div>

            <div className="hidden xl:block xl:pt-6">
              <div className="rounded-[2rem] border border-border/60 bg-card/70 p-5 shadow-[0_18px_45px_rgba(8,17,31,0.04)] dark:bg-card/50">
                <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Before you continue
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Select the room and rate combination you prefer. Final booking details will be
                  reviewed at checkout.
                </p>

                <div className="mt-5 border-t border-border/60 pt-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-7 text-muted-foreground">
                      Direct booking gives you a clearer line to the property and a smoother start
                      to the stay.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-6 sm:py-10 lg:py-16">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-10">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2 pb-4 xl:hidden">
              <Button href={`/book/${slug}`} variant="outline" color="slate" className="dark:text-white">
                Change dates
              </Button>
              <Link
                href={`/hotels/${slug}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to property
              </Link>
            </div>
            <div className="space-y-5">
              {roomTypesWithRates.map((room) => (
                <RoomCard
                  key={room.roomTypeId}
                  slug={slug}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  occupancyParam={occupancy != null ? String(occupancy) : ''}
                  rooms={rooms}
                  roomTypeId={room.roomTypeId}
                  name={room.name}
                  occupancy={room.occupancy}
                  shortDescription={room.shortDescription}
                  availableRooms={room.availableRooms}
                  nights={nights}
                  averagePricePerNight={room.averagePricePerNight}
                  plans={room.plans}
                  nightsForPlans={room.nightsForPlans}
                  noRatePlanForOccupancy={room.noRatePlanForOccupancy}
                  multiRoomMode={room.multiRoomMode}
                  totalGuests={room.totalGuests}
                  totalRooms={room.totalRooms}
                  shareCombinations={room.shareCombinations}
                  plansForOccupancy1={room.plansForOccupancy1}
                  plansForOccupancy2={room.plansForOccupancy2}
                  plansForOccupancy3={room.plansForOccupancy3}
                  plansForOccupancy4={room.plansForOccupancy4}
                  nightsForPlans1={room.nightsForPlans1}
                  nightsForPlans2={room.nightsForPlans2}
                  nightsForPlans3={room.nightsForPlans3}
                  nightsForPlans4={room.nightsForPlans4}
                />
              ))}

              {roomTypesWithRates.length === 0 && (
                <div className="rounded-[2rem] border border-border/60 bg-card/70 p-6 shadow-[0_18px_45px_rgba(8,17,31,0.04)] dark:bg-card/50 sm:p-7">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                    No rooms configured
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    No room types are currently configured for this property.
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className="hidden min-w-0 xl:block">
            <div className="rounded-[1.8rem] border border-border/60 bg-card/70 p-5 text-card-foreground shadow-[0_14px_35px_rgba(8,17,31,0.04)] dark:bg-card/50 xl:sticky xl:top-8">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Stay summary
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
                <SummaryRow label="Check-in" value={checkIn} />
                <SummaryRow label="Check-out" value={checkOut} />
                <SummaryRow
                  label="Stay"
                  value={`${nights} night${nights !== 1 ? 's' : ''}`}
                />
                <SummaryRow
                  label="Rooms"
                  value={`${rooms} room${rooms !== 1 ? 's' : ''}`}
                />
                {guestSummary && <SummaryRow label="Guests" value={guestSummary} />}
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-border/60 pt-6">
                <Button href={`/book/${slug}`} variant="outline" color="slate" className=' dark:text-white'>
                  Change dates
                </Button>

                <Link
                  href={`/hotels/${slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to property
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  )
}

function SummaryChip({
  icon,
  text,
}: {
  icon: React.ReactNode
  text: string
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm text-muted-foreground dark:bg-card/50">
      {icon}
      {text}
    </span>
  )
}

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm text-foreground">{value}</span>
    </div>
  )
}