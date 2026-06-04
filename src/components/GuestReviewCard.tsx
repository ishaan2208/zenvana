import { Star } from 'lucide-react'

import { ReviewAvatar } from '@/components/ReviewAvatar'

export type GuestReviewItem = {
  id: string
  name: string
  stars: number
  text: string
  imageSrc?: string
  subline?: string
}

export function GuestReviewCard({ review }: { review: GuestReviewItem }) {
  const { name, stars, text, imageSrc, subline } = review

  return (
    <article className="quiet-card w-[min(100%,340px)] shrink-0 snap-start p-6 sm:w-[340px]">
      <p className="text-sm leading-7 text-foreground/90">{text}</p>
      <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
        <ReviewAvatar name={name} imageSrc={imageSrc} size={40} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{name}</div>
          {(subline || stars > 0) && (
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {subline && <span>{subline}</span>}
              {subline && stars > 0 && <span aria-hidden>·</span>}
              {stars > 0 && (
                <span className="flex items-center gap-0.5 text-amber-500" aria-label={`${stars} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, s) => (
                    <Star
                      key={s}
                      className={s < stars ? 'h-3 w-3 fill-current' : 'h-3 w-3 opacity-30'}
                      aria-hidden
                    />
                  ))}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
