import type { Metadata } from 'next'

import { Container } from '@/components/Container'
import Link from 'next/link'
import { Calendar, CheckCircle2, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Offers',
  description: 'Special offers and packages at Zenvana Hotels. Book direct for the best rates.',
}

export default function OffersPage() {
  const featuredOffers = [
    {
      title: 'Weekend Escape Package',
      description:
        'A short stay designed for slower mornings and an easy reset from routine.',
      validity: 'Valid for a limited time (placeholder)',
      benefits: ['Discount on room booking', 'Complimentary breakfast', 'Flexible check-in'],
      inclusions: ['Discount percentage (placeholder)', 'Complimentary services', 'Special hotel benefits'],
    },
    {
      title: 'Advance Booking Deal',
      description:
        'Plan ahead for cleaner value, smoother check-in, and a more confident arrival.',
      validity: 'Book in advance (placeholder)',
      benefits: ['Special discounted rate', 'Free welcome drink', 'Complimentary Wi-Fi'],
      inclusions: ['Discount percentage (placeholder)', 'Complimentary services', 'Special hotel benefits'],
    },
    {
      title: 'Dining Experience Offer',
      description:
        'A taste-led add-on that makes dinner feel like part of the trip, not an afterthought.',
      validity: 'Valid on selected days (placeholder)',
      benefits: ['Discount on restaurant dining', 'Complimentary dessert', 'Priority table reservation'],
      inclusions: ['Discount percentage (placeholder)', 'Complimentary services', 'Special hotel benefits'],
    },
  ]

  const promos = [
    {
      title: 'Seasonal Deals',
      description: 'Curated value tied to seasons and quieter travel windows.',
    },
    {
      title: 'Festival Packages',
      description: 'Stay plans designed around celebratory weekends and city energy.',
    },
    {
      title: 'Long Stay Discounts',
      description: 'Better value for longer, calmer stays with practical comfort.',
    },
  ]

  return (
    <div className="section-rule bg-muted/5">
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
        <div className="mt-12 space-y-8">
          {featuredOffers.map((offer) => (
            <section key={offer.title} className="quiet-card overflow-hidden">
              <div className="grid gap-0 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <div className="relative h-full min-h-[240px] bg-muted lg:min-h-[320px]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.18),transparent_60%),linear-gradient(to_bottom,_rgba(0,0,0,0.06),rgba(0,0,0,0.1))]" />
                    <div className="absolute inset-0 grid place-items-center text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
                      Offer image placeholder
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 p-6 sm:p-7 lg:p-8">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-foreground/70">
                    <Sparkles className="h-4 w-4" />
                    Featured offer
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
                    <Link href="/hotels" className="site-button-dark w-fit">
                      Book Now
                    </Link>
                  </div>

                  {/* SECTION 3 — OFFER DETAILS (under each offer) */}
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

        {/* SECTION 5 — ADDITIONAL PROMOTIONS */}
        <div className="mt-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="eyebrow">More promotions</div>
            <h2 className="display-title mt-4 text-3xl sm:text-4xl">
              Smaller deals, same quiet value.
            </h2>
            <p className="body-copy mt-5 text-muted-foreground">
              A set of additional promotions presented in a clean grid layout.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {promos.map((p) => (
              <article
                key={p.title}
                className="quiet-card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.14),transparent_55%),linear-gradient(to_bottom,_rgba(0,0,0,0.06),rgba(0,0,0,0.12))]" />
                  <div className="absolute inset-0 grid place-items-center text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
                    Promo image placeholder
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">{p.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{p.description}</p>
                  <div className="mt-6">
                    <Link href="/offers" className="site-link">
                      Explore Offer
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </div>
  )
}

