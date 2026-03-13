'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BedDouble,
  Mail,
  PhoneCall,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { Button } from '@/components/Button'
import { PriceWithTax } from '@/components/PriceWithTax'
import { createPublicBookingWithRoomLines } from '@/lib/api'

const MULTI_ROOM_STORAGE_KEY = 'zenvana_multi_room_booking'

type StoredPayload = {
  slug: string
  checkIn: string
  checkOut: string
  nights: number
  roomTypeId: number
  roomTypeName: string
  roomLines: Array<{
    roomTypeId: number
    ratePlanId: number
    occupancy: number
    tariff: number
  }>
  totalAmount: number
}

type Props = {
  slug: string
  propertyName: string
  primaryPhone?: string
}

export default function MultiRoomCheckoutForm({
  slug,
  propertyName,
  primaryPhone,
}: Props) {
  const router = useRouter()
  const [payload, setPayload] = useState<StoredPayload | null>(null)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw =
        typeof window !== 'undefined'
          ? sessionStorage.getItem(MULTI_ROOM_STORAGE_KEY)
          : null

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
      <div className="mt-8 rounded-[2rem] border border-amber-300/60 bg-amber-50/80 p-6 text-center dark:bg-amber-950/20">
        <p className="text-sm leading-7 text-amber-800 dark:text-amber-300">
          No multi-room booking is currently in progress. Please return to the rooms page
          and select your room combination again.
        </p>
        <Link href={`/book/${slug}/rooms`} className="mt-5 inline-block">
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

  const occLabels: Record<number, string> = {
    1: 'Single',
    2: 'Double',
    3: 'Triple',
    4: '4-share',
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const data = await createPublicBookingWithRoomLines(slug, {
        guest: {
          name: guestName,
          phone: guestPhone,
          email: guestEmail || undefined,
        },
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

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(MULTI_ROOM_STORAGE_KEY)
      }

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
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 text-card-foreground shadow-[0_18px_45px_rgba(8,17,31,0.05)] dark:bg-card/50">
        <div className="border-b border-border/60 px-5 py-5 sm:px-6">
          <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            Booking summary
          </div>
          <h2 className="mt-3 font-serif text-3xl tracking-[-0.04em] text-foreground">
            {roomTypeName}
          </h2>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryCard
              icon={<BedDouble className="h-4.5 w-4.5" />}
              label="Room type"
              value={roomTypeName}
            />
            <SummaryCard
              icon={<ShieldCheck className="h-4.5 w-4.5" />}
              label="Total"
              value={<PriceWithTax amount={Number(totalAmount)} size="default" showTaxBreakup={false} />}
            />
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-border/60 bg-background/55 p-4 dark:bg-background/35">
            <div className="space-y-3">
              {Object.entries(byOcc).map(([occ, { count }]) => (
                <div key={occ} className="flex items-start justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    {occLabels[Number(occ)] ?? `${occ}-share`} share
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {count} room{count > 1 ? 's' : ''}
                  </span>
                </div>
              ))}

              <div className="flex items-start justify-between gap-4 border-t border-border/60 pt-3">
                <span className="text-sm text-muted-foreground">Check-in</span>
                <span className="text-sm font-medium text-foreground">{checkIn}</span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-muted-foreground">Check-out</span>
                <span className="text-sm font-medium text-foreground">{checkOut}</span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-muted-foreground">Nights</span>
                <span className="text-sm font-medium text-foreground">{nights}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 text-card-foreground shadow-[0_18px_45px_rgba(8,17,31,0.05)] dark:bg-card/50">
          <div className="border-b border-border/60 px-5 py-5 sm:px-6">
            <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              Guest details
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Enter the details for the primary guest for this booking.
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
                icon={<Users className="h-4 w-4" />}
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
                  icon={<PhoneCall className="h-4 w-4" />}
                />
                <InputField
                  id="guestEmail"
                  label="Email"
                  type="email"
                  value={guestEmail}
                  onChange={setGuestEmail}
                  required
                  autoComplete="email"
                  icon={<Mail className="h-4 w-4" />}
                />
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
            {submitting ? 'Processing…' : 'Confirm booking'}
          </Button>

          {primaryPhone && (
            <div className="rounded-[1.35rem] border border-border/60 bg-card/70 px-4 py-4 text-center dark:bg-card/50">
              <p className="text-sm leading-7 text-muted-foreground">
                Need help with this booking?
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
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-[1.35rem] border border-border/60 bg-background/55 p-4 dark:bg-background/35">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </div>
          <p className="mt-2 text-sm font-medium leading-7 text-foreground">{value}</p>
        </div>
      </div>
    </div>
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
  icon,
}: {
  id: string
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  autoComplete?: string
  icon?: React.ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          required={required}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className={`block h-14 w-full rounded-[1.1rem] border border-border/70 bg-background/70 text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-background/50 ${icon ? 'pl-11 pr-4' : 'px-4'
            }`}
        />
      </div>
    </div>
  )
}