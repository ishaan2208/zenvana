'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { useAppRouter } from '@/hooks/useAppRouter'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  BedDouble,
  CalendarRange,
  CheckCircle2,
  CreditCard,
  Loader2,
  Mail,
  PhoneCall,
  ShieldCheck,
  Users,
  User2,
  Wallet,
} from 'lucide-react'

import { Button } from '@/components/Button'
import { PriceWithMarketRate } from '@/components/PriceWithMarketRate'
import { BookingTotalDisplay, CouponCelebration } from '@/components/CouponCelebration'
import { useCheckoutCouponState } from './CheckoutCouponState'
import {
  createPublicBookingWithRoomLines,
  createRazorpayOrder,
  validatePublicBookingCoupon,
  verifyRazorpayAndCreateBooking,
  type PublicBookingPayload,
} from '@/lib/api'
import { couponErrorMessage } from '@/lib/coupon-errors'
import {
  checkGuestAccountExists,
  formatZenvanaGuestSalutationName,
  getZenvanaGuestMe,
} from '@/lib/zenvanaGuestApi'
import { toast } from 'sonner'
import { track } from '@/lib/analytics/client'
import {
  trackBookingCompletedAction,
  trackPaymentFailedAction,
  trackPaymentInitiatedAction,
} from '@/app/actions/analytics'

const MULTI_ROOM_STORAGE_KEY = 'zenvana_multi_room_booking'
const GUEST_REQUIRED_TOAST_ID = 'zenvana-checkout-guest-required'

async function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return
  if (window.Razorpay) return
  await new Promise<void>((resolve, reject) => {
    const url = 'https://checkout.razorpay.com/v1/checkout.js'
    const existing = document.querySelector(`script[src="${url}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () =>
        reject(new Error('Razorpay script failed to load'))
      )
      return
    }
    const s = document.createElement('script')
    s.src = url
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Razorpay'))
    document.body.appendChild(s)
  })
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
          razorpay_signature: string
        }) => void
      ) => void
    }
  }
}

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
  initialCouponCode?: string
}

export default function MultiRoomCheckoutForm({
  slug,
  propertyName,
  primaryPhone,
  initialCouponCode,
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

  const [paymentMode, setPaymentMode] = useState<'pay_later' | 'pay_now'>('pay_now')
  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const [pointsBalance, setPointsBalance] = useState<number | null>(null)
  const [couponCodeInput, setCouponCodeInput] = useState('')
  const couponCtx = useCheckoutCouponState()
  const [localAppliedCoupon, setLocalAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null)
  const [localCouponAppliedKey, setLocalCouponAppliedKey] = useState(0)
  const appliedCoupon = couponCtx?.appliedCoupon ?? localAppliedCoupon
  const setAppliedCoupon = couponCtx?.setAppliedCoupon ?? setLocalAppliedCoupon
  const couponAppliedKey = couponCtx?.couponAppliedKey ?? localCouponAppliedKey
  const bumpCouponAppliedKey = couponCtx
    ? couponCtx.bumpAppliedKey
    : () => setLocalCouponAppliedKey((k) => k + 1)
  const [couponBusy, setCouponBusy] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const applyButtonRef = useRef<HTMLButtonElement>(null)
  const reduceMotion = useReducedMotion()

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

  const checkoutViewedFiredRef = useRef(false)
  useEffect(() => {
    if (checkoutViewedFiredRef.current) return
    if (!payload) return
    checkoutViewedFiredRef.current = true
    track(
      'checkout_viewed',
      {
        roomTypeId: payload.roomTypeId,
        roomTypeName: payload.roomTypeName,
        totalAmount: payload.totalAmount,
        roomLineCount: payload.roomLines.length,
        nights: payload.nights,
        couponPrefilled: Boolean(initialCouponCode),
      },
      slug,
    )
  }, [payload, slug, initialCouponCode])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const me = await getZenvanaGuestMe()
        if (cancelled || !me) return
        setPointsBalance(me.pointsBalance ?? 0)
        const d = me.phoneE164.replace(/\D/g, '').slice(-10)
        if (d.length === 10) {
          setGuestPhone((prev) => (prev.trim() ? prev : d))
        }
        if (me.email) setGuestEmail((prev) => (prev.trim() ? prev : me.email!))
        const line = formatZenvanaGuestSalutationName(me)
        if (line) setGuestName((prev) => (prev.trim() ? prev : line))
      } catch {
        /* optional */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

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

  // Pre-fill the coupon input when arriving from the offers page, but DO NOT auto-apply.
  // The user must click "Apply" to trigger validation + the celebration animation.
  useEffect(() => {
    if (!initialCouponCode) return
    if (!payload) return
    if (appliedCoupon) return
    const normalized = initialCouponCode.trim().toUpperCase()
    if (!normalized) return
    if (couponCodeInput.trim().toUpperCase() !== normalized) {
      setCouponCodeInput(normalized)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCouponCode, payload])

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
  const effectiveTotalAmount = Math.max(0, totalAmount - (appliedCoupon?.discountAmount ?? 0))

  function handleGuestNameChange(value: string) {
    setGuestName(value)
    setFieldErrors((prev) => ({ ...prev, guestName: undefined }))
    setError(null)
    toast.dismiss(GUEST_REQUIRED_TOAST_ID)
  }

  function handleGuestPhoneChange(value: string) {
    setGuestPhone(value)
    setFieldErrors((prev) => ({ ...prev, guestPhone: undefined }))
    setError(null)
    toast.dismiss(GUEST_REQUIRED_TOAST_ID)
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
      const firstId = nextErrors.guestName ? 'guestName' : 'guestPhone'
      requestAnimationFrame(() => {
        document.getElementById(firstId)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
        document.getElementById(firstId)?.focus()
      })
      return false
    }
    return true
  }

  function buildBookingPayload(): PublicBookingPayload {
    return {
      guest: {
        name: guestName.trim(),
        phone: guestPhone.trim(),
        email: guestEmail.trim() || undefined,
      },
      checkIn,
      checkOut,
      paymentIntent: 'pay_now',
      couponCode: appliedCoupon?.code,
      pointsToRedeem: appliedCoupon ? 0 : Math.floor(pointsToRedeem / 10) * 10,
      roomLines: roomLines.map((l) => ({
        roomTypeId: l.roomTypeId,
        ratePlanId: l.ratePlanId,
        occupancy: l.occupancy,
        tariff: l.tariff,
      })),
    }
  }

  async function applyCouponByCode(codeRaw: string) {
    const code = codeRaw.trim().toUpperCase()
    if (!code) {
      setCouponError('Enter a coupon code')
      return
    }
    if (pointsToRedeem > 0) {
      setCouponError('Points and coupon cannot be used together.')
      return
    }
    setCouponBusy(true)
    setCouponError(null)
    try {
      const result = await validatePublicBookingCoupon(slug, {
        ...buildBookingPayload(),
        paymentIntent: paymentMode === 'pay_now' ? 'pay_now' : 'pay_later',
        couponCode: code,
        pointsToRedeem: 0,
      })
      if (!result.valid) {
        const needsAuth =
          result.reason === 'COUPON_LOGIN_REQUIRED' ||
          result.reason === 'COUPON_IDENTITY_REQUIRED' ||
          result.reason === 'COUPON_PHONE_MISMATCH'
        if (needsAuth) {
          setAppliedCoupon({ code: result.code ?? code, discountAmount: result.discountAmount ?? 0 })
          setCouponCodeInput(result.code ?? code)
          bumpCouponAppliedKey()
          track('coupon_failed', { code, reason: result.reason ?? 'AUTH_REQUIRED' }, slug)
          await new Promise((resolve) => setTimeout(resolve, 1400))
          toast.info('Sign in or verify your phone to use this coupon. Redirecting...')
          const redirect = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : `/book/${slug}/checkout`
          const existing = await checkGuestAccountExists(guestPhone)
          const nextAuthPath = existing === false ? '/guest/signup' : '/login'
          setTimeout(() => {
            router.push(`${nextAuthPath}?redirect=${encodeURIComponent(redirect)}`)
          }, 900)
          return
        }
        setCouponError(couponErrorMessage(result.reason, result.message))
        setAppliedCoupon(null)
        track('coupon_failed', { code, reason: result.reason ?? 'INVALID' }, slug)
        return
      }
      setAppliedCoupon({ code: result.code ?? code, discountAmount: result.discountAmount ?? 0 })
      setCouponCodeInput(result.code ?? code)
      bumpCouponAppliedKey()
      track(
        'coupon_applied',
        { code: result.code ?? code, discountAmount: result.discountAmount ?? 0 },
        slug,
      )
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Coupon validation failed')
      setAppliedCoupon(null)
      track('coupon_failed', { code, reason: 'EXCEPTION' }, slug)
    } finally {
      setCouponBusy(false)
    }
  }

  async function handleApplyCoupon() {
    await applyCouponByCode(couponCodeInput)
  }

  function pushConfirmation(bookingReference: string) {
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
        totalAmount: String(effectiveTotalAmount),
        bookingReference,
      })
    )
  }

  async function handlePayLater(e: React.FormEvent) {
    e.preventDefault()
    if (!validateRequiredFields()) return
    setSubmitting(true)
    setError(null)

    try {
      const data = await createPublicBookingWithRoomLines(slug, {
        guest: {
          name: guestName.trim(),
          phone: guestPhone.trim(),
          email: guestEmail.trim() || undefined,
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
        couponCode: appliedCoupon?.code,
        pointsToRedeem: appliedCoupon ? 0 : Math.floor(pointsToRedeem / 10) * 10,
      })

      trackBookingCompletedAction({
        bookingReference: data.bookingReference,
        propertySlug: slug,
        paymentMode: 'pay_later',
        amount: effectiveTotalAmount,
        meta: {
          couponCode: appliedCoupon?.code ?? null,
          roomTypeName,
        },
      }).catch(() => {})

      pushConfirmation(data.bookingReference)
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
      await loadRazorpayScript()
      const RazorpayCtor = window.Razorpay
      if (!RazorpayCtor) {
        throw new Error('Payment script did not load. Please refresh and try again.')
      }

      const bookingPayload = buildBookingPayload()
      const pts = appliedCoupon ? 0 : Math.floor(pointsToRedeem / 10) * 10
      const order = await createRazorpayOrder(slug, bookingPayload, {
        pointsToRedeem: pts,
      })
      const { orderId, cashPaise: amountPaise } = order

      const options = {
        key: rzpKey,
        amount: amountPaise,
        currency: 'INR',
        name: 'ZenVana',
        description: `Booking — ${propertyName}`,
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
            const data = await verifyRazorpayAndCreateBooking(
              slug,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              bookingPayload
            )
            trackBookingCompletedAction({
              bookingReference: data.bookingReference,
              propertySlug: slug,
              paymentMode: 'pay_now',
              amount: effectiveTotalAmount,
              meta: {
                amountPaise,
                couponCode: appliedCoupon?.code ?? null,
                razorpayPaymentId: response.razorpay_payment_id,
                roomTypeName,
              },
            }).catch(() => {})
            setSubmitting(false)
            pushConfirmation(data.bookingReference)
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
          amount: effectiveTotalAmount,
          meta: { orderId, couponCode: appliedCoupon?.code ?? null },
        }).catch(() => {})
        track(
          'payment_failed',
          { amount: effectiveTotalAmount, orderId, couponCode: appliedCoupon?.code ?? null },
          slug,
        )
      })

      rzp.open()
      trackPaymentInitiatedAction({
        propertySlug: slug,
        bookingReference: null,
        paymentMode: 'pay_now',
        amount: effectiveTotalAmount,
        meta: { amountPaise, orderId, couponCode: appliedCoupon?.code ?? null },
      }).catch(() => {})
      track(
        'payment_initiated',
        {
          amount: effectiveTotalAmount,
          amountPaise,
          orderId,
          paymentMode: 'pay_now',
          couponCode: appliedCoupon?.code ?? null,
        },
        slug,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
      setSubmitting(false)
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

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
                    <BookingTotalDisplay
                      totalAmount={totalAmount}
                      marketAmount={marketTotal}
                      couponDiscount={appliedCoupon?.discountAmount ?? 0}
                      couponCode={appliedCoupon?.code ?? null}
                      appliedKey={couponAppliedKey}
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
                  Payment
                </div>
                <div className="mt-3 text-sm font-medium text-foreground">
                  Pay now or pay at property
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Online payment uses Razorpay for the cash portion; signed-in guests can redeem points the same way as single-room checkout.
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

        <form
          onSubmit={paymentMode === 'pay_now' ? handlePayNow : handlePayLater}
          className="space-y-6"
        >
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

          <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-background/55 shadow-[0_18px_45px_rgba(8,17,31,0.05)] backdrop-blur-2xl dark:bg-background/30">
            <div className="border-b border-border/60 px-5 py-5 sm:px-6">
              <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                Payment
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                Choose how to confirm this multi-room booking.
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
                        amount={effectiveTotalAmount}
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
                  checked={paymentMode === 'pay_later'}
                  onSelect={() => setPaymentMode('pay_later')}
                  title="Pay at property"
                  description="Confirm the booking now and settle the amount during your stay."
                  icon={<Wallet className="h-5 w-5" />}
                  tone="neutral"
                />
              </div>

              {pointsBalance != null && pointsBalance >= 10 && paymentMode === 'pay_now' && (
                <div className="mt-5 rounded-[1.35rem] border border-border/60 bg-background/72 px-4 py-4 backdrop-blur-xl dark:bg-background/35">
                  <label className="block text-sm font-medium text-foreground" htmlFor="mrPointsRedeem">
                    Redeem points (balance {pointsBalance}; 10 pts = ₹1)
                  </label>
                  <input
                    id="mrPointsRedeem"
                    type="number"
                    min={0}
                    max={pointsBalance}
                    step={10}
                    value={pointsToRedeem}
                    disabled={Boolean(appliedCoupon)}
                    onChange={(e) => {
                      const raw = parseInt(e.target.value, 10)
                      if (Number.isNaN(raw)) {
                        setPointsToRedeem(0)
                        return
                      }
                      const v = Math.min(Math.max(0, Math.floor(raw / 10) * 10), pointsBalance)
                      setPointsToRedeem(v)
                    }}
                    className="mt-2 w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  {appliedCoupon && (
                    <p className="mt-2 text-xs text-muted-foreground">Remove coupon to redeem points.</p>
                  )}
                </div>
              )}

              <div className="mt-5 rounded-[1.35rem] border border-border/60 bg-background/72 px-4 py-4 backdrop-blur-xl dark:bg-background/35">
                <label className="block text-sm font-medium text-foreground" htmlFor="mrCouponCode">
                  Offer code
                </label>
                {!appliedCoupon &&
                  initialCouponCode &&
                  couponCodeInput.trim().toUpperCase() ===
                  initialCouponCode.trim().toUpperCase() && (
                    <p className="mt-1 text-xs font-medium text-primary">
                      Code ready — click Apply to unlock your discount.
                    </p>
                  )}
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    id="mrCouponCode"
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => {
                      setCouponCodeInput(e.target.value.toUpperCase())
                      setCouponError(null)
                    }}
                    disabled={pointsToRedeem > 0 || couponBusy}
                    className="h-12 w-full rounded-[1rem] border border-border/70 bg-background/70 px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-background/50"
                    placeholder="Enter coupon"
                  />
                  <motion.button
                    ref={applyButtonRef}
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={pointsToRedeem > 0 || couponBusy || !couponCodeInput.trim() || Boolean(appliedCoupon)}
                    whileTap={
                      !reduceMotion &&
                      !appliedCoupon && !couponBusy && couponCodeInput.trim() && pointsToRedeem === 0
                        ? { scale: 0.96 }
                        : undefined
                    }
                    className={`relative inline-flex h-12 min-w-[120px] items-center justify-center overflow-hidden rounded-[1rem] px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${appliedCoupon
                        ? 'bg-emerald-600 text-white shadow-[0_10px_24px_-8px_rgba(16,185,129,0.55)] dark:bg-emerald-400 dark:text-emerald-950'
                        : 'bg-primary text-primary-foreground'
                      }`}
                  >
                    {couponBusy && !reduceMotion && (
                      <motion.span
                        aria-hidden
                        initial={{ x: '-130%' }}
                        animate={{ x: '160%' }}
                        transition={{ duration: 1.1, ease: 'linear', repeat: Infinity }}
                        className="pointer-events-none absolute inset-0 -skew-x-12 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.42),transparent)]"
                      />
                    )}
                    <AnimatePresence mode="wait" initial={false}>
                      {couponBusy ? (
                        <motion.span
                          key="busy"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.18 }}
                          className="relative inline-flex items-center gap-2"
                        >
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Applying…
                        </motion.span>
                      ) : appliedCoupon ? (
                        <motion.span
                          key="applied"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.2 }}
                          className="relative inline-flex items-center gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Applied
                        </motion.span>
                      ) : (
                        <motion.span
                          key="apply"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.18 }}
                          className="relative"
                        >
                          Apply
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
                <CouponCelebration
                  applied={appliedCoupon}
                  appliedKey={couponAppliedKey}
                  originalAmount={totalAmount}
                  originRef={applyButtonRef}
                  onRemove={() => {
                    setAppliedCoupon(null)
                    setCouponError(null)
                  }}
                />
                {couponError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{couponError}</p>}
                {pointsToRedeem > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Set points to 0 before applying a coupon.
                  </p>
                )}
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
              {submitting
                ? 'Processing…'
                : paymentMode === 'pay_now'
                  ? 'Pay & confirm booking'
                  : 'Confirm booking'}
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
    </>
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
        name="mrPaymentMode"
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

