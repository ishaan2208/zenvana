'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { BedDouble, ChevronLeft, ChevronRight } from 'lucide-react'

type Room = {
  name: string
  description: string
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function RoomsCarousel({
  rooms,
  autoplayMs = 4500,
}: {
  rooms: Room[]
  autoplayMs?: number | false
}) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const baseCount = rooms.length
  const loopedRooms = useMemo(() => {
    // Render 3x to enable seamless looping.
    return [...rooms, ...rooms, ...rooms]
  }, [rooms])
  const loopStartIndex = baseCount

  const [activeIndex, setActiveIndex] = useState(loopStartIndex)
  const [pageCount, setPageCount] = useState(baseCount)
  const [pageIndex, setPageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const animationRef = useRef<number | null>(null)
  const drag = useRef<{
    isDown: boolean
    startX: number
    startScrollLeft: number
    pointerId: number | null
  }>({ isDown: false, startX: 0, startScrollLeft: 0, pointerId: null })

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  }, [])

  const logicalActive = ((activeIndex - loopStartIndex) % baseCount + baseCount) % baseCount

  const measure = () => {
    const el = trackRef.current
    if (!el) return
    const first = el.querySelector<HTMLElement>('[data-slide]')
    if (!first) return
    const slideWidth = first.getBoundingClientRect().width
    if (!slideWidth) return
    const visible = Math.max(1, Math.round(el.getBoundingClientRect().width / slideWidth))
    setPageCount(Math.max(1, Math.ceil(baseCount / visible)))
  }

  const getSlideStep = () => {
    const el = trackRef.current
    if (!el) return 0
    const first = el.querySelector<HTMLElement>('[data-slide]')
    if (!first) return 0
    const slideRect = first.getBoundingClientRect()
    const computed = window.getComputedStyle(el)
    const gap = Number.parseFloat(computed.columnGap || computed.gap || '0') || 0
    return slideRect.width + gap
  }

  const easeInOut = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

  const scrollToIndex = (idx: number) => {
    const el = trackRef.current
    if (!el) return
    const step = getSlideStep()
    const target = step * idx
    if (prefersReducedMotion) {
      el.scrollLeft = target
      return
    }

    const start = el.scrollLeft
    const distance = target - start
    const duration = 500
    const startTime = performance.now()

    if (animationRef.current != null) {
      cancelAnimationFrame(animationRef.current)
    }

    const stepFrame = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(1, elapsed / duration)
      const eased = easeInOut(t)
      el.scrollLeft = start + distance * eased
      if (t < 1) {
        animationRef.current = requestAnimationFrame(stepFrame)
      }
    }

    animationRef.current = requestAnimationFrame(stepFrame)
  }

  const onPrev = () => scrollToIndex(clamp(activeIndex - 1, 0, rooms.length - 1))
  const onNext = () => scrollToIndex(clamp(activeIndex + 1, 0, rooms.length - 1))

  useEffect(() => {
    measure()
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseCount])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return

    const onScroll = () => {
      const step = getSlideStep()
      if (!step) return
      const idx = clamp(Math.round(el.scrollLeft / step), 0, loopedRooms.length - 1)

      // Seamless loop: if we get too close to either end, jump by one set.
      if (idx <= baseCount * 0.5) {
        const jumped = idx + baseCount
        el.scrollLeft = jumped * step
        setActiveIndex(jumped)
      } else if (idx >= baseCount * 2.5) {
        const jumped = idx - baseCount
        el.scrollLeft = jumped * step
        setActiveIndex(jumped)
      } else {
        setActiveIndex(idx)
      }

      const logicalIdx = ((idx - loopStartIndex) % baseCount + baseCount) % baseCount
      const visible = Math.max(1, Math.round(el.getBoundingClientRect().width / step))
      const page = clamp(Math.floor(logicalIdx / visible), 0, Math.max(0, Math.ceil(baseCount / visible) - 1))
      setPageIndex(page)
    }

    // Start centered in the middle set.
    const step = getSlideStep()
    if (step) {
      el.scrollLeft = loopStartIndex * step
      setActiveIndex(loopStartIndex)
    }

    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseCount, loopedRooms.length, loopStartIndex])

  useEffect(() => {
    if (!autoplayMs || prefersReducedMotion || isHovered) return
    const el = trackRef.current
    if (!el) return

    const id = window.setInterval(() => {
      const step = getSlideStep()
      if (!step) return
      scrollToIndex(activeIndex + 1)
    }, autoplayMs)

    return () => window.clearInterval(id)
  }, [activeIndex, autoplayMs, prefersReducedMotion, isHovered])

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute -top-14 right-0 hidden items-center gap-2 md:flex">
        <button
          type="button"
          aria-label="Previous room"
          onClick={() => scrollToIndex(activeIndex - 1)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground/80 hover:bg-card hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next room"
          onClick={() => scrollToIndex(activeIndex + 1)}
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
          'cursor-grab active:cursor-grabbing',
        )}
        onPointerDown={(e) => {
          const el = trackRef.current
          if (!el) return
          drag.current.isDown = true
          drag.current.startX = e.clientX
          drag.current.startScrollLeft = el.scrollLeft
          drag.current.pointerId = e.pointerId
          el.setPointerCapture?.(e.pointerId)
        }}
        onPointerMove={(e) => {
          const el = trackRef.current
          if (!el || !drag.current.isDown) return
          const dx = e.clientX - drag.current.startX
          el.scrollLeft = drag.current.startScrollLeft - dx
        }}
        onPointerUp={(e) => {
          const el = trackRef.current
          if (!el) return
          drag.current.isDown = false
          if (drag.current.pointerId != null) {
            el.releasePointerCapture?.(drag.current.pointerId)
          }
          drag.current.pointerId = null
        }}
        onPointerCancel={() => {
          drag.current.isDown = false
          drag.current.pointerId = null
        }}
      >
        {loopedRooms.map((room, i) => {
          const isCenter = i === activeIndex
          const isNear = Math.abs(i - activeIndex) === 1

          return (
          <article
            key={`${room.name}-${i}`}
            data-slide
            className={clsx(
              'quiet-card snap-center shrink-0 overflow-hidden',
              'basis-full sm:basis-[calc(50%-12px)] lg:basis-[calc(33.333%-16px)]',
              'transition-transform duration-500 ease-in-out will-change-transform',
              isCenter ? 'scale-[1]' : isNear ? 'scale-[0.96]' : 'scale-[0.92]',
            )}
          >
            <div className="relative aspect-[4/3] bg-muted">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.14),transparent_55%),linear-gradient(to_bottom,_rgba(0,0,0,0.08),rgba(0,0,0,0.08))]" />
              <div className="absolute inset-0 grid place-items-center text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
                Room image placeholder
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <BedDouble className="h-4 w-4" />
                Room type
              </div>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
                {room.name}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{room.description}</p>
              <div className="mt-6">
                <Link href="/hotels" className="site-button-light">
                  Explore Room
                </Link>
              </div>
            </div>
          </article>
          )
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {Array.from({ length: pageCount }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => {
              const el = trackRef.current
              if (!el) return
              const step = getSlideStep()
              if (!step) return
              const visible = Math.max(1, Math.round(el.getBoundingClientRect().width / step))
              scrollToIndex(loopStartIndex + i * visible)
            }}
            className={clsx(
              'h-2 w-2 rounded-full transition',
              i === pageIndex ? 'bg-foreground/80' : 'bg-foreground/25 hover:bg-foreground/40',
            )}
          />
        ))}
      </div>
    </div>
  )
}

