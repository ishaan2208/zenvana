'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import { createPublicBookingWithRoomLines } from '@/lib/api'

const MULTI_ROOM_STORAGE_KEY = 'zenvana_multi_room_booking'

type StoredPayload = {
  slug: string
  checkIn: string
  checkOut: string
  nights: number
  roomTypeId: number
  roomTypeName: string
  roomLines: Array<{ roomTypeId: number; ratePlanId: number; occupancy: number; tariff: number }>
  totalAmount: number
}

type Props = {
  slug: string
  propertyName: string
  primaryPhone?: string
}

export default function MultiRoomCheckoutForm({ slug, propertyName, primaryPhone }: Props) {
  const router = useRouter()
  const [payload, setPayload] = useState<StoredPayload | null>(null)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem(MULTI_ROOM_STORAGE_KEY) : null
      if (raw) {
        const data = JSON.parse(raw) as StoredPayload
        if (data.slug === slug && data.roomLines?.length) setPayload(data)
      }
    } catch {
      setPayload(null)
    }
  }, [slug])

  if (!payload) {
    return (
      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-amber-800">No multi-room booking in progress. Please select rooms and rate plans from the rooms page.</p>
        <Link href={`/book/${slug}/rooms`} className="mt-4 inline-block">
          <Button variant="outline" color="slate">
            Back to rooms
          </Button>
        </Link>
      </div>
    )
  }

  const { checkIn, checkOut, nights, roomTypeName, roomLines, totalAmount } = payload
  const byOcc = roomLines.reduce((acc, line) => {
    const key = line.occupancy
    if (!acc[key]) acc[key] = { count: 0, tariff: line.tariff }
    acc[key].count += 1
    return acc
  }, {} as Record<number, { count: number; tariff: number }>)
  const occLabels: Record<number, string> = { 1: 'Single', 2: 'Double', 3: 'Triple', 4: '4-share' }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const data = await createPublicBookingWithRoomLines(slug, {
        guest: { name: guestName, phone: guestPhone, email: guestEmail || undefined },
        checkIn,
        checkOut,
        roomLines: roomLines.map((l) => ({
          roomTypeId: l.roomTypeId,
          ratePlanId: l.ratePlanId,
          occupancy: l.occupancy,
          tariff: l.tariff,
        })),
        paymentIntent: 'pay_later',
      })
      if (typeof window !== 'undefined') sessionStorage.removeItem(MULTI_ROOM_STORAGE_KEY)
      router.push(
        `/booking/confirmation?` +
          new URLSearchParams({
            propertyName,
            checkIn,
            checkOut,
            roomTypeName,
            totalAmount: String(totalAmount),
            bookingReference: data.bookingReference,
          })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed')
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="font-semibold text-slate-900">Booking summary</h2>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">Room type</dt>
            <dd className="text-slate-900">{roomTypeName}</dd>
          </div>
          {Object.entries(byOcc).map(([occ, { count }]) => (
            <div key={occ} className="flex justify-between">
              <dt className="text-slate-600">{occLabels[Number(occ)] ?? `${occ}-share`} share</dt>
              <dd className="text-slate-900">{count} room{count > 1 ? 's' : ''}</dd>
            </div>
          ))}
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

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <h2 className="font-semibold text-slate-900">Guest details</h2>
        <div>
          <label htmlFor="guestName" className="block text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            id="guestName"
            type="text"
            required
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="guestPhone" className="block text-sm font-medium text-slate-700">
            Phone
          </label>
          <input
            id="guestPhone"
            type="tel"
            required
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="guestEmail" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="guestEmail"
            type="email"
            required
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" color="blue" className="w-full" disabled={submitting}>
          {submitting ? 'Processing…' : 'Confirm booking'}
        </Button>
        {primaryPhone && (
          <p className="text-center text-sm text-slate-600">
            Or call us at{' '}
            <a href={`tel:${primaryPhone}`} className="text-blue-600 hover:underline">
              {primaryPhone}
            </a>{' '}
            to book.
          </p>
        )}
      </form>
    </>
  )
}
