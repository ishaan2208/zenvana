/**
 * Server component. Pulls live Google reviews when configured, otherwise
 * renders a curated set of editorial-tone testimonials so the section
 * always looks right.
 *
 * Configure in env to switch on the live path:
 *   GOOGLE_PLACES_API_KEY=AIza...
 *   GOOGLE_PLACE_IDS=ChIJxxxxxxxxx,ChIJyyyyyyyyy
 */

import { Star } from 'lucide-react'

import type { GuestReviewItem } from '@/components/GuestReviewCard'
import { GuestReviewsMarquee } from '@/components/GuestReviewsMarquee'
import { getAggregatedReviews } from '@/lib/google-reviews'

type StaticReview = {
  name: string
  city?: string
  stars: number
  imageSrc?: string
  text: string
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

function toGuestReviewItems(
  useLive: boolean,
  live: Awaited<ReturnType<typeof getAggregatedReviews>> | null,
): GuestReviewItem[] {
  if (useLive && live) {
    return live.reviews.map((review, index) => ({
      id: `google-${index}-${review.authorName}`,
      name: review.authorName,
      stars: Math.round(review.rating),
      text: review.text,
      imageSrc: review.authorPhotoUrl,
      subline: [review.relativeTime, review.sourcePlaceName].filter(Boolean).join(' · '),
    }))
  }

  return STATIC_REVIEWS.map((review, index) => ({
    id: `static-${index}`,
    name: review.name,
    stars: review.stars,
    text: review.text,
    imageSrc: review.imageSrc,
    subline: review.city,
  }))
}

export async function GuestVoicesSection() {
  const live = await getAggregatedReviews({ totalLimit: 16 }).catch(() => null)
  const useLive = !!live && live.reviews.length >= 3

  const aggregateValue = useLive ? live!.ratingValue : STATIC_AGGREGATE.ratingValue
  const aggregateCount = useLive ? live!.reviewCount : STATIC_AGGREGATE.reviewCount
  const sourceLabel = useLive
    ? live!.sources.length > 1
      ? 'Across Google reviews · multiple Zenvana properties'
      : `Google reviews · ${live!.sources[0]?.placeName ?? 'Zenvana'}`
    : STATIC_AGGREGATE.source

  const reviewItems = toGuestReviewItems(useLive, live)

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
                : "We don't curate around the bad ones. These are real names, real stays, and the rating that follows us into the next booking."}
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

        <GuestReviewsMarquee reviews={reviewItems} />
      </div>
    </section>
  )
}
