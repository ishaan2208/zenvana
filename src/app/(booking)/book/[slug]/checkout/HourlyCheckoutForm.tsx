'use client'

import { useState } from 'react'
import { useAppRouter } from '@/hooks/useAppRouter'
import {
  createPublicHourlyBooking,
  sendPublicBookingOtp,
  verifyPublicBookingOtp,
} from '@/lib/api'
import { Button } from '@/components/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trackBookingCompletedAction } from '@/app/actions/analytics'

type Props = {
  slug: string
  propertyName: string
  primaryPhone?: string
  date: string
  startTime: string
  durationHours: number
  roomTypeId: string
  roomTypeName: string
  totalAmount: string
  occupancy: number
}

export default function HourlyCheckoutForm({
  slug,
  propertyName,
  primaryPhone,
  date,
  startTime,
  durationHours,
  roomTypeId,
  roomTypeName,
  totalAmount,
  occupancy,
}: Props) {
  const router = useAppRouter()
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpBusy, setOtpBusy] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSendOtp() {
    setError(null)
    if (!guestPhone.trim() || guestPhone.trim().replace(/\D/g, '').length < 10) {
      setError('Enter a valid WhatsApp number')
      return
    }
    setOtpBusy(true)
    try {
      await sendPublicBookingOtp(slug, guestPhone.trim())
      setOtpSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setOtpBusy(false)
    }
  }

  async function handleVerifyOtp() {
    setError(null)
    if (!otp.trim()) {
      setError('Enter the OTP')
      return
    }
    setOtpBusy(true)
    try {
      await verifyPublicBookingOtp(slug, guestPhone.trim(), otp.trim())
      setOtpVerified(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed')
    } finally {
      setOtpBusy(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!guestName.trim()) {
      setError('Guest name is required')
      return
    }
    if (!guestPhone.trim()) {
      setError('Phone is required')
      return
    }
    if (!otpVerified) {
      setError('Please verify your WhatsApp number')
      return
    }

    setSubmitting(true)
    try {
      const data = await createPublicHourlyBooking(slug, {
        stayKind: 'HOURLY',
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim() || undefined,
        date,
        startTime,
        durationHours,
        roomTypeId: parseInt(roomTypeId, 10),
        totalAmount: Number(totalAmount),
        occupancy,
        payment: { paid: false },
      })

      trackBookingCompletedAction({
        bookingReference: data.bookingReference,
        propertySlug: slug,
        paymentMode: 'pay_at_property',
        amount: Number(totalAmount),
        meta: {
          stayKind: 'hourly',
          durationHours,
          roomTypeName,
        },
      }).catch(() => {})

      router.push(
        `/booking/confirmation?` +
          new URLSearchParams({
            slug,
            propertyName,
            propertyPhone: primaryPhone ?? '',
            checkIn: date,
            checkOut: data.checkOut ?? date,
            roomTypeName,
            totalAmount: String(totalAmount),
            bookingReference: data.bookingReference,
            stayKind: 'hourly',
            startTime,
            durationHours: String(durationHours),
          }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card/50 p-4 text-sm">
        <p className="font-medium">{roomTypeName}</p>
        <p className="mt-1 text-muted-foreground">
          {date} · {startTime} · {durationHours} hours · {occupancy} guest
          {occupancy === 1 ? '' : 's'}
        </p>
        <p className="mt-2 text-xl font-semibold">
          ₹{Number(totalAmount).toLocaleString('en-IN')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="hourly-name">Guest name</Label>
          <Input
            id="hourly-name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hourly-phone">WhatsApp number</Label>
          <Input
            id="hourly-phone"
            value={guestPhone}
            onChange={(e) => {
              setGuestPhone(e.target.value)
              setOtpVerified(false)
              setOtpSent(false)
            }}
            required
            autoComplete="tel"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hourly-email">Email (optional)</Label>
          <Input
            id="hourly-email"
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[8rem] flex-1 space-y-1.5">
            <Label htmlFor="hourly-otp">OTP</Label>
            <Input
              id="hourly-otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={!otpSent || otpVerified}
              placeholder="6-digit code"
            />
          </div>
          {!otpVerified ? (
            <Button
              type="button"
              variant="outline"
              color="slate"
              disabled={otpBusy}
              onClick={() => void (otpSent ? handleVerifyOtp() : handleSendOtp())}
            >
              {otpBusy
                ? '…'
                : otpSent
                  ? 'Verify OTP'
                  : 'Send WhatsApp OTP'}
            </Button>
          ) : (
            <p className="pb-2 text-sm text-emerald-600">Phone verified</p>
          )}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting || !otpVerified} className="w-full">
        {submitting ? 'Confirming…' : 'Confirm hourly stay · Pay at property'}
      </Button>
    </form>
  )
}
