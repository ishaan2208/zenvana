'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/Button'

type Props = {
  slug: string
  propertyName: string
  primaryPhone?: string
  checkIn: string
  checkOut: string
  roomTypeId: string
  roomTypeName: string
  nights: string
  totalAmount: string
}

export default function CheckoutForm({
  slug,
  propertyName,
  primaryPhone,
  checkIn,
  checkOut,
  roomTypeId,
  roomTypeName,
  nights,
  totalAmount,
}: Props) {
  const router = useRouter()
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    // TODO: POST to backend public booking API when available.
    // For now we redirect to confirmation. You can later add:
    // await fetch(`${BACKEND}/public/properties/${slug}/booking`, { method: 'POST', body: JSON.stringify({ ... }) })
    router.push(
      `/booking/confirmation?` +
        new URLSearchParams({
          propertyName,
          checkIn,
          checkOut,
          roomTypeName,
          totalAmount,
        })
    )
  }

  return (
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
      <Button type="submit" color="blue" className="w-full" disabled={submitting}>
        {submitting ? 'Processing…' : 'Request booking'}
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
  )
}
