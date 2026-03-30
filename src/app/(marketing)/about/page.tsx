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
          <p className="body-copy mx-auto max-w-4xl sm:text-lg">
            Placeholder paragraph: Describe the feeling of staying at your hotel, your service
            style, and what guests can expect throughout their visit. Keep this section calm,
            premium, and easy to read.
          </p>
        </div>
      </section>

      <AboutSplit />
    </div>
  )
}
