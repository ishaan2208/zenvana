import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/Container'
import { blogPosts } from '@/lib/blogPosts'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read stories, updates, and notes from Zenvana.',
}

export default function BlogPage() {
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

  return (
    <div>
      <section className="section-rule brand-gradient">
        <Container className="py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/70">Journal</div>
            <h1 className="mt-4 font-serif text-4xl tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
              Stories from Zenvana
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
              Read local guides, stay recommendations, and hospitality insights for travelers
              exploring Dehradun.
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
                    src="/images/dehradun/restaurantImage.png"
                    alt={featured.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
                </div>
                <div className="p-6 sm:p-8">
                  <div className="eyebrow">Featured Post</div>
                  <h2 className="display-title mt-3 text-2xl sm:text-3xl">{featured.title}</h2>
                  <p className="body-copy mt-4">{featured.excerpt}</p>
                  <div className="mt-6">
                    <Link href={featured.href ?? `/blog/${featured.slug}`} className="site-button-dark">
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
                        src={thumbs[index % thumbs.length]}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-semibold tracking-tight text-foreground">{post.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
                      <div className="mt-5">
                        <Link href={post.href ?? `/blog/${post.slug}`} className="site-button-light">
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
                      <Link href={post.href ?? `/blog/${post.slug}`} className="site-link text-sm">
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

