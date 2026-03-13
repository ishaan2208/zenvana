'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

type Testimonial = {
  name: string
  text: string
  stars: 1 | 2 | 3 | 4 | 5
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function RestaurantTestimonials({
  items,
  autoplayMs = 4500,
}: {
  items: Testimonial[]
  autoplayMs?: number | false
}) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  }, [])

  const scrollTo = (i: number) => {
    const el = trackRef.current
    if (!el) return
    const slide = el.querySelector<HTMLElement>('[data-slide]')
    if (!slide) return
    const gap = Number.parseFloat(window.getComputedStyle(el).gap || '0') || 0
    const step = slide.getBoundingClientRect().width + gap
    el.scrollTo({ left: i * step, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  }

  useEffect(() => {
    scrollTo(index)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  useEffect(() => {
    if (!autoplayMs || prefersReducedMotion || hovered) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length)
    }, autoplayMs)
    return () => window.clearInterval(id)
  }, [autoplayMs, hovered, items.length, prefersReducedMotion])

  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="absolute -top-14 right-0 hidden items-center gap-2 md:flex">
        <button
          type="button"
          aria-label="Previous testimonial"
          onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground/80 hover:bg-card hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next testimonial"
          onClick={() => setIndex((i) => (i + 1) % items.length)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground/80 hover:bg-card hover:text-foreground"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={trackRef}
        className={clsx(
          'mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2',
          'scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {items.map((t, i) => (
          <article
            key={`${t.name}-${i}`}
            data-slide
            className="quiet-card snap-start shrink-0 basis-full p-6 sm:basis-[calc(50%-12px)] lg:basis-[calc(33.333%-16px)]"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-muted" />
              <div>
                <div className="text-sm font-semibold text-foreground">{t.name}</div>
                <div className="mt-1 flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }, (_, s) => (
                    <Star key={s} className={s < t.stars ? 'h-4 w-4 fill-current' : 'h-4 w-4 opacity-30'} />
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{t.text}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to testimonial ${i + 1}`}
            onClick={() => setIndex(clamp(i, 0, items.length - 1))}
            className={clsx(
              'h-2 w-2 rounded-full transition',
              i === index ? 'bg-foreground/80' : 'bg-foreground/25 hover:bg-foreground/40',
            )}
          />
        ))}
      </div>
    </div>
  )
}

