'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppRouter } from '@/hooks/useAppRouter'
import Script from 'next/script'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  BadgeCheck,
  CalendarRange,
  CheckCircle2,
  CreditCard,
  Loader2,
  Mail,
  PhoneCall,
  ShieldCheck,
  User2,
  Wallet,
} from 'lucide-react'

import { Button } from '@/components/Button'
import { PriceWithMarketRate } from '@/components/PriceWithMarketRate'
import {
  BookingTotalDisplay,
  CouponCelebration,
} from '@/components/CouponCelebration'
import { LiveBookingTotal, useCheckoutCouponState } from './CheckoutCouponState'
import { CheckoutDockBar } from './CheckoutDockBar'
import { couponErrorMessage } from '@/lib/coupon-errors'
import {
  PRICE_CHANGED_TOAST_ID,
  isPriceGuardCode,
  priceChangedMessage,
  priceGuardErrorMessage,
} from '@/lib/price-guard-errors'
import {
  createPublicBookingWithRoomLines,
  createRazorpayOrder,
  sendPublicBookingOtp,
  validatePublicBookingCoupon,
  verifyPublicBookingOtp,
  verifyRazorpayAndCreateBooking,
  type ApiError,
  type PublicBookingPayload,
} from '@/lib/api'
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

import {
  GUEST_REQUIRED_TOAST_ID,
  InputField,
  OTP_REQUIRED_TOAST_ID,
  PaymentOptionCard,
  SummaryCard,
  WhatsAppIcon,
  focusCheckoutField,
  formatCountdown,
  loadRazorpayScript,
} from './checkout-fields'

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
  initialCouponCode?: string
}

/** Match backend `getNightsBetween` for tariff × nights totals. */
function countStayNights(checkInStr: string, checkOutStr: string): number {
  const start = new Date(checkInStr)
  const end = new Date(checkOutStr)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const n = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
  return Math.max(1, n)
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
  initialCouponCode,
}: Props) {
  const router = useAppRouter()

  const [guestName, setGuestName] = useState('')
  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const [couponCodeInput, setCouponCodeInput] = useState('')
  // Coupon state lives in context so the page-level booking summary (sidebar,
  // mobile bar, hero chip) can react. Falls back to local state if no provider
  // is mounted (e.g. when this form is reused in isolation).
  const couponCtx = useCheckoutCouponState()
  const [localAppliedCoupon, setLocalAppliedCoupon] = useState<{
    code: string
    discountAmount: number
  } | null>(null)
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
  const [pointsBalance, setPointsBalance] = useState<number | null>(null)
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    guestName?: string
    guestPhone?: string
  }>({})

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null)
  // Set when the backend re-prices this stay and rejects our total. From then on
  // the form quotes the server's number, so the guest confirms the real price.
  const [serverTotal, setServerTotal] = useState<number | null>(null)

  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [maskedPhone, setMaskedPhone] = useState('')
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [verifiedPhone, setVerifiedPhone] = useState('')
  const [otpBusy, setOtpBusy] = useState(false)
  const [isSignedInGuest, setIsSignedInGuest] = useState(false)
  const [registeredPhone10, setRegisteredPhone10] = useState('')

  const [paymentMode, setPaymentMode] = useState<'pay_at_property' | 'pay_now'>(
    'pay_now',
  )
  const checkoutViewedFiredRef = useRef(false)

  useEffect(() => {
    if (checkoutViewedFiredRef.current) return
    checkoutViewedFiredRef.current = true
    track(
      'checkout_viewed',
      {
        roomTypeId,
        roomTypeName,
        totalAmount: Number(totalAmount),
        nights: Number(nights),
        couponPrefilled: Boolean(initialCouponCode),
      },
      slug,
    )
  }, [initialCouponCode, nights, roomTypeId, roomTypeName, slug, totalAmount])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const me = await getZenvanaGuestMe()
        if (cancelled || !me) return
        setIsSignedInGuest(true)
        setPointsBalance(me.pointsBalance ?? 0)
        const d = me.phoneE164.replace(/\D/g, '').slice(-10)
        if (d.length === 10) {
          setRegisteredPhone10(d)
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
    setError(null)
    toast.dismiss(GUEST_REQUIRED_TOAST_ID)
    toast.dismiss(OTP_REQUIRED_TOAST_ID)
    resetPhoneVerification(value)
  }

  function handleGuestNameChange(value: string) {
    setGuestName(value)
    setFieldErrors((prev) => ({ ...prev, guestName: undefined }))
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
      focusCheckoutField(nextErrors.guestName ? 'guestName' : 'guestPhone')
      return false
    }
    return true
  }

  function validateWhatsAppOtp() {
    if (!otpRequiredForPayAtProperty || phoneVerified) return true

    const msg = otpSent
      ? 'Please enter the 6-digit OTP sent to your WhatsApp.'
      : 'Please verify your phone number via WhatsApp before confirming your booking.'
    const focusId = otpSent ? 'guestPhoneOtp' : 'sendWhatsappOtp'

    setError(msg)
    toast.error(msg, { id: OTP_REQUIRED_TOAST_ID, duration: 8000 })
    focusCheckoutField(focusId)
    return false
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
      toast.dismiss(OTP_REQUIRED_TOAST_ID)
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
      toast.dismiss(OTP_REQUIRED_TOAST_ID)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed')
    } finally {
      setOtpBusy(false)
    }
  }

  const expiresInSeconds = otpExpiresAt
    ? Math.max(
        0,
        Math.floor((new Date(otpExpiresAt).getTime() - Date.now()) / 1000),
      )
    : null

  const phoneReadyForOtp = guestPhone.replace(/\D/g, '').length >= 10
  const guestPhone10 = guestPhone.replace(/\D/g, '').slice(-10)
  const sameAsRegisteredPhone =
    isSignedInGuest &&
    Boolean(registeredPhone10) &&
    guestPhone10 === registeredPhone10
  const otpRequiredForPayAtProperty =
    paymentMode === 'pay_at_property' && !sameAsRegisteredPhone
  const payAtPropertyVerificationDone =
    !otpRequiredForPayAtProperty || phoneVerified

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

  const roomsSelected = Math.max(1, Math.floor(_numRooms ?? 1))
  const ratePlanIdNum =
    _ratePlan && _ratePlan !== 'default' && !Number.isNaN(Number(_ratePlan))
      ? Number(_ratePlan)
      : undefined
  /** Prefer the nights the backend priced with over re-deriving them locally. */
  const stayNights = useMemo(() => {
    const fromParam = Number(nights)
    return Number.isFinite(fromParam) && fromParam > 0
      ? fromParam
      : countStayNights(checkIn, checkOut)
  }, [checkIn, checkOut, nights])

  /** Whole-stay, all rooms — the server's number once it has told us one. */
  const baseTotalAmount = serverTotal ?? Number(totalAmount)

  /**
   * One line per room. `totalAmount` covers every room selected, so it is split
   * before being expressed as a per-room nightly tariff — sending a single line
   * at the aggregate rate would book one room at N× the rate.
   */
  const buildRoomLines = () => {
    const perRoomPerNight =
      Math.round((baseTotalAmount / roomsSelected / stayNights) * 100) / 100
    return Array.from({ length: roomsSelected }, () => ({
      roomTypeId: parseInt(roomTypeId, 10),
      occupancy: occupancy ?? 1,
      tariff: perRoomPerNight,
      ...(ratePlanIdNum != null ? { ratePlanId: ratePlanIdNum } : {}),
    }))
  }

  const effectiveTotalAmount = useMemo(() => {
    const discount = appliedCoupon?.discountAmount ?? 0
    return Math.max(0, baseTotalAmount - discount)
  }, [appliedCoupon?.discountAmount, baseTotalAmount])

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
      const bookingPayload: PublicBookingPayload = {
        guest: {
          name: guestName.trim() || 'Guest',
          phone: guestPhone.trim() || '9999999999',
          email: guestEmail.trim() || undefined,
        },
        checkIn,
        checkOut,
        paymentIntent: paymentMode === 'pay_now' ? 'pay_now' : 'pay_later',
        roomLines: buildRoomLines(),
        couponCode: code,
        pointsToRedeem: 0,
      }
      const result = await validatePublicBookingCoupon(slug, bookingPayload)
      if (!result.valid) {
        const needsAuth =
          result.reason === 'COUPON_LOGIN_REQUIRED' ||
          result.reason === 'COUPON_IDENTITY_REQUIRED' ||
          result.reason === 'COUPON_PHONE_MISMATCH'
        if (needsAuth) {
          setAppliedCoupon({
            code: result.code ?? code,
            discountAmount: result.discountAmount ?? 0,
          })
          setCouponCodeInput(result.code ?? code)
          bumpCouponAppliedKey()
          track(
            'coupon_failed',
            { code, reason: result.reason ?? 'AUTH_REQUIRED' },
            slug,
          )
          await new Promise((resolve) => setTimeout(resolve, 1400))
          toast.info(
            'Sign in or verify your phone to use this coupon. Redirecting...',
          )
          const redirect =
            typeof window !== 'undefined'
              ? `${window.location.pathname}${window.location.search}`
              : `/book/${slug}/checkout`
          const existing = await checkGuestAccountExists(guestPhone)
          const nextAuthPath = existing === false ? '/guest/signup' : '/login'
          setTimeout(() => {
            router.push(
              `${nextAuthPath}?redirect=${encodeURIComponent(redirect)}`,
            )
          }, 900)
          return
        }
        setCouponError(couponErrorMessage(result.reason, result.message))
        setAppliedCoupon(null)
        track(
          'coupon_failed',
          { code, reason: result.reason ?? 'INVALID' },
          slug,
        )
        return
      }
      setAppliedCoupon({
        code: result.code ?? code,
        discountAmount: result.discountAmount ?? 0,
      })
      setCouponCodeInput(result.code ?? code)
      bumpCouponAppliedKey()
      track(
        'coupon_applied',
        {
          code: result.code ?? code,
          discountAmount: result.discountAmount ?? 0,
        },
        slug,
      )
    } catch (err) {
      setCouponError(
        err instanceof Error ? err.message : 'Coupon validation failed',
      )
      setAppliedCoupon(null)
      track('coupon_failed', { code, reason: 'EXCEPTION' }, slug)
    } finally {
      setCouponBusy(false)
    }
  }

  async function handleApplyCoupon() {
    await applyCouponByCode(couponCodeInput)
  }

  // Pre-fill the coupon input when arriving from the offers page, but DO NOT auto-apply.
  // The user must click "Apply" to trigger validation + the celebration animation.
  useEffect(() => {
    if (!initialCouponCode) return
    if (appliedCoupon) return
    const normalized = initialCouponCode.trim().toUpperCase()
    if (!normalized) return
    if (couponCodeInput.trim().toUpperCase() !== normalized) {
      setCouponCodeInput(normalized)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCouponCode])

  /**
   * Pay-at-property only. Uses the roomLines shape so this path gets the same
   * server-side re-pricing and OTP handling as every other booking route; the
   * legacy single-room shape (with its client-asserted `payment.paid`) is gone.
   */
  async function confirmBooking() {
    const data = await createPublicBookingWithRoomLines(slug, {
      guest: {
        name: guestName.trim(),
        phone: guestPhone.trim(),
        email: guestEmail.trim() || undefined,
      },
      checkIn,
      checkOut,
      paymentIntent: 'pay_later',
      roomLines: buildRoomLines(),
      couponCode: appliedCoupon?.code,
      pointsToRedeem: pointsToRedeem > 0 ? pointsToRedeem : 0,
    })
    trackBookingCompletedAction({
      bookingReference: data.bookingReference,
      propertySlug: slug,
      paymentMode: 'pay_at_property',
      amount: effectiveTotalAmount,
      meta: {
        couponCode: appliedCoupon?.code ?? null,
        transactionId: null,
        roomTypeName,
      },
    }).catch(() => {})

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
          bookingReference: data.bookingReference,
        }),
    )
  }

  /**
   * Turn a backend rejection into something the guest can act on. A price
   * rejection is not a dead end: the server sends back what the stay actually
   * costs, so we re-quote in place and the next attempt confirms the real total.
   * Returns true when it recognised and handled the error.
   */
  function handleApiError(err: unknown, fallback: string): boolean {
    const e = err as ApiError
    setPaymentLinkUrl(e?.paymentLinkUrl ?? null)

    if (e?.code === 'PRICE_CHANGED') {
      if (typeof e.serverTotal === 'number') setServerTotal(e.serverTotal)
      const msg = priceChangedMessage(e.serverTotal)
      setError(msg)
      toast.error(msg, { id: PRICE_CHANGED_TOAST_ID, duration: 8000 })
      track(
        'price_changed',
        {
          clientTotal: baseTotalAmount,
          serverTotal: e.serverTotal ?? null,
          roomTypeId,
          nights: stayNights,
        },
        slug,
      )
      return true
    }

    if (isPriceGuardCode(e?.code)) {
      const msg = priceGuardErrorMessage(e.code, e?.message)
      setError(msg)
      toast.error(msg, { id: PRICE_CHANGED_TOAST_ID, duration: 8000 })
      return true
    }

    setError(err instanceof Error ? err.message : fallback)
    return false
  }

  async function handlePayAtProperty(e: React.FormEvent) {
    e.preventDefault()

    if (!validateRequiredFields()) return
    if (!validateWhatsAppOtp()) return

    setSubmitting(true)
    setError(null)
    setPaymentLinkUrl(null)

    try {
      await confirmBooking()
    } catch (err) {
      handleApiError(err, 'Booking failed')
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
        throw new Error(
          'Payment script did not load. Please refresh and try again.',
        )
      }

      const bookingPayload: PublicBookingPayload = {
        guest: {
          name: guestName.trim(),
          phone: guestPhone.trim(),
          email: guestEmail.trim() || undefined,
        },
        checkIn,
        checkOut,
        paymentIntent: 'pay_now',
        couponCode: appliedCoupon?.code,
        pointsToRedeem: appliedCoupon
          ? 0
          : Math.floor(pointsToRedeem / 10) * 10,
        roomLines: buildRoomLines(),
      }

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
              bookingPayload,
            )
            setSubmitting(false)
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
                  bookingReference: data.bookingReference,
                }),
            )
          } catch (err) {
            handleApiError(err, 'Booking failed')
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
          meta: {
            amountPaise,
            orderId,
            couponCode: appliedCoupon?.code ?? null,
          },
        }).catch(() => {})
      })

      rzp.open()
      trackPaymentInitiatedAction({
        propertySlug: slug,
        bookingReference: null,
        paymentMode: 'pay_now',
        amount: effectiveTotalAmount,
        meta: { amountPaise, orderId, couponCode: appliedCoupon?.code ?? null },
      }).catch(() => {})
    } catch (err) {
      handleApiError(err, 'Payment failed')
      setSubmitting(false)
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <form
        onSubmit={
          paymentMode === 'pay_now' ? handlePayNow : handlePayAtProperty
        }
        className="space-y-6 pb-28 xl:pb-0"
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
                    <BookingTotalDisplay
                      totalAmount={Number(totalAmount)}
                      marketAmount={marketTotal}
                      couponDiscount={appliedCoupon?.discountAmount ?? 0}
                      couponCode={appliedCoupon?.code ?? null}
                      appliedKey={couponAppliedKey}
                    />
                  }
                />
                <SummaryCard
                  icon={<ShieldCheck className="h-4.5 w-4.5" />}
                  label="Rooms"
                  value={`${guestSummary.rooms} room${
                    guestSummary.rooms !== 1 ? 's' : ''
                  }`}
                />
                <SummaryCard
                  icon={<User2 className="h-4.5 w-4.5" />}
                  label="Occupancy"
                  value={guestSummary.guestText}
                />
              </div>
            </div>

            <div className="border-t border-border/60 p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-7">
              <div className="bg-background/72 rounded-[1.5rem] border border-border/60 p-4 backdrop-blur-xl dark:bg-background/35">
                <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Recommended path
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                    Default
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    Pay now
                  </span>
                </div>
              </div>

              {primaryPhone && (
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
              Enter the primary guest details exactly as they should appear on
              the booking.
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
                  id="whatsappVerification"
                  className={`rounded-[1.35rem] border p-4 ${
                    payAtPropertyVerificationDone
                      ? 'border-emerald-300/60 bg-emerald-50/80 text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-950/25 dark:text-emerald-300'
                      : 'border-[#25D366]/20 bg-[linear-gradient(180deg,rgba(37,211,102,0.10),rgba(37,211,102,0.04))] text-foreground dark:bg-[linear-gradient(180deg,rgba(37,211,102,0.12),rgba(37,211,102,0.03))]'
                  }`}
                >
                  {payAtPropertyVerificationDone ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">
                          {sameAsRegisteredPhone
                            ? 'Using your registered phone number — no extra WhatsApp verification needed.'
                            : 'Phone verified successfully on WhatsApp.'}
                        </span>
                      </div>

                      {!sameAsRegisteredPhone && (
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
                      )}
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
                            We verify the guest phone on WhatsApp before
                            confirming pay-at-property bookings.
                          </p>
                        </div>
                      </div>

                      {!otpSent ? (
                        <button
                          id="sendWhatsappOtp"
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
                              ? ` • Expires in ${formatCountdown(
                                  expiresInSeconds,
                                )}`
                              : ''}
                          </p>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                              id="guestPhoneOtp"
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={otp}
                              onChange={(e) => {
                                setOtp(
                                  e.target.value.replace(/\D/g, '').slice(0, 6),
                                )
                                setError(null)
                                toast.dismiss(OTP_REQUIRED_TOAST_ID)
                              }}
                              className="h-12 w-full rounded-[1rem] border border-border/70 bg-background/70 px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-background/50"
                              placeholder="Enter 6-digit OTP"
                            />

                            <button
                              type="button"
                              disabled={otp.length !== 6 || otpBusy}
                              onClick={handleVerifyOtp}
                              className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] bg-[#25D366] px-5 text-sm font-medium text-white shadow-[0_16px_30px_rgba(37,211,102,0.22)] transition hover:bg-[#1fbe5a] disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[160px]"
                            >
                              <WhatsAppIcon className="h-5 w-5" />
                              {otpBusy ? 'Verifying…' : 'Verify'}
                            </button>
                          </div>

                          <button
                            type="button"
                            disabled={resendCooldown > 0 || otpBusy}
                            onClick={handleSendOtp}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-[0.95rem] border border-[#25D366]/35 bg-[#25D366]/10 px-4 text-[12px] font-medium text-[#1f9d4d] transition hover:bg-[#25D366]/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#59e08c]"
                          >
                            <WhatsAppIcon className="h-4 w-4" />
                            {resendCooldown > 0
                              ? `Resend in ${resendCooldown}s`
                              : 'Resend OTP'}
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
              Choose how the booking should be confirmed. Online payment is
              preselected.
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
                checked={paymentMode === 'pay_at_property'}
                onSelect={() => setPaymentMode('pay_at_property')}
                title="Pay at property"
                description="Confirm the booking now and settle the amount during your stay."
                icon={<Wallet className="h-5 w-5" />}
                tone="neutral"
              />
            </div>

            {pointsBalance != null &&
              pointsBalance >= 10 &&
              paymentMode === 'pay_now' && (
                <div className="bg-background/72 mt-5 rounded-[1.35rem] border border-border/60 px-4 py-4 backdrop-blur-xl dark:bg-background/35">
                  <label
                    className="block text-sm font-medium text-foreground"
                    htmlFor="pointsRedeem"
                  >
                    Redeem points (balance {pointsBalance}; 10 pts = ₹1)
                  </label>
                  <input
                    id="pointsRedeem"
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
                      const v = Math.min(
                        Math.max(0, Math.floor(raw / 10) * 10),
                        pointsBalance,
                      )
                      setPointsToRedeem(v)
                    }}
                    className="mt-2 w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  {appliedCoupon && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Remove coupon to redeem points.
                    </p>
                  )}
                </div>
              )}

            <div className="bg-background/72 mt-5 rounded-[1.35rem] border border-border/60 px-4 py-4 backdrop-blur-xl dark:bg-background/35">
              <label
                className="block text-sm font-medium text-foreground"
                htmlFor="couponCode"
              >
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
                  id="couponCode"
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
                  disabled={
                    pointsToRedeem > 0 ||
                    couponBusy ||
                    !couponCodeInput.trim() ||
                    Boolean(appliedCoupon)
                  }
                  whileTap={
                    !reduceMotion &&
                    !appliedCoupon &&
                    !couponBusy &&
                    couponCodeInput.trim() &&
                    pointsToRedeem === 0
                      ? { scale: 0.96 }
                      : undefined
                  }
                  className={`relative inline-flex h-12 min-w-[120px] items-center justify-center overflow-hidden rounded-[1rem] px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    appliedCoupon
                      ? 'bg-emerald-600 text-white shadow-[0_10px_24px_-8px_rgba(16,185,129,0.55)] dark:bg-emerald-400 dark:text-emerald-950'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {couponBusy && !reduceMotion && (
                    <motion.span
                      aria-hidden
                      initial={{ x: '-130%' }}
                      animate={{ x: '160%' }}
                      transition={{
                        duration: 1.1,
                        ease: 'linear',
                        repeat: Infinity,
                      }}
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
                originalAmount={Number(totalAmount)}
                originRef={applyButtonRef}
                onRemove={() => {
                  setAppliedCoupon(null)
                  setCouponError(null)
                }}
              />
              {couponError && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                  {couponError}
                </p>
              )}
              {pointsToRedeem > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Set points to 0 before applying a coupon.
                </p>
              )}
            </div>

            <div className="bg-background/72 mt-5 rounded-[1.35rem] border border-border/60 px-4 py-4 backdrop-blur-xl dark:bg-background/35">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground dark:bg-background/45">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    Direct booking reassurance
                  </div>
                  <p className="mt-1.5 text-sm leading-7 text-muted-foreground">
                    Your booking is made directly with the property. Better
                    clarity, easier coordination, and fewer third-party circus
                    tricks.
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
            <p>{error}</p>
            {paymentLinkUrl && (
              <a
                href={paymentLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-medium underline underline-offset-2"
              >
                Complete payment for existing booking
              </a>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="hidden xl:block">
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
          </div>

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

        <CheckoutDockBar
          ctaLabel={
            paymentMode === 'pay_now' ? 'Pay & confirm' : 'Confirm booking'
          }
          sentLabel={
            paymentMode === 'pay_now' ? 'Opening payment…' : 'Confirming…'
          }
          submitting={submitting}
          microline={
            paymentMode === 'pay_now'
              ? 'Secure payment via Razorpay'
              : 'No payment needed now — pay at the hotel'
          }
        >
          <LiveBookingTotal
            baseTotal={Number(totalAmount)}
            marketAmount={marketTotal}
            variant="mobile-bar"
          />
        </CheckoutDockBar>
      </form>
    </>
  )
}
