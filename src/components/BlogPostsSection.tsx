'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'

export type BlogPostCard = {
  slug: string
  title: string
  excerpt: string
  href?: string
  category?: string
  heroImageUrl?: string | null
  publishedLabel?: string | null
  readingTimeMinutes?: number
  authorName?: string
}

type BlogPostsSectionProps = {
  posts: BlogPostCard[]
  eyebrow?: string
  heading?: string
  copy?: string
  /** Show only the first N posts and link to /blog for the rest. */
  preview?: boolean
  initialCount?: number
  step?: number
}

const FALLBACK_IMAGE = '/images/dehradun/restaurantImage.png'

/**
 * Homepage blog teaser. Mobile-first editorial cards with a single "hero"
 * lead post + grid of supporting stories. Renders nothing if posts is empty,
 * so the section can be dropped onto any page safely.
 */
export function BlogPostsSection({
  posts,
  eyebrow = 'The Zenvana Journal',
  heading = 'Slow stories from Dehradun',
  copy = 'Hotel guides, neighbourhood walks, and seasonal dining notes — published by the team that runs our properties on Rajpur Road.',
  preview = false,
  initialCount = 6,
  step = 6,
}: BlogPostsSectionProps) {
  const [visibleCount, setVisibleCount] = useState(initialCount)
  const cap = preview ? Math.min(posts.length, initialCount) : posts.length
  const visiblePosts = useMemo(() => posts.slice(0, Math.min(visibleCount, cap)), [posts, visibleCount, cap])
  const hasMore = !preview && visibleCount < posts.length

  if (posts.length === 0) return null

  const [lead, ...others] = visiblePosts

  return (
    <section className="section-rule">
      <div className="container-shell py-14 sm:py-16 lg:py-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="eyebrow">{eyebrow}</div>
            <h2 className="display-title mt-3 text-3xl tracking-[-0.025em] sm:text-4xl lg:text-5xl">
              {heading}
            </h2>
            <p className="body-copy mt-4">{copy}</p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 self-start rounded-full border border-border/70 bg-background/80 px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-card md:self-end"
          >
            All stories
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
              <path
                d="M2 8h11M9 4l4 4-4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Lead story */}
          {lead ? (
            <article className="group blog-card lg:col-span-7">
              <Link href={lead.href ?? `/blog/${lead.slug}`} className="blog-card-media lg:aspect-[16/10]" aria-label={lead.title}>
                <Image
                  src={lead.heroImageUrl || FALLBACK_IMAGE}
                  alt={lead.title}
                  fill
                  sizes="(min-width: 1024px) 56vw, 100vw"
                  className="object-cover"
                  unoptimized={(lead.heroImageUrl || '').startsWith('http')}
                />
                <div className="absolute left-3 top-3">
                  <span className="blog-chip blog-chip-accent">{lead.category ?? 'Featured'}</span>
                </div>
              </Link>
              <div className="flex flex-1 flex-col gap-3 p-6 sm:p-8">
                <div className="blog-meta">
                  {lead.authorName ? <span>{lead.authorName}</span> : null}
                  {lead.publishedLabel ? <span className="blog-meta-dot">{lead.publishedLabel}</span> : null}
                  {lead.readingTimeMinutes ? (
                    <span className="blog-meta-dot">{lead.readingTimeMinutes} min read</span>
                  ) : null}
                </div>
                <Link href={lead.href ?? `/blog/${lead.slug}`}>
                  <h3 className="font-serif text-2xl leading-snug tracking-[-0.02em] text-foreground transition group-hover:opacity-90 sm:text-3xl">
                    {lead.title}
                  </h3>
                </Link>
                <p className="line-clamp-3 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-7">
                  {lead.excerpt}
                </p>
                <div className="mt-auto pt-2">
                  <Link
                    href={lead.href ?? `/blog/${lead.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition hover:gap-3"
                  >
                    Read story
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                      <path
                        d="M2 8h11M9 4l4 4-4 4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ) : null}

          {/* Secondary grid */}
          {others.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
              {others.slice(0, 3).map((post) => (
                <article key={post.slug} className="group blog-card">
                  <Link
                    href={post.href ?? `/blog/${post.slug}`}
                    className="blog-card-media aspect-[16/10] sm:aspect-[16/9] lg:aspect-[16/8]"
                    aria-label={post.title}
                  >
                    <Image
                      src={post.heroImageUrl || FALLBACK_IMAGE}
                      alt={post.title}
                      fill
                      sizes="(min-width: 1024px) 40vw, 50vw"
                      className="object-cover"
                      loading="lazy"
                      unoptimized={(post.heroImageUrl || '').startsWith('http')}
                    />
                    {post.category ? (
                      <div className="absolute left-3 top-3">
                        <span className="blog-chip">{post.category}</span>
                      </div>
                    ) : null}
                  </Link>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <Link href={post.href ?? `/blog/${post.slug}`}>
                      <h3 className="font-serif text-lg leading-snug tracking-[-0.015em] text-foreground">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                    <div className="mt-auto blog-meta">
                      {post.publishedLabel ? <span>{post.publishedLabel}</span> : null}
                      {post.readingTimeMinutes ? (
                        <span className="blog-meta-dot">{post.readingTimeMinutes} min</span>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>

        {/* Additional rows beyond the hero strip */}
        {others.length > 3 ? (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:mt-8 lg:grid-cols-3">
            {others.slice(3).map((post) => (
              <article key={post.slug} className="group blog-card">
                <Link
                  href={post.href ?? `/blog/${post.slug}`}
                  className="blog-card-media"
                  aria-label={post.title}
                >
                  <Image
                    src={post.heroImageUrl || FALLBACK_IMAGE}
                    alt={post.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                    loading="lazy"
                    unoptimized={(post.heroImageUrl || '').startsWith('http')}
                  />
                  {post.category ? (
                    <div className="absolute left-3 top-3">
                      <span className="blog-chip">{post.category}</span>
                    </div>
                  ) : null}
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <Link href={post.href ?? `/blog/${post.slug}`}>
                    <h3 className="font-serif text-lg leading-snug tracking-[-0.015em] text-foreground">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                  <div className="mt-auto blog-meta">
                    {post.publishedLabel ? <span>{post.publishedLabel}</span> : null}
                    {post.readingTimeMinutes ? (
                      <span className="blog-meta-dot">{post.readingTimeMinutes} min</span>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {hasMore ? (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + step)}
              className="site-button-light"
            >
              Load more stories
            </button>
          </div>
        ) : null}

        {preview && posts.length > initialCount ? (
          <div className="mt-10 flex justify-center">
            <Link href="/blog" className="site-button-dark">
              Read all stories
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  )
}
