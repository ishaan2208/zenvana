'use client'

import type { CSSProperties, ReactNode } from 'react'

import { useInViewOnce } from '@/hooks/useInViewOnce'
import { cn } from '@/lib/utils'

type RevealProps = {
  children: ReactNode
  /** Stagger delay in ms (e.g. index * 70). Keep small — fast, not theatrical. */
  delay?: number
  className?: string
  /** Visible ratio that triggers the reveal. */
  minRatio?: number
}

/**
 * Entrance reveal primitive — opacity + a small rise, settling on scroll-in.
 *
 * Single source of truth for "appears as you reach it" moments (the collection,
 * key marketing beats). Fires once (never re-triggers on re-render), animates
 * only transform/opacity, and degrades to an opacity-only fade under
 * `prefers-reduced-motion` (handled by the `.reveal` rules in globals.css).
 *
 * Reserve for a few high-impact moments — do NOT wrap every section/card.
 */
export function Reveal({ children, delay = 0, className, minRatio = 0.15 }: RevealProps) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>({ minRatio })

  return (
    <div
      ref={ref}
      data-inview={inView ? 'true' : 'false'}
      className={cn('reveal', className)}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  )
}
