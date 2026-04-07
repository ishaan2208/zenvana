'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAppRouter } from '@/hooks/useAppRouter'
import {
  BedDouble,
  CalendarRange,
  Mail,
  PhoneCall,
  ShieldCheck,
  Users,
  User2,
} from 'lucide-react'

import { Button } from '@/components/Button'
import { PriceWithMarketRate } from '@/components/PriceWithMarketRate'
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
  marketTotal?: number
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
  const router = useAppRouter()

  const [payload, setPayload] = useState<StoredPayload | null>(null)

  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    guestName?: string
    guestPhone?: string
  }>({})

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


  const byOcc = useMemo(() => {
    if (!payload) return {} as Record<number, { count: number; tariff: number }>

    return payload.roomLines.reduce((acc, line) => {
      const key = line.occupancy
      if (!acc[key]) acc[key] = { count: 0, tariff: line.tariff }
      acc[key].count += 1
      return acc
    }, {} as Record<number, { count: number; tariff: number }>)
  }, [payload])

  const totalRooms = payload?.roomLines.length ?? 0
  const totalGuests = payload?.roomLines.reduce((sum, line) => sum + line.occupancy, 0) ?? 0

  const occLabels: Record<number, string> = {
    1: 'Single',
    2: 'Double',
    3: 'Triple',
    4: '4-share',
  }

  if (!payload) {
    return (
      <div className="mt-8 rounded-[2rem] border border-amber-300/60 bg-amber-50/80 p-6 text-center dark:border-amber-700/40 dark:bg-amber-950/20">
        <p className="text-sm leading-7 text-amber-800 dark:text-amber-300">
          No multi-room booking is currently in progress. Please return to the rooms page and select your room combination again.
        </p>
        <Link href={`/book/${slug}/rooms`} className="mt-5 inline-block">
          <Button variant="outline" color="slate">
            Back to rooms
          </Button>
        </Link>
      </div>
    )
  }

  const { checkIn, checkOut, nights, roomTypeName, roomLines, totalAmount, marketTotal } = payload

  function handleGuestNameChange(value: string) {
    setGuestName(value)
    setFieldErrors((prev) => ({ ...prev, guestName: undefined }))
  }

  function handleGuestPhoneChange(value: string) {
    setGuestPhone(value)
    setFieldErrors((prev) => ({ ...prev, guestPhone: undefined }))
  }

  function validateRequiredFields() {
    const nextErrors: { guestName?: string; guestPhone?: string } = {}
    if (!guestName.trim()) nextErrors.guestName = 'Name is required'
    if (!guestPhone.trim()) nextErrors.guestPhone = 'Phone number is required'
    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateRequiredFields()) return
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
          slug,
          propertyName,
          propertyPhone: primaryPhone ?? '',
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
      <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-background/55 shadow-[0_24px_70px_rgba(8,17,31,0.08)] backdrop-blur-2xl dark:bg-background/30">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="p-5 sm:p-6 lg:p-7">
            <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              Multi-room booking summary
            </div>

            <h2 className="mt-3 font-serif text-3xl tracking-[-0.04em] text-foreground">
              {roomTypeName}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              This flow keeps the room split, guest details, and final total clear before confirmation.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <SummaryCard
                icon={<CalendarRange className="h-4.5 w-4.5" />}
                label="Stay"
                value={`${checkIn} → ${checkOut}`}
              />
              <SummaryCard
                icon={<ShieldCheck className="h-4.5 w-4.5" />}
                label="Total"
                value={
                  <PriceWithMarketRate
                    amount={Number(totalAmount)}
                    marketAmount={marketTotal}
                    size="default"
                    showTaxBreakup={false}
                  />
                }
              />
              <SummaryCard
                icon={<BedDouble className="h-4.5 w-4.5" />}
                label="Rooms"
                value={`${totalRooms} room${totalRooms !== 1 ? 's' : ''}`}
              />
              <SummaryCard
                icon={<Users className="h-4.5 w-4.5" />}
                label="Guests"
                value={`${totalGuests} guest${totalGuests !== 1 ? 's' : ''}`}
              />
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-border/60 bg-background/72 p-4 backdrop-blur-xl dark:bg-background/35">
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

                <div className="border-t border-border/60 pt-3" />

                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Nights</span>
                  <span className="text-sm font-medium text-foreground">{nights}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-7">
            <div className="rounded-[1.5rem] border border-border/60 bg-background/72 p-4 backdrop-blur-xl dark:bg-background/35">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Payment note
              </div>
              <div className="mt-3 text-sm font-medium text-foreground">
                Multi-room checkout keeps the current pay-later flow
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                This matches the existing room-lines booking contract in your current implementation.
              </p>
            </div>

            {primaryPhone && (
              <div className="mt-4 rounded-[1.5rem] border border-border/60 bg-background/72 p-4 backdrop-blur-xl dark:bg-background/35">
                <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Need help?
                </div>
                <a
                  href={`tel:${primaryPhone}`}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-foreground transition hover:underline"
                >
                  <PhoneCall className="h-4 w-4" />
                  {primaryPhone}
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-background/55 shadow-[0_18px_45px_rgba(8,17,31,0.05)] backdrop-blur-2xl dark:bg-background/30">
          <div className="border-b border-border/60 px-5 py-5 sm:px-6">
            <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              Guest details
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Enter the primary guest details for this booking.
            </p>
          </div>

          <div className="px-5 py-5 sm:px-6 sm:py-6">
            <div className="grid gap-5">
              <InputField
                id="guestName"
                label="Full name"
                type="text"
                value={guestName}
                onChange={handleGuestNameChange}
                autoComplete="name"
                icon={<User2 className="h-4 w-4" />}
                error={fieldErrors.guestName}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <InputField
                  id="guestPhone"
                  label="Phone"
                  type="tel"
                  value={guestPhone}
                  onChange={handleGuestPhoneChange}
                  autoComplete="tel"
                  icon={<PhoneCall className="h-4 w-4" />}
                  error={fieldErrors.guestPhone}
                />

                <InputField
                  id="guestEmail"
                  label="Email"
                  type="email"
                  value={guestEmail}
                  onChange={setGuestEmail}
                  autoComplete="email"
                  icon={<Mail className="h-4 w-4" />}
                />
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div
            className="rounded-[1.35rem] border border-red-300/60 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/20 dark:text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Button
            type="submit"
            color="blue"
            className="h-14 w-full rounded-[1.1rem] text-sm font-medium shadow-[0_14px_34px_rgba(37,99,235,0.22)]"
            disabled={submitting}
          >
            {submitting ? 'Processing…' : 'Confirm booking'}
          </Button>

          {primaryPhone && (
            <div className="rounded-[1.35rem] border border-border/60 bg-background/55 px-4 py-4 text-center backdrop-blur-xl dark:bg-background/30">
              <p className="text-sm leading-7 text-muted-foreground">
                Need help with this booking?
              </p>
              <a
                href={`tel:${primaryPhone}`}
                className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-foreground transition hover:underline"
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
  icon: ReactNode
  label: string
  value: ReactNode
}) {
  return (
    <div className="rounded-[1.35rem] border border-border/60 bg-background/72 p-4 backdrop-blur-xl dark:bg-background/35">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground dark:bg-background/45">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 text-sm font-medium leading-7 text-foreground">
            {value}
          </div>
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
  error,
}: {
  id: string
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  autoComplete?: string
  icon?: ReactNode
  error?: string
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
          aria-invalid={Boolean(error)}
          className={`block h-14 w-full rounded-[1.1rem] border bg-background/70 text-foreground shadow-none outline-none transition placeholder:text-muted-foreground focus:ring-2 dark:bg-background/50 ${error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
            : 'border-border/70 focus:border-primary focus:ring-primary/15'
            } ${icon ? 'pl-11 pr-4' : 'px-4'
            }`}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

