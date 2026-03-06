import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getPublicPropertyBySlug } from '@/lib/api'
import { Button } from '@/components/Button'
import CheckoutForm from './CheckoutForm'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    checkIn?: string
    checkOut?: string
    roomTypeId?: string
    roomTypeName?: string
    nights?: string
    totalAmount?: string
    numRooms?: string
    ratePlan?: string
    ratePlanLabel?: string
    occupancy?: string
  }>
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { slug } = await params
  const q = await searchParams

  const required = ['checkIn', 'checkOut', 'roomTypeId', 'roomTypeName', 'nights', 'totalAmount']
  const missing = required.filter((k) => !q[k as keyof typeof q])
  if (missing.length > 0) {
    redirect(`/book/${slug}/rooms?checkIn=${q.checkIn ?? ''}&checkOut=${q.checkOut ?? ''}`)
  }

  const property = await getPublicPropertyBySlug(slug)
  if (!property) notFound()

  const checkIn = q.checkIn!
  const checkOut = q.checkOut!
  const roomTypeName = q.roomTypeName!
  const nights = q.nights!
  const totalAmount = q.totalAmount!
  const numRooms = q.numRooms ? parseInt(q.numRooms, 10) : 1
  const ratePlanLabel = q.ratePlanLabel ?? (q.ratePlan === 'default' ? 'Room only' : q.ratePlan ?? 'Room only')

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-slate-900">
        Checkout — {property.publicName}
      </h1>

      <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="font-semibold text-slate-900">Booking summary</h2>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">Room</dt>
            <dd className="text-slate-900">
              {roomTypeName}
              {numRooms > 1 ? ` × ${numRooms} rooms` : ''}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Rate plan</dt>
            <dd className="text-slate-900">{ratePlanLabel}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Check-in</dt>
            <dd className="text-slate-900">{checkIn}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Check-out</dt>
            <dd className="text-slate-900">{checkOut}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Nights</dt>
            <dd className="text-slate-900">{nights}</dd>
          </div>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-semibold">
            <dt className="text-slate-900">Total</dt>
            <dd className="text-slate-900">₹{Number(totalAmount).toLocaleString('en-IN')}</dd>
          </div>
        </dl>
      </div>

      <CheckoutForm
        slug={slug}
        propertyName={property.publicName}
        primaryPhone={property.primaryPhone}
        checkIn={checkIn}
        checkOut={checkOut}
        roomTypeId={q.roomTypeId!}
        roomTypeName={roomTypeName}
        nights={nights}
        totalAmount={totalAmount}
      />

      <p className="mt-8">
        <Link
          href={`/book/${slug}/rooms?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to rooms
        </Link>
      </p>
    </div>
  )
}
