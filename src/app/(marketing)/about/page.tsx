import type { Metadata } from 'next'

import { AboutSplit } from '@/components/AboutSplit'
import { AboutStory } from '@/components/AboutStory'

export const metadata: Metadata = {
  title: 'About Us | Zenvana Hotels Dehradun',
  description:
    'Learn about Zenvana Hotels in Dehradun. Discover our story, warm hospitality, thoughtful spaces, and guest-first experience.',
  openGraph: {
    title: 'About Us | Zenvana Hotels Dehradun',
    description:
      'Explore the story behind Zenvana Hotels and discover what makes our Dehradun stay experience warm and memorable.',
    type: 'website',
    images: [{ url: '/images/about-hero.jpg', alt: 'Zenvana Hotels About Us hero banner' }],
  },
}

export default function AboutPage() {
  return (
    <div className="bg-background text-foreground">
      <AboutStory />

      <section className="section-rule">
        <div className="container-shell py-14 text-center sm:py-16 lg:py-20">
          <h2 className="display-title mx-auto max-w-4xl text-3xl font-semibold sm:text-4xl">
            Why Zenvana Provides the Best Hotels in Dehradun
          </h2>
          <div className="body-copy mx-auto mt-6 max-w-4xl space-y-5 text-left sm:text-lg">
            <p>
              We understand that modern travelers look for more than just a room. That is why our
              properties are strategically located to give you the best of both worlds:
            </p>
            <p>
              <strong>Prime Locations:</strong> Situated near Rajpur Road, our guests enjoy easy
              access to Dehradun's best cafes, shopping hubs like Pacific Mall, and corporate
              centers.
            </p>
            <p>
              <strong>The Ultimate Rooftop Experience:</strong> Most of our properties feature a
              signature rooftop cafe, offering panoramic skyline views of the valley and the
              majestic Himalayan foothills.
            </p>
            <p>
              <strong>Curated Comfort:</strong> From Monte Verde's spacious layouts for longer
              stays to the Silkwood family suites, we provide a variety of accommodations tailored
              to business travelers, couples, and families alike.
            </p>
          </div>
        </div>
      </section>

      <AboutSplit />
    </div>
  )
}
