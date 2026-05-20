import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/Container'
import { JsonLd } from '@/components/JsonLd'
import { getBlogPostHref, getPublishedBlogPosts } from '@/lib/blog'
import { breadcrumbJsonLd } from '@/lib/structured-data'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Journal · Dehradun Travel & Hotel Guides',
  description:
    'Slow-paced guides to staying, eating, and exploring Dehradun, Rajpur Road, and the Mussoorie foothills. Written by the Zenvana team.',
  keywords: [
    'Dehradun travel guide',
    'best hotel Dehradun',
    'Rajpur Road guide',
    'family hotels Dehradun',
    'budget hotels Dehradun',
  ],
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Journal · Dehradun Travel & Hotel Guides',
    description: 'Slow-paced guides to staying and exploring Dehradun.',
    url: `${SITE_URL}/blog`,
    type: 'website',
  },
}

export default async function BlogPage() {
  const blogPosts = await getPublishedBlogPosts()
  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Journal', url: `${SITE_URL}/blog` },
  ]
  const featured = blogPosts[0]
  const rest = blogPosts.slice(1)
  const categories = ['Hotel Guides', 'Budget Stays', 'Luxury Stays', 'Family Travel', 'Travel Tips']
  const tags = [
    'best hotel in dehradun',
    'rajpur road stay',
    'budget hotels',
    'family stay',
    'luxury hotels',
    'dehradun travel',
  ]
  const thumbs = [
    '/images/dehradun/Rosewood.png',
    '/images/dehradun/silkwood .png',
    '/images/dehradun/MonteVerde.png',
    '/images/dehradun/cherrwood building pic 1.png',
    '/images/dehradun/SILVER W BUILDING PIC.png',
  ]

  if (!featured) {
    return (
      <div>
        <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
        <section className="section-rule brand-gradient">
          <Container className="py-16 sm:py-20 lg:py-24">
            <h1 className="font-serif text-4xl text-white">Stories from Zenvana</h1>
            <p className="mt-4 text-white/85">Blog posts will appear here once published.</p>
          </Container>
        </section>
      </div>
    )
  }

  const featuredImage = featured.heroImageUrl || '/images/dehradun/restaurantImage.png'

  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <section className="section-rule brand-gradient">
        <Container className="py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/70">Journal</div>
            <h1 className="mt-4 font-serif text-4xl tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
              Stories from Zenvana
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
              Read local guides, stay recommendations, and hospitality insights for travelers exploring Dehradun.
            </p>
          </div>
        </Container>
      </section>

      <section className="section-rule">
        <Container className="py-12 sm:py-14 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-12">
            <main className="space-y-8 lg:col-span-8">
              <article className="quiet-card overflow-hidden">
                <div className="relative aspect-[16/9]">
                  <Image
                    src={featuredImage}
                    alt={featured.title}
                    fill
                    className="object-cover"
                    priority
                    unoptimized={featuredImage.startsWith('http')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
                </div>
                <div className="p-6 sm:p-8">
                  <div className="eyebrow">Featured Post</div>
                  <h2 className="display-title mt-3 text-2xl sm:text-3xl">{featured.title}</h2>
                  <p className="body-copy mt-4">{featured.excerpt}</p>
                  <div className="mt-6">
                    <Link href={getBlogPostHref(featured)} className="site-button-dark">
                      Read More
                    </Link>
                  </div>
                </div>
              </article>

              <div className="grid gap-6 md:grid-cols-2">
                {rest.map((post, index) => (
                  <article key={post.slug} className="quiet-card overflow-hidden">
                    <div className="relative aspect-[16/10]">
                      <Image
                        src={post.heroImageUrl || thumbs[index % thumbs.length]}
                        alt={post.title}
                        fill
                        className="object-cover"
                        unoptimized={Boolean(post.heroImageUrl?.startsWith('http'))}
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-semibold tracking-tight text-foreground">{post.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
                      <div className="mt-5">
                        <Link href={getBlogPostHref(post)} className="site-button-light">
                          Read More
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </main>

            <aside className="space-y-6 lg:col-span-4">
              <div className="quiet-card p-5">
                <div className="eyebrow">Social Networks</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">Facebook</span>
                  <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">Instagram</span>
                  <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">LinkedIn</span>
                  <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">YouTube</span>
                </div>
              </div>

              <div className="quiet-card p-5">
                <div className="eyebrow">Categories</div>
                <ul className="mt-3 space-y-2">
                  {categories.map((category) => (
                    <li key={category} className="text-sm text-muted-foreground">
                      {category}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="quiet-card p-5">
                <div className="eyebrow">Recent Posts</div>
                <ul className="mt-3 space-y-3">
                  {blogPosts.slice(0, 6).map((post) => (
                    <li key={post.slug}>
                      <Link href={getBlogPostHref(post)} className="site-link text-sm">
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="quiet-card p-5">
                <div className="eyebrow">Tags Cloud</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </div>
  )
}
