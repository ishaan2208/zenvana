import type { Metadata } from 'next'

import { Container } from '@/components/Container'
import Image from 'next/image'
import Link from 'next/link'
import {
  Award,
  ChefHat,
  GlassWater,
  Sparkles,
  Star,
  Sunset,
  UtensilsCrossed,
} from 'lucide-react'
import { RestaurantTestimonials } from '@/components/RestaurantTestimonials'
import { RestaurantStats } from '@/components/RestaurantStats'

export const metadata: Metadata = {
  title: 'Restaurant',
  description: 'Discover the restaurant experience at Zenvana.',
}

export default function RestaurantPage() {
  const features = [
    {
      title: 'Signature Cuisine',
      icon: <ChefHat className="h-5 w-5" />,
      description: 'House-inspired plates with seasonal ingredients and clean flavors.',
    },
    {
      title: 'Elegant Ambience',
      icon: <Sparkles className="h-5 w-5" />,
      description: 'Warm lighting, calm music, and a layout designed for slow dinners.',
    },
    {
      title: 'Rooftop Dining',
      icon: <Sunset className="h-5 w-5" />,
      description: 'Open-air seating with skyline views and an evening breeze.',
    },
    {
      title: 'Crafted Beverages',
      icon: <GlassWater className="h-5 w-5" />,
      description: 'Mocktails and pours designed to pair well with a longer meal.',
    },
  ]

  const menu = [
    { name: 'Chef’s Seasonal Starter', description: 'A light bite designed to open the palate.', price: '₹ —' },
    { name: 'Signature Grill Plate', description: 'Charred notes with a balanced, clean finish.', price: '₹ —' },
    { name: 'Herb & Citrus Bowl', description: 'Fresh textures with a calm, bright profile.', price: '₹ —' },
    { name: 'Slow-Cooked Special', description: 'Comfort-forward and thoughtfully spiced.', price: '₹ —' },
    { name: 'Rooftop Sharing Platter', description: 'Designed for groups and longer conversations.', price: '₹ —' },
    { name: 'House Dessert', description: 'A soft, warm ending with seasonal accents.', price: '₹ —' },
    { name: 'Crafted Beverage', description: 'Signature mocktail with layered notes.', price: '₹ —' },
    { name: 'Bar Snack Pairing', description: 'A crisp accompaniment for a drink-led evening.', price: '₹ —' },
  ]

  const testimonials = [
    { name: 'Customer review', text: 'A premium feel with calm service and beautifully paced courses.', stars: 5 as const },
    { name: 'Customer review', text: 'Rooftop mood was excellent — warm lighting and great ambience.', stars: 5 as const },
    { name: 'Customer review', text: 'Food felt thoughtfully made. A great spot for a quieter dinner.', stars: 4 as const },
  ]

  return (
    <>
      {/* SECTION 1 — RESTAURANT INTRODUCTION */}
      <section className="section-rule">
        <div className="container-shell py-14 sm:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <div className="eyebrow">Fine Dining Experience</div>
              <h1 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
                A Culinary Journey Awaits
              </h1>
              <p className="body-copy mt-5">
                A premium restaurant experience designed for slower evenings, warm lighting,
                and a menu that feels seasonal, clean, and quietly indulgent.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button type="button" className="site-button-dark">
                  Reserve Table
                </button>
                <Link href="/contact" className="site-button-light">
                  Contact
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] bg-muted">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.18),transparent_60%),linear-gradient(to_bottom,_rgba(0,0,0,0.06),rgba(0,0,0,0.12))]" />
                <div className="absolute inset-0 grid place-items-center text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
                  Restaurant Image
                </div>
                <Image
                  src="/images/dehradun/restaurantImage.png"
                  alt="Restaurant"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — DINING EXPERIENCE FEATURES */}
      <section className="section-rule bg-muted/10">
        <div className="container-shell py-14 sm:py-16 lg:py-20">
          <div className="max-w-2xl">
            <div className="eyebrow">Dining experience</div>
            <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
              Crafted for mood, taste, and time.
            </h2>
            <p className="body-copy mt-5 max-w-xl">
              Signature plates, elegant ambience, and a rooftop feel built for longer evenings.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="quiet-card p-6 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — CHEF SPECIAL MENU */}
      <section className="section-rule">
        <div className="container-shell py-14 sm:py-16 lg:py-20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="eyebrow">Chef special</div>
              <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
                Featured menu highlights
              </h2>
              <p className="body-copy mt-5 max-w-xl">
                A curated selection of dishes presented with premium ingredients and clean flavor.
              </p>
            </div>

            <button type="button" className="site-button-light w-fit">
              View Full Menu
            </button>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {menu.map((item) => (
              <article key={item.name} className="quiet-card overflow-hidden">
                <div className="relative aspect-[4/3] bg-muted">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.14),transparent_55%),linear-gradient(to_bottom,_rgba(0,0,0,0.06),rgba(0,0,0,0.12))]" />
                  <div className="absolute inset-0 grid place-items-center text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
                    Food image placeholder
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {item.name}
                    </h3>
                    <div className="text-sm font-semibold text-foreground/80">{item.price}</div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — RESTAURANT EXPERIENCE */}
      <section className="section-rule bg-muted/10">
        <div className="container-shell py-14 sm:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] bg-muted">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.18),transparent_60%),linear-gradient(to_bottom,_rgba(0,0,0,0.06),rgba(0,0,0,0.12))]" />
                <div className="absolute inset-0 grid place-items-center text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
                  Experience image placeholder
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="eyebrow">Atmosphere</div>
              <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
                An evening designed to feel unhurried.
              </h2>
              <p className="body-copy mt-5">
                A premium dining space with carefully tuned lighting, comfortable seating, and a
                relaxed pace.
              </p>

              <div className="mt-7 grid gap-3 text-sm leading-7 text-muted-foreground">
                <div className="flex items-start gap-3">
                  <Award className="mt-1 h-4 w-4 text-primary" />
                  <span>Comfortable seating</span>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="mt-1 h-4 w-4 text-primary" />
                  <span>Scenic views</span>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="mt-1 h-4 w-4 text-primary" />
                  <span>Warm lighting</span>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="mt-1 h-4 w-4 text-primary" />
                  <span>Relaxed atmosphere</span>
                </div>
              </div>

              <div className="mt-7">
                <button type="button" className="site-button-dark inline-flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  Book a Table
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — IMAGE GALLERY */}
      <section className="section-rule">
        <div className="container-shell py-14 sm:py-16 lg:py-20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="eyebrow">Gallery</div>
              <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
                A visual taste of the space.
              </h2>
              <p className="body-copy mt-5 max-w-xl">
                Image-first layout with soft hover motion and premium spacing.
              </p>
            </div>

            <button type="button" className="site-button-light w-fit">
              View Gallery
            </button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="group relative aspect-[4/3] overflow-hidden rounded-[1.6rem] bg-muted"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.18),transparent_60%),linear-gradient(to_bottom,_rgba(0,0,0,0.06),rgba(0,0,0,0.1))] transition duration-300 group-hover:opacity-80" />
                <div className="absolute inset-0 grid place-items-center text-xs font-medium uppercase tracking-[0.22em] text-foreground/55 transition duration-300 group-hover:scale-[1.04]">
                  Image placeholder
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — CUSTOMER TESTIMONIALS */}
      <section className="section-rule bg-muted/10">
        <div className="container-shell py-14 sm:py-16 lg:py-20">
          <div className="max-w-2xl">
            <div className="eyebrow">Testimonials</div>
            <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
              Guests remember the feeling.
            </h2>
            <p className="body-copy mt-5 max-w-xl">
              Smooth sliding reviews with star ratings and premium spacing.
            </p>
          </div>

          <RestaurantTestimonials items={testimonials} autoplayMs={4500} />
        </div>
      </section>

      {/* SECTION 7 — RESTAURANT STATISTICS */}
      <section className="section-rule">
        <div className="container-shell py-14 sm:py-16 lg:py-20">
          <div className="max-w-2xl">
            <div className="eyebrow">At a glance</div>
            <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
              Premium dining, measured simply.
            </h2>
            <p className="body-copy mt-5 max-w-xl">
              Animated counters that highlight experience, variety, and guest satisfaction.
            </p>
          </div>

          <div className="mt-10">
            <RestaurantStats />
          </div>
        </div>
      </section>

      {/* SECTION 8 — RESERVATION / BOOK TABLE */}
      <section className="section-rule bg-muted/10">
        <div className="container-shell py-14 sm:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <div className="eyebrow">Reservations</div>
              <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
                Reserve a table
              </h2>
              <p className="body-copy mt-5">
                Share a few details and we&apos;ll confirm availability and preferred seating.
              </p>

              <div className="mt-7 grid gap-3 text-sm leading-7 text-muted-foreground">
                <div className="flex items-start gap-3">
                  <Award className="mt-1 h-4 w-4 text-primary" />
                  <span>Private dining requests</span>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="mt-1 h-4 w-4 text-primary" />
                  <span>Rooftop seating availability</span>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="mt-1 h-4 w-4 text-primary" />
                  <span>Celebration add-ons</span>
                </div>
              </div>
            </div>

            <div className="quiet-card lg:col-span-7 p-6 sm:p-7">
              <div className="eyebrow">Book</div>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                Table booking form
              </h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Placeholder form layout inspired by premium restaurant sites.
              </p>

              <form className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
                    Name
                  </span>
                  <input
                    className="h-12 rounded-2xl border border-border/70 bg-background px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
                    placeholder="Your name"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
                    Email
                  </span>
                  <input
                    type="email"
                    className="h-12 rounded-2xl border border-border/70 bg-background px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
                    placeholder="you@example.com"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
                    Phone
                  </span>
                  <input
                    className="h-12 rounded-2xl border border-border/70 bg-background px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
                    placeholder="+91 00000 00000"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
                    Date
                  </span>
                  <input
                    className="h-12 rounded-2xl border border-border/70 bg-background px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
                    placeholder="Select date"
                  />
                </label>

                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
                    Number of Guests
                  </span>
                  <input
                    className="h-12 rounded-2xl border border-border/70 bg-background px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
                    placeholder="2"
                  />
                </label>

                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
                    Message
                  </span>
                  <textarea
                    className="min-h-[140px] resize-none rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
                    placeholder="Any preferences?"
                  />
                </label>

                <div className="sm:col-span-2 pt-2">
                  <button type="button" className="site-button-dark w-full sm:w-auto">
                    Reserve Table
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9 — CALL TO ACTION */}
      <section className="section-rule">
        <div className="container-shell py-14 sm:py-16 lg:py-20">
          <div className="brand-gradient overflow-hidden rounded-[2rem] px-6 py-10 text-white sm:px-8 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/70">
                Visit
              </div>
              <h2 className="mt-4 font-serif text-3xl tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                Book your dining experience
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/80 sm:text-base">
                Premium dining with warm service, scenic mood, and a quieter pace.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  className="site-button-light border-white/20 bg-white/12 text-white hover:bg-white/16"
                >
                  Book Your Dining Experience
                </button>
              </div>
              <div className="mt-7 flex items-center justify-center gap-2 text-amber-300">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current opacity-90" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

