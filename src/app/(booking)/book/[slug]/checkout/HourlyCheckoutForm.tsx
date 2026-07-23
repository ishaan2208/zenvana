'use client'

import { useState } from 'react'
import { useAppRouter } from '@/hooks/useAppRouter'
import {
  BadgeCheck,
  CalendarRange,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Mail,
  PhoneCall,
  ShieldCheck,
  User2,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  createPublicHourlyBooking,
  createPublicHourlyRazorpayOrder,
  sendPublicBookingOtp,
  verifyPublicBookingOtp,
  verifyPublicHourlyRazorpay,
  type PublicHourlyRazorpayBookingPayload,
} from '@/lib/api'
import { Button } from '@/components/Button'
import { PriceWithTax } from '@/components/PriceWithTax'
import {
  trackBookingCompletedAction,
  trackPaymentFailedAction,
  trackPaymentInitiatedAction,
} from '@/app/actions/analytics'
import {
  buildBookHourlyRoomsPath,
  sanitizeReturnTo,
} from '@/lib/book-rooms-url'
import { DAY_USE_STAY_KIND_PARAM } from '@/lib/stay-kind'
import {
  GUEST_REQUIRED_TOAST_ID,
  InputField,
  OTP_REQUIRED_TOAST_ID,
  PaymentOptionCard,
  SummaryCard,
  WhatsAppIcon,
  focusCheckoutField,
  loadRazorpayScript,
} from './checkout-fields'
import { CheckoutDockBar } from './CheckoutDockBar'

/**
 * Kill-switch for day-use online payment: the UI ships dark until the
 * backend's verified hourly Razorpay path is deployed, then flips on via env.
 */
const DAY_USE_PAY_NOW_ENABLED = process.env.NEXT_PUBLIC_DAYUSE_PAYNOW === '1'

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
  returnTo?: string | null
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
  returnTo,
}: Props) {
  const router = useAppRouter()
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [maskedPhone, setMaskedPhone] = useState('')
  const [otpBusy, setOtpBusy] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null)
  const [paymentMode, setPaymentMode] = useState<'pay_now' | 'pay_at_property'>(
    DAY_USE_PAY_NOW_ENABLED ? 'pay_now' : 'pay_at_property',
  )
  const [fieldErrors, setFieldErrors] = useState<{
    guestName?: string
    guestPhone?: string
  }>({})

  const isPayNow = DAY_USE_PAY_NOW_ENABLED && paymentMode === 'pay_now'

  function validateRequiredFields() {
    const nextErrors: { guestName?: string; guestPhone?: string } = {}
    if (!guestName.trim()) nextErrors.guestName = 'Name is required'
    if (!guestPhone.trim()) nextErrors.guestPhone = 'Phone number is required'
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      const msg =
        'Please enter your full name and phone number before continuing.'
      setError(msg)
      toast.error(msg, { id: GUEST_REQUIRED_TOAST_ID, duration: 8000 })
      focusCheckoutField(nextErrors.guestName ? 'guestName' : 'guestPhone')
      return false
    }
    return true
  }

  function validateWhatsAppOtp() {
    // Verified online payment substitutes for OTP (server models this too).
    if (isPayNow) return true
    if (phoneVerified) return true
    const msg = otpSent
      ? 'Please enter the 6-digit OTP sent to your WhatsApp.'
      : 'Please verify your phone number via WhatsApp before confirming your booking.'
    setError(msg)
    toast.error(msg, { id: OTP_REQUIRED_TOAST_ID, duration: 8000 })
    focusCheckoutField(otpSent ? 'guestPhoneOtp' : 'sendWhatsappOtp')
    return false
  }

  async function handleSendOtp() {
    if (guestPhone.replace(/\D/g, '').length < 10) {
      const msg = 'Enter a valid WhatsApp number'
      setError(msg)
      toast.error(msg, { id: OTP_REQUIRED_TOAST_ID })
      focusCheckoutField('guestPhone')
      return
    }
    try {
      setOtpBusy(true)
      setError(null)
      const data = await sendPublicBookingOtp(slug, guestPhone.trim())
      setOtpSent(true)
      setMaskedPhone(data.maskedPhone ?? '')
      setOtp('')
      toast.dismiss(OTP_REQUIRED_TOAST_ID)
      toast.success('OTP sent on WhatsApp')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP'
      setError(msg)
      toast.error(msg)
    } finally {
      setOtpBusy(false)
    }
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) {
      const msg = 'Enter the OTP'
      setError(msg)
      toast.error(msg)
      return
    }
    try {
      setOtpBusy(true)
      setError(null)
      await verifyPublicBookingOtp(slug, guestPhone.trim(), otp.trim())
      setPhoneVerified(true)
      setOtp('')
      setOtpSent(false)
      toast.dismiss(OTP_REQUIRED_TOAST_ID)
      toast.success('Phone verified')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'OTP verification failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setOtpBusy(false)
    }
  }

  function confirmationHref(data: {
    bookingReference: string
    checkOut?: string
  }): string {
    const confirmParams = new URLSearchParams({
      slug,
      propertyName,
      propertyPhone: primaryPhone ?? '',
      checkIn: date,
      checkOut: data.checkOut ?? date,
      roomTypeName,
      totalAmount: String(totalAmount),
      bookingReference: data.bookingReference,
      stayKind: DAY_USE_STAY_KIND_PARAM,
      startTime,
      durationHours: String(durationHours),
    })
    return `/booking/confirmation?${confirmParams.toString()}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPaymentLinkUrl(null)
    if (!validateRequiredFields()) return
    if (!validateWhatsAppOtp()) return

    if (isPayNow) {
      await handlePayNow()
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

      router.push(confirmationHref(data))
    } catch (err) {
      const e = err as Error & { paymentLinkUrl?: string }
      const msg = e instanceof Error ? e.message : 'Booking failed'
      setError(msg)
      setPaymentLinkUrl(e.paymentLinkUrl ?? null)
      toast.error(msg)
      setSubmitting(false)
    }
  }

  /** Mirrors CheckoutForm.handlePayNow: order → Razorpay modal → verify → confirmation. */
  async function handlePayNow() {
    const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (!rzpKey) {
      setError('Online payment is not configured.')
      return
    }

    setSubmitting(true)
    try {
      await loadRazorpayScript()
      const RazorpayCtor = window.Razorpay
      if (!RazorpayCtor) {
        throw new Error(
          'Payment script did not load. Please refresh and try again.',
        )
      }

      const bookingPayload: PublicHourlyRazorpayBookingPayload = {
        stayKind: 'HOURLY',
        guest: {
          name: guestName.trim(),
          phone: guestPhone.trim(),
          email: guestEmail.trim() || undefined,
        },
        date,
        startTime,
        durationHours,
        roomTypeId: parseInt(roomTypeId, 10),
        occupancy,
      }

      const order = await createPublicHourlyRazorpayOrder(slug, bookingPayload)
      const { orderId, cashPaise: amountPaise } = order

      const options = {
        key: rzpKey,
        amount: amountPaise,
        currency: 'INR',
        name: 'ZenVana',
        description: `Hourly stay — ${propertyName}`,
        order_id: orderId,
        prefill: {
          name: guestName,
          email: guestEmail || undefined,
          contact: guestPhone || undefined,
        },
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) => {
          try {
            const data = await verifyPublicHourlyRazorpay(
              slug,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              bookingPayload,
            )
            trackBookingCompletedAction({
              bookingReference: data.bookingReference,
              propertySlug: slug,
              paymentMode: 'pay_now',
              amount: amountPaise / 100,
              meta: {
                stayKind: 'hourly',
                durationHours,
                roomTypeName,
              },
            }).catch(() => {})
            setSubmitting(false)
            router.push(confirmationHref(data))
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Booking failed')
            setSubmitting(false)
          }
        },
      }

      const rzp = new RazorpayCtor(options)

      rzp.on('payment.failed', () => {
        setError('Payment failed or was cancelled.')
        setSubmitting(false)
        trackPaymentFailedAction({
          propertySlug: slug,
          bookingReference: null,
          paymentMode: 'pay_now',
          amount: amountPaise / 100,
          meta: { amountPaise, orderId, stayKind: 'hourly' },
        }).catch(() => {})
      })

      rzp.open()
      trackPaymentInitiatedAction({
        propertySlug: slug,
        bookingReference: null,
        paymentMode: 'pay_now',
        amount: amountPaise / 100,
        meta: { amountPaise, orderId, stayKind: 'hourly' },
      }).catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
      setSubmitting(false)
    }
  }

  const roomsBackHref = buildBookHourlyRoomsPath({
    slug,
    date,
    startTime,
    durationHours,
    guests: occupancy,
    returnTo: sanitizeReturnTo(returnTo) ?? undefined,
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-28 xl:pb-0">
      <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-background/55 shadow-[0_24px_70px_rgba(8,17,31,0.08)] backdrop-blur-2xl dark:bg-background/30">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="p-5 sm:p-6 lg:p-7">
            <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              Booking summary
            </div>
            <h2 className="mt-3 font-serif text-3xl tracking-[-0.04em] text-foreground">
              {roomTypeName}
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <SummaryCard
                icon={<CalendarRange className="h-4 w-4" />}
                label="Date"
                value={date}
              />
              <SummaryCard
                icon={<Clock className="h-4 w-4" />}
                label="Slot"
                value={`${startTime} · ${durationHours}h`}
              />
              <SummaryCard
                icon={<BadgeCheck className="h-4 w-4" />}
                label="Total"
                value={
                  <PriceWithTax amount={Number(totalAmount)} size="default" />
                }
              />
              <SummaryCard
                icon={<User2 className="h-4 w-4" />}
                label="Guests"
                value={`${occupancy} guest${occupancy !== 1 ? 's' : ''}`}
              />
            </div>
          </div>

          <div className="border-t border-border/60 p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-7">
            <div className="bg-background/72 rounded-[1.5rem] border border-border/60 p-4 backdrop-blur-xl dark:bg-background/35">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Payment
              </div>
              {DAY_USE_PAY_NOW_ENABLED ? (
                <div className="mt-3 grid gap-3">
                  <PaymentOptionCard
                    checked={paymentMode === 'pay_now'}
                    onSelect={() => setPaymentMode('pay_now')}
                    title="Pay now"
                    description={
                      <>
                        Complete payment online for{' '}
                        <PriceWithTax
                          amount={Number(totalAmount)}
                          size="sm"
                          inline
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
                    title="Pay at the hotel"
                    description="Reserve now, pay when you arrive."
                    icon={<Wallet className="h-5 w-5" />}
                    tone="neutral"
                  />
                </div>
              ) : (
                <>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                      Hourly stay
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      Pay at property
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Confirm your slot now and pay at the hotel when you arrive.
                  </p>
                </>
              )}
            </div>

            {primaryPhone ? (
              <div className="bg-background/72 mt-4 rounded-[1.5rem] border border-border/60 p-4 backdrop-blur-xl dark:bg-background/35">
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
            ) : null}

            <a
              href={roomsBackHref}
              className="mt-4 inline-flex text-sm font-medium text-foreground/80 transition hover:text-foreground"
            >
              Change room or slot
            </a>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-background/55 shadow-[0_18px_45px_rgba(8,17,31,0.05)] backdrop-blur-2xl dark:bg-background/30">
        <div className="border-b border-border/60 px-5 py-5 sm:px-6">
          <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            Guest details
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Enter the primary guest details exactly as they should appear on the
            booking.
          </p>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
          <InputField
            id="guestName"
            label="Full name"
            type="text"
            value={guestName}
            onChange={(v) => {
              setGuestName(v)
              setFieldErrors((p) => ({ ...p, guestName: undefined }))
              setError(null)
              toast.dismiss(GUEST_REQUIRED_TOAST_ID)
            }}
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
              onChange={(v) => {
                setGuestPhone(v)
                setFieldErrors((p) => ({ ...p, guestPhone: undefined }))
                setPhoneVerified(false)
                setOtpSent(false)
                setError(null)
                toast.dismiss(GUEST_REQUIRED_TOAST_ID)
                toast.dismiss(OTP_REQUIRED_TOAST_ID)
              }}
              autoComplete="tel"
              icon={<PhoneCall className="h-4 w-4" />}
              error={fieldErrors.guestPhone}
            />
            <InputField
              id="guestEmail"
              label="Email (optional)"
              type="email"
              value={guestEmail}
              onChange={setGuestEmail}
              autoComplete="email"
              icon={<Mail className="h-4 w-4" />}
            />
          </div>

          {!isPayNow && (
            <div
              id="whatsappVerification"
              className={`rounded-[1.35rem] border p-4 ${
                phoneVerified
                  ? 'border-emerald-300/60 bg-emerald-50/80 text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-950/25 dark:text-emerald-300'
                  : 'border-[#25D366]/20 bg-[linear-gradient(180deg,rgba(37,211,102,0.10),rgba(37,211,102,0.04))] text-foreground dark:bg-[linear-gradient(180deg,rgba(37,211,102,0.12),rgba(37,211,102,0.03))]'
              }`}
            >
              {phoneVerified ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      Phone verified successfully on WhatsApp.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-medium text-foreground hover:underline dark:text-white"
                    onClick={() => setPhoneVerified(false)}
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
                        We verify the guest phone on WhatsApp before confirming
                        pay-at-property bookings.
                        {maskedPhone ? ` Sent to ${maskedPhone}.` : ''}
                      </p>
                    </div>
                  </div>

                  {!otpSent ? (
                    <Button
                      id="sendWhatsappOtp"
                      type="button"
                      variant="outline"
                      color="slate"
                      disabled={
                        otpBusy || guestPhone.replace(/\D/g, '').length < 10
                      }
                      onClick={() => void handleSendOtp()}
                      className="dark:text-white"
                    >
                      {otpBusy ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        'Send WhatsApp OTP'
                      )}
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <label className="block min-w-0 flex-1 space-y-2">
                        <span className="text-sm font-medium">6-digit OTP</span>
                        <input
                          id="guestPhoneOtp"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="h-12 w-full rounded-2xl border border-border/70 bg-background/80 px-4 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:bg-background/40"
                          placeholder="••••••"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                        />
                      </label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          disabled={otpBusy}
                          onClick={() => void handleVerifyOtp()}
                        >
                          {otpBusy ? 'Verifying…' : 'Verify OTP'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          color="slate"
                          disabled={otpBusy}
                          onClick={() => void handleSendOtp()}
                          className="dark:text-white"
                        >
                          Resend
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {error ? (
            <div
              className="rounded-[1.35rem] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              <p>{error}</p>
              {paymentLinkUrl ? (
                <a
                  href={paymentLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block font-medium underline underline-offset-2"
                >
                  Complete payment for existing booking
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-start gap-3 rounded-[1.35rem] border border-border/60 bg-background/60 px-4 py-3 text-sm text-muted-foreground dark:bg-background/30">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              You are booking directly with {propertyName}. Your reference is
              created as soon as you confirm.
            </p>
          </div>

          <div className="hidden xl:block">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto sm:min-w-[14rem]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isPayNow ? 'Opening payment…' : 'Confirming…'}
                </>
              ) : isPayNow ? (
                'Pay & confirm booking'
              ) : (
                'Confirm booking'
              )}
            </Button>
          </div>
        </div>
      </section>

      <CheckoutDockBar
        ctaLabel={isPayNow ? 'Pay & confirm' : 'Confirm booking'}
        sentLabel={isPayNow ? 'Opening payment…' : 'Confirming…'}
        submitting={submitting}
        microline={
          isPayNow
            ? 'Secure payment via Razorpay'
            : 'No payment needed now — pay at the hotel'
        }
      >
        <div className="flex items-center justify-between gap-4">
          <span className="flex flex-col">
            <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Total
            </span>
            <span className="text-[11px] text-muted-foreground">
              {startTime} · {durationHours}h
            </span>
          </span>
          <PriceWithTax amount={Number(totalAmount)} size="lg" />
        </div>
      </CheckoutDockBar>
    </form>
  )
}
