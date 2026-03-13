'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import {
  BadgeCheck,
  CreditCard,
  PhoneCall,
  ShieldCheck,
} from 'lucide-react'

import { Button } from '@/components/Button'
import { PriceWithTax } from '@/components/PriceWithTax'
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
      on: (
        event: string,
        handler: (res: {
          razorpay_payment_id: string
          razorpay_order_id: string
        }) => void
      ) => void
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
  const [paymentMode, setPaymentMode] = useState<'pay_at_property' | 'pay_now'>(
    'pay_at_property'
  )

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
        className="space-y-6"
      >
        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 text-card-foreground shadow-[0_18px_45px_rgba(8,17,31,0.05)] dark:bg-card/50">
          <div className="border-b border-border/60 px-5 py-5 sm:px-6">
            <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              Guest details
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Enter the details for the primary guest. We will use these for booking
              confirmation and stay communication.
            </p>
          </div>

          <div className="px-5 py-5 sm:px-6 sm:py-6">
            <div className="grid gap-5">
              <InputField
                id="guestName"
                label="Full name"
                type="text"
                value={guestName}
                onChange={setGuestName}
                required
                autoComplete="name"
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <InputField
                  id="guestPhone"
                  label="Phone"
                  type="tel"
                  value={guestPhone}
                  onChange={setGuestPhone}
                  required
                  autoComplete="tel"
                />

                <InputField
                  id="guestEmail"
                  label="Email"
                  type="email"
                  value={guestEmail}
                  onChange={setGuestEmail}
                  required
                  autoComplete="email"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 text-card-foreground shadow-[0_18px_45px_rgba(8,17,31,0.05)] dark:bg-card/50">
          <div className="border-b border-border/60 px-5 py-5 sm:px-6">
            <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              Payment
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Choose whether to confirm now and pay at the property, or complete payment
              online.
            </p>
          </div>

          <div className="px-5 py-5 sm:px-6 sm:py-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <PaymentOptionCard
                checked={paymentMode === 'pay_at_property'}
                onSelect={() => setPaymentMode('pay_at_property')}
                title="Pay at property"
                description="Confirm the booking now and settle the amount during your stay."
                icon={<BadgeCheck className="h-5 w-5" />}
              />

              <PaymentOptionCard
                checked={paymentMode === 'pay_now'}
                onSelect={() => setPaymentMode('pay_now')}
                title="Pay now"
                description={
                  <>
                    Complete payment online for <PriceWithTax amount={Number(totalAmount)} size="sm" showTaxBreakup={false} />.
                  </>
                }
                icon={<CreditCard className="h-5 w-5" />}
              />
            </div>

            <div className="mt-5 rounded-[1.35rem] border border-border/60 bg-background/55 px-4 py-4 dark:bg-background/35">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-sm leading-7 text-muted-foreground">
                  Your booking is made directly with the property. This keeps the process
                  clearer and makes pre-arrival coordination easier.
                </p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div
            className="rounded-[1.35rem] border border-red-300/60 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Button
            type="submit"
            color="blue"
            className="h-14 w-full rounded-[1.1rem] text-sm font-medium"
            disabled={submitting}
          >
            {submitting
              ? 'Processing…'
              : paymentMode === 'pay_now'
                ? 'Pay & confirm booking'
                : 'Confirm booking'}
          </Button>

          {primaryPhone && (
            <div className="rounded-[1.35rem] border border-border/60 bg-card/70 px-4 py-4 text-center dark:bg-card/50">
              <p className="text-sm leading-7 text-muted-foreground">
                Prefer to complete this by phone?
              </p>
              <a
                href={`tel:${primaryPhone}`}
                className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
              >
                <PhoneCall className="h-4 w-4" />
                {primaryPhone}
              </a>
            </div>
          )}
        </div>
      </form>
    </>
  )
}

function InputField({
  id,
  label,
  type,
  value,
  onChange,
  required,
  autoComplete,
}: {
  id: string
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  autoComplete?: string
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="block h-14 w-full rounded-[1.1rem] border border-border/70 bg-background/70 px-4 text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-background/50"
      />
    </div>
  )
}

function PaymentOptionCard({
  checked,
  onSelect,
  title,
  description,
  icon,
}: {
  checked: boolean
  onSelect: () => void
  title: string
  description: React.ReactNode
  icon: React.ReactNode
}) {
  return (
    <label
      className={`cursor-pointer rounded-[1.4rem] border p-4 transition-all ${checked
        ? 'border-primary bg-primary/5 ring-1 ring-primary'
        : 'border-border/60 bg-background/55 hover:border-foreground/15 dark:bg-background/35'
        }`}
    >
      <input
        type="radio"
        name="paymentMode"
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />

      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
          {icon}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-base font-medium tracking-tight text-foreground">{title}</p>
            {checked && (
              <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-primary">
                Selected
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
        </div>
      </div>
    </label>
  )
}