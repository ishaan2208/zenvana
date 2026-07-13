import type { Transition, Variants } from 'framer-motion'

/**
 * Motion constants — the JS mirror of the CSS `--ease-*` / `--duration-*` tokens
 * in globals.css. Import these in Framer Motion surfaces so easing/timing stays
 * consistent with the CSS-driven primitives (no scattered magic numbers).
 */

/** Easing curves (cubic-bezier control points). */
type Bezier = [number, number, number, number]
export const EASE = {
  out: [0.16, 1, 0.3, 1] as Bezier,
  inOut: [0.65, 0, 0.35, 1] as Bezier,
  drawer: [0.32, 0.72, 0, 1] as Bezier,
}

/** Durations in SECONDS (Framer Motion uses seconds; CSS tokens are ms). */
export const DURATION = {
  instant: 0.1,
  fast: 0.15,
  base: 0.2,
  slow: 0.3,
} as const

/** Natural spring for organic motion (sheets, draggable, playful reveals). */
export const SPRING: Transition = { type: 'spring', stiffness: 350, damping: 30, mass: 1 }
/** Softer spring for larger/heavier surfaces. */
export const SPRING_SOFT: Transition = { type: 'spring', stiffness: 260, damping: 28, mass: 1 }

/**
 * Origin-aware popover / menu transition (scale 0.96 → 1 + fade).
 * Never animate from scale(0) — start at 0.96. Pair with a CSS `transform-origin`
 * pointed at the trigger so it grows from where it was opened.
 */
export const popoverVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.fast, ease: EASE.out },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: DURATION.instant, ease: EASE.out },
  },
}

/**
 * Fade + small rise variants. Pass `reduced` (from `useReducedMotion()`) to drop
 * the movement and fade only — keeps feedback without motion.
 */
export function fadeUpVariants(reduced = false): Variants {
  return {
    hidden: { opacity: 0, y: reduced ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: DURATION.base, ease: EASE.out },
    },
  }
}

/**
 * Per-item layout spring for a nav row's inline clusters (logo, link group,
 * action buttons). Stiffness eases off left→right so each item trails the
 * one before it by a few frames during the bar's condense — a wave
 * (parallax), never a rigid block move. Pass the item's index in the row.
 *
 * Deliberately scoped to normal-flow children, never the sticky bar itself:
 * Framer's `layout` FLIP animates via transform, which fights the browser's
 * own offset recalculation on a `position: sticky` element whenever its size
 * changes — the bar's own height/shadow condense uses a plain CSS transition
 * instead (see Header.tsx).
 */
export function navItemTransition(index: number, reduced = false): Transition {
  if (reduced) return { duration: 0 }
  return {
    type: 'spring',
    stiffness: 470 - index * 26,
    damping: 33,
    mass: 0.85,
  }
}
