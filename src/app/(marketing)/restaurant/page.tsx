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
import { EventBookingForm } from '@/components/EventBookingForm'
import { JsonLd } from '@/components/JsonLd'
import { breadcrumbJsonLd, restaurantJsonLd } from '@/lib/structured-data'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Rooftop Restaurant on Rajpur Road, Dehradun',
  description:
    'Feasta — the rooftop restaurant by Zenvana on Rajpur Road, Dehradun. Indian and continental cuisine, calm ambience, and skyline views. Open daily.',
  keywords: [
    'best restaurant in Dehradun',
    'rooftop restaurant Dehradun',
    'Rajpur Road restaurant',
    'fine dining Dehradun',
    'Feasta Dehradun',
  ],
  alternates: { canonical: '/restaurant' },
  openGraph: {
    title: 'Rooftop Restaurant on Rajpur Road, Dehradun',
    description: 'Indian and continental cuisine, calm ambience, and skyline views.',
    url: `${SITE_URL}/restaurant`,
    type: 'website',
    images: [{ url: `${SITE_URL}/images/dehradun/feasta.png`, alt: 'Feasta rooftop restaurant Dehradun' }],
  },
}

export default function RestaurantPage() {
  const features = [
    {
      title: 'Best Signature Flavors',
      icon: <ChefHat className="h-5 w-5" />,
      description:
        'Fresh Ingredients & Bold Himalayan Tastes. We serve house-inspired plates made with seasonal ingredients and clean flavors. It is why locals call us the best restaurant in Dehradun for a fresh, modern meal.',
    },
    {
      title: 'Chill & Elegant Ambience',
      icon: <Sparkles className="h-5 w-5" />,
      description:
        'The Perfect Spot for Slow Evenings. Whether it is a coffee date or a long dinner with friends, our warm lighting and calm music create an atmosphere where you can truly relax and unwind.',
    },
    {
      title: 'Scenic Rooftop Cafe Dehradun',
      icon: <Sunset className="h-5 w-5" />,
      description:
        'Skyline Views & Open-Air Hangouts. Catch the evening breeze and the best valley views in town. Our deck is the top rooftop cafe destination for anyone looking to eat, drink, and enjoy the Dehradun skyline.',
    },
    {
      title: 'Crafted Mocktails & Drinks',
      icon: <GlassWater className="h-5 w-5" />,
      description:
        'Artisanal Pours for Longer Conversations. Pair your meal with our signature mocktails and house pours. Designed for sipping slowly while you soak in the mood and the music.',
    },
  ]

  const menu = [
    { name: 'Butter Chicken', description: 'One of the most loved dishes at our restaurant in Dehradun, cooked in a rich tomato-butter gravy with balanced spices.', price: '300/500/-', imageSrc: '/images/dehradun/Butter Chicken.jpg' },
    { name: 'Kadai Paneer', description: 'A popular North Indian paneer dish served at our Rajpur Road restaurant, made with fresh capsicum, onion, and aromatic masala.', price: '280/-', imageSrc: '/images/dehradun/kadai paneer.jpg' },
    { name: 'Dal Makhani', description: 'Slow-cooked black lentils with cream and butter, ideal for guests looking for a classic fine dining meal in Dehradun.', price: '280/-', imageSrc: '/images/dehradun/Dal Makhani.jpg' },
    { name: 'Chicken Biryani', description: 'Fragrant basmati rice layered with tender chicken and spices, a top choice for biryani lovers near Rajpur Road Dehradun.', price: '300/-', imageSrc: '/images/dehradun/Chicken Biryani.jpg' },
    { name: 'Mix Veg', description: 'A wholesome mixed vegetable curry cooked with fresh seasonal vegetables and aromatic Indian spices, perfect for a balanced vegetarian meal in Dehradun.', price: '200/-', imageSrc: '/images/dehradun/4x3-mix-veg-recipe.jpg (1).jpeg' },
    { name: 'Paneer Tikka', description: 'Marinated paneer grilled in the tandoor with Indian spices, perfect for vegetarian guests visiting our Rajpur Road cafe and restaurant.', price: '350/-', imageSrc: '/images/dehradun/paneer tikka.jpg' },
    { name: 'Jeera Rice', description: 'Light and flavorful cumin rice that pairs well with every main course on our Dehradun restaurant menu.', price: '180/-', imageSrc: '/images/dehradun/jeera-rice-1.jpg' },
    { name: 'Honey Chilly Potato', description: 'A crispy and flavorful starter with a sweet-spicy glaze, loved by guests searching for the best restaurant in Dehradun.', price: '210/-', imageSrc: '/images/dehradun/Honey chilli.jpg' },
  ]

  const testimonials = [
    {
      name: 'Yogesh Kumar',
      text: 'One of the best restaurant experiences in Dehradun. The rooftop ambiance, attentive staff, and well-balanced flavors made our dinner on Rajpur Road truly memorable from start to finish.',
      stars: 5 as const,
      imageSrc: '/images/dehradun/Yogesh.png',
    },
    {
      name: 'Shailja Singh',
      text: 'If you are looking for the best restaurant in Rajpur Road, Dehradun, this is a great choice. The warm lighting, elegant setup, and quality food created a perfect evening for family dining.',
      stars: 5 as const,
      imageSrc: '/images/dehradun/Shailja Singh.png',
    },
    {
      name: 'Shashank Satlaksh',
      text: 'The food quality and presentation were excellent, and every dish felt freshly prepared. This rooftop restaurant in Dehradun is ideal for a relaxed dinner with scenic views and calm service.',
      stars: 4 as const,
      imageSrc: '/images/dehradun/Shashank Satlaksh.png',
    },
    {
      name: 'Jasleen Kaur',
      text: 'A premium dining place near Rajpur Road with great taste, comfortable seating, and polite staff. We enjoyed the overall vibe and would recommend it to anyone searching for the best restaurant in Dehradun.',
      stars: 5 as const,
      imageSrc: '/images/dehradun/Jasleen Kaur.png',
    },
  ]
  const galleryImages = [
    '/images/dehradun/IMG_4505.jpg',
    '/images/dehradun/IMG_4518.jpg',
    '/images/dehradun/IMG_4536.JPG',
    '/images/dehradun/IMG_4542.JPG',
    '/images/dehradun/IMG_4660.jpg',
    '/images/dehradun/IMG_4668.jpg',
    '/images/dehradun/feasta.png',
    '/images/dehradun/restaurantImage.png',
  ]

  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Restaurant', url: `${SITE_URL}/restaurant` },
  ]

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbs),
          restaurantJsonLd({
            image: `${SITE_URL}/images/dehradun/feasta.png`,
          }),
        ]}
      />
      {/* SECTION 1 — RESTAURANT INTRODUCTION */}
      <section className="section-rule">
        <div className="container-shell py-14 sm:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <div className="eyebrow">Fine Dining Experience - Dehradun</div>
              <h1 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
                Dehradun&apos;s Finest Rooftop Dining, Above the City Lights
              </h1>
              <p className="body-copy mt-5">
                Celebrated as the best restaurant in Dehradun, we offer an unforgettable culinary
                journey under open skies - slow evenings, warm candlelight, and a seasonal menu
                crafted with mountain freshness. Experience Dehradun&apos;s most breathtaking rooftop
                cafe with Mussoorie view - where the distant Shivalik hills meet a menu that&apos;s
                quietly indulgent, every single evening.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="https://feasta.stayzenvana.com/menu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-button-dark"
                >
                  Order Now
                </a>
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
        <div className="container-shell py-8 sm:py-10 lg:py-12">
          <div className="mx-auto max-w-none text-center">
            <div className="eyebrow">Dining experience</div>
            <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
              The Best Restaurant in Dehradun for Great Vibes
            </h2>
            <p className="body-copy mx-auto mt-4 max-w-4xl">
              Looking for the best restaurant in Rajpur Road, Dehradun? Zenvana offers a premium
              rooftop dining experience with signature flavors, fresh ingredients, and warm service.
              From family dinners to date nights and celebrations, our menu blends North Indian
              favorites, tandoori specialties, and modern cafe-style options in one elegant setting.
              If you are searching for the best restaurant in Dehradun for ambiance, taste, and
              consistent quality, this is your perfect dining destination.
            </p>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
              <div className="eyebrow">Chef Special</div>
              <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
                Taste of Luxury Dining
              </h2>
              <p className="body-copy mt-5 max-w-xl">
                Experience the finest flavors at the best restaurant on Rajpur Road Dehradun,
                offering a premium selection of dishes made with high-quality ingredients and
                expert techniques. Enjoy a luxurious fine dining experience with a perfect balance
                of taste, presentation, and ambiance.
              </p>
            </div>

            <a
              href="https://feasta.stayzenvana.com/menu"
              target="_blank"
              rel="noopener noreferrer"
              className="site-button-light w-fit"
            >
              Full Menu
            </a>

          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {menu.map((item) => (
              <article key={item.name} className="quiet-card overflow-hidden">
                <div className="relative aspect-[4/3] bg-muted">
                  <Image
                    src={item.imageSrc}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.14),transparent_55%),linear-gradient(to_bottom,_rgba(0,0,0,0.06),rgba(0,0,0,0.12))]" />
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
                <Image
                  src="/images/dehradun/IMG_4477.jpg"
                  alt="Perfect evening rooftop seating at Zenvana restaurant in Dehradun"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.18),transparent_60%),linear-gradient(to_bottom,_rgba(0,0,0,0.06),rgba(0,0,0,0.12))]" />
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="eyebrow">Atmosphere</div>
              <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
                Perfect Evening Setting
              </h2>
              <p className="body-copy mt-5">
                Step into a warm and inviting space at the best restaurant in Dehradun, where soft
                lighting, comfortable seating, and a calm vibe create the perfect setting to relax,
                dine, and enjoy every moment.
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
            {galleryImages.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-[1.6rem] bg-muted"
              >
                <Image
                  src={src}
                  alt="Restaurant gallery image"
                  fill
                  className="object-cover transition duration-300 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.18),transparent_60%),linear-gradient(to_bottom,_rgba(0,0,0,0.06),rgba(0,0,0,0.1))] transition duration-300 group-hover:opacity-80" />
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

      {/* SECTION 8 — EVENT ENQUIRY / BOOK EVENT */}
      <section className="section-rule bg-muted/10">
        <div className="container-shell py-14 sm:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <div className="eyebrow">Events</div>
              <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
                Book an event
              </h2>
              <p className="body-copy mt-5">
                Share your event details and we&apos;ll help you plan the perfect celebration.
              </p>

              <div className="mt-7 grid gap-3 text-sm leading-7 text-muted-foreground">
                <div className="flex items-start gap-3">
                  <Award className="mt-1 h-4 w-4 text-primary" />
                  <span>Birthday and anniversary events</span>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="mt-1 h-4 w-4 text-primary" />
                  <span>Corporate and group gatherings</span>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="mt-1 h-4 w-4 text-primary" />
                  <span>Custom decor and catering options</span>
                </div>
              </div>
            </div>

            <div className="quiet-card lg:col-span-7 p-6 sm:p-7">
              <div className="eyebrow">Book</div>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                Event booking form
              </h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Share your requirements and our team will connect with availability and pricing.
              </p>
              <EventBookingForm />
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

