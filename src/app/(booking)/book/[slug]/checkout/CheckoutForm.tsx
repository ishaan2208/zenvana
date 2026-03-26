'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import {
  BadgeCheck,
  CalendarRange,
  CheckCircle2,
  CreditCard,
  Mail,
  PhoneCall,
  ShieldCheck,
  User2,
  Wallet,
} from 'lucide-react'

import { Button } from '@/components/Button'
import { PriceWithMarketRate } from '@/components/PriceWithMarketRate'
import {
  createPublicBooking,
  sendPublicBookingOtp,
  verifyPublicBookingOtp,
} from '@/lib/api'

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
  marketTotal?: number
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

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
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
  marketTotal,
  numRooms: _numRooms,
  ratePlan: _ratePlan,
  occupancy,
}: Props) {
  const router = useRouter()

  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    guestName?: string
    guestPhone?: string
  }>({})

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [maskedPhone, setMaskedPhone] = useState('')
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [verifiedPhone, setVerifiedPhone] = useState('')
  const [otpBusy, setOtpBusy] = useState(false)

  const [paymentMode, setPaymentMode] = useState<'pay_at_property' | 'pay_now'>(
    'pay_now'
  )

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  function resetPhoneVerification(nextPhone?: string) {
    const resolvedPhone = nextPhone ?? guestPhone
    const normalized = resolvedPhone.replace(/\D/g, '').slice(-10)
    const verified = verifiedPhone.replace(/\D/g, '').slice(-10)

    if (normalized === verified && phoneVerified) return

    setPhoneVerified(false)
    setVerifiedPhone('')
    setOtp('')
    setOtpSent(false)
    setMaskedPhone('')
    setOtpExpiresAt(null)
    setResendCooldown(0)
  }

  function handleGuestPhoneChange(value: string) {
    setGuestPhone(value)
    setFieldErrors((prev) => ({ ...prev, guestPhone: undefined }))
    resetPhoneVerification(value)
  }

  function handleGuestNameChange(value: string) {
    setGuestName(value)
    setFieldErrors((prev) => ({ ...prev, guestName: undefined }))
  }

  function validateRequiredFields() {
    const nextErrors: { guestName?: string; guestPhone?: string } = {}
    if (!guestName.trim()) nextErrors.guestName = 'Name is required'
    if (!guestPhone.trim()) nextErrors.guestPhone = 'Phone number is required'
    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSendOtp() {
    try {
      setOtpBusy(true)
      setError(null)
      const data = await sendPublicBookingOtp(slug, guestPhone)
      setOtpSent(true)
      setMaskedPhone(data.maskedPhone ?? '')
      setOtpExpiresAt(data.expiresAt ?? null)
      setResendCooldown(60)
      setOtp('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setOtpBusy(false)
    }
  }

  async function handleVerifyOtp() {
    try {
      setOtpBusy(true)
      setError(null)
      await verifyPublicBookingOtp(slug, guestPhone, otp)
      setPhoneVerified(true)
      setVerifiedPhone(guestPhone)
      setOtp('')
      setOtpSent(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed')
    } finally {
      setOtpBusy(false)
    }
  }

  const expiresInSeconds = otpExpiresAt
    ? Math.max(0, Math.floor((new Date(otpExpiresAt).getTime() - Date.now()) / 1000))
    : null

  const phoneReadyForOtp = guestPhone.replace(/\D/g, '').length >= 10

  const guestSummary = useMemo(() => {
    const rooms = _numRooms ?? 1
    const guestText =
      occupancy != null
        ? `${occupancy} guest${occupancy !== 1 ? 's' : ''}`
        : 'Guest details'

    return {
      rooms,
      guestText,
    }
  }, [_numRooms, occupancy])

  const payload = () => ({
    guestName,
    guestPhone,
    guestEmail: guestEmail || undefined,
    checkIn,
    checkOut,
    roomTypeId: parseInt(roomTypeId, 10),
    totalAmount: parseFloat(totalAmount),
    numRooms: _numRooms ?? 1,
    ratePlan: _ratePlan,
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
        slug,
        propertyName,
        propertyPhone: primaryPhone ?? '',
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

    if (!validateRequiredFields()) return

    if (!phoneVerified) {
      setError('Please verify guest phone via WhatsApp OTP before booking.')
      return
    }

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
    if (!validateRequiredFields()) return
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
        prefill: {
          name: guestName,
          email: guestEmail || undefined,
          contact: guestPhone || undefined,
        },
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
        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-background/55 shadow-[0_24px_70px_rgba(8,17,31,0.08)] backdrop-blur-2xl dark:bg-background/30">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="p-5 sm:p-6 lg:p-7">
              <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                Booking summary
              </div>

              <h2 className="mt-3 font-serif text-3xl tracking-[-0.04em] text-foreground">
                {roomTypeName}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                Final guest details, WhatsApp verification, payment, done. This is the last clean stretch before confirmation.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <SummaryCard
                  icon={<CalendarRange className="h-4.5 w-4.5" />}
                  label="Stay"
                  value={`${checkIn} → ${checkOut}`}
                />
                <SummaryCard
                  icon={<BadgeCheck className="h-4.5 w-4.5" />}
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
                  icon={<ShieldCheck className="h-4.5 w-4.5" />}
                  label="Rooms"
                  value={`${guestSummary.rooms} room${guestSummary.rooms !== 1 ? 's' : ''}`}
                />
                <SummaryCard
                  icon={<User2 className="h-4.5 w-4.5" />}
                  label="Occupancy"
                  value={guestSummary.guestText}
                />
              </div>
            </div>

            <div className="border-t border-border/60 p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-7">
              <div className="rounded-[1.5rem] border border-border/60 bg-background/72 p-4 backdrop-blur-xl dark:bg-background/35">
                <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Recommended path
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                    Default
                  </span>
                  <span className="text-sm font-medium text-foreground">Pay now</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  This is preselected so guests can complete the booking in one smooth pass.
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

        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-background/55 shadow-[0_18px_45px_rgba(8,17,31,0.05)] backdrop-blur-2xl dark:bg-background/30">
          <div className="border-b border-border/60 px-5 py-5 sm:px-6">
            <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              Guest details
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Enter the primary guest details exactly as they should appear on the booking.
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

              {paymentMode === 'pay_at_property' && (
                <div
                  className={`rounded-[1.35rem] border p-4 ${phoneVerified
                    ? 'border-emerald-300/60 bg-emerald-50/80 text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-950/25 dark:text-emerald-300'
                    : 'border-[#25D366]/20 bg-[linear-gradient(180deg,rgba(37,211,102,0.10),rgba(37,211,102,0.04))] text-foreground dark:bg-[linear-gradient(180deg,rgba(37,211,102,0.12),rgba(37,211,102,0.03))]'
                    }`}
                >
                  {phoneVerified ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">Phone verified successfully on WhatsApp.</span>
                      </div>

                      <button
                        type="button"
                        className="text-xs font-medium text-foreground hover:underline dark:text-white"
                        onClick={() => {
                          setPhoneVerified(false)
                          setVerifiedPhone('')
                        }}
                      >
                        Verify another number
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_28px_rgba(37,211,102,0.28)]">
                          <WhatsAppIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                            WhatsApp verification
                          </div>
                          <p className="mt-2 text-sm leading-7 text-muted-foreground">
                            We verify the guest phone on WhatsApp before confirming pay-at-property bookings.
                          </p>
                        </div>
                      </div>

                      {!otpSent ? (
                        <button
                          type="button"
                          disabled={!phoneReadyForOtp || otpBusy}
                          onClick={handleSendOtp}
                          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[1rem] border border-[#25D366]/70 bg-[#25D366]  px-4 text-sm font-medium text-white shadow-[0_16px_30px_rgba(37,211,102,0.22)] transition hover:bg-[#1fbe5a] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                          <WhatsAppIcon className="h-5 w-5" />
                          {otpBusy ? 'Sending OTP…' : 'Send OTP on WhatsApp'}
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground">
                            OTP sent to {maskedPhone || guestPhone}
                            {expiresInSeconds != null
                              ? ` • Expires in ${formatCountdown(expiresInSeconds)}`
                              : ''}
                          </p>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={otp}
                              onChange={(e) =>
                                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                              }
                              className="h-12 w-full rounded-[1rem] border border-border/70 bg-background/70 px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-background/50"
                              placeholder="Enter 6-digit OTP"
                            />

                            <button
                              type="button"
                              disabled={otp.length !== 6 || otpBusy}
                              onClick={handleVerifyOtp}
                              className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] bg-[#25D366] px-5 text-sm font-medium text-white shadow-[0_16px_30px_rgba(37,211,102,0.22)] transition hover:bg-[#1fbe5a] disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[160px]"
                            >
                              <WhatsAppIcon className="h-4.5 w-4.5" />
                              {otpBusy ? 'Verifying…' : 'Verify on WhatsApp'}
                            </button>
                          </div>

                          <button
                            type="button"
                            disabled={resendCooldown > 0 || otpBusy}
                            onClick={handleSendOtp}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-[0.95rem] border border-[#25D366]/35 bg-[#25D366]/10 px-4 text-[12px] font-medium text-[#1f9d4d] transition hover:bg-[#25D366]/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#59e08c]"
                          >
                            <WhatsAppIcon className="h-4 w-4" />
                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-background/55 shadow-[0_18px_45px_rgba(8,17,31,0.05)] backdrop-blur-2xl dark:bg-background/30">
          <div className="border-b border-border/60 px-5 py-5 sm:px-6">
            <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              Payment
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Choose how the booking should be confirmed. Online payment is preselected.
            </p>
          </div>

          <div className="px-5 py-5 sm:px-6 sm:py-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <PaymentOptionCard
                checked={paymentMode === 'pay_now'}
                onSelect={() => setPaymentMode('pay_now')}
                title="Pay now"
                description={
                  <>
                    Complete payment online for{' '}
                    <PriceWithMarketRate
                      amount={Number(totalAmount)}
                      marketAmount={marketTotal}
                      size="sm"
                      showTaxBreakup={false}
                    />
                    .
                  </>
                }
                icon={<CreditCard className="h-5 w-5" />}
                tone="primary"
                badge="Recommended"
              />

              <PaymentOptionCard
                checked={paymentMode === 'pay_at_property'}
                onSelect={() => setPaymentMode('pay_at_property')}
                title="Pay at property"
                description="Confirm the booking now and settle the amount during your stay."
                icon={<Wallet className="h-5 w-5" />}
                tone="neutral"
              />
            </div>

            <div className="mt-5 rounded-[1.35rem] border border-border/60 bg-background/72 px-4 py-4 backdrop-blur-xl dark:bg-background/35">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground dark:bg-background/45">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    Direct booking reassurance
                  </div>
                  <p className="mt-1.5 text-sm leading-7 text-muted-foreground">
                    Your booking is made directly with the property. Better clarity, easier coordination, and fewer third-party circus tricks.
                  </p>
                </div>
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
            disabled={submitting || (paymentMode === 'pay_at_property' && !phoneVerified)}
          >
            {submitting
              ? 'Processing…'
              : paymentMode === 'pay_now'
                ? 'Pay & confirm booking'
                : 'Confirm booking'}
          </Button>

          {primaryPhone && (
            <div className="rounded-[1.35rem] border border-border/60 bg-background/55 px-4 py-4 text-center backdrop-blur-xl dark:bg-background/30">
              <p className="text-sm leading-7 text-muted-foreground">
                Prefer to complete this by phone?
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
    </>
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

function PaymentOptionCard({
  checked,
  onSelect,
  title,
  description,
  icon,
  tone,
  badge,
}: {
  checked: boolean
  onSelect: () => void
  title: string
  description: ReactNode
  icon: ReactNode
  tone: 'primary' | 'neutral'
  badge?: string
}) {
  const activePrimary =
    checked && tone === 'primary'
      ? 'border-primary bg-primary/7 ring-1 ring-primary'
      : ''

  const activeNeutral =
    checked && tone === 'neutral'
      ? 'border-foreground/20 bg-foreground/[0.03] ring-1 ring-foreground/10'
      : ''

  return (
    <label
      className={`cursor-pointer rounded-[1.45rem] border p-4 transition-all ${checked
        ? `${activePrimary} ${activeNeutral}`
        : 'border-border/60 bg-background/72 hover:border-foreground/15 dark:bg-background/35'
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
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone === 'primary'
            ? 'bg-primary text-primary-foreground'
            : 'bg-foreground text-background'
            }`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-medium tracking-tight text-foreground">
              {title}
            </p>

            {badge && (
              <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-primary">
                {badge}
              </span>
            )}

            {checked && !badge && (
              <span className="rounded-full border border-foreground/15 bg-foreground/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-foreground/80">
                Selected
              </span>
            )}
          </div>

          <div className="mt-2 text-sm leading-7 text-muted-foreground">
            {description}
          </div>
        </div>
      </div>
    </label>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M19.05 4.94A9.86 9.86 0 0 0 12.03 2C6.55 2 2.09 6.45 2.09 11.94c0 1.76.46 3.48 1.34 5L2 22l5.2-1.36a9.92 9.92 0 0 0 4.82 1.23h.01c5.48 0 9.94-4.46 9.94-9.94a9.86 9.86 0 0 0-2.92-6.99Zm-7.02 15.25h-.01a8.25 8.25 0 0 1-4.2-1.15l-.3-.18-3.08.81.82-3-.2-.31a8.22 8.22 0 0 1-1.27-4.41c0-4.55 3.7-8.25 8.26-8.25 2.2 0 4.27.86 5.83 2.41a8.2 8.2 0 0 1 2.42 5.84c0 4.55-3.71 8.25-8.27 8.25Zm4.52-6.18c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.13-.57.12-.17.25-.65.8-.8.97-.15.17-.3.19-.55.06-.25-.12-1.06-.39-2.02-1.25-.74-.66-1.24-1.48-1.39-1.73-.15-.25-.02-.38.11-.5.11-.11.25-.3.37-.45.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.57-1.37-.78-1.88-.21-.5-.42-.43-.57-.44h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.43 1.02 2.6.12.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.52.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29Z" />
    </svg>
  )
}
