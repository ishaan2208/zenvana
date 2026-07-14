import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CloudinaryImage from '@/components/CloudinaryImage'
import {
  ArrowLeft,
  BadgeCheck,
  BedDouble,
  Camera,
  MapPin,
  ShieldCheck,
} from 'lucide-react'

import { getPublicPropertyBySlug } from '@/lib/api'
import { Container } from '@/components/Container'
import { EmblaImageGallery } from '@/components/EmblaImageGallery'
import { pickHeroAndGallery } from '@/lib/media'
import { promoOrCouponFromSearchParams } from '@/lib/promo-or-coupon-code'
import { isDayUseParam } from '@/lib/stay-kind'
import { BookingSteps } from '@/components/booking/BookingSteps'
import { BookSearchForm } from './BookSearchForm'
import { Badge } from '@/components/ui/badge'
import { TrackOnMount } from '@/components/analytics/TrackOnMount'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    couponCode?: string
    promoCode?: string
    stayKind?: string
  }>
}

export const metadata = {
  robots: { index: false, follow: true },
}

export default async function BookPropertyPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params
  const q = await searchParams
  const couponCode = promoOrCouponFromSearchParams(q)
  const initialStayKind = isDayUseParam(q.stayKind) ? 'hourly' : 'overnight'
  const property = await getPublicPropertyBySlug(slug)
  if (!property) notFound()

  const { heroUrl, gallery } = pickHeroAndGallery(property.images)

  const imageUrls = Array.from(
    new Set(
      [heroUrl, ...gallery.map((image) => image.url)].filter(
        Boolean,
      ) as string[],
    ),
  )

  const bookingGallery = imageUrls.slice(0, 8).map((url, index) => ({
    url,
    alt: `${property.publicName} photo ${index + 1}`,
  }))

  const location = [property.city, property.state].filter(Boolean).join(', ')
  const roomCount = property.roomTypes?.length ?? 0

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <TrackOnMount
        name="property_viewed"
        propertySlug={slug}
        properties={{ slug, publicName: property.publicName }}
        dedupeKey={`property_viewed:${slug}`}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(120,119,198,0.10),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_28%)]" />

      <Container className="relative py-4 sm:py-6 lg:py-10">
        <Link
          href={`/hotels/${slug}`}
          className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm font-medium text-foreground/80 backdrop-blur-xl transition hover:text-foreground dark:bg-background/40"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">Back to property</span>
        </Link>

        <PropertyBookingHeader
          propertyName={property.publicName}
          description={property.descriptionShort}
          location={location}
          heroUrl={heroUrl}
          imageCount={bookingGallery.length}
          roomCount={roomCount}
        />

        <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:items-start xl:gap-8">
          <aside className="order-1 min-w-0 xl:sticky xl:top-8">
            <BookSearchForm
              slug={slug}
              propertyName={property.publicName}
              location={location}
              initialCouponCode={couponCode}
              hourlyStay={property.hourlyStay}
              initialStayKind={initialStayKind}
            />
          </aside>

          <div className="order-2 min-w-0 space-y-6">
            <section className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-background/55 shadow-[0_24px_70px_rgba(8,17,31,0.08)] backdrop-blur-2xl dark:bg-background/30 sm:rounded-[2rem]">
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 max-w-2xl">
                    <Badge className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[10px] uppercase tracking-[0.26em] text-muted-foreground shadow-none dark:bg-background/40">
                      <Camera className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                      Property gallery
                    </Badge>

                    <h2 className="mt-4 text-balance font-serif text-2xl leading-tight tracking-[-0.04em] text-foreground sm:text-3xl">
                      Review the stay before you choose your dates.
                    </h2>

                    <p className="mt-3 hidden max-w-xl text-sm leading-7 text-muted-foreground sm:block sm:text-base">
                      The booking flow stays simple, but the imagery still does
                      the trust-building. Browse the property, then lock in your
                      dates and occupancy in one clean step.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {location ? (
                      <GlassPill
                        icon={<MapPin className="h-3.5 w-3.5 shrink-0" />}
                        text={location}
                      />
                    ) : null}

                    <div className="hidden sm:block">
                      <GlassPill
                        icon={<ShieldCheck className="h-3.5 w-3.5 shrink-0" />}
                        text="Direct booking benefits"
                      />
                    </div>

                    <GlassPill
                      icon={<BadgeCheck className="h-3.5 w-3.5 shrink-0" />}
                      text={`${bookingGallery.length} photos`}
                    />
                  </div>
                </div>

                <div className="mt-5 min-w-0 overflow-hidden rounded-[1.35rem] sm:rounded-[1.6rem]">
                  {bookingGallery.length > 0 ? (
                    <EmblaImageGallery
                      images={bookingGallery}
                      aspectClassName="aspect-[16/11] sm:aspect-[16/9]"
                      priorityFirstImage
                      showThumbs
                    />
                  ) : (
                    <div className="relative overflow-hidden rounded-[1.35rem] border border-border/60 bg-[linear-gradient(135deg,#0b1422_0%,#10233b_52%,#173e2d_100%)] sm:rounded-[1.6rem]">
                      <div className="aspect-[16/11] sm:aspect-[16/9]" />
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </Container>
    </main>
  )
}

function PropertyBookingHeader({
  propertyName,
  description,
  location,
  heroUrl,
  imageCount,
  roomCount,
}: {
  propertyName: string
  description?: string | null
  location?: string
  heroUrl?: string
  imageCount: number
  roomCount: number
}) {
  return (
    <section className="mt-4 overflow-hidden rounded-[1.5rem] border border-border/60 bg-background/55 shadow-[0_24px_70px_rgba(8,17,31,0.08)] backdrop-blur-2xl dark:bg-background/30 sm:rounded-[2rem]">
      <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1.08fr)_minmax(280px,360px)]">
        <div className="min-w-0 p-5 sm:p-6 lg:p-7">
          <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground sm:text-[11px]">
            Direct booking
          </div>

          <BookingSteps current={1} className="mt-2" />

          <h1 className="mt-3 text-balance font-serif text-[clamp(2rem,5vw,3.5rem)] leading-[0.96] tracking-[-0.05em] text-foreground">
            Choose your dates at {propertyName}
          </h1>

          {description ? (
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {location ? (
              <GlassPill
                icon={<MapPin className="h-3.5 w-3.5 shrink-0" />}
                text={location}
              />
            ) : null}

            {roomCount > 0 ? (
              <div className="hidden sm:block">
                <GlassPill
                  icon={<BedDouble className="h-3.5 w-3.5 shrink-0" />}
                  text={`${roomCount} room type${roomCount === 1 ? '' : 's'}`}
                />
              </div>
            ) : null}

            {imageCount > 0 ? (
              <GlassPill
                icon={<Camera className="h-3.5 w-3.5 shrink-0" />}
                text={`${imageCount} photos`}
              />
            ) : null}
          </div>
        </div>

        <div className="relative min-h-[220px] border-t border-border/60 lg:min-h-full lg:border-l lg:border-t-0">
          {heroUrl ? (
            <CloudinaryImage
              src={heroUrl}
              alt={propertyName}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 360px"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#08111f_0%,#0d2037_52%,#143626_100%)]" />
          )}

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,12,22,0.10)_0%,rgba(6,12,22,0.55)_100%)]" />
        </div>
      </div>
    </section>
  )
}

function GlassPill({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-background/65 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-xl dark:bg-background/35">
      {icon}
      <span className="truncate">{text}</span>
    </span>
  )
}
