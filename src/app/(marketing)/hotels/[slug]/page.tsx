import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPublicPropertyBySlug, getPublicProperties } from '@/lib/api'
import { Container } from '@/components/Container'
import { Button } from '@/components/Button'
import {
  lodgingBusinessJsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
} from '@/lib/structured-data'
import { CalendarCheck, MapPin, Phone } from 'lucide-react'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvana.com'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const properties = await getPublicProperties()
  return properties.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const property = await getPublicPropertyBySlug(slug)
  if (!property) return { title: 'Hotel not found' }
  const city = property.city ?? ''
  return {
    title: `${property.publicName} by Zenvana | Boutique Hotel in ${city} | Book Direct`,
    description:
      property.descriptionShort ??
      `Book ${property.publicName} directly. ${city}. Best rates when you book with Zenvana.`,
    openGraph: {
      images: getHeroImageUrl(property.images),
    },
  }
}

function getHeroImageUrl(images: unknown): string[] {
  if (!images || !Array.isArray(images)) return []
  const hero = images.find(
    (i: { isHero?: boolean; classification?: string }) =>
      i?.isHero || i?.classification === 'hero'
  )
  const url = hero?.url ?? (images[0] as { url?: string } | undefined)?.url
  return url ? [url] : []
}

export default async function PropertyPage({ params }: Props) {
  const { slug } = await params
  const property = await getPublicPropertyBySlug(slug)
  if (!property) notFound()

  const heroUrl = getHeroImageUrl(property.images)[0]

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
      {/* Hero */}
      <section className="relative">
        {heroUrl ? (
          <img
            src={heroUrl}
            alt=""
            className="h-[50vh] w-full object-cover"
          />
        ) : (
          <div className="h-[50vh] w-full bg-slate-200" />
        )}
        <div className="absolute inset-0 bg-slate-900/30" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <Container>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {property.publicName}
            </h1>
            {(property.city || property.state) && (
              <p className="mt-1">
                {[property.city, property.state].filter(Boolean).join(', ')}
              </p>
            )}
          </Container>
        </div>
      </section>

      <Container className="py-12">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {property.descriptionShort && (
              <p className="text-lg text-slate-600">
                {property.descriptionShort}
              </p>
            )}
            {property.descriptionLong && (
              <div
                className="mt-6 prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{
                  __html: property.descriptionLong.replace(/\n/g, '<br />'),
                }}
              />
            )}

            {property.roomTypes && property.roomTypes.length > 0 && (
              <section className="mt-12">
                <h2 className="font-display text-xl font-semibold text-slate-900">
                  Rooms
                </h2>
                <ul className="mt-4 space-y-4">
                  {property.roomTypes.map((rt) => (
                    <li
                      key={rt.id}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <h3 className="font-medium text-slate-900">{rt.name}</h3>
                      {rt.shortDescription && (
                        <p className="mt-1 text-sm text-slate-600">
                          {rt.shortDescription}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {property.faqs && property.faqs.length > 0 && (
              <section className="mt-12">
                <h2 className="font-display text-xl font-semibold text-slate-900">
                  FAQs
                </h2>
                <dl className="mt-4 space-y-4">
                  {property.faqs.map((faq) => (
                    <div key={faq.id}>
                      <dt className="font-medium text-slate-900">
                        {faq.question}
                      </dt>
                      <dd className="mt-1 text-slate-600">{faq.answer}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-8 rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Book direct
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Best rates when you book with us.
              </p>
              <Button
                href={`/book/${property.slug}`}
                color="blue"
                className="mt-4 flex w-full items-center justify-center gap-2"
              >
                <CalendarCheck className="h-4 w-4" aria-hidden />
                Check availability
              </Button>
              {property.primaryPhone && (
                <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <a
                    href={`tel:${property.primaryPhone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {property.primaryPhone}
                  </a>
                </p>
              )}
              {property.fullAddress && (
                <p className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span>{property.fullAddress}</span>
                </p>
              )}
              {property.googleMapPlaceUrl && (
                <a
                  href={property.googleMapPlaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                  View on map →
                </a>
              )}
            </div>
          </aside>
        </div>
      </Container>

      <nav className="border-t border-slate-200 bg-slate-50 py-8">
        <Container>
          <Link
            href="/hotels"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← All hotels
          </Link>
        </Container>
      </nav>
    </>
  )
}
