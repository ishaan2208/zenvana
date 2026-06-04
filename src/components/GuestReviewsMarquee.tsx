'use client'

import type { CSSProperties } from 'react'

import { GuestReviewCard, type GuestReviewItem } from '@/components/GuestReviewCard'
import { useInViewOnce } from '@/hooks/useInViewOnce'

type Props = {
  reviews: GuestReviewItem[]
}

/** Duplicate reviews so the CSS marquee loop seams at -50% translate. */
function loopReviews(reviews: GuestReviewItem[]): GuestReviewItem[] {
  if (reviews.length === 0) return []
  if (reviews.length === 1) {
    return [reviews[0], reviews[0], reviews[0], reviews[0]]
  }
  return [...reviews, ...reviews]
}

export function GuestReviewsMarquee({ reviews }: Props) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>({
    minRatio: 0.35,
    rootMargin: '0px 0px -8% 0px',
  })

  if (reviews.length === 0) return null

  const looped = loopReviews(reviews)
  const durationSec = Math.min(90, Math.max(48, reviews.length * 7))

  return (
    <div
      ref={ref}
      className="guest-reviews-marquee relative mt-10"
      data-active={inView ? 'true' : 'false'}
      style={
        { '--guest-reviews-marquee-duration': `${durationSec}s` } as CSSProperties & {
          '--guest-reviews-marquee-duration': string
        }
      }
    >
      <div className="guest-reviews-track flex w-max items-stretch gap-4 px-1">
        {looped.map((review, index) => (
          <GuestReviewCard key={`${review.id}-${index}`} review={review} />
        ))}
      </div>
    </div>
  )
}
