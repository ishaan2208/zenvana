import type { Metadata } from 'next'

import { Container } from '@/components/Container'
import { getPublicOffers } from '@/lib/api'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, CheckCircle2, Sparkles } from 'lucide-react'
import { JsonLd } from '@/components/JsonLd'
import { breadcrumbJsonLd } from '@/lib/structured-data'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Offers · Direct-Booking Value at Zenvana Hotels Dehradun',
  description:
    'Live offers and packages for Zenvana Hotels in Dehradun. Booking direct always beats OTA pricing — see this month\'s coupons and seasonal stays.',
  alternates: { canonical: '/offers' },
  openGraph: {
    title: 'Offers · Direct-Booking Value at Zenvana Hotels',
    description: 'Live offers and packages for Zenvana Hotels in Dehradun.',
    url: `${SITE_URL}/offers`,
    type: 'website',
  },
}

export default async function OffersPage() {
  const offers = await getPublicOffers()
  const featuredOffers = offers.map((offer) => ({
    title: offer.title,
    code: offer.code,
    imageUrl: offer.imageUrl ?? null,
    description: `Use code ${offer.code} at checkout to unlock direct booking value.`,
    validity: offer.validUntil
      ? `Valid until ${new Date(offer.validUntil).toLocaleDateString('en-IN')}`
      : 'Valid for a limited time',
    benefits: [
      offer.discountType === 'PERCENT'
        ? `${offer.discountValue}% off on booking amount`
        : `₹${Math.round(offer.discountValue)} off on booking amount`,
      offer.scopeType === 'GLOBAL'
        ? 'Available across Zenvana hotels'
        : 'Available on selected hotels',
      'Apply the code on checkout page',
    ],
    inclusions: [
      `Offer code: ${offer.code}`,
      offer.maxDiscount ? `Max discount: ₹${Math.round(offer.maxDiscount)}` : 'No max cap',
      offer.minBookingAmount
        ? `Min booking: ₹${Math.round(offer.minBookingAmount)}`
        : 'No minimum booking amount',
      offer.minRoomNights ? `Min stay: ${offer.minRoomNights} night(s)` : 'No minimum stay length',
      offer.loginRequired ? 'Login required at checkout' : 'Guest checkout allowed',
    ],
  }))

  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Offers', url: `${SITE_URL}/offers` },
  ]

  return (
    <div className="section-rule bg-muted/5">
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <Container className="py-16 sm:py-20 lg:py-24">
        {/* SECTION 1 — PAGE INTRO */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="eyebrow">Curated value</div>
          <h1 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">Offers</h1>
          <p className="body-copy mt-5 text-muted-foreground">
            Explore limited-time packages and thoughtfully shaped deals designed to make the stay calmer,
            smoother, and more certain.
          </p>
        </div>

        {/* SECTION 2 — FEATURED OFFERS */}
        {featuredOffers.length > 0 ? (
          <div className="mt-12 space-y-8">
            {featuredOffers.map((offer) => (
              <section key={offer.title} className="quiet-card overflow-hidden">
                <div className="grid gap-0 lg:grid-cols-12">
                  <div className="lg:col-span-5 lg:flex lg:items-start">
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                      {offer.imageUrl ? (
                        <Image
                          src={offer.imageUrl}
                          alt={offer.title}
                          fill
                          className="object-cover object-center"
                          sizes="(min-width: 1024px) 40vw, 100vw"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.18),transparent_60%),linear-gradient(to_bottom,_rgba(0,0,0,0.06),rgba(0,0,0,0.1))]" />
                      {!offer.imageUrl && (
                        <div className="absolute inset-0 grid place-items-center text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
                          Offer image placeholder
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-7 p-6 sm:p-7 lg:p-8">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-foreground/70">
                      <Sparkles className="h-4 w-4" />
                      Featured offer code
                    </div>

                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                      {offer.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{offer.description}</p>

                    <div className="mt-6 grid gap-2">
                      {offer.benefits.map((b) => (
                        <div key={b} className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                          <CheckCircle2 className="mt-1 h-4 w-4 text-primary" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="inline-flex items-center gap-2 rounded-2xl bg-muted px-4 py-2 text-sm text-foreground/75">
                        <Calendar className="h-4 w-4" />
                        {offer.validity}
                      </div>
                      <Link
                        href={`/hotels?${new URLSearchParams({ couponCode: offer.code }).toString()}`}
                        className="site-button-dark w-fit"
                      >
                        Book with this offer
                      </Link>
                    </div>

                    <div className="mt-7 border-t border-border/60 pt-6">
                      <div className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
                        Inclusions
                      </div>
                      <div className="mt-4 grid gap-2">
                        {offer.inclusions.map((i) => (
                          <div key={i} className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                            <CheckCircle2 className="mt-1 h-4 w-4 text-primary" />
                            <span>{i}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section className="mt-12 quiet-card p-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">No active offers right now</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              We could not find any currently active coupon codes. Please check again shortly.
            </p>
            <div className="mt-6">
              <Link href="/hotels" className="site-button-dark">
                Explore Hotels
              </Link>
            </div>
          </section>
        )}

        {/* SECTION 4 — CALL TO ACTION */}
        <div className="mt-12">
          <div className="brand-gradient overflow-hidden rounded-[2rem] px-6 py-10 text-white sm:px-8 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/70">
                Booking
              </div>
              <h2 className="mt-4 font-serif text-3xl tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                Take advantage of curated offers.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/80 sm:text-base">
                Choose an offer, book direct, and arrive with fewer loose ends.
              </p>
              <div className="mt-6">
                <Link
                  href="/hotels"
                  className="site-button-light border-white/20 bg-white/12 text-white hover:bg-white/16"
                >
                  Book Your Stay
                </Link>
              </div>
            </div>
          </div>
        </div>

      </Container>
    </div>
  )
}

