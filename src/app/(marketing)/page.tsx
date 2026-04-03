import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  BriefcaseBusiness,
  MapPin,
  MapPinned,
  PartyPopper,
  Star,
  UtensilsCrossed,
} from 'lucide-react'
import { HomeLimewoodMap } from '@/components/HomeLimewoodMap'
import { RoomsCarousel } from '@/components/RoomsCarousel'
import { getPublicPropertyBySlug } from '@/lib/api'

/** Hero booking dropdown: fixed options (booking routes use these slugs). */
const HERO_BOOK_PROPERTIES: { slug: string; publicName: string }[] = [
  { slug: 'silkwood', publicName: 'Silkwood' },
  { slug: 'monteverde', publicName: 'Monte Verde' },
]
import { HeroBookBar } from './HeroBookBar'

export const metadata: Metadata = {
  title: 'Zenvana Hotels | Dehradun stays, book direct',
  description:
    'Discover boutique and family-friendly stays on Rajpur Road, Dehradun. Book direct with Zenvana for calmer stays, better value, and thoughtful hospitality.',
}

export default async function HomePage() {
  const limewood = await getPublicPropertyBySlug('limewood')

  return (
    <>
      <HeroSection properties={HERO_BOOK_PROPERTIES} />
      <IntroTextSection />
      <RoomsSection />
      <SpecialOffersSection />
      <DiningSection />
      <EventsSection />
      <GallerySection />
      <TestimonialsSection />
      <LocationSection
        latitude={limewood?.latitude}
        longitude={limewood?.longitude}
        mapPlaceUrl={limewood?.googleMapPlaceUrl}
      />
      <BookingCtaSection />
    </>
  )
}

function IntroTextSection() {
  return (
    <section className="section-rule bg-background">
      <div className="container-shell py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-4xl text-center text-foreground">
          <h1 className="font-serif text-2xl font-semibold tracking-[-0.03em] sm:text-3xl lg:text-4xl">
            Best Hotel in Dehradun | Zenvana Hotels Rajpur Road Dehradun
          </h1>
          <h3 className="mt-2 font-serif text-xl tracking-[-0.02em] text-muted-foreground sm:text-2xl">
            A Serene Luxury Hotel near Rajpur Road, Dehradun
          </h3>
          <div className="mt-3 mx-auto h-px w-16 bg-muted-foreground/40" />
          <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
            <p>
              In{' '}
              <a
                href="https://en.wikipedia.org/wiki/Dehradun"
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 hover:underline"
              >
                Dehradun
              </a>
              , mornings start slow with fresh air, soft light, and the hills in the distance. At
              Zenvana Hotels, we try to keep that same calm feeling inside the hotel, so your stay
              feels simple, relaxed, and easy.
            </p>
            <p>
              We sit between the energy of Rajpur Road and the quiet of the Mussoorie foothills,
              giving you the best of both worlds. Step out for cafés, shopping, and city life, then
              come back to warm service, clean rooms, and a peaceful place to unwind.
            </p>
            <p>
              Whether you&apos;re here for a corporate event, a short staycation, or a longer
              getaway, every moment at our Dehradun hotel is shaped to feel unhurried, attentive,
              and quietly luxurious.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function HeroSection({
  properties,
}: {
  properties: { slug: string; publicName: string }[]
}) {
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
        <div className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-soft-light">
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_60%),repeating-linear-gradient(135deg,_rgba(255,255,255,0.09),_rgba(255,255,255,0.09)_1px,_transparent_1px,_transparent_10px)]" />
        </div>
      </div>

      <div className="container-shell relative flex min-h-[92svh] flex-col items-center justify-center pb-10 pt-32 sm:pb-12 lg:pb-24">
        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <div className="relative space-y-5 sm:space-y-6 lg:space-y-7">
            <h1 className="max-w-3xl font-serif text-3xl font-semibold leading-tight tracking-[-0.05em] sm:text-4xl lg:text-5xl">
              Discover the Best Hotels in Dehradun with Zenvana
            </h1>

            <p className="max-w-xl mx-auto text-sm leading-7 text-white/85 sm:text-base lg:text-lg">
              Zenvana brings together Dehradun-rooted stays shaped by Rajpur Road,
              foothill calm, family comfort, and direct-booking ease.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-10 max-w-6xl px-4 mx-auto">
          <HeroBookBar properties={properties} />
        </div>
      </div>
    </section>
  )
}

function RoomsSection() {
  const rooms = [
    {
      name: 'Rosewood',
      description: 'A calm, light-filled room with plush comfort and an easy city rhythm.',
      imageSrc: '/images/dehradun/Rosewood.png',
      href: '/hotels/rosewood',
    },
    {
      name: 'Silkwood',
      description: 'Designed for friends and families with practical layout and warm details.',
      imageSrc: '/images/dehradun/silkwood .png',
      imageAlt: 'best hotels in dehradun',
      href: '/hotels/silkwood',
    },
    {
      name: 'Monte Verde',
      description: 'More space, softer lighting, and a slower pace for longer stays.',
      imageSrc: '/images/dehradun/MonteVerde.png',
      href: '/hotels/monteverde',
    },
    {
      name: 'Silverwood',
      description: 'Framed views of the hills with morning light and quieter evenings.',
      imageSrc: '/images/dehradun/SILVER W BUILDING PIC.png',
      href: '/hotels/silverwood',
    },
    {
      name: 'Cherrywood',
      description: 'Watch the city move from a higher, calmer vantage point.',
      imageSrc: '/images/dehradun/cherrwood building pic 1.png',
      imageAlt: 'best hotels in dehradun',
      href: '/hotels/cherrywood',
    },
  ]

  return (
    <section className="section-rule">
      <div className="container-shell py-14 sm:py-16 lg:py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="eyebrow">Accommodation</div>
            <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
              Discover Rooms That Redefine Comfort in Dehradun.
            </h2>
            <p className="body-copy mt-5 max-w-xl">
              Enjoy a relaxing stay with comfortable rooms, modern amenities, and warm hospitality.
              Designed for both leisure and business travelers, our rooms offer the comfort and
              convenience you expect from the <strong>best hotel in Dehradun</strong>. Experience a
              peaceful stay where every detail is crafted for your comfort at the{' '}
              <strong>best hotel in Dehradun</strong>.
            </p>
          </div>

          <Link
            href="/hotels"
            className="site-button-light w-fit md:mt-[68px]"
          >
            Explore more
          </Link>
        </div>

        <RoomsCarousel rooms={rooms} autoplayMs={4500} />
      </div>
    </section>
  )
}

function SpecialOffersSection() {
  const offers = [
    {
      title: 'Early Booking Discount - Best Hotel in Dehradun',
      highlight: 'Save up to 15%',
      description:
        'Plan ahead and unlock premium savings at the best hotel in Dehradun. Enjoy elegant stays, seamless service, and exclusive early-bird pricing when you reserve in advance.',
    },
    {
      title: 'Weekend Getaway Offer - Escape to Dehradun',
      highlight: 'City-to-hills reset',
      description:
        'Recharge your weekends at the best hotel in Dehradun with a curated getaway. Enjoy late checkouts, slower mornings, and easy access to scenic locations.',
    },
    {
      title: 'Dining Special Offer - Stay & Dine in Style',
      highlight: 'Taste-led stays',
      description:
        'Enhance your stay at the best hotel in Dehradun with curated dining experiences. From local flavors to premium meals, make every moment memorable.',
    },
  ]

  return (
    <section className="section-rule bg-muted/20">
      <div className="container-shell py-14 sm:py-16 lg:py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="eyebrow">SPECIAL OFFERS</div>
            <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
              Value that feels curated, not noisy.
            </h2>
            <p className="body-copy mt-5 max-w-xl">
              Discover exclusive deals at the best hotel in Dehradun, where every offer is
              thoughtfully designed to elevate your stay-not complicate it.
            </p>
          </div>

          <Link href="/offers" className="site-button-dark w-fit">
            View Offers
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {offers.map((offer) => (
            <article
              key={offer.title}
              className="quiet-card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="p-6">
                <div className="inline-flex rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-accent-foreground">
                  {offer.highlight}
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
                  {offer.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {offer.description}
                </p>
                <div className="mt-6">
                  <Link href="/offers" className="site-link">
                    View Offer
                  </Link>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-primary/30 via-accent/25 to-primary/30 opacity-0 transition group-hover:opacity-100" />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function DiningSection() {
  return (
    <section className="section-rule">
      <div className="container-shell py-14 sm:py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] bg-muted">
              <Image
                src="/images/dehradun/feasta.png"
                alt="best hotels in dehradun"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.18),transparent_60%),linear-gradient(to_bottom,_rgba(0,0,0,0.06),rgba(0,0,0,0.12))]" />
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="eyebrow">DINING</div>
            <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
              Rooftop restaurant in Dehradun with a refined dining experience.
            </h2>
            <p className="body-copy mt-5">
              Discover a premium restaurant in Dehradun where ambiance meets exceptional
              taste. Our rooftop dining experience is designed for relaxed evenings, elegant
              settings, and thoughtfully curated menus. From locally inspired dishes to modern
              cuisine, every plate is crafted to deliver a fine dining experience in Dehradun
              that feels both elevated and welcoming.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/restaurant" className="site-button-dark inline-flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                Explore Dining
              </Link>
              <Link href="/contact" className="site-button-light">
                Enquire
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function EventsSection() {
  const events = [
    {
      title: 'Wedding events',
      icon: <PartyPopper className="h-5 w-5" />,
      text: 'Celebrate your special day at one of the most elegant wedding venues in Dehradun. From intimate ceremonies to grand celebrations, our spaces are designed with warmth, beauty, and flexibility.',
    },
    {
      title: 'Corporate meetings',
      icon: <BriefcaseBusiness className="h-5 w-5" />,
      text: 'Host productive corporate meetings in Dehradun with well-equipped spaces tailored for workshops, conferences, and business gatherings, ensuring a smooth and professional experience.',
    },
    {
      title: 'Private celebrations',
      icon: <PartyPopper className="h-5 w-5" />,
      text: 'Plan birthdays, anniversaries, and intimate gatherings in a refined setting. Our event spaces in Dehradun offer the perfect balance of comfort, ambiance, and personalized service.',
    },
  ]

  return (
    <section className="section-rule bg-muted/10">
      <div className="container-shell py-14 sm:py-16 lg:py-20">
        <div className="text-center">
          <div className="eyebrow">EVENTS</div>
          <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
            Event spaces in Dehradun designed for effortless celebrations.
          </h2>
          <p className="body-copy mt-5">
            Host weddings, corporate events, and private gatherings at a premium venue in
            Dehradun, where every detail is thoughtfully managed for a seamless and elegant
            experience.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {events.map((item) => (
            <div key={item.title} className="quiet-card p-6">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
                {item.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function GallerySection() {
  const galleryImages = [
    '/images/dehradun/Rosewood.png',
    '/images/dehradun/silkwood .png',
    '/images/dehradun/MonteVerde.png',
    '/images/dehradun/Lucury room 1.png',
    '/images/dehradun/cherrwood building pic 1.png',
    '/images/dehradun/SILVER W BUILDING PIC.png',
    '/images/dehradun/feasta.png',
    '/images/dehradun/restaurantImage.png',
  ]

  return (
    <section className="section-rule">
      <div className="container-shell py-14 sm:py-16 lg:py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="eyebrow">Gallery</div>
            <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
              A visual feel for the stay.
            </h2>
            <p className="body-copy mt-5 max-w-xl">
              A small grid preview — with hover motion — to set the tone without noise.
            </p>
          </div>

          <Link href="/hotels" className="site-button-light w-fit">
            View Full Gallery
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {galleryImages.map((src, idx) => (
            <div
              key={`${src}-${idx}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-[1.6rem] bg-muted"
            >
              <Image
                src={src}
                alt="best hotels in dehradun"
                fill
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.18),transparent_60%),linear-gradient(to_bottom,_rgba(0,0,0,0.06),rgba(0,0,0,0.1))] transition duration-300 group-hover:opacity-80" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Aarav Sharma',
      text: 'From the moment we arrived, everything felt seamless and well-organized. The rooms were spacious, clean, and thoughtfully designed for comfort. The staff was polite, responsive, and always ready to help, making our stay truly relaxing. The smooth check-in process and attention to detail made this one of the best hotel experiences in Dehradun for us.',
      stars: 5,
      imageSrc: '/images/dehradun/istockphoto-2194433569-612x612.jpg',
    },
    {
      name: 'Rahul Verma',
      text: 'The ambiance of the hotel is elegant and calming, perfect for both short and long stays. The property is very well maintained, and cleanliness is clearly a priority here. What stood out the most was the service quality-professional yet warm-which truly reflects the standard you expect from the best hotel in Dehradun.',
      stars: 5,
      imageSrc:
        '/images/dehradun/cheerful-indian-businessman-smiling-closeup-portrait-jobs-career-campaign_53876-129417.avif',
    },
    {
      name: 'Rohan Mehta',
      text: 'A perfect place for families as well as couples looking for a comfortable and peaceful stay. The location is convenient, the rooms are cozy, and the hospitality is genuinely welcoming. Every small detail is taken care of, making it easy to relax and enjoy your time. Definitely one of the best hotel stays in Dehradun.',
      stars: 4,
      imageSrc: '/images/dehradun/istockphoto-613557584-612x612.jpg',
    },
    {
      name: 'Neha Kapoor',
      text: 'We had a wonderful experience staying here. The location is excellent, with easy access to key areas of Dehradun. The staff was supportive throughout our stay, and the overall atmosphere felt warm and inviting. It is a reliable and comfortable choice for anyone searching for the best hotel in Dehradun.',
      stars: 5,
      imageSrc: '/images/dehradun/ultra-realistic-indian-ai-girl-600nw-2735385401.webp',
    },
  ]

  return (
    <section className="section-rule bg-muted/15">
      <div className="container-shell py-14 sm:py-16 lg:py-20">
        <div className="text-center">
          <div className="eyebrow">TESTIMONIALS</div>
          <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
            Why guests call us the best hotel in Dehradun.
          </h2>
          <p className="body-copy mt-5">
            Real experiences from guests who have enjoyed their stay at one of the best hotels in
            Dehradun, known for comfort, service, and thoughtful hospitality.
          </p>
        </div>

        <div className="mt-10 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {testimonials.map((t, idx) => (
            <article
              key={idx}
              className="quiet-card min-w-[280px] max-w-[360px] flex-1 snap-start p-6 sm:min-w-[340px]"
            >
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 overflow-hidden rounded-full bg-muted">
                  <Image
                    src={t.imageSrc}
                    alt="best hotels in dehradun"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="mt-1 flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }, (_, s) => (
                      <Star
                        key={s}
                        className={
                          s < t.stars ? 'h-4 w-4 fill-current' : 'h-4 w-4 opacity-30'
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{t.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function LocationSection({
  latitude,
  longitude,
  mapPlaceUrl,
}: {
  latitude?: number
  longitude?: number
  mapPlaceUrl?: string
}) {
  const highlights = [
    'Easy access to city cafés and local shopping',
    'A short drive toward foothill viewpoints and trails',
    'Good starting point for day trips and longer stays',
  ]

  return (
    <section className="section-rule">
      <div className="container-shell py-14 sm:py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <div className="eyebrow">Location</div>
            <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
              Where the city meets the hills.
            </h2>
            <p className="body-copy mt-5">
              A clear base for exploring nearby attractions while keeping the stay calm and connected.
            </p>

            <div className="mt-7 grid gap-3">
              {highlights.map((h) => (
                <div key={h} className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                  <MapPin className="mt-1 h-4 w-4 text-primary" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] bg-muted">
              <HomeLimewoodMap
                latitude={latitude}
                longitude={longitude}
                mapPlaceUrl={mapPlaceUrl}
              />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.22),transparent_58%),linear-gradient(to_bottom,_rgba(0,0,0,0.05),rgba(0,0,0,0.12))]" />

              <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-2xl bg-background/70 px-4 py-2 text-sm text-foreground shadow-sm backdrop-blur">
                <MapPinned className="h-4 w-4" />
                Nearby highlights
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function BookingCtaSection() {
  return (
    <section className="section-rule">
      <div className="container-shell py-14 sm:py-16 lg:py-20">
        <div className="brand-gradient overflow-hidden rounded-[2rem] px-6 py-10 text-white sm:px-8 lg:px-10">
          <div className="text-center">
            <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/70">
              Booking
            </div>
            <h2 className="mt-4 font-serif text-3xl tracking-[-0.03em] sm:text-4xl lg:text-5xl">
              A quieter stay starts with a clean booking.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/80 sm:text-base">
              Reserve your stay with direct support and a smoother arrival experience.
            </p>

            <div className="mt-6 flex justify-center">
              <Link href="/hotels" className="site-button-light border-white/20 bg-white/12 dark:text-white hover:bg-white/16">
                Book Your Stay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
