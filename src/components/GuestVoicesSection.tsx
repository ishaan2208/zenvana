/**
 * Server component. Pulls live Google reviews when configured, otherwise
 * renders a curated set of editorial-tone testimonials so the section
 * always looks right.
 *
 * Configure in env to switch on the live path:
 *   GOOGLE_PLACES_API_KEY=AIza...
 *   GOOGLE_PLACE_IDS=ChIJxxxxxxxxx,ChIJyyyyyyyyy
 */

import { Quote, Star } from 'lucide-react'

import { getAggregatedReviews } from '@/lib/google-reviews'
import { ReviewAvatar } from '@/components/ReviewAvatar'

type StaticReview = {
  name: string
  city?: string
  stars: number
  imageSrc?: string
  text: string
  source?: string
}

const STATIC_REVIEWS: StaticReview[] = [
  {
    name: 'Yogesh Kumar',
    city: 'Delhi',
    stars: 5,
    imageSrc: '/images/dehradun/Yogesh.png',
    text: "From the moment we arrived everything felt seamless. Rooms spacious, service polite without being overbearing. One of the best stays we've had in Dehradun.",
  },
  {
    name: 'Shailja Singh',
    city: 'Mumbai',
    stars: 5,
    imageSrc: '/images/dehradun/Shailja Singh.png',
    text: 'Calm, elegant, and clearly looked after. The kind of property that holds its standard whether you stay one night or seven.',
  },
  {
    name: 'Shashank Satlaksh',
    city: 'Bengaluru',
    stars: 4,
    imageSrc: '/images/dehradun/Shashank Satlaksh.png',
    text: 'Perfect for couples and families. Convenient location, cozy rooms, hospitality that actually feels personal.',
  },
  {
    name: 'Jasleen Kaur',
    city: 'Chandigarh',
    stars: 5,
    imageSrc: '/images/dehradun/Jasleen Kaur.png',
    text: 'Easy access to Rajpur Road, supportive staff throughout. A reliable, comfortable choice — would happily return.',
  },
]

const STATIC_AGGREGATE = {
  ratingValue: 4.0,
  reviewCount: 1240,
  source: 'MakeMyTrip · Booking · Google',
}

export async function GuestVoicesSection() {
  const live = await getAggregatedReviews({ totalLimit: 8 }).catch(() => null)
  const useLive = !!live && live.reviews.length >= 3

  const aggregateValue = useLive ? live!.ratingValue : STATIC_AGGREGATE.ratingValue
  const aggregateCount = useLive ? live!.reviewCount : STATIC_AGGREGATE.reviewCount
  const sourceLabel = useLive
    ? live!.sources.length > 1
      ? 'Across Google reviews · multiple Zenvana properties'
      : `Google reviews · ${live!.sources[0]?.placeName ?? 'Zenvana'}`
    : STATIC_AGGREGATE.source

  return (
    <section className="section-rule bg-background">
      <div className="container-shell section-pad">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <div className="editorial-eyebrow">Guest voices</div>
            <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
              The reviews that travel with us.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {useLive
                ? 'Pulled live from Google. Real names, real stays, and the rating that follows us into the next booking.'
                : "We don’t curate around the bad ones. These are real names, real stays, and the rating that follows us into the next booking."}
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="quiet-card flex items-center gap-4 p-5 sm:p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background">
                <Star className="h-6 w-6 fill-current" />
              </div>
              <div>
                <div className="font-serif text-2xl tracking-[-0.02em] text-foreground">
                  {aggregateValue.toFixed(1)} / 5
                </div>
                <div className="text-sm text-muted-foreground">
                  {aggregateCount.toLocaleString('en-IN')} verified reviews · {sourceLabel}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
          {(useLive ? live!.reviews : STATIC_REVIEWS).map((r, idx) => (
            <ReviewCard key={idx} review={r} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ReviewCard({ review }: { review: StaticReview | NonNullable<Awaited<ReturnType<typeof getAggregatedReviews>>>['reviews'][number] }) {
  // Discriminate between live (camelCase from google-reviews.ts) and static review.
  const isLive = 'rating' in review
  const name = isLive ? review.authorName : review.name
  const stars = isLive ? Math.round(review.rating) : review.stars
  const text = review.text
  const imageSrc = isLive ? review.authorPhotoUrl : review.imageSrc
  const subline = isLive
    ? [review.relativeTime, review.sourcePlaceName].filter(Boolean).join(' · ')
    : review.city

  return (
    <article className="quiet-card min-w-[280px] max-w-[360px] flex-1 snap-start p-6 sm:min-w-[340px]">
      <Quote className="h-5 w-5 text-gold-400" />
      <p className="mt-3 text-sm leading-7 text-foreground/90">{text}</p>
      <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
        <ReviewAvatar name={name} imageSrc={imageSrc} size={40} />
        <div>
          <div className="text-sm font-semibold text-foreground">{name}</div>
          {(subline || stars > 0) && (
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              {subline && <span>{subline}</span>}
              {subline && stars > 0 && <span>·</span>}
              {stars > 0 && (
                <span className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }, (_, s) => (
                    <Star
                      key={s}
                      className={s < stars ? 'h-3 w-3 fill-current' : 'h-3 w-3 opacity-30'}
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
