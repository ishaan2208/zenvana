import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  getPublicPropertyBySlug,
  getPublicAvailability,
  getPublicRatesBulk,
} from '@/lib/api'
import { Button } from '@/components/Button'
import { RoomCard } from './RoomCard'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ checkIn?: string; checkOut?: string; occupancy?: string }>
}

export default async function BookRoomsPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { checkIn, checkOut, occupancy: occupancyParam } = await searchParams

  if (!checkIn || !checkOut) {
    redirect(`/book/${slug}`)
  }

  const occupancy = occupancyParam ? parseInt(occupancyParam, 10) : undefined

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

  const roomTypesWithRates = availability.roomTypes.map((av) => {
    const rt = property.roomTypes.find((r) => r.id === av.roomTypeId)
    const rate = ratesByRoomTypeId.get(av.roomTypeId)
    return {
      ...av,
      shortDescription: rt?.shortDescription ?? null,
      averagePricePerNight: rate?.averagePricePerNight ?? rt?.basePrice ?? 0,
    }
  })

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-slate-900">
        Select room — {property.publicName}
      </h1>
      <p className="mt-2 text-slate-600">
        {checkIn} to {checkOut} · {nights} night{nights !== 1 ? 's' : ''}
        {occupancy != null && ` · ${occupancy} adult${occupancy !== 1 ? 's' : ''}`}
      </p>

      <div className="mt-8 space-y-4">
        {roomTypesWithRates.map((room) => (
          <RoomCard
            key={room.roomTypeId}
            slug={slug}
            checkIn={checkIn}
            checkOut={checkOut}
            occupancyParam={occupancyParam ?? ''}
            roomTypeId={room.roomTypeId}
            name={room.name}
            occupancy={room.occupancy}
            shortDescription={room.shortDescription}
            availableRooms={room.availableRooms}
            nights={nights}
            averagePricePerNight={room.averagePricePerNight}
          />
        ))}
      </div>

      {roomTypesWithRates.length === 0 && (
        <p className="mt-6 text-slate-600">No room types are configured for this property.</p>
      )}

      <p className="mt-8">
        <Link
          href={`/book/${slug}${occupancyParam ? `?occupancy=${occupancyParam}` : ''}`}
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
