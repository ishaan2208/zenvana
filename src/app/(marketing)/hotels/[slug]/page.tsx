import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BedDouble,
  CalendarCheck,
  Camera,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { getPublicPropertyBySlug, getPublicProperties } from '@/lib/api'
import { Container } from '@/components/Container'
import { Button } from '@/components/Button'
import { EmblaImageGallery } from '@/components/EmblaImageGallery'
import { PropertyMapSection } from '@/components/PropertyMapSection'
import { normalizeGalleryImages, pickHeroAndGallery } from '@/lib/media'
import {
  lodgingBusinessJsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
} from '@/lib/structured-data'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://zenvanahotels.com'

type Props = { params: Promise<{ slug: string }> }
type Property = NonNullable<Awaited<ReturnType<typeof getPublicPropertyBySlug>>>

export async function generateStaticParams() {
  const properties = await getPublicProperties()
  return properties.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const property = await getPublicPropertyBySlug(slug)

  if (!property) {
    return {
      title: 'Hotel not found | Zenvana',
    }
  }

  const location = [property.city, property.state].filter(Boolean).join(', ')
  const { heroUrl } = pickHeroAndGallery(property.images)

  const title = `${property.publicName} by Zenvana | Boutique Hotel in ${property.city ?? 'Dehradun'} | Book Direct`
  const description =
    property.descriptionShort ??
    `${property.publicName} by Zenvana offers a thoughtful stay in ${location || 'Dehradun'}. Explore rooms, see real property photos, and book direct for a smoother arrival.`

  const canonical = `${SITE_URL}/hotels/${slug}`

  return {
    title,
    description,
    keywords: [
      property.publicName,
      property.city,
      property.state,
      'boutique hotel',
      'hotel in dehradun',
      'book direct hotel',
      'zenvana hotels',
      `${property.publicName} rooms`,
      `${property.publicName} photos`,
    ].filter(Boolean),
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      images: heroUrl ? [{ url: heroUrl, alt: property.publicName }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: heroUrl ? [heroUrl] : [],
    },
  }
}

export default async function PropertyPage({ params }: Props) {
  const { slug } = await params
  const property = await getPublicPropertyBySlug(slug)
  if (!property) notFound()

  const galleryData = pickHeroAndGallery(property.images)
  const heroUrl = galleryData.heroUrl
  const galleryImages = galleryData.gallery
  const roomTypes = property.roomTypes ?? []
  const location = [property.city, property.state].filter(Boolean).join(', ') || 'Dehradun'
  const totalImageCount = (heroUrl ? 1 : 0) + galleryImages.length

  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Hotels', url: `${SITE_URL}/hotels` },
    { name: property.publicName, url: `${SITE_URL}/hotels/${slug}` },
  ]

  const faqsForLd = property.faqs?.map((f) => ({
    question: f.question,
    answer: f.answer,
  }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(lodgingBusinessJsonLd(property)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)),
        }}
      />
      {faqsForLd && faqsForLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqPageJsonLd(faqsForLd)),
          }}
        />
      )}

      <main className="bg-background text-foreground pb-24 xl:pb-0">
        <PropertyHero
          property={property}
          heroUrl={heroUrl}
          location={location}
          galleryImages={galleryImages}
          totalImageCount={totalImageCount}
        />

        <QuickFacts
          property={property}
          location={location}
          totalImageCount={totalImageCount}
        />

        <QuickAnchorNav
          hasGallery={galleryImages.length > 0}
          hasRooms={roomTypes.length > 0}
          hasMap={property.latitude != null && property.longitude != null}
          hasFaqs={(property.faqs?.length ?? 0) > 0}
        />

        <Container className="py-8 sm:py-10 lg:py-16">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.12fr)_380px] xl:gap-10">
            <div className="min-w-0 space-y-14 sm:space-y-16">
              <OverviewSplitSection
                property={property}
                location={location}
                galleryImages={galleryImages}
              />

              {galleryImages.length > 0 && (
                <GallerySection
                  propertyName={property.publicName}
                  images={galleryImages}
                />
              )}

              {roomTypes.length > 0 && (
                <RoomsSection propertySlug={property.slug} roomTypes={roomTypes} />
              )}

              <PropertyMapSection
                propertyName={property.publicName}
                latitude={property.latitude}
                longitude={property.longitude}
                fullAddress={property.fullAddress}
                mapPlaceUrl={property.googleMapPlaceUrl}
              />

              {property.faqs && property.faqs.length > 0 && (
                <FaqSection faqs={property.faqs} />
              )}
            </div>

            <aside className="min-w-0">
              <BookingSidebar
                property={property}
                location={location}
                totalImageCount={totalImageCount}
              />
            </aside>
          </div>
        </Container>

        <section className="border-t border-border/60 bg-background">
          <Container className="py-8">
            <Link
              href="/hotels"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              All hotels
            </Link>
          </Container>
        </section>

        <PropertyMobileBookingBar property={property} />
      </main>
    </>
  )
}

function PropertyHero({
  property,
  heroUrl,
  location,
  galleryImages,
  totalImageCount,
}: {
  property: Property
  heroUrl?: string
  location: string
  galleryImages: Array<{ url: string }>
  totalImageCount: number
}) {
  const previewImages = galleryImages.slice(0, 5)

  return (
    <section className="relative isolate overflow-hidden bg-[#08111f] text-white">
      <div className="relative min-h-[76svh] sm:min-h-[88svh]">
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={`${property.publicName} in ${location}`}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#08111f_0%,#0d2037_50%,#143626_100%)]" />
        )}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,16,0.20)_0%,rgba(4,8,16,0.34)_18%,rgba(4,8,16,0.64)_58%,rgba(4,8,16,0.88)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(219,230,76,0.18),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(116,195,101,0.12),transparent_22%)]" />

        <Container className="relative z-10 flex min-h-[76svh] flex-col justify-between py-5 sm:min-h-[88svh] sm:py-8">
          <div className="flex items-start justify-between gap-4">
            <Link
              href="/hotels"
              className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/10 px-3.5 py-2 text-xs font-medium text-white/90 backdrop-blur-xl transition hover:bg-white/16"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to hotels
            </Link>


          </div>

          <div className="max-w-5xl pt-16 sm:pt-24">


            <h1 className="mt-5 max-w-4xl font-serif text-[clamp(2.5rem,7vw,6.4rem)] leading-[0.92] tracking-[-0.05em] text-white">
              {property.publicName}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/82 sm:text-base">
              <div className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-white/70" />
                <span>{location}</span>
              </div>
              {property.primaryPhone && (
                <>
                  <span className="hidden h-1 w-1 rounded-full bg-white/30 sm:inline-block" />
                  <a
                    href={`tel:${property.primaryPhone}`}
                    className="inline-flex items-center gap-2 text-white/86 transition hover:text-white"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-white/70" />
                    <span>{property.primaryPhone}</span>
                  </a>
                </>
              )}
            </div>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/76 sm:text-lg">
              {property.descriptionShort ??
                `A thoughtfully located Zenvana stay in ${location}, designed for easy arrivals, quiet comfort, and a smoother city stay.`}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                href={`/book/${property.slug}`}
                color="blue"
                className="flex items-center justify-center gap-2 rounded-full px-6"
              >
                <CalendarCheck className="h-4 w-4" />
                Check availability
              </Button>

              {property.googleMapPlaceUrl ? (
                <a
                  href={property.googleMapPlaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/5 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur-xl transition hover:bg-white/16"
                >
                  <MapPin className="h-4 w-4" />
                  View on map
                </a>
              ) : null}
            </div>
          </div>

          {previewImages.length > 0 && (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-[0.28em] text-white/62">
                  Preview the stay
                </div>
                <a
                  href="#gallery"
                  className="inline-flex items-center gap-2 text-sm font-medium text-white/82 transition hover:text-white"
                >
                  See full gallery
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
                {previewImages.map((img, index) => (
                  <a
                    key={`${img.url}-${index}`}
                    href="#gallery"
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
                  >
                    <div className="relative aspect-[1.15/1]">
                      <Image
                        src={img.url}
                        alt={`${property.publicName} preview ${index + 1}`}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-[1.04]"
                        sizes="(max-width: 640px) 50vw, 20vw"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </Container>
      </div>
    </section>
  )
}

function QuickFacts({
  property,
  location,
  totalImageCount,
}: {
  property: Property
  location: string
  totalImageCount: number
}) {
  const items = [
    {
      icon: Camera,
      title: `${totalImageCount} photos`,
      text: 'See the rooms, common areas, and overall feel before you book.',
    },
    {
      icon: BedDouble,
      title: `${property.roomTypes?.length ?? 0} room types`,
      text: 'Browse different room options and choose the stay that suits your trip.',
    },
    {
      icon: BadgeCheck,
      title: 'Book direct',
      text: 'Faster coordination, clearer communication, and a smoother arrival experience.',
    },
    {
      icon: MapPin,
      title: location,
      text: property.fullAddress ?? 'Well placed for a convenient city stay.',
    },
  ]

  return (
    <section className="border-b border-border/60 bg-background">
      <Container className="py-4 sm:py-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="group rounded-[1.35rem] border border-border/60 bg-card/80 p-4 shadow-[0_10px_35px_rgba(8,17,31,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(8,17,31,0.06)] dark:bg-card/60"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium tracking-tight text-foreground">
                      {item.title}
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

function QuickAnchorNav({
  hasGallery,
  hasRooms,
  hasMap,
  hasFaqs,
}: {
  hasGallery: boolean
  hasRooms: boolean
  hasMap: boolean
  hasFaqs: boolean
}) {
  const links = [
    { href: '#overview', label: 'Overview', enabled: true },
    { href: '#gallery', label: 'Gallery', enabled: hasGallery },
    { href: '#rooms', label: 'Rooms', enabled: hasRooms },
    { href: '#location', label: 'Location', enabled: hasMap },
    { href: '#faqs', label: 'FAQs', enabled: hasFaqs },
  ].filter((item) => item.enabled)

  return (
    <section className="border-b border-border/60 bg-background/82 backdrop-blur-xl">
      <Container className="overflow-x-auto">
        <nav className="flex min-w-max items-center gap-2 py-3">
          {links.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full border border-border/70 bg-card/60 px-4 py-2 text-sm font-medium text-foreground/80 transition hover:bg-card hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </Container>
    </section>
  )
}

function OverviewSplitSection({
  property,
  location,
  galleryImages,
}: {
  property: Property
  location: string
  galleryImages: Array<{ url: string }>
}) {
  const collage = galleryImages.slice(0, 4)

  return (
    <section id="overview" className="scroll-mt-28">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start lg:gap-10">
        <div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Overview
          </div>
          <h2 className="mt-4 font-serif text-4xl leading-[0.95] tracking-[-0.05em] text-foreground sm:text-5xl">
            Quiet comfort, easy access, and a stay that feels considered from the moment you arrive.
          </h2>

          <p className="mt-6 text-base leading-8 text-muted-foreground">
            {property.descriptionShort ??
              `${property.publicName} offers a calm and practical base in ${location}, with thoughtfully designed rooms, a clear arrival experience, and the kind of stay that lets the city unfold at its own pace.`}
          </p>

          {property.descriptionLong ? (
            <div
              className="prose prose-neutral mt-6 max-w-none text-muted-foreground dark:prose-invert prose-headings:font-serif prose-headings:text-foreground prose-p:leading-8"
              dangerouslySetInnerHTML={{
                __html: property.descriptionLong.replace(/\n/g, '<br />'),
              }}
            />
          ) : (
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Whether you are here for a quick city stop, a longer work stay, or a relaxed Dehradun visit,
              the page below lets you explore the property visually before committing to a booking.
            </p>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.4rem] border border-border/60 bg-card/80 p-4 dark:bg-card/60">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">Designed to build trust</div>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    Real imagery, clear room presentation, and practical stay information in one place.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-border/60 bg-card/80 p-4 dark:bg-card/60">
              <div className="flex items-start gap-3">
                <CalendarCheck className="mt-0.5 h-5 w-5 text-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">Booking always within reach</div>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    The page keeps booking visible without interrupting the story of the stay.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {collage.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {collage.map((img, index) => {
              const tall = index === 0 || index === 3
              return (
                <div
                  key={`${img.url}-${index}`}
                  className={`group relative overflow-hidden rounded-[1.7rem] border border-border/60 bg-card/60 ${tall ? 'col-span-2 aspect-[16/11] sm:col-span-1 sm:aspect-[3/4]' : 'aspect-[4/3]'
                    }`}
                >
                  <Image
                    src={img.url}
                    alt={`${property.publicName} gallery image ${index + 1}`}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(0,0,0,0.22)_100%)]" />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function GallerySection({
  propertyName,
  images,
}: {
  propertyName: string
  images: Array<{ url: string }>
}) {
  return (
    <section id="gallery" className="scroll-mt-28">
      <div className="max-w-2xl">
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Gallery
        </div>
        <h2 className="mt-4 font-serif text-3xl leading-[0.96] tracking-[-0.04em] text-foreground sm:text-4xl">
          See the stay before you arrive.
        </h2>
        <p className="mt-4 text-base leading-8 text-muted-foreground">
          Browse the rooms, common spaces, and overall atmosphere to get a clearer sense of the property before you book.
        </p>
      </div>

      <div className="mt-8">
        <EmblaImageGallery
          images={images.map((img, index) => ({
            url: img.url,
            alt: `${propertyName} gallery image ${index + 1}`,
          }))}
          aspectClassName="aspect-[16/11]"
          autoPlay
          showThumbs
        />
      </div>
    </section>
  )
}

function RoomsSection({
  propertySlug,
  roomTypes,
}: {
  propertySlug: string
  roomTypes: Array<{
    id: string | number
    name: string
    shortDescription?: string | null
    images?: unknown
  }>
}) {
  return (
    <section id="rooms" className="scroll-mt-28">
      <div className="max-w-2xl">
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Rooms
        </div>
        <h2 className="mt-4 font-serif text-3xl leading-[0.96] tracking-[-0.04em] text-foreground sm:text-4xl">
          Rooms that deserve more than a thumbnail.
        </h2>
        <p className="mt-4 text-base leading-8 text-muted-foreground">
          Each room type gets proper visual space, so guests can compare the stay experience with confidence rather than guessing from a single cramped image.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {roomTypes.map((rt) => {
          const roomImages = normalizeGalleryImages(rt.images)

          return (
            <article
              key={rt.id}
              className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 shadow-[0_14px_40px_rgba(8,17,31,0.05)] dark:bg-card/60"
            >
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <div className="p-3 sm:p-4">
                  {roomImages.length > 0 ? (
                    <EmblaImageGallery
                      images={roomImages.map((img, idx) => ({
                        url: img.url,
                        alt: `${rt.name} image ${idx + 1}`,
                      }))}
                      aspectClassName="aspect-[16/11]"
                      autoPlay={false}
                      showThumbs={roomImages.length > 1}
                    />
                  ) : (
                    <div className="flex aspect-[16/11] items-center justify-center rounded-[1.5rem] bg-muted text-muted-foreground">
                      Room images coming soon
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between border-t border-border/60 p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-7">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground/78">
                      <BedDouble className="h-3.5 w-3.5" />
                      {roomImages.length > 0 ? `${roomImages.length} photos` : 'Room details'}
                    </div>

                    <h3 className="mt-4 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                      {rt.name}
                    </h3>

                    <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                      {rt.shortDescription ??
                        `${rt.name} is designed for a comfortable and well-paced stay, with clean proportions, practical comfort, and a calm visual feel.`}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 ">
                    <Button
                      href={`/book/${propertySlug}?room=${encodeURIComponent(rt.name)}`}
                      color="blue"
                      className="flex items-center justify-center gap-2 rounded-full"
                    >
                      <CalendarCheck className="h-4 w-4" />
                      Check availability
                    </Button>

                    <a
                      href="#gallery"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-background px-5 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
                    >
                      <Camera className="h-4 w-4" />
                      View more photos
                    </a>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function FaqSection({
  faqs,
}: {
  faqs: Array<{
    id: string | number
    question: string
    answer: string
  }>
}) {
  return (
    <section id="faqs" className="scroll-mt-28">
      <div className="max-w-2xl">
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Useful to know
        </div>
        <h2 className="mt-4 font-serif text-3xl leading-[0.96] tracking-[-0.04em] text-foreground sm:text-4xl">
          Practical details before you book.
        </h2>
      </div>

      <div className="mt-8 grid gap-4">
        {faqs.map((faq) => (
          <details
            key={faq.id}
            className="group rounded-[1.6rem] border border-border/60 bg-card/80 p-5 shadow-[0_12px_35px_rgba(8,17,31,0.04)] transition dark:bg-card/60"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-medium tracking-tight text-foreground sm:text-lg">
              <span>{faq.question}</span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}

function BookingSidebar({
  property,
  location,
  totalImageCount,
}: {
  property: Property
  location: string
  totalImageCount: number
}) {
  const roomCount = property.roomTypes?.length ?? 0

  return (
    <div className="xl:sticky xl:top-8">
      <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 shadow-[0_24px_60px_rgba(8,17,31,0.08)] backdrop-blur-xl dark:bg-card/55">
        <div className="border-b border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent)] px-6 py-6 sm:px-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Book direct
          </div>

          <h2 className="mt-4 font-serif text-3xl tracking-[-0.04em] text-foreground">
            Stay with confidence
          </h2>

          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Explore the property visually, compare rooms properly, and book direct when you are ready.
          </p>
        </div>

        <div className="px-6 py-6 sm:px-7">
          <Button
            href={`/book/${property.slug}`}
            color="blue"
            className="flex w-full items-center justify-center gap-2 rounded-full"
          >
            <CalendarCheck className="h-4 w-4" />
            Check availability
          </Button>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[1.25rem] border border-border/60 bg-background/80 p-4">
              <div className="flex items-start gap-3">
                <Camera className="mt-0.5 h-4 w-4 text-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">{totalImageCount} property photos</div>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    A more complete look before booking.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-border/60 bg-background/80 p-4">
              <div className="flex items-start gap-3">
                <BedDouble className="mt-0.5 h-4 w-4 text-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">{roomCount} room types</div>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    Compare spaces and choose what fits your trip.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-border/60 bg-background/80 p-4 sm:col-span-2 xl:col-span-1">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">{location}</div>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    {property.fullAddress ?? 'Easy to locate and straightforward to reach.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-border/60 bg-background/80 p-4 sm:col-span-2 xl:col-span-1">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">Direct coordination</div>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    Reach the property team more easily before arrival.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4 border-t border-border/60 pt-6">
            {property.primaryPhone && (
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Phone
                  </div>
                  <a
                    href={`tel:${property.primaryPhone}`}
                    className="mt-1 inline-block text-sm font-medium text-foreground hover:underline"
                  >
                    {property.primaryPhone}
                  </a>
                </div>
              </div>
            )}

            {property.googleMapPlaceUrl && (
              <a
                href={property.googleMapPlaceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition hover:text-primary"
              >
                View on map
                <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PropertyMobileBookingBar({ property }: { property: Property }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/92 px-3 py-3 backdrop-blur-xl xl:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        {property.primaryPhone ? (
          <a
            href={`tel:${property.primaryPhone}`}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition hover:bg-muted"
            aria-label="Call property"
          >
            <Phone className="h-4.5 w-4.5" />
          </a>
        ) : null}

        <Button
          href={`/book/${property.slug}`}
          color="blue"
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full"
        >
          <CalendarCheck className="h-4 w-4" />
          Check availability
        </Button>
      </div>
    </div>
  )
}