import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, MapPin, Mountain, Trees, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Zenvana Hotels | Dehradun stays, book direct',
  description:
    'Discover boutique and family-friendly stays on Rajpur Road, Dehradun. Book direct with Zenvana for calmer stays, better value, and thoughtful hospitality.',
}

const editorialCategories = [
  {
    title: 'Rajpur Road stays',
    description:
      'For guests who want the Dehradun pulse, cafés, access, and the classic road that rises toward the hills.',
    image: '/images/dehradun/rajpur-road-editorial.jpg',
  },
  {
    title: 'Foothill quiet',
    description:
      'A softer side of the city — greener, slower, and better suited to longer exhale-mode stays.',
    image: '/images/dehradun/foothills-editorial.jpg',
  },
  {
    title: 'Family-friendly weekends',
    description:
      'Rooms and stays that feel practical, warm, and easy rather than cramped and overcomplicated.',
    image: '/images/dehradun/family-stay-editorial.jpg',
  },
]

const featuredHotels = [
  {
    name: 'Silverwood',
    location: 'Rajpur Road, Dehradun',
    image: '/images/hotels/silverwood-hero.jpg',
    description:
      'A calmer city stay with quick access, warm interiors, and the kind of practical comfort families actually notice.',
  },
  {
    name: 'Limewood',
    location: 'Dehradun foothills',
    image: '/images/hotels/limewood-hero.jpg',
    description:
      'A more atmospheric escape shaped by softer mornings, greener surroundings, and a slower rhythm of stay.',
  },
]

const directReasons = [
  'Better direct-booking value',
  'Faster help with changes and requests',
  'Clearer coordination before arrival',
  'A more personal connection to the property',
]

const faqs = [
  {
    q: 'Why book direct with Zenvana?',
    a: 'Direct booking gives guests cleaner pricing, better communication, and a more reliable line to the property team before arrival.',
  },
  {
    q: 'Are your hotels suitable for families?',
    a: 'Yes. Zenvana focuses on family-friendly practicality without losing the boutique hospitality feeling.',
  },
  {
    q: 'Do you offer seasonal deals?',
    a: 'Yes. Selected stays and seasons may include curated direct-booking offers.',
  },
]

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ExploreSection />
      <FeaturedHotelsSection />
      <DirectBookingSection />
      <OffersSection />
      <FaqSection />
    </>
  )
}

function HeroSection() {
  return (
    <section className="relative min-h-[92svh] overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/dehradun/dehradun-hero.jpg"
          alt="Dehradun foothills and Rajpur Road atmosphere at golden hour"
          fill
          priority
          className="object-cover"
        />
        <div className="hero-overlay absolute inset-0" />
      </div>

      <div className="container-shell relative flex min-h-[92svh] flex-col justify-end pb-8 pt-28 sm:pb-12 lg:pb-16">
        <div className="max-w-4xl text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/75">
            Dehradun, told more beautifully
          </div>

          <h1 className="mt-4 max-w-4xl font-serif text-4xl tracking-[-0.04em] sm:text-5xl lg:text-7xl">
            Stay close to the hills,
            <span className="block">book with more certainty.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/82 sm:text-base">
            Zenvana brings together Dehradun-rooted stays shaped by Rajpur Road,
            foothill calm, family comfort, and direct-booking ease.
          </p>
        </div>

        <div className="mt-8 max-w-6xl">
          <div className="book-bar">
            <input className="book-input" placeholder="Choose a property" />
            <input className="book-input" placeholder="Check-in — Check-out" />
            <input className="book-input" placeholder="Guests & rooms" />
            <button className="site-button-dark h-12 rounded-2xl">Book stay</button>
          </div>
        </div>
      </div>
    </section>
  )
}

function ExploreSection() {
  return (
    <section className="section-rule">
      <div className="container-shell py-14 sm:py-16 lg:py-20">
        <div className="max-w-2xl">
          <div className="eyebrow">Explore Zenvana</div>
          <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
            A Dehradun story, not a pile of property cards.
          </h2>
          <p className="body-copy mt-5 max-w-xl">
            Start with the mood of the place — Rajpur Road energy, foothill quiet,
            long-stay comfort, and family-friendly ease — then move naturally toward the stay.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {editorialCategories.map((item) => (
            <article key={item.title}>
              <div className="editorial-image aspect-[4/5]">
                <Image src={item.image} alt={item.title} fill className="object-cover" />
              </div>
              <h3 className="mt-4 text-xl font-medium tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturedHotelsSection() {
  return (
    <section className="section-rule">
      <div className="container-shell py-14 sm:py-16 lg:py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="eyebrow">Featured stays</div>
            <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
              Places that feel considered before you even arrive.
            </h2>
          </div>

          <Link href="/hotels" className="site-link inline-flex items-center gap-2">
            View all hotels
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 space-y-12">
          {featuredHotels.map((hotel, index) => (
            <article
              key={hotel.name}
              className={`grid gap-6 lg:grid-cols-12 lg:items-center ${index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
                }`}
            >
              <div className="editorial-image lg:col-span-7 aspect-[16/10]">
                <Image src={hotel.image} alt={hotel.name} fill className="object-cover" />
              </div>

              <div className="lg:col-span-5 lg:px-6">
                <div className="eyebrow">{hotel.location}</div>
                <h3 className="display-title mt-3 text-3xl sm:text-4xl">{hotel.name}</h3>
                <p className="body-copy mt-4">{hotel.description}</p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/hotels/${hotel.name.toLowerCase()}`} className="site-button-dark">
                    Book now
                  </Link>
                  <Link href={`/hotels/${hotel.name.toLowerCase()}`} className="site-button-light">
                    Explore stay
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function DirectBookingSection() {
  return (
    <section className="section-rule">
      <div className="container-shell py-14 sm:py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="max-w-xl">
            <div className="eyebrow">Why book direct</div>
            <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
              The point is not just price. It is less friction.
            </h2>
            <p className="body-copy mt-5">
              Better booking feels like cleaner communication, easier coordination,
              and less marketplace nonsense between you and the property.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {directReasons.map((item) => (
              <div key={item} className="quiet-card p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-7 text-foreground/85">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 border-t border-border/60 pt-8 sm:grid-cols-3">
          <Stat icon={<MapPin className="h-5 w-5" />} title="Rajpur Road access" text="Connected, familiar, and central to the Dehradun story." />
          <Stat icon={<Mountain className="h-5 w-5" />} title="Foothill atmosphere" text="Closer to green relief, calmer mornings, and the rise toward Mussoorie." />
          <Stat icon={<Users className="h-5 w-5" />} title="Family practicality" text="Useful comfort, easier layouts, and less travel-chaos theater." />
        </div>
      </div>
    </section>
  )
}

function Stat({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-1 text-primary dark:text-accent">{icon}</div>
      <div>
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-7 text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}

function OffersSection() {
  return (
    <section className="section-rule">
      <div className="container-shell py-14 sm:py-16 lg:py-20">
        <div className="brand-gradient overflow-hidden rounded-[2rem] px-6 py-10 text-white sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/70">
              Curated offers
            </div>
            <h2 className="mt-4 font-serif text-3xl tracking-[-0.03em] sm:text-4xl lg:text-5xl">
              Seasonal stays, presented quietly.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
              Offers should feel like thoughtful value, not discount-market screaming.
            </p>

            <div className="mt-6">
              <Link href="/offers" className="site-button-light border-white/20 bg-white/12 text-white hover:bg-white/16">
                Explore offers
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FaqSection() {
  return (
    <section className="section-rule">
      <div className="container-shell py-14 sm:py-16 lg:py-20">
        <div className="max-w-2xl">
          <div className="eyebrow">Practical questions</div>
          <h2 className="display-title mt-4 text-3xl sm:text-4xl">
            The useful details, without the fog machine.
          </h2>
        </div>

        <div className="mt-8 grid gap-4">
          {faqs.map((faq) => (
            <details key={faq.q} className="quiet-card p-5">
              <summary className="cursor-pointer list-none text-base font-medium text-foreground">
                {faq.q}
              </summary>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}