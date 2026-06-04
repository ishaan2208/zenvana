'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

import { useInViewOnce } from '@/hooks/useInViewOnce'
import { cn } from '@/lib/utils'

const SLIDE_INTERVAL_MS = 4800
const CROSSFADE_MS = 900

type Props = {
  urls: string[]
  alt: string
  priority?: boolean
  className?: string
}

export function PropertyCardImageSlideshow({
  urls,
  alt,
  priority = false,
  className,
}: Props) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>({ minRatio: 0.35, rootMargin: '0px 0px -8% 0px' })
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (!inView || urls.length < 2 || paused || reduceMotion) return
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % urls.length)
    }, SLIDE_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [inView, urls.length, paused, reduceMotion])

  if (urls.length === 0) return null

  const showDots = urls.length > 1 && !reduceMotion

  return (
    <div
      ref={ref}
      className={cn('relative h-full w-full', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {urls.map((url, i) => {
        const active = i === index
        return (
          <Image
            key={`${url}-${i}`}
            src={url}
            alt={active ? alt : ''}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={priority && i === 0}
            loading={priority && i === 0 ? 'eager' : 'lazy'}
            fetchPriority={priority && i === 0 ? 'high' : 'auto'}
            quality={65}
            aria-hidden={!active}
            unoptimized={url.startsWith('http')}
            className={cn(
              'object-cover transition-opacity ease-out motion-reduce:transition-none',
              active ? 'opacity-100' : 'opacity-0',
            )}
            style={{ transitionDuration: `${CROSSFADE_MS}ms` }}
          />
        )
      })}

      {showDots ? (
        <div
          className="absolute bottom-3 right-3 z-[1] flex gap-1.5"
          aria-hidden
        >
          {urls.map((url, i) => (
            <span
              key={url}
              className={cn(
                'h-1 rounded-full bg-white/90 shadow-sm transition-[width,opacity] duration-300 ease-out',
                i === index ? 'w-5 opacity-100' : 'w-1 opacity-55',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
