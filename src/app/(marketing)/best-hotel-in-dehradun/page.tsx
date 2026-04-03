import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Best Hotel in Dehradun 2026 | Luxury & Budget Stays – Zenvana Group',
  description:
    'Looking for the best hotel in Dehradun? Discover luxury, budget & family-friendly stays by Zenvana Group. Book now for best deals.',
}

type HotelBlock = {
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  href?: string
}

const hotelBlocks: HotelBlock[] = [
  {
    title: 'Rosewood Hotel Dehradun – A Symbol of Luxury',
    description:
      'Rosewood Hotel represents the pinnacle of luxury within the group and is often considered the best hotel in Dehradun for travelers seeking a premium experience. The property is designed with modern architecture, elegant interiors, and a refined ambiance that appeals to both leisure and business travelers.',
    imageSrc: '/images/dehradun/Rosewood.png',
    imageAlt: 'Rosewood Hotel Dehradun exterior and rooms',
    href: 'https://zenvanahotels.com/hotels/rosewood',
  },
  {
    title: 'Limewood Hotel Dehradun – Affordable Yet Stylish',
    description:
      'Limewood Hotel has been designed for travelers who want comfort without spending excessively. Despite being a budget-friendly option, it does not compromise on quality or style, making it a practical option for solo and business travelers.',
    imageSrc: '/images/dehradun/Lift (1).png',
    imageAlt: 'Limewood Hotel Dehradun room and interior view',
    href: 'https://zenvanahotels.com/hotels/limewood',
  },
  {
    title: 'Silkwood Hotel Dehradun – Elegant Living Experience',
    description:
      'Silkwood Hotel brings a sense of elegance and sophistication to the hospitality experience in Dehradun. The rooms are spacious, beautifully decorated, and equipped with modern amenities that cater to both comfort and style.',
    imageSrc: '/images/dehradun/silkwood .png',
    imageAlt: 'Silkwood Hotel Dehradun room photo',
    href: 'https://zenvanahotels.com/hotels/silkwood',
  },
  {
    title: 'Monteverde Hotel Dehradun – Stay Close to Nature',
    description:
      'Monteverde Hotel is ideal for travelers who wish to immerse themselves in nature while enjoying modern comforts. The hotel offers scenic hill-facing surroundings and a quiet atmosphere for a relaxed stay.',
    imageSrc: '/images/dehradun/MonteVerde.png',
    imageAlt: 'Monteverde Hotel Dehradun room and mountain-view stay',
    href: 'https://zenvanahotels.com/hotels/monteverde',
  },
  {
    title: 'Serenwood Hotel Dehradun – Peaceful and Eco-Friendly Stay',
    description:
      'Serenwood Hotel offers a tranquil escape from busy city movement. Surrounded by greenery, the property focuses on creating a calm and rejuvenating experience for guests who value peace and relaxation.',
    imageSrc: '/images/dehradun/IMG_4477.JPG',
    imageAlt: 'Serenwood Hotel Dehradun stay experience image',
    href: 'https://zenvanahotels.com/hotels/serenwood',
  },
  {
    title: 'Silverwood Hotel Dehradun – Perfect for Business Travelers',
    description:
      'Silverwood Hotel is tailored for business travel with practical comfort, efficient service, and modern amenities such as reliable high-speed internet and convenient city access.',
    imageSrc: '/images/dehradun/SILVER W BUILDING PIC.png',
    imageAlt: 'Silverwood Hotel Dehradun building and stay photo',
    href: 'https://zenvanahotels.com/hotels/silverwood',
  },
  {
    title: 'Cherrywood Hotel Dehradun – Comfort for Families',
    description:
      'Cherrywood Hotel is designed with families in mind, offering spacious rooms, warm hospitality, and dependable value. It is a reliable option for group and family stays in Dehradun.',
    imageSrc: '/images/dehradun/cherrwood building pic 1.png',
    imageAlt: 'Cherrywood Hotel Dehradun exterior and family-friendly stay',
    href: 'https://zenvanahotels.com/hotels/cherrywood',
  },
]

const pricingRows = [
  { type: 'Luxury Hotels', examples: 'Silkwood, Serenwood', range: 'Premium range' },
  { type: 'Mid-range Hotels', examples: 'Limewood, Monteverde, Cherrywood', range: 'Balanced value' },
  { type: 'Budget Hotels', examples: 'Rosewood, Silverwood', range: 'Budget-friendly range' },
]

const relatedPosts = [
  {
    title: 'Best Hotels Near Rajpur Road Dehradun (Local Stay Guide 2026)',
    href: '/blog/best-hotels-near-rajpur-road-dehradun',
    image: '/images/dehradun/IMG_4478.JPG',
  },
  {
    title: 'Family-Friendly Hotels in Dehradun for Comfortable Group Stays',
    href: '/blog/family-friendly-hotels-in-dehradun',
    image: '/images/dehradun/cherrwood building pic 1.png',
  },
  {
    title: 'Budget Hotels in Dehradun with Comfort, Clean Rooms & Good Value',
    href: '/blog/budget-hotels-in-dehradun-with-comfort',
    image: '/images/dehradun/Lift (1).png',
  },
]

const galleryImages = [
  {
    src: '/images/dehradun/Rosewood.png',
    alt: 'Rosewood hotel facade and architecture',
  },
  {
    src: '/images/dehradun/silkwood .png',
    alt: 'Silkwood premium room interior',
  },
]

export default function BestHotelInDehradunPage() {
  return (
    <article className="section-rule">
      <header className="brand-gradient">
        <div className="container-shell py-16 text-center sm:py-20 lg:py-24">
          <div className="mx-auto max-w-3xl">
            <div className="eyebrow text-white/70">Blog</div>
            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
              Best Hotel in Dehradun 2026: Luxury, Budget &amp; Family Stays by Zenvana Group
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-sm leading-7 text-white/85 sm:text-base">
              Zenvana Group offers a carefully curated collection of stays across Dehradun for
              luxury, budget, and family travelers.
            </p>
          </div>
        </div>
      </header>

      <div className="container-shell py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl space-y-10">
          <section id="title">
            <h2 className="display-title text-2xl sm:text-3xl">
              Best Hotel in Dehradun 2026: Luxury, Budget &amp; Family Stays by Zenvana Group
            </h2>
            <p className="body-copy mt-5 leading-8">
              Zenvana Group offers a carefully curated collection of hotels including Rosewood,
              Limewood, Silkwood, Monteverde, Serenwood, Silverwood, and Cherrywood, each crafted
              to meet the diverse needs of travelers. Whether you are looking for a luxury escape, a
              budget-friendly stay, or a comfortable family hotel, Zenvana ensures a seamless blend
              of modern amenities and personalized service.
            </p>
            <p className="body-copy mt-4 leading-8">
              As tourism and work travel continue to grow in Uttarakhand, guests are increasingly
              looking for hotels that combine reliable comfort with smart location choices. This
              guide is designed to help you compare property style, room convenience, accessibility,
              and overall value before making your final booking decision.
            </p>
          </section>

          <section id="intro">
            <h2 className="display-title text-2xl sm:text-3xl">
              Discover the Best Hotels in Dehradun with Zenvana
            </h2>
            <p className="body-copy mt-5 leading-8">
              Dehradun, the beautiful capital of Uttarakhand, is one of the most preferred travel
              destinations in North India. Located in the picturesque Doon Valley, the city offers a
              perfect blend of nature, comfort, and urban lifestyle.
            </p>
            <p className="body-copy mt-4 leading-8">
              To understand more about the city&apos;s geography and culture, visit{' '}
              <a
                href="https://en.wikipedia.org/wiki/Dehradun"
                target="_blank"
                rel="noreferrer"
                className="site-link"
              >
                this source
              </a>{' '}
              and for tourism details use{' '}
              <a
                href="https://www.euttaranchal.com/tourism/dehradun.php#google_vignette"
                target="_blank"
                rel="noreferrer"
                className="site-link"
              >
                this guide
              </a>
              .
            </p>
            <p className="body-copy mt-4 leading-8">
              Whether you are visiting for a quick weekend break, a longer family holiday, a
              destination event, or a business trip, selecting the right hotel zone can make a major
              difference in your daily travel time, dining options, and overall trip comfort.
            </p>
          </section>

          <section id="subheadings" className="space-y-8">
            <h2 className="display-title text-2xl sm:text-3xl">
              Experience Premium Hospitality with Zenvana Group
            </h2>

            <section className="space-y-4">
              <h3 className="display-title text-xl sm:text-2xl">Gallery Preview</h3>
              <p className="body-copy leading-8">
                A quick visual look at selected stays from the Zenvana collection in Dehradun.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {galleryImages.map((image) => (
                  <div key={image.src} className="quiet-card overflow-hidden rounded-xl">
                    <div className="relative aspect-square">
                      <Image src={image.src} alt={image.alt} fill className="object-cover" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {hotelBlocks.map((hotel) => (
              <section key={hotel.title} className="space-y-4 border-b border-border/60 pb-8">
                <div className="relative mx-auto aspect-square w-full max-w-[620px] overflow-hidden rounded-xl">
                  <Image src={hotel.imageSrc} alt={hotel.imageAlt} fill className="object-cover" />
                </div>
                <h3 className="display-title text-2xl">{hotel.title}</h3>
                <p className="body-copy leading-8">{hotel.description}</p>
                <p className="body-copy leading-8">
                  Guests usually compare this property based on location convenience, room comfort,
                  service responsiveness, and pricing flexibility during peak and off-peak seasons.
                  If your plan includes local sightseeing and city dining, this stay can be a
                  practical fit depending on your itinerary.
                </p>
                {hotel.href ? (
                  <p>
                    <a href={hotel.href} target="_blank" rel="noreferrer" className="site-link">
                      Discover more
                    </a>
                  </p>
                ) : null}
              </section>
            ))}
          </section>

          <section id="action-items" className="space-y-8">
            <section>
              <h2 className="display-title text-2xl sm:text-3xl">
                Understanding Hotel Pricing in Dehradun
              </h2>
              <p className="body-copy mt-5 leading-8">
                Luxury hotels like Rosewood and Monteverde offer premium experiences at higher price
                ranges, while Limewood and Cherrywood provide budget-friendly options. Mid-range
                options like Silkwood, Serenwood, and Silverwood balance cost and comfort.
              </p>
              <div className="mt-6 overflow-x-auto rounded-xl border border-border/70">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-foreground">Category</th>
                      <th className="px-4 py-3 font-semibold text-foreground">Examples</th>
                      <th className="px-4 py-3 font-semibold text-foreground">Price Positioning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingRows.map((row, i) => (
                      <tr key={row.type} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                        <td className="px-4 py-3 text-muted-foreground">{row.type}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.examples}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.range}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="display-title text-xl sm:text-2xl">
                Travel Tips for Booking the Best Hotel in Dehradun
              </h3>
              <ul className="body-copy mt-4 list-disc space-y-2 pl-6 leading-8">
                <li>Booking your hotel in advance is always recommended.</li>
                <li>Choose a hotel that aligns with your travel purpose.</li>
                <li>Reading reviews and comparing amenities helps decision-making.</li>
                <li>Checking location advantages can improve your stay experience.</li>
              </ul>
              <p className="body-copy mt-5 leading-8">
                For the best booking experience, compare cancellation policy, check-in support,
                breakfast inclusions, and transfer convenience. Travelers who review these details
                early usually avoid last-minute surprises and manage their trip budget better.
              </p>
            </section>
          </section>

          <section className="space-y-4">
            <h2 className="display-title text-2xl sm:text-3xl">How to Compare Hotels Before You Book</h2>
            <p className="body-copy leading-8">
              Start by shortlisting hotels based on your trip purpose: couples, family, business, or
              mixed travel. Then compare each option on practical parameters such as road access,
              room size, cleanliness, service quality, and guest rating consistency.
            </p>
            <p className="body-copy leading-8">
              If you are planning nearby day trips to Mussoorie, Rishikesh, or Haridwar, also
              account for departure timing and return convenience. Choosing the right base location
              often saves both time and transport costs during your stay.
            </p>
          </section>

          <section id="conclusion">
            <h2 className="display-title text-2xl sm:text-3xl">Conclusion: Find Your Perfect Stay in Dehradun</h2>
            <p className="body-copy mt-5 leading-8">
              Choosing the best hotel in Dehradun is easier with Zenvana Group. From luxury
              experiences at Rosewood to practical comfort at Cherrywood, every traveler can find a
              stay that fits their plan and budget.
            </p>
            <p className="body-copy mt-4 leading-8">
              Before finalizing, align your choice with stay purpose, guest count, and daily travel
              route. With a clear comparison approach and the right property match, your Dehradun
              visit becomes smoother, more comfortable, and better optimized for value.
            </p>
            <div className="mt-6">
              <Link href="/hotels" className="site-button-dark">
                Book Your Stay
              </Link>
            </div>
          </section>

          <section className="border-t border-border/60 pt-8">
            <h2 className="display-title text-2xl sm:text-3xl">Author</h2>
            <div className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted">
                <Image
                  src="/images/dehradun/cheerful-indian-businessman-smiling-closeup-portrait-jobs-career-campaign_53876-129417.avif"
                  alt="Author image"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="text-base font-semibold text-foreground">Zenvana Editorial Team</div>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">
                  Hospitality and travel writers focused on practical Dehradun stay guides.
                </p>
              </div>
            </div>
          </section>

          <section className="border-t border-border/60 pt-8">
            <h2 className="display-title text-2xl sm:text-3xl">Related Posts</h2>
            <div className="mt-6 space-y-4">
              {relatedPosts.map((post) => (
                <article key={post.title} className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
                  <div className="relative h-28 overflow-hidden rounded-lg sm:h-24">
                    <Image src={post.image} alt={post.title} fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">{post.title}</h3>
                    <div className="mt-3">
                      <Link href={post.href} className="site-link">
                        Read more
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </article>
  )
}

