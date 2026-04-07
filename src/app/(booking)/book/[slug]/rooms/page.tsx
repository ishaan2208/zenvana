import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Hotel,
  MapPin,
  Sparkles,
} from 'lucide-react'

import {
  getPublicAvailability,
  getPublicPropertyBySlug,
  getPublicRatesBulk,
  getPublicRatesWithPlans,
} from '@/lib/api'
import type { PublicRatesWithPlansPlan } from '@/lib/api'
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { SoldOutTag } from '@/components/SoldOutTag'
import { RoomCard } from './RoomCard'
import { isRoomTypePurchasable } from './roomAvailability'
import {
  filterPreferDoubleSharing,
  filterPreferNoTriple,
  getShareCombinations,
} from './shareCombinations'

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
      <main className="min-h-screen bg-background text-foreground">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(120,119,198,0.10),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_28%)]" />
        <Container className="relative py-6 sm:py-8 lg:py-12">
          <Link
            href={`/book/${slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm font-medium text-foreground/80 backdrop-blur-xl transition hover:text-foreground dark:bg-background/40"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to stay details
          </Link>

          <section className="mt-5 overflow-hidden rounded-[2rem] border border-border/60 bg-background/55 shadow-[0_24px_70px_rgba(8,17,31,0.08)] backdrop-blur-2xl dark:bg-background/30">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="p-5 sm:p-6 lg:p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[10px] uppercase tracking-[0.26em] text-muted-foreground dark:bg-background/40">
                  <Sparkles className="h-3.5 w-3.5" />
                  Room selection
                </div>

                <h1 className="mt-4 font-serif text-[clamp(2rem,5vw,4rem)] leading-[0.95] tracking-[-0.05em] text-foreground">
                  We couldn’t load rooms for these dates.
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Live availability was not returned for your selected stay. Change the dates and try again.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button href={`/book/${slug}`} variant="outline" color="slate" className="dark:text-white">
                    Change dates
                  </Button>

                  <Link
                    href={`/hotels/${slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm font-medium text-foreground/80 backdrop-blur-xl transition hover:text-foreground dark:bg-background/40"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to property
                  </Link>
                </div>
              </div>

              <div className="border-t border-border/60 p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-8">
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
                  <SummaryRow label="Rooms requested" value={`${rooms} room${rooms !== 1 ? 's' : ''}`} />
                  {occupancy != null && (
                    <SummaryRow
                      label="Guests"
                      value={
                        guestsPerRoom != null && rooms >= 6
                          ? `${guestsPerRoom} / room (${occupancy} total)`
                          : `${occupancy} guest${occupancy !== 1 ? 's' : ''}`
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </section>
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
    ? filterPreferDoubleSharing(filterPreferNoTriple(getShareCombinations(rooms, occupancy!)))
    : []

  const hasConfiguredPropertyRooms = property.roomTypes.length > 0

  /** Skip rate-plan fetches when inventory cannot satisfy the guest’s room count. */
  const inventoryEligible = availability.roomTypes.filter(
    (av) => av.availableRooms > 0 && av.availableRooms >= rooms,
  )

  const plansPerType = await Promise.all(
    inventoryEligible.map((av) =>
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

  const propertyRoomTypeById = new Map(
    property.roomTypes.map((roomType) => [String(roomType.id), roomType] as const)
  )
  const propertyRoomTypeByName = new Map(
    property.roomTypes.map((roomType) => [roomType.name.trim().toLowerCase(), roomType] as const)
  )

  const roomTypesWithRates = inventoryEligible.map((av, i) => {
    const rt =
      propertyRoomTypeById.get(String(av.roomTypeId)) ??
      propertyRoomTypeByName.get(av.name.trim().toLowerCase())
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
        roomImages: rt?.images ?? null,
        averagePricePerNight: rate?.averagePricePerNight ?? rt?.basePrice ?? 0,
        averageMarketRatePerNight: rate?.averageMarketRatePerNight,
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
      roomImages: rt?.images ?? null,
      averagePricePerNight: rate?.averagePricePerNight ?? rt?.basePrice ?? 0,
      averageMarketRatePerNight: rate?.averageMarketRatePerNight,
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

  const bookableRoomTypes = roomTypesWithRates.filter((room) =>
    isRoomTypePurchasable(room, rooms),
  )

  const allRoomsSoldOutForStay =
    hasConfiguredPropertyRooms && bookableRoomTypes.length === 0

  const stayDetailsHref = `/book/${slug}?checkIn=${checkIn}&checkOut=${checkOut}&rooms=${rooms}${occupancy != null ? `&guests=${occupancy}` : ''}${guestsPerRoom != null ? `&guestsPerRoom=${guestsPerRoom}` : ''}`

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(120,119,198,0.10),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_28%)]" />

      <Container className="relative py-5 sm:py-6 lg:py-10">
        <Link
          href={stayDetailsHref}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm font-medium text-foreground/80 backdrop-blur-xl transition hover:text-foreground dark:bg-background/40"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to stay details
        </Link>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-8">
          <div className="min-w-0 space-y-5">
            {!hasConfiguredPropertyRooms ? (
              <div className="rounded-[2rem] border border-border/60 bg-background/55 p-6 shadow-[0_18px_45px_rgba(8,17,31,0.04)] backdrop-blur-2xl dark:bg-background/30 sm:p-7">
                <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  No rooms configured
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  No room types are currently configured for this property.
                </p>
              </div>
            ) : allRoomsSoldOutForStay ? (
              <section className="relative overflow-hidden rounded-[2rem] border border-rose-200/70 bg-gradient-to-br from-rose-50/95 via-background/85 to-background/60 shadow-[0_28px_80px_rgba(190,18,60,0.12)] backdrop-blur-2xl dark:border-rose-900/50 dark:from-rose-950/40 dark:via-background/40 dark:to-background/25 sm:p-2">
                <div
                  className="pointer-events-none absolute -right-6 -top-10 select-none sm:-right-4 sm:-top-6"
                  aria-hidden
                >
                  <span className="block rotate-[-14deg] text-[clamp(3.5rem,14vw,7rem)] font-black uppercase leading-none tracking-tighter text-rose-200/90 dark:text-rose-950/50">
                    Sold
                  </span>
                  <span className="-mt-2 block rotate-[-14deg] text-[clamp(2.5rem,10vw,5rem)] font-black uppercase leading-none tracking-tighter text-rose-300/80 dark:text-rose-900/40">
                    Out
                  </span>
                </div>

                <div className="relative p-6 sm:p-8 lg:p-10">
                  <div className="inline-flex flex-wrap items-center gap-3">
                    <SoldOutTag className="px-4 py-2 text-xs tracking-[0.18em]" label="Fully booked" />
                    <span className="text-[11px] uppercase tracking-[0.24em] text-rose-800/80 dark:text-rose-200/80">
                      {property.publicName}
                    </span>
                  </div>

                  <h1 className="mt-5 max-w-xl font-serif text-[clamp(1.75rem,4.5vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-foreground">
                    All rooms are sold out for these dates
                  </h1>

                  <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
                    Every room type at this hotel is unavailable for your stay — not enough inventory
                    or no matching rate plans for your guest count. Browse other Zenvana properties or
                    change your dates and room configuration.
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <Button
                      href="/hotels"
                      color="blue"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl sm:w-auto"
                    >
                      <Hotel className="h-4 w-4" />
                      View all properties
                    </Button>
                    <Button
                      href={stayDetailsHref}
                      variant="outline"
                      color="slate"
                      className="dark:text-white"
                    >
                      Change dates or rooms
                    </Button>
                    <Link
                      href={`/hotels/${slug}`}
                      className="inline-flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:px-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      This hotel’s page
                    </Link>
                  </div>
                </div>
              </section>
            ) : (
              bookableRoomTypes.map((room) => (
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
                  roomImages={room.roomImages}
                  availableRooms={room.availableRooms}
                  nights={nights}
                  averagePricePerNight={room.averagePricePerNight}
                  averageMarketRatePerNight={room.averageMarketRatePerNight}
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
              ))
            )}
          </div>

          <aside>
            <div className="sticky top-8 rounded-[1.8rem] border border-border/60 bg-background/55 p-5 shadow-[0_18px_45px_rgba(8,17,31,0.05)] backdrop-blur-2xl dark:bg-background/30">
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
                <SummaryRow label="Rooms" value={`${rooms} room${rooms !== 1 ? 's' : ''}`} />
                {guestSummary && <SummaryRow label="Guests" value={guestSummary} />}
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </main>
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
      <span className="text-right text-sm text-foreground">
        {value}
      </span>
    </div>
  )
}
