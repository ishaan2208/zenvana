'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { Button } from '@/components/Button'
import { createPublicBooking } from '@/lib/api'

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
  numRooms?: number
  ratePlan?: string
  occupancy?: number
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, handler: (res: { razorpay_payment_id: string; razorpay_order_id: string }) => void) => void
    }
  }
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
  numRooms: _numRooms,
  ratePlan: _ratePlan,
  occupancy,
}: Props) {
  const router = useRouter()
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMode, setPaymentMode] = useState<'pay_at_property' | 'pay_now'>('pay_at_property')

  const payload = () => ({
    guestName,
    guestPhone,
    guestEmail: guestEmail || undefined,
    checkIn,
    checkOut,
    roomTypeId: parseInt(roomTypeId, 10),
    totalAmount: parseFloat(totalAmount),
    occupancy: occupancy ?? 1,
  })

  async function confirmBooking(transactionId?: string) {
    const data = await createPublicBooking(slug, {
      ...payload(),
      payment: transactionId
        ? { paid: true, transactionId }
        : { paid: false },
    })
    router.push(
      `/booking/confirmation?` +
      new URLSearchParams({
        propertyName,
        checkIn,
        checkOut,
        roomTypeName,
        totalAmount,
        bookingReference: data.bookingReference,
      })
    )
  }

  async function handlePayAtProperty(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await confirmBooking()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed')
      setSubmitting(false)
    }
  }

  async function handlePayNow(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (!rzpKey) {
      setError('Online payment is not configured.')
      return
    }
    setSubmitting(true)
    try {
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(totalAmount),
          currency: 'INR',
        }),
      })
      if (!orderRes.ok) {
        const j = await orderRes.json().catch(() => ({}))
        throw new Error(j?.error ?? 'Could not create payment order')
      }
      const { orderId } = await orderRes.json()
      if (!orderId) throw new Error('Invalid order response')

      const options = {
        key: rzpKey,
        amount: Math.round(parseFloat(totalAmount) * 100),
        currency: 'INR',
        name: 'ZenVana',
        description: `Booking — ${propertyName}`,
        order_id: orderId,
        prefill: { name: guestName, email: guestEmail || undefined },
        handler: async (response: { razorpay_payment_id: string }) => {
          try {
            await confirmBooking(response.razorpay_payment_id)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Booking failed')
            setSubmitting(false)
          }
        },
      }

      const Razorpay = window.Razorpay
      if (!Razorpay) {
        setError('Payment script did not load. Please refresh and try again.')
        setSubmitting(false)
        return
      }
      const rzp = new Razorpay(options)
      rzp.on('payment.failed', () => {
        setError('Payment failed or was cancelled.')
        setSubmitting(false)
      })
      rzp.open()
      setSubmitting(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
      setSubmitting(false)
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <form
        onSubmit={paymentMode === 'pay_now' ? handlePayNow : handlePayAtProperty}
        className="mt-8 space-y-4"
      >
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

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">Payment</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="paymentMode"
                checked={paymentMode === 'pay_at_property'}
                onChange={() => setPaymentMode('pay_at_property')}
                className="rounded border-slate-300"
              />
              <span className="text-slate-700">Pay at property</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="paymentMode"
                checked={paymentMode === 'pay_now'}
                onChange={() => setPaymentMode('pay_now')}
                className="rounded border-slate-300"
              />
              <span className="text-slate-700">Pay now (₹{Number(totalAmount).toLocaleString('en-IN')})</span>
            </label>
          </div>
        </div>

        <Button type="submit" color="blue" className="w-full" disabled={submitting}>
          {submitting
            ? 'Processing…'
            : paymentMode === 'pay_now'
              ? 'Pay & confirm booking'
              : 'Confirm booking'}
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
