'use client'

import type { RefObject } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion'
import { PartyPopper, Sparkles, BadgePercent, X } from 'lucide-react'
import { PriceWithMarketRate } from '@/components/PriceWithMarketRate'

const CONFETTI_COLORS = [
  '#10b981',
  '#22c55e',
  '#16a34a',
  '#facc15',
  '#f59e0b',
  '#fb7185',
  '#ec4899',
  '#a855f7',
  '#3b82f6',
  '#06b6d4',
  '#14b8a6',
  '#f97316',
]

type ShapeKind = 'square' | 'circle' | 'bar' | 'star' | 'ribbon'

type ConfettiPiece = {
  id: number
  layer: 'burst' | 'fountain'
  xMid: number
  xEnd: number
  yMid: number
  yEnd: number
  rotate: number
  rotateY: number
  scale: number
  duration: number
  delay: number
  color: string
  shape: ShapeKind
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SHAPES: ShapeKind[] = ['square', 'circle', 'bar', 'star', 'ribbon']

function buildPieces(seed: number, isMobile: boolean): ConfettiPiece[] {
  const rand = mulberry32(seed || 1)
  const burstCount = isMobile ? 20 : 38
  const fountainCount = isMobile ? 10 : 18
  const pieces: ConfettiPiece[] = []

  // Radial burst — pieces fly outward in all directions then fall under gravity.
  for (let i = 0; i < burstCount; i++) {
    const angle = rand() * Math.PI * 2
    const distance = (isMobile ? 140 : 220) + rand() * (isMobile ? 160 : 280)
    const xEnd = Math.cos(angle) * distance
    const yMid = Math.sin(angle) * distance * 0.55 - 30
    const yEnd = yMid + 240 + rand() * 220
    pieces.push({
      id: i,
      layer: 'burst',
      xMid: xEnd * 0.55,
      xEnd,
      yMid,
      yEnd,
      rotate: rand() * 720 - 360,
      rotateY: rand() * 540 - 270,
      scale: 0.65 + rand() * 0.85,
      duration: 1.4 + rand() * 1.2,
      delay: rand() * 0.05,
      color: CONFETTI_COLORS[Math.floor(rand() * CONFETTI_COLORS.length)],
      shape: SHAPES[Math.floor(rand() * SHAPES.length)],
    })
  }

  // Fountain — upward narrow cone, peak, then heavy fall.
  for (let i = 0; i < fountainCount; i++) {
    const coneAngle = (rand() - 0.5) * (Math.PI / 2.2) // ±~40° around straight up
    const power = (isMobile ? 180 : 260) + rand() * (isMobile ? 140 : 220)
    const xEnd = Math.sin(coneAngle) * power * 1.4
    const yPeak = -power
    const yEnd = power + (isMobile ? 220 : 380) + rand() * 180
    pieces.push({
      id: burstCount + i,
      layer: 'fountain',
      xMid: xEnd * 0.5,
      xEnd,
      yMid: yPeak,
      yEnd,
      rotate: rand() * 900 - 450,
      rotateY: rand() * 720 - 360,
      scale: 0.75 + rand() * 0.95,
      duration: 1.9 + rand() * 1.0,
      delay: rand() * 0.08,
      color: CONFETTI_COLORS[Math.floor(rand() * CONFETTI_COLORS.length)],
      shape: SHAPES[Math.floor(rand() * SHAPES.length)],
    })
  }
  return pieces
}

function ConfettiShape({ shape }: { shape: ShapeKind }) {
  if (shape === 'circle') {
    return (
      <span
        className="block h-2.5 w-2.5 rounded-full shadow-[0_0_10px_currentColor]"
        style={{ background: 'currentColor' }}
      />
    )
  }
  if (shape === 'bar') {
    return (
      <span
        className="block h-1.5 w-4 rounded-sm"
        style={{ background: 'currentColor' }}
      />
    )
  }
  if (shape === 'ribbon') {
    return (
      <span
        className="block h-1 w-5 rounded-full"
        style={{
          background:
            'linear-gradient(90deg, currentColor 0%, color-mix(in srgb, currentColor 40%, transparent) 100%)',
        }}
      />
    )
  }
  if (shape === 'star') {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
        className="drop-shadow-[0_0_6px_currentColor]"
      >
        <path d="M12 2l2.39 7.36H22l-6.18 4.49L18.18 22 12 17.27 5.82 22l2.36-8.15L2 9.36h7.61z" />
      </svg>
    )
  }
  return (
    <span
      className="block h-2.5 w-2.5 rounded-[2px]"
      style={{ background: 'currentColor' }}
    />
  )
}

type Origin = { x: number; y: number }

export function ConfettiBurst({
  triggerKey,
  origin,
}: {
  triggerKey: number
  origin: Origin | null
}) {
  const reduceMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const pieces = useMemo(
    () => buildPieces(triggerKey || 1, isMobile),
    [triggerKey, isMobile],
  )

  useEffect(() => {
    if (!triggerKey) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 2900)
    return () => clearTimeout(t)
  }, [triggerKey])

  if (reduceMotion || !visible || !origin || !mounted) return null

  // Portal to <body> so a transformed ancestor (e.g. framer-motion `layout`
  // on the banner / parent cards) cannot capture our `position: fixed` overlay.
  const overlay = (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
      style={{ perspective: '1200px' }}
    >
      {/* Soft radial flash at the origin point */}
      <motion.div
        key={`flash-${triggerKey}`}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 0.55, 0], scale: [0.4, 1.7, 2.2] }}
        transition={{ duration: 0.9, ease: [0.16, 0.84, 0.34, 1] }}
        className="absolute h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.55)_0%,rgba(16,185,129,0.18)_45%,transparent_72%)] blur-xl"
        style={{ left: origin.x, top: origin.y }}
      />

      {pieces.map((p) => {
        const ease =
          p.layer === 'fountain'
            ? ([0.22, 1, 0.36, 1] as [number, number, number, number])
            : ([0.16, 0.84, 0.34, 1] as [number, number, number, number])
        return (
          <motion.span
            key={`${triggerKey}-${p.id}`}
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              rotate: 0,
              rotateY: 0,
              scale: 0.35,
            }}
            animate={{
              x: [0, p.xMid, p.xEnd],
              y: [0, p.yMid, p.yEnd],
              rotate: p.rotate,
              rotateY: p.rotateY,
              opacity: [1, 1, 0],
              scale: p.scale,
            }}
            transition={{
              duration: p.duration,
              ease,
              times: [0, 0.42, 1],
              delay: p.delay,
            }}
            className="absolute will-change-transform [transform-style:preserve-3d]"
            style={{ left: origin.x, top: origin.y, color: p.color }}
          >
            <ConfettiShape shape={p.shape} />
          </motion.span>
        )
      })}
    </div>
  )

  return createPortal(overlay, document.body)
}

/**
 * Eased-count animated rupee value. Uses requestAnimationFrame + React state
 * so the displayed digits ALWAYS re-render — no reliance on motion-value text
 * subscription edge cases.
 */
function AnimatedRupee({
  from,
  to,
  className,
  duration = 0.95,
  delay = 0,
}: {
  from: number
  to: number
  className?: string
  duration?: number
  delay?: number
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
      const eased = easeOutQuart(t)
      setDisplay(from + (to - from) * eased)
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

export type AppliedCouponBannerProps = {
  code: string
  originalAmount: number
  discountAmount: number
  /** Increments each time the user successfully applies a coupon — drives one-shot animations. */
  appliedKey: number
  onRemove?: () => void
}

export function AppliedCouponBanner({
  code,
  originalAmount,
  discountAmount,
  appliedKey,
  onRemove,
}: AppliedCouponBannerProps) {
  const reduceMotion = useReducedMotion()
  const newAmount = Math.max(0, originalAmount - discountAmount)
  const savedRounded = Math.round(discountAmount)
  const percentOff =
    originalAmount > 0
      ? Math.max(1, Math.round((discountAmount / originalAmount) * 100))
      : 0

  const animKey = `apply-${appliedKey}`

  return (
    <motion.div
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{
        type: 'spring',
        stiffness: 320,
        damping: 22,
        mass: 0.9,
      }}
      className="relative mt-3 overflow-hidden rounded-[1.4rem] border border-emerald-300/60 bg-[linear-gradient(135deg,#ecfdf5_0%,#d1fae5_45%,#bbf7d0_100%)] p-4 shadow-[0_22px_55px_-18px_rgba(16,185,129,0.55),0_8px_22px_-12px_rgba(16,185,129,0.35)] dark:border-emerald-400/25 dark:bg-[linear-gradient(135deg,rgba(6,78,59,0.62)_0%,rgba(6,95,70,0.50)_45%,rgba(4,120,87,0.40)_100%)] dark:shadow-[0_28px_60px_-22px_rgba(16,185,129,0.55),0_0_0_1px_rgba(16,185,129,0.18)_inset] sm:p-5"
    >
      {/* Animated halo behind savings */}
      {!reduceMotion && (
        <motion.div
          key={`halo-${animKey}`}
          aria-hidden
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: [0, 0.55, 0.18], scale: [0.4, 1.4, 1] }}
          transition={{ duration: 1.6, ease: [0.16, 0.84, 0.34, 1] }}
          className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.55)_0%,rgba(16,185,129,0.12)_55%,transparent_75%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(52,211,153,0.55)_0%,rgba(16,185,129,0.18)_55%,transparent_75%)]"
        />
      )}

      {/* Diagonal sheen sweep */}
      {!reduceMotion && (
        <motion.div
          key={`sheen-${animKey}`}
          aria-hidden
          initial={{ x: '-130%' }}
          animate={{ x: '170%' }}
          transition={{ duration: 1.5, ease: [0.16, 0.84, 0.34, 1], delay: 0.1 }}
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.55),transparent)] dark:bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.18),transparent)]"
        />
      )}

      {/* Drifting sparkles */}
      {!reduceMotion && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {[
            { left: '6%', top: '22%', delay: 0.1, size: 'h-3.5 w-3.5' },
            { left: '94%', top: '16%', delay: 0.25, size: 'h-3 w-3' },
            { left: '12%', top: '78%', delay: 0.35, size: 'h-3 w-3' },
            { left: '88%', top: '74%', delay: 0.5, size: 'h-3.5 w-3.5' },
            { left: '52%', top: '8%', delay: 0.6, size: 'h-2.5 w-2.5' },
          ].map((s, i) => (
            <motion.span
              key={`${animKey}-spark-${i}`}
              initial={{ opacity: 0, scale: 0.4, rotate: -20, y: 4 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.4, 1.1, 1, 0.6],
                rotate: [0, 22, -8, 0],
                y: [4, -4, 0, -2],
              }}
              transition={{ duration: 1.8, delay: s.delay, ease: 'easeOut' }}
              className="absolute text-emerald-500 dark:text-emerald-300"
              style={{ left: s.left, top: s.top }}
            >
              <Sparkles className={s.size} />
            </motion.span>
          ))}
        </div>
      )}

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <motion.div
            key={`badge-${animKey}`}
            initial={
              reduceMotion ? false : { scale: 0.3, rotate: -16, opacity: 0 }
            }
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 14,
              delay: 0.05,
            }}
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_14px_28px_-8px_rgba(16,185,129,0.6),0_0_0_4px_rgba(255,255,255,0.55)] dark:from-emerald-300 dark:to-emerald-500 dark:text-emerald-950 dark:shadow-[0_14px_28px_-8px_rgba(16,185,129,0.55),0_0_0_3px_rgba(6,78,59,0.55)] sm:h-12 sm:w-12"
          >
            <PartyPopper className="h-5 w-5" />
            {!reduceMotion && (
              <motion.span
                aria-hidden
                key={`pulse-${animKey}`}
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 1.9 }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.05 }}
                className="absolute inset-0 rounded-full ring-2 ring-emerald-400/70 dark:ring-emerald-300/70"
              />
            )}
          </motion.div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-200">
                Coupon applied
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-white/80 px-2 py-0.5 text-[11px] font-semibold tracking-[0.12em] text-emerald-800 backdrop-blur dark:border-emerald-300/30 dark:bg-emerald-950/50 dark:text-emerald-100">
                <BadgePercent className="h-3 w-3" />
                {code}
              </span>
              {percentOff >= 1 && (
                <motion.span
                  key={`pct-${animKey}`}
                  initial={
                    reduceMotion ? false : { opacity: 0, scale: 0.7, y: -4 }
                  }
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 16,
                    delay: 0.45,
                  }}
                  className="inline-flex items-center rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_6px_14px_-4px_rgba(16,185,129,0.55)] dark:bg-emerald-400 dark:text-emerald-950"
                >
                  −{percentOff}% off
                </motion.span>
              )}
            </div>

            {/* Price slash row */}
            <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm sm:text-base">
              <span className="relative inline-block">
                <span className="font-medium tabular-nums text-emerald-900/55 dark:text-emerald-100/55">
                  ₹{Math.round(originalAmount).toLocaleString('en-IN')}
                </span>
                {/* Hand-tilted strike with soft glow */}
                <motion.span
                  key={`strike-${animKey}`}
                  aria-hidden
                  initial={reduceMotion ? { scaleX: 1 } : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.18,
                    ease: [0.16, 0.84, 0.34, 1],
                  }}
                  style={{
                    transformOrigin: 'left center',
                    rotate: '-3deg',
                  }}
                  className="pointer-events-none absolute -inset-x-1 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-rose-500/90 shadow-[0_0_8px_rgba(244,63,94,0.55)] dark:bg-rose-400/90 dark:shadow-[0_0_10px_rgba(251,113,133,0.55)]"
                />
              </span>

              <motion.span
                key={`arrow-${animKey}`}
                initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.5 }}
                className="text-emerald-700/80 dark:text-emerald-200/80"
              >
                →
              </motion.span>

              {/* New total counts DOWN from old → new for cinematic effect */}
              <motion.span
                key={`new-${animKey}`}
                initial={reduceMotion ? false : { opacity: 0, y: 6, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 18,
                  delay: 0.45,
                }}
                className="font-semibold tabular-nums text-emerald-800 dark:text-emerald-100"
              >
                <AnimatedRupee
                  from={originalAmount}
                  to={newAmount}
                  duration={1.05}
                  delay={0.55}
                />
              </motion.span>
            </div>

            {/* Savings pill with count-up + halo */}
            <motion.div
              key={`saved-${animKey}`}
              initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 18,
                delay: 0.7,
              }}
              className="relative mt-3 inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_10px_22px_-6px_rgba(16,185,129,0.55)] dark:from-emerald-400 dark:to-emerald-300 dark:text-emerald-950"
            >
              {!reduceMotion && (
                <motion.span
                  aria-hidden
                  key={`saved-sheen-${animKey}`}
                  initial={{ x: '-130%' }}
                  animate={{ x: '160%' }}
                  transition={{
                    duration: 1.2,
                    ease: [0.16, 0.84, 0.34, 1],
                    delay: 0.95,
                    repeat: 1,
                    repeatDelay: 0.4,
                  }}
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.55),transparent)]"
                />
              )}
              <Sparkles className="h-3.5 w-3.5" />
              <span className="relative">You saved&nbsp;</span>
              <span className="relative">
                <AnimatedRupee
                  className="tabular-nums"
                  from={0}
                  to={savedRounded}
                  duration={1.0}
                  delay={0.7}
                />
              </span>
            </motion.div>
          </div>
        </div>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-8 items-center gap-1 self-start rounded-full border border-emerald-700/20 bg-white/80 px-3 text-[11px] font-medium text-emerald-900 backdrop-blur transition hover:bg-white dark:border-emerald-200/20 dark:bg-emerald-950/55 dark:text-emerald-100 dark:hover:bg-emerald-950/75"
          >
            <X className="h-3 w-3" />
            Remove
          </button>
        )}
      </div>
    </motion.div>
  )
}

export type CouponCelebrationProps = {
  applied: { code: string; discountAmount: number } | null
  appliedKey: number
  originalAmount: number
  onRemove?: () => void
  /** Optional: Apply button ref. Confetti will burst from its center. */
  originRef?: RefObject<HTMLElement | null>
}

export function CouponCelebration({
  applied,
  appliedKey,
  originalAmount,
  onRemove,
  originRef,
}: CouponCelebrationProps) {
  const [origin, setOrigin] = useState<Origin | null>(null)
  const reduceMotion = useReducedMotion()
  const lastFiredRef = useRef(0)

  useEffect(() => {
    if (appliedKey === 0) return
    if (appliedKey === lastFiredRef.current) return
    lastFiredRef.current = appliedKey
    if (!applied) return

    const rect = originRef?.current?.getBoundingClientRect()
    if (rect && rect.width > 0) {
      setOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
    } else if (typeof window !== 'undefined') {
      setOrigin({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    }

    if (
      !reduceMotion &&
      typeof navigator !== 'undefined' &&
      typeof navigator.vibrate === 'function'
    ) {
      try {
        navigator.vibrate([12, 28, 14])
      } catch {
        /* noop */
      }
    }
  }, [appliedKey, applied, originRef, reduceMotion])

  return (
    <>
      <ConfettiBurst triggerKey={applied ? appliedKey : 0} origin={origin} />
      <AnimatePresence initial={false}>
        {applied && (
          <AppliedCouponBanner
            key="applied-banner"
            code={applied.code}
            discountAmount={applied.discountAmount}
            originalAmount={originalAmount}
            appliedKey={appliedKey}
            onRemove={onRemove}
          />
        )}
      </AnimatePresence>
    </>
  )
}

/**
 * Drop-in replacement for `<PriceWithMarketRate>` in the booking-summary "Total"
 * card. Pulses + glows when a coupon is applied, animates the price counting
 * down from the original to the discounted total, and renders a vibrant
 * "CODE − ₹X off" chip below.
 */
export function BookingTotalDisplay({
  totalAmount,
  marketAmount,
  couponDiscount,
  couponCode,
  appliedKey,
}: {
  /** Pre-coupon total (cash payable before the coupon discount). */
  totalAmount: number
  /** Optional market / OTA list price for the strike-through comparison. */
  marketAmount?: number
  /** Coupon savings in rupees (0 when no coupon applied). */
  couponDiscount: number
  /** Coupon code string (null when no coupon applied). */
  couponCode: string | null
  /** Bumps each time the user successfully applies a coupon. */
  appliedKey: number
}) {
  const reduceMotion = useReducedMotion()
  const hasCoupon = couponDiscount > 0
  const effective = Math.max(0, totalAmount - couponDiscount)
  const previousAmountRef = useRef(effective)
  const [animateFrom, setAnimateFrom] = useState(effective)

  useEffect(() => {
    if (effective !== previousAmountRef.current) {
      setAnimateFrom(previousAmountRef.current)
      previousAmountRef.current = effective
    }
  }, [effective])

  // No coupon — keep the existing market-rate strike presentation untouched.
  if (!hasCoupon) {
    return (
      <PriceWithMarketRate
        amount={effective}
        marketAmount={marketAmount}
        size="default"
        showTaxBreakup={false}
      />
    )
  }

  return (
    <div className="relative block">
      {/* Glow halo on coupon apply */}
      {!reduceMotion && appliedKey > 0 && (
        <motion.span
          aria-hidden
          key={`halo-${appliedKey}`}
          initial={{ opacity: 0.55, scale: 0.92 }}
          animate={{ opacity: 0, scale: 1.22 }}
          transition={{ duration: 1.4, ease: [0.16, 0.84, 0.34, 1] }}
          className="pointer-events-none absolute -inset-2 -z-0 rounded-2xl bg-emerald-400/35 blur-xl dark:bg-emerald-500/35"
        />
      )}

      <div className="relative space-y-1.5">
        {/* Subtotal — pre-coupon amount, struck through */}
        <motion.div
          key={`sub-${appliedKey}`}
          initial={reduceMotion ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="flex items-baseline justify-between gap-2 text-[12px] text-muted-foreground"
        >
          <span>Subtotal</span>
          <span className="relative font-medium tabular-nums">
            ₹{Math.round(totalAmount).toLocaleString('en-IN')}
            {!reduceMotion && appliedKey > 0 && (
              <motion.span
                aria-hidden
                key={`strike-${appliedKey}`}
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
            )}
            {(reduceMotion || appliedKey === 0) && (
              <span className="absolute inset-0 line-through decoration-rose-500/85 decoration-2 dark:decoration-rose-400/90" />
            )}
          </span>
        </motion.div>

        {/* Highlighted coupon discount line — the primary "this is what saved you money" indicator */}
        {couponCode && (
          <motion.div
            key={`coupon-line-${appliedKey}`}
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
            className="relative flex items-baseline justify-between gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-emerald-500/15 via-emerald-500/15 to-emerald-500/10 px-2 py-1 text-[12px] font-semibold text-emerald-700 ring-1 ring-emerald-500/25 dark:from-emerald-400/20 dark:via-emerald-400/20 dark:to-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-300/25"
          >
            {!reduceMotion && appliedKey > 0 && (
              <motion.span
                aria-hidden
                key={`coupon-sheen-${appliedKey}`}
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
            <span className="relative inline-flex min-w-0 items-center gap-1 truncate">
              <BadgePercent className="h-3 w-3 shrink-0" />
              <span className="truncate uppercase tracking-[0.08em]">
                {couponCode}
              </span>
            </span>
            <span className="relative tabular-nums">
              −₹{Math.round(couponDiscount).toLocaleString('en-IN')}
            </span>
          </motion.div>
        )}

        {/* New total — big, emerald, animated count-down. THIS is the grand total. */}
        <motion.div
          key={`grand-${appliedKey}`}
          initial={reduceMotion ? false : { scale: 0.96 }}
          animate={
            !reduceMotion && appliedKey > 0
              ? { scale: [0.96, 1.05, 1] }
              : { scale: 1 }
          }
          transition={{
            duration: 0.9,
            ease: [0.16, 0.84, 0.34, 1],
            delay: 0.55,
          }}
          className="flex items-baseline justify-between gap-2 border-t border-emerald-500/30 pt-1.5 dark:border-emerald-300/25"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700/80 dark:text-emerald-200/80">
            Total
          </span>
          <span className="text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-200">
            <AnimatedRupee
              from={appliedKey > 0 ? animateFrom : effective}
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
