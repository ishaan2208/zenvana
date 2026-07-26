'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BadgePercent } from 'lucide-react'

import { PriceWithMarketRate } from '@/components/PriceWithMarketRate'

export type AppliedCoupon = { code: string; discountAmount: number } | null

type CouponState = {
  appliedCoupon: AppliedCoupon
  setAppliedCoupon: (c: AppliedCoupon) => void
  couponAppliedKey: number
  bumpAppliedKey: () => void
  /**
   * Set when the backend re-prices the stay and rejects the total this page was
   * opened with. The URL amount is then stale everywhere on the page, so every
   * page-level total defers to this instead.
   */
  repricedTotal: number | null
  setRepricedTotal: (n: number | null) => void
}

const CouponStateContext = createContext<CouponState | null>(null)

export function CheckoutCouponProvider({ children }: { children: ReactNode }) {
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon>(null)
  const [couponAppliedKey, setCouponAppliedKey] = useState(0)
  const [repricedTotal, setRepricedTotal] = useState<number | null>(null)
  const bumpAppliedKey = useCallback(
    () => setCouponAppliedKey((k) => k + 1),
    [],
  )
  const value = useMemo(
    () => ({
      appliedCoupon,
      setAppliedCoupon,
      couponAppliedKey,
      bumpAppliedKey,
      repricedTotal,
      setRepricedTotal,
    }),
    [appliedCoupon, couponAppliedKey, bumpAppliedKey, repricedTotal],
  )
  return (
    <CouponStateContext.Provider value={value}>
      {children}
    </CouponStateContext.Provider>
  )
}

export function useCheckoutCouponState(): CouponState | null {
  return useContext(CouponStateContext)
}

/** Tracks the previous render's value of `value`. */
function usePrevious<T>(value: T) {
  const ref = useRef<T | undefined>(undefined)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}

/**
 * Eased count-down rupee — RAF + state. Reused across summary contexts so
 * digits always re-render reliably regardless of motion-value subscription.
 */
function CountingRupee({
  from,
  to,
  duration = 0.95,
  delay = 0,
  className,
}: {
  from: number
  to: number
  duration?: number
  delay?: number
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = useState<number>(reduceMotion ? to : from)

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(to)
      return
    }
    let raf = 0
    let startMs = 0
    const totalMs = Math.max(0, duration) * 1000
    const delayMs = Math.max(0, delay) * 1000
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)
    const tick = (now: number) => {
      if (!startMs) startMs = now
      const elapsed = now - startMs - delayMs
      if (elapsed < 0) {
        setDisplay(from)
        raf = requestAnimationFrame(tick)
        return
      }
      const t = totalMs === 0 ? 1 : Math.min(1, elapsed / totalMs)
      setDisplay(from + (to - from) * easeOutQuart(t))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [from, to, duration, delay, reduceMotion])

  return (
    <span className={className}>
      ₹{Math.round(display).toLocaleString('en-IN')}
    </span>
  )
}

type LiveTotalVariant = 'sidebar' | 'mobile-bar' | 'chip'

/**
 * Page-level booking total that subscribes to the checkout coupon context and
 * animates whenever a coupon is applied or removed. Three layout variants
 * cover the page-level total displays:
 *
 *  - `sidebar`     — full breakdown (subtotal strike, coupon line, big total)
 *  - `mobile-bar`  — compact one-row bar with right-aligned animated total
 *  - `chip`        — inline pill for the hero chip row
 */
export function LiveBookingTotal({
  baseTotal: baseTotalProp,
  marketAmount: marketAmountProp,
  variant,
}: {
  baseTotal: number
  marketAmount?: number
  variant: LiveTotalVariant
}) {
  const ctx = useCheckoutCouponState()
  const reduceMotion = useReducedMotion()
  const appliedCoupon = ctx?.appliedCoupon ?? null
  const couponAppliedKey = ctx?.couponAppliedKey ?? 0
  const couponDiscount = appliedCoupon?.discountAmount ?? 0
  const couponCode = appliedCoupon?.code ?? null
  const hasCoupon = couponDiscount > 0
  // A server re-price supersedes the URL amount this page was rendered with,
  // and invalidates the struck-through comparison rate along with it.
  const baseTotal = ctx?.repricedTotal ?? baseTotalProp
  const marketAmount =
    ctx?.repricedTotal != null ? undefined : marketAmountProp
  const effective = Math.max(0, baseTotal - couponDiscount)

  const [animateFrom, setAnimateFrom] = useState(effective)
  const prevEffectiveRef = usePrevious(effective)
  useEffect(() => {
    if (
      prevEffectiveRef.current !== undefined &&
      prevEffectiveRef.current !== effective
    ) {
      setAnimateFrom(prevEffectiveRef.current)
    }
  }, [effective, prevEffectiveRef])

  if (variant === 'chip') {
    return (
      <span className="inline-flex items-baseline gap-1.5">
        <PriceWithMarketRate
          amount={effective}
          marketAmount={marketAmount}
          size="sm"
          inline
          showTaxBreakup={false}
        />
        <AnimatePresence initial={false}>
          {hasCoupon && couponCode && (
            <motion.span
              key={`chip-${couponAppliedKey}`}
              initial={
                reduceMotion ? false : { opacity: 0, x: -4, scale: 0.9 }
              }
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -4, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700 ring-1 ring-emerald-500/30 dark:bg-emerald-400/15 dark:text-emerald-200 dark:ring-emerald-300/30"
            >
              <BadgePercent className="h-2.5 w-2.5" />
              −₹{Math.round(couponDiscount).toLocaleString('en-IN')}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    )
  }

  if (variant === 'mobile-bar') {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Total
          </span>
          {hasCoupon ? (
            <motion.span
              key={`m-total-${couponAppliedKey}`}
              animate={
                !reduceMotion && couponAppliedKey > 0
                  ? { scale: [0.96, 1.05, 1] }
                  : {}
              }
              transition={{ duration: 0.7, ease: [0.16, 0.84, 0.34, 1] }}
              className="text-lg font-bold tracking-tight tabular-nums text-emerald-700 dark:text-emerald-200"
            >
              <CountingRupee
                from={couponAppliedKey > 0 ? animateFrom : effective}
                to={effective}
                duration={0.85}
              />
            </motion.span>
          ) : (
            <span className="text-lg font-semibold tracking-tight text-foreground">
              <PriceWithMarketRate
                amount={effective}
                marketAmount={marketAmount}
                size="lg"
                showTaxBreakup={false}
              />
            </span>
          )}
        </div>
        <AnimatePresence initial={false}>
          {hasCoupon && couponCode && (
            <motion.div
              key={`m-coupon-${couponAppliedKey}`}
              initial={
                reduceMotion ? false : { opacity: 0, y: -3, scale: 0.95 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -3, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              className="flex items-baseline justify-between gap-3 rounded-md bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-500/25 dark:bg-emerald-400/15 dark:text-emerald-200 dark:ring-emerald-300/25"
            >
              <span className="inline-flex items-center gap-1">
                <BadgePercent className="h-3 w-3" />
                <span className="uppercase tracking-[0.08em]">
                  {couponCode}
                </span>
              </span>
              <span className="tabular-nums">
                −₹{Math.round(couponDiscount).toLocaleString('en-IN')}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // sidebar — full breakdown with halo + animated big total
  if (!hasCoupon) {
    return (
      <PriceWithMarketRate
        amount={effective}
        marketAmount={marketAmount}
        size="xl"
        showTaxBreakup={false}
      />
    )
  }

  return (
    <div className="relative">
      {!reduceMotion && couponAppliedKey > 0 && (
        <motion.span
          aria-hidden
          key={`sb-halo-${couponAppliedKey}`}
          initial={{ opacity: 0.55, scale: 0.92 }}
          animate={{ opacity: 0, scale: 1.2 }}
          transition={{ duration: 1.4, ease: [0.16, 0.84, 0.34, 1] }}
          className="pointer-events-none absolute -inset-3 -z-0 rounded-2xl bg-emerald-400/30 blur-xl dark:bg-emerald-500/30"
        />
      )}
      <div className="relative space-y-2">
        <motion.div
          key={`sb-sub-${couponAppliedKey}`}
          initial={reduceMotion ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="flex items-baseline justify-between gap-3 text-sm text-muted-foreground"
        >
          <span>Subtotal</span>
          <span className="relative font-medium tabular-nums">
            ₹{Math.round(baseTotal).toLocaleString('en-IN')}
            {!reduceMotion && couponAppliedKey > 0 ? (
              <motion.span
                aria-hidden
                key={`sb-strike-${couponAppliedKey}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: 0.55,
                  delay: 0.2,
                  ease: [0.16, 0.84, 0.34, 1],
                }}
                style={{ transformOrigin: 'left center' }}
                className="pointer-events-none absolute -inset-x-0.5 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-rose-500/85 shadow-[0_0_6px_rgba(244,63,94,0.5)] dark:bg-rose-400/90"
              />
            ) : (
              <span className="absolute inset-0 line-through decoration-rose-500/85 decoration-2 dark:decoration-rose-400/90" />
            )}
          </span>
        </motion.div>

        {couponCode && (
          <motion.div
            key={`sb-coupon-${couponAppliedKey}`}
            initial={
              reduceMotion ? false : { opacity: 0, x: -6, scale: 0.96 }
            }
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 20,
              delay: 0.4,
            }}
            className="relative flex items-baseline justify-between gap-3 overflow-hidden rounded-lg bg-gradient-to-r from-emerald-500/15 via-emerald-500/15 to-emerald-500/10 px-2.5 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-500/25 dark:from-emerald-400/20 dark:via-emerald-400/20 dark:to-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-300/25"
          >
            {!reduceMotion && couponAppliedKey > 0 && (
              <motion.span
                aria-hidden
                key={`sb-sheen-${couponAppliedKey}`}
                initial={{ x: '-130%' }}
                animate={{ x: '160%' }}
                transition={{
                  duration: 1.1,
                  ease: [0.16, 0.84, 0.34, 1],
                  delay: 0.5,
                }}
                className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.45),transparent)] dark:bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.18),transparent)]"
              />
            )}
            <span className="relative inline-flex min-w-0 items-center gap-1.5 truncate">
              <BadgePercent className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate uppercase tracking-[0.08em]">
                {couponCode}
              </span>
            </span>
            <span className="relative tabular-nums">
              −₹{Math.round(couponDiscount).toLocaleString('en-IN')}
            </span>
          </motion.div>
        )}

        <motion.div
          key={`sb-grand-${couponAppliedKey}`}
          initial={reduceMotion ? false : { scale: 0.96 }}
          animate={
            !reduceMotion && couponAppliedKey > 0
              ? { scale: [0.96, 1.05, 1] }
              : { scale: 1 }
          }
          transition={{
            duration: 0.9,
            ease: [0.16, 0.84, 0.34, 1],
            delay: 0.55,
          }}
          className="flex items-baseline justify-between gap-3 border-t border-emerald-500/30 pt-2 dark:border-emerald-300/25"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700/80 dark:text-emerald-200/80">
            Total
          </span>
          <span className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-200">
            <CountingRupee
              from={couponAppliedKey > 0 ? animateFrom : effective}
              to={effective}
              duration={1.0}
              delay={0.6}
            />
          </span>
        </motion.div>
      </div>
    </div>
  )
}
