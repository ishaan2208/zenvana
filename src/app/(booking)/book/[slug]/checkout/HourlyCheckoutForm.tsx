'use client'

import { useState } from 'react'
import { useAppRouter } from '@/hooks/useAppRouter'
import {
  BadgeCheck,
  CalendarRange,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  PhoneCall,
  ShieldCheck,
  User2,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  createPublicHourlyBooking,
  sendPublicBookingOtp,
  verifyPublicBookingOtp,
} from '@/lib/api'
import { Button } from '@/components/Button'
import { PriceWithTax } from '@/components/PriceWithTax'
import { trackBookingCompletedAction } from '@/app/actions/analytics'
import { buildBookHourlyRoomsPath, sanitizeReturnTo } from '@/lib/book-rooms-url'

const GUEST_REQUIRED_TOAST_ID = 'hourly-guest-required'
const OTP_REQUIRED_TOAST_ID = 'hourly-otp-required'

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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function InputField(props: {
  id: string
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  icon: React.ReactNode
  error?: string
}) {
  return (
    <label htmlFor={props.id} className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{props.label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {props.icon}
        </span>
        <input
          id={props.id}
          type={props.type}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          autoComplete={props.autoComplete}
          className={`h-12 w-full rounded-2xl border bg-background/80 pl-11 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 dark:bg-background/40 ${
            props.error
              ? 'border-destructive/60 focus:border-destructive'
              : 'border-border/70 focus:border-primary/40'
          }`}
        />
      </div>
      {props.error ? (
        <span className="text-xs text-destructive" role="alert">
          {props.error}
        </span>
      ) : null}
    </label>
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
    <div className="rounded-[1.35rem] border border-border/60 bg-background/72 p-4 backdrop-blur-xl dark:bg-background/35">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.18em]">{label}</span>
      </div>
      <div className="mt-2 text-sm font-medium text-foreground">{value}</div>
    </div>
  )
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
  const [fieldErrors, setFieldErrors] = useState<{
    guestName?: string
    guestPhone?: string
  }>({})

  function focusCheckoutField(fieldId: string) {
    requestAnimationFrame(() => {
      document.getElementById(fieldId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      document.getElementById(fieldId)?.focus()
    })
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!validateRequiredFields()) return
    if (!validateWhatsAppOtp()) return

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

      const confirmParams = new URLSearchParams({
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
      })
      router.push(`/booking/confirmation?${confirmParams.toString()}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Booking failed'
      setError(msg)
      toast.error(msg)
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
    <form onSubmit={handleSubmit} className="space-y-6">
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
                value={<PriceWithTax amount={Number(totalAmount)} size="default" />}
              />
              <SummaryCard
                icon={<User2 className="h-4 w-4" />}
                label="Guests"
                value={`${occupancy} guest${occupancy !== 1 ? 's' : ''}`}
              />
            </div>
          </div>

          <div className="border-t border-border/60 p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-7">
            <div className="rounded-[1.5rem] border border-border/60 bg-background/72 p-4 backdrop-blur-xl dark:bg-background/35">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Payment
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Hourly
                </span>
                <span className="text-sm font-medium text-foreground">
                  Pay at property
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Confirm your slot now and settle at the hotel on arrival.
              </p>
            </div>

            {primaryPhone ? (
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
            Enter the primary guest details exactly as they should appear on the booking.
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
                    disabled={otpBusy || guestPhone.replace(/\D/g, '').length < 10}
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

          {error ? (
            <div
              className="rounded-[1.35rem] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <div className="flex items-start gap-3 rounded-[1.35rem] border border-border/60 bg-background/60 px-4 py-3 text-sm text-muted-foreground dark:bg-background/30">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              You are booking directly with {propertyName}. Your reference is created as
              soon as you confirm.
            </p>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto sm:min-w-[14rem]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming…
              </>
            ) : (
              'Confirm hourly stay'
            )}
          </Button>
        </div>
      </section>
    </form>
  )
}
