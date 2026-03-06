import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getPublicPropertyBySlug, getPublicRatesWithPlans } from '@/lib/api'
import { RatePlanSelector } from './RatePlanSelector'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    checkIn?: string
    checkOut?: string
    roomTypeId?: string
    roomTypeName?: string
    occupancy?: string
    availableRooms?: string
  }>
}

export default async function RatePlanPage({ params, searchParams }: Props) {
  const { slug } = await params
  const q = await searchParams

  const required = ['checkIn', 'checkOut', 'roomTypeId', 'roomTypeName']
  const missing = required.filter((k) => !q[k as keyof typeof q])
  if (missing.length > 0) {
    redirect(`/book/${slug}/rooms?checkIn=${q.checkIn ?? ''}&checkOut=${q.checkOut ?? ''}&occupancy=${q.occupancy ?? ''}`)
  }

  const property = await getPublicPropertyBySlug(slug)
  if (!property) notFound()

  const occupancy = q.occupancy ? parseInt(q.occupancy, 10) : undefined
  const ratesWithPlans = await getPublicRatesWithPlans(
    slug,
    Number(q.roomTypeId),
    q.checkIn!,
    q.checkOut!,
    occupancy
  )

  if (!ratesWithPlans) {
    return (
      <div>
        <p className="text-slate-600">We couldn’t load rate plans. Please try again.</p>
        <Link href={`/book/${slug}/rooms?checkIn=${q.checkIn}&checkOut=${q.checkOut}&occupancy=${q.occupancy ?? ''}`} className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          ← Back to rooms
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-slate-900">
        Choose rate plan — {q.roomTypeName}
      </h1>
      <p className="mt-2 text-slate-600">
        {q.checkIn} to {q.checkOut} · {ratesWithPlans.nights} night{ratesWithPlans.nights !== 1 ? 's' : ''}
        {occupancy != null && ` · ${occupancy} adult${occupancy !== 1 ? 's' : ''}`}
      </p>

      <RatePlanSelector
        slug={slug}
        checkIn={q.checkIn!}
        checkOut={q.checkOut!}
        roomTypeId={q.roomTypeId!}
        roomTypeName={q.roomTypeName!}
        nights={String(ratesWithPlans.nights)}
        occupancy={q.occupancy ?? ''}
        plans={ratesWithPlans.plans}
        availableRooms={Math.max(1, parseInt(q.availableRooms ?? '1', 10) || 1)}
      />

      <p className="mt-8">
        <Link
          href={`/book/${slug}/rooms?checkIn=${encodeURIComponent(q.checkIn!)}&checkOut=${encodeURIComponent(q.checkOut!)}&occupancy=${q.occupancy ?? ''}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to room types
        </Link>
      </p>
    </div>
  )
}
