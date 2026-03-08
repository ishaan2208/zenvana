import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  getPublicPropertyBySlug,
  getPublicAvailability,
  getPublicRatesBulk,
  getPublicRatesWithPlans,
} from '@/lib/api'
import type { PublicRatesWithPlansPlan } from '@/lib/api'
import { Button } from '@/components/Button'
import { RoomCard } from './RoomCard'
import { getShareCombinations, filterPreferNoTriple } from './shareCombinations'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ checkIn?: string; checkOut?: string; occupancy?: string; rooms?: string; guests?: string }>
}

export default async function BookRoomsPage({ params, searchParams }: Props) {
  const { slug } = await params
  const q = await searchParams
  const { checkIn, checkOut, occupancy: occupancyParam, rooms: roomsParam, guests: guestsParam } = q

  if (!checkIn || !checkOut) {
    redirect(`/book/${slug}`)
  }

  const rooms = roomsParam ? parseInt(roomsParam, 10) : 1
  const guests = guestsParam ? parseInt(guestsParam, 10) : undefined
  const occupancy = guests ?? (occupancyParam ? parseInt(occupancyParam, 10) : undefined)

  const [property, availability, ratesBulk] = await Promise.all([
    getPublicPropertyBySlug(slug),
    getPublicAvailability(slug, checkIn, checkOut),
    getPublicRatesBulk(slug, checkIn, checkOut, occupancy),
  ])

  if (!property) notFound()

  if (!availability) {
    return (
      <div>
        <p className="text-slate-600">
          We couldn’t load availability for these dates. Please check the dates
          and try again.
        </p>
        <Button href={`/book/${slug}`} variant="outline" color="slate" className="mt-4">
          Change dates
        </Button>
        <p className="mt-6">
          <Link href={`/hotels/${slug}`} className="text-sm text-blue-600 hover:underline">
            ← Back to property
          </Link>
        </p>
      </div>
    )
  }

  const nights = availability.nights
  const ratesByRoomTypeId = new Map(
    ratesBulk?.roomTypes?.map((r) => [r.roomTypeId, r]) ?? []
  )

  // Multi-room: fetch plans for 1–4 guests per room and compute share combinations (e.g. 7 in 3 = 2 double + 1 triple)
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
            getPublicRatesWithPlans(slug, av.roomTypeId, checkIn, checkOut, 4),
          ])
        : getPublicRatesWithPlans(slug, av.roomTypeId, checkIn, checkOut, occupancy ?? undefined)
    )
  )

  const roomTypesWithRates = availability.roomTypes.map((av, i) => {
    const rt = property.roomTypes.find((r) => r.id === av.roomTypeId)
    const rate = ratesByRoomTypeId.get(av.roomTypeId)
    const plansData = plansPerType[i]
    if (isMultiRoomWithGuests && Array.isArray(plansData)) {
      const [data1, data2, data3, data4] = plansData as [
        Awaited<ReturnType<typeof getPublicRatesWithPlans>>,
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
        plansForOccupancy4: (data4?.plans ?? []) as PublicRatesWithPlansPlan[],
        nightsForPlans1: data1?.nights ?? nights,
        nightsForPlans2: data2?.nights ?? nights,
        nightsForPlans3: data3?.nights ?? nights,
        nightsForPlans4: data4?.nights ?? nights,
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

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-slate-900">
        Select room — {property.publicName}
      </h1>
      <p className="mt-2 text-slate-600">
        {checkIn} to {checkOut} · {nights} night{nights !== 1 ? 's' : ''}
        {rooms > 0 && ` · ${rooms} room${rooms !== 1 ? 's' : ''}`}
        {occupancy != null && ` · ${occupancy} guest${occupancy !== 1 ? 's' : ''}`}
      </p>

      <div className="mt-8 space-y-4">
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
      </div>

      {roomTypesWithRates.length === 0 && (
        <p className="mt-6 text-slate-600">No room types are configured for this property.</p>
      )}

      <p className="mt-8">
        <Link
          href={`/book/${slug}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Change dates
        </Link>
        {' · '}
        <Link href={`/hotels/${slug}`} className="text-sm text-blue-600 hover:underline">
          Back to property
        </Link>
      </p>
    </div>
  )
}
