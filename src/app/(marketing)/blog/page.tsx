import type { Metadata } from 'next'
import Link from 'next/link'

import { BlogCoverPicture } from '@/components/blog/BlogCoverPicture'
import { BlogNewsletter } from '@/components/blog/BlogNewsletter'
import { BlogSearch, type BlogSearchItem } from '@/components/blog/BlogSearch'
import { BlogStoryThumbnail } from '@/components/blog/BlogStoryThumbnail'
import { Container } from '@/components/Container'
import { JsonLd } from '@/components/JsonLd'
import { getBlogPostHref, getPublishedBlogPosts } from '@/lib/blog'
import {
  deriveBlogCategory,
  groupPostsByCategory,
} from '@/lib/blogContent'
import {
  resolveBlogHeroImages,
  resolveBlogThumbnail,
} from '@/lib/blogImageResolver'
import {
  estimateReadingTimeMinutes,
  formatPublishedDate,
} from '@/lib/blogReadingTime'
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/structured-data'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'The Zenvana Journal · Dehradun Hotel & Travel Guides',
  description:
    'An editorial journal from Rajpur Road — hotel guides, neighbourhood walks, dining notes, and Mussoorie weekends. Written by the team behind Zenvana Hotels in Dehradun.',
  keywords: [
    'Dehradun travel guide',
    'best hotels in Dehradun',
    'best hotel on Rajpur Road',
    'Rajpur Road hotels',
    'family hotels Dehradun',
    'boutique hotels Dehradun',
    'luxury hotels Dehradun',
    'where to stay in Dehradun',
    'Mussoorie weekend trip',
    'Mussoorie hotels nearby',
    'restaurants in Dehradun',
    'best cafes Dehradun',
    'things to do in Dehradun',
    'Dehradun travel blog',
    'Zenvana Hotels journal',
  ],
  alternates: { canonical: '/blog' },
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  openGraph: {
    title: 'The Zenvana Journal · Dehradun Hotel & Travel Guides',
    description:
      'Considered guides to staying and exploring Dehradun — written by the team behind Zenvana Hotels on Rajpur Road.',
    url: `${SITE_URL}/blog`,
    type: 'website',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Zenvana Journal · Dehradun Hotel & Travel Guides',
    description: 'Hotel guides, neighbourhood walks, and seasonal stories from Dehradun.',
  },
}

function deriveIssue(date: Date) {
  const baseYear = 2025
  const monthsSinceBase = (date.getFullYear() - baseYear) * 12 + date.getMonth()
  const issueNumber = Math.max(1, monthsSinceBase + 1)
  const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return { issueNumber, label }
}

type BlogPost = Awaited<ReturnType<typeof getPublishedBlogPosts>>[number]

export default async function BlogPage() {
  const blogPosts = await getPublishedBlogPosts()
  const issue = deriveIssue(new Date())

  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Journal', url: `${SITE_URL}/blog` },
  ]

  if (blogPosts.length === 0) {
    return (
      <div className="overflow-x-clip">
        <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
        <Masthead issue={issue} count={0} />
        <Container className="py-16 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-xl text-center">
            <div className="eyebrow">Coming Soon</div>
            <h2 className="display-title mt-4 text-2xl tracking-[-0.025em] sm:text-3xl lg:text-4xl">
              The Journal is being written.
            </h2>
            <p className="body-copy mt-5">
              We&apos;re curating our first stories about staying on Rajpur Road, the Mussoorie foothills, and
              the everyday rituals that make Dehradun feel like home. Subscribe to be the first to read them.
            </p>
            <div className="mt-10">
              <BlogNewsletter />
            </div>
          </div>
        </Container>
      </div>
    )
  }

  // ---- DATA SHAPING ---------------------------------------------------
  const [featured, ...rest] = blogPosts
  const featuredHero = resolveBlogHeroImages(featured, featured.title)
  const featuredHref = getBlogPostHref(featured)
  const featuredCategory = deriveBlogCategory(featured)
  const featuredReadTime = estimateReadingTimeMinutes(featured.contentHtml)
  const featuredDate = featured.publishedAt ? formatPublishedDate(featured.publishedAt) : null

  // Top-stories trio (positions 2–4).
  const topStories = rest.slice(0, 3)
  // The long read break — pick post #5 if available, else fall back to last top-story.
  const longRead = rest.length >= 4 ? rest[3] : null
  // Everything after the long read flows into the archive grid.
  const archivePosts = rest.slice(longRead ? 4 : 3)

  const categoryGroups = groupPostsByCategory(blogPosts)
  const postsByCategory: Record<string, BlogPost[]> = {}
  for (const post of blogPosts) {
    const cat = deriveBlogCategory(post)
    if (!postsByCategory[cat]) postsByCategory[cat] = []
    postsByCategory[cat].push(post)
  }
  const departments = categoryGroups
    .filter((g) => g.count >= 2)
    .slice(0, 4)
    .map((g) => ({
      category: g.category,
      count: g.count,
      posts: postsByCategory[g.category] || [],
    }))

  const searchItems: BlogSearchItem[] = blogPosts.map((post) => {
    const thumb = resolveBlogThumbnail(post, post.title)
    return {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      href: getBlogPostHref(post),
      category: deriveBlogCategory(post),
      heroImageUrl: thumb?.url ?? null,
      publishedLabel: post.publishedAt ? formatPublishedDate(post.publishedAt) : null,
      authorName: post.authorName,
      keywords: post.seoKeywords ?? [],
    }
  })

  const itemList = itemListJsonLd({
    name: 'Zenvana Journal · Dehradun Travel & Hotel Guides',
    url: `${SITE_URL}/blog`,
    items: blogPosts.slice(0, 12).map((post) => ({
      name: post.title,
      url: `${SITE_URL}${getBlogPostHref(post)}`,
      image: resolveBlogThumbnail(post, post.title)?.url || undefined,
      description: post.excerpt,
    })),
  })

  return (
    <div className="overflow-x-clip">
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), itemList]} />

      <Masthead issue={issue} count={blogPosts.length} />

      {/* ═════════════════════════════════════════════════════════ */}
      {/*  THE COVER  — full-bleed hero, image-aspect-aware           */}
      {/* ═════════════════════════════════════════════════════════ */}
      <section className="relative" aria-labelledby="cover-story">
        <Container className="pt-6 sm:pt-10 lg:pt-12">
          <div className="mb-4 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground sm:mb-6">
            <span>On the Cover · Issue No. {String(issue.issueNumber).padStart(2, '0')}</span>
            <span className="hidden sm:inline">{issue.label}</span>
          </div>
        </Container>

        {/* Full-bleed image break — uses HERO_DESKTOP @ 16:9 on ≥md, HERO_MOBILE @ 4:5 on mobile.
            The image fills the viewport edge-to-edge, matching CN Traveler hero treatment. */}
        <Link href={featuredHref} aria-label={featured.title} className="block">
          <BlogCoverPicture hero={featuredHero} priority className="w-full" />
        </Link>

        <Container className="pb-14 pt-8 sm:pb-20 sm:pt-12 lg:pb-28 lg:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
              <span className="text-gold-600 dark:text-gold-300">{featuredCategory}</span>
              <span aria-hidden="true">·</span>
              <span>{featuredReadTime} min read</span>
              {featuredDate ? (
                <>
                  <span aria-hidden="true">·</span>
                  <time dateTime={featured.publishedAt!.toISOString()}>{featuredDate}</time>
                </>
              ) : null}
            </div>

            <Link href={featuredHref} className="block">
              <h2
                id="cover-story"
                className="mt-5 break-words font-serif text-[2rem] leading-[1.02] tracking-[-0.03em] text-foreground transition hover:opacity-80 sm:mt-6 sm:text-5xl lg:text-6xl xl:text-[4.25rem]"
              >
                {featured.title}
              </h2>
            </Link>

            <p className="mx-auto mt-6 max-w-2xl text-balance text-[15px] leading-8 text-muted-foreground sm:mt-7 sm:text-lg sm:leading-9">
              {featured.excerpt}
            </p>

            <div className="mt-7 flex flex-col items-center gap-3 sm:mt-9">
              <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
                By {featured.authorName}
              </span>
              <Link
                href={featuredHref}
                className="group/cta inline-flex items-center gap-2 border-b border-foreground/40 pb-1 text-sm font-medium tracking-wide text-foreground transition hover:border-foreground"
              >
                Read the cover story
                <Arrow />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ═════════════════════════════════════════════════════════ */}
      {/*  ALSO IN THIS ISSUE — 3-up at 3:2 (matches THUMBNAIL spec) */}
      {/* ═════════════════════════════════════════════════════════ */}
      {topStories.length > 0 ? (
        <section className="border-t border-border/60" aria-labelledby="in-this-issue">
          <Container className="py-14 sm:py-20 lg:py-24">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-3 sm:mb-14">
              <div className="min-w-0">
                <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
                  Also in this issue
                </div>
                <h2
                  id="in-this-issue"
                  className="mt-3 font-serif text-3xl tracking-[-0.025em] text-foreground sm:text-4xl lg:text-5xl"
                >
                  Three more <span className="italic">worth your time</span>
                </h2>
              </div>
              <Link
                href="#archive"
                className="text-[11px] font-medium uppercase tracking-[0.22em] text-foreground/70 transition hover:text-foreground"
              >
                Full archive →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-x-6 md:gap-y-12 lg:gap-x-10">
              {topStories.map((post, idx) => (
                <StoryCard key={post.id} post={post} number={idx + 2} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* ═════════════════════════════════════════════════════════ */}
      {/*  THE LONG READ — photo essay break, full-bleed 16:9        */}
      {/* ═════════════════════════════════════════════════════════ */}
      {longRead ? <LongReadBreak post={longRead} /> : null}

      {/* ═════════════════════════════════════════════════════════ */}
      {/*  DEPARTMENTS — editorial table of contents                 */}
      {/* ═════════════════════════════════════════════════════════ */}
      {departments.length > 0 ? (
        <section className="border-t border-border/60 bg-muted/20 dark:bg-card/30" aria-labelledby="departments">
          <Container className="py-14 sm:py-20 lg:py-28">
            <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
              <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
                Departments
              </div>
              <h2
                id="departments"
                className="mt-3 font-serif text-3xl tracking-[-0.025em] text-foreground sm:text-4xl lg:text-5xl"
              >
                Browse <span className="italic">by section</span>
              </h2>
              <p className="body-copy mx-auto mt-4 max-w-xl">
                Slow guides, not listicles — curated by the editors of the Journal.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-2 lg:gap-x-16 lg:gap-y-20">
              {departments.map((dept) => (
                <DepartmentBlock key={dept.category} department={dept} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* ═════════════════════════════════════════════════════════ */}
      {/*  THE ARCHIVE — search + sidebar                            */}
      {/* ═════════════════════════════════════════════════════════ */}
      <section
        id="archive"
        className="scroll-mt-24 border-t border-border/60"
        aria-labelledby="archive-heading"
      >
        <Container className="py-14 sm:py-20 lg:py-28">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-x-16">
            <div className="min-w-0 lg:col-span-8">
              <header className="mb-10 sm:mb-12">
                <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
                  The Archive
                </div>
                <h2
                  id="archive-heading"
                  className="mt-3 break-words font-serif text-[2rem] leading-[1.05] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-6xl"
                >
                  Every story, <span className="italic">every issue</span>.
                </h2>
                <p className="body-copy mt-5 max-w-2xl">
                  Search by hotel, neighbourhood, or season. Every guide is written by the team that runs our
                  properties — no AI padding, no SEO filler.
                </p>
              </header>
              <BlogSearch
                items={searchItems}
                categories={categoryGroups.map((g) => ({ category: g.category, count: g.count }))}
              />
              {archivePosts.length > 0 ? (
                <p className="mt-8 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Showing {searchItems.length} stories — filter above to narrow down.
                </p>
              ) : null}
            </div>

            <aside className="space-y-8 lg:col-span-4">
              <div className="rounded-[1.5rem] border border-border/60 bg-card/70 p-7 backdrop-blur">
                <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
                  From the Editors
                </div>
                <h3 className="mt-4 font-serif text-xl leading-snug tracking-[-0.02em] text-foreground">
                  Considered notes from <span className="italic">Rajpur Road</span>
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  The Zenvana Journal is written by the people who run our hotels, restaurants, and walking
                  routes. We publish a small number of long-form guides each month.
                </p>
                <Link
                  href="/about"
                  className="mt-5 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-foreground transition hover:opacity-70"
                >
                  Meet the team
                  <Arrow />
                </Link>
              </div>

              <div className="rounded-[1.5rem] border border-border/60 bg-card/70 p-7 backdrop-blur">
                <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
                  Sections
                </div>
                <ul className="mt-5 divide-y divide-border/40">
                  {categoryGroups.map((group) => (
                    <li
                      key={group.category}
                      className="flex items-baseline justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <span className="min-w-0 truncate text-sm font-medium text-foreground/85">
                        {group.category}
                      </span>
                      <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                        {String(group.count).padStart(2, '0')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[1.5rem] border border-border/60 bg-card/70 p-7 backdrop-blur">
                <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
                  Most Recent
                </div>
                <ol className="mt-5 space-y-5">
                  {blogPosts.slice(0, 5).map((post, idx) => (
                    <li key={post.id} className="group">
                      <Link
                        href={getBlogPostHref(post)}
                        className="grid grid-cols-[auto_1fr] items-start gap-4"
                      >
                        <span className="font-serif text-xl leading-none text-muted-foreground/40">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0 border-b border-border/40 pb-4 group-last:border-0 group-last:pb-0">
                          <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                            {post.publishedAt ? formatPublishedDate(post.publishedAt) : '—'}
                          </div>
                          <div className="mt-1.5 break-words text-sm font-medium leading-snug text-foreground transition group-hover:text-foreground/70">
                            {post.title}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>

              <BlogNewsletter
                variant="card"
                heading="Subscribe to the Journal"
                copy="One email a month. New stories, hotel openings, seasonal restaurant changes."
              />
            </aside>
          </div>
        </Container>
      </section>

      {/* ═════════════════════════════════════════════════════════ */}
      {/*  CLOSING — plan-your-stay band                             */}
      {/* ═════════════════════════════════════════════════════════ */}
      <section
        className="brand-gradient relative overflow-hidden border-t border-border/40"
        aria-labelledby="visit-cta"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.12) 0%, transparent 50%)',
          }}
          aria-hidden="true"
        />
        <Container className="relative py-16 text-center sm:py-20 lg:py-28">
          <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/70">
            Plan your stay
          </div>
          <h2
            id="visit-cta"
            className="mt-5 break-words font-serif text-3xl leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl"
          >
            Come stay <span className="italic">with us</span> on Rajpur Road.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/85 sm:text-base">
            Four boutique hotels, one restaurant, and a team that knows Dehradun by heart.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/hotels" className="site-button-light bg-white/95 text-foreground hover:bg-white dark:text-black">
              Explore our hotels
            </Link>
            <Link
              href="/contact"
              className="site-button-light border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              Plan with our team
            </Link>
          </div>
        </Container>
      </section>
    </div>
  )
}

// ============================================================
// SUBCOMPONENTS
// ============================================================

function Masthead({
  issue,
  count,
}: {
  issue: { issueNumber: number; label: string }
  count: number
}) {
  return (
    <section className="border-b border-border/60 bg-background">
      <Container className="py-5 sm:py-8 lg:py-10">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground sm:text-[10px] sm:tracking-[0.32em]">
          <span className="truncate">
            Vol. IV · Issue No. {String(issue.issueNumber).padStart(2, '0')}
          </span>
          <span className="hidden sm:inline">{issue.label}</span>
          <span className="truncate">
            {count} {count === 1 ? 'Story' : 'Stories'} · Updated Weekly
          </span>
        </div>

        <div className="mt-7 text-center sm:mt-10 lg:mt-12">
          <h1 className="break-words font-serif text-4xl leading-[0.98] tracking-[-0.035em] text-foreground sm:text-6xl sm:tracking-[-0.045em] lg:text-7xl xl:text-[5.5rem]">
            The <span className="italic">Zenvana</span> Journal
          </h1>
          <p className="mt-3 text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:mt-5 sm:text-xs sm:tracking-[0.36em]">
            Dispatches from Rajpur Road · Dehradun
          </p>
        </div>

        <div className="mt-7 flex items-center gap-3 sm:mt-12 sm:gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="hidden whitespace-nowrap text-[10px] uppercase tracking-[0.32em] text-muted-foreground sm:inline">
            Hotels · Travel · Dining · The City
          </span>
          <span className="whitespace-nowrap text-[9px] uppercase tracking-[0.22em] text-muted-foreground sm:hidden">
            Hotels · Travel · Dining
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      </Container>
    </section>
  )
}

/**
 * Top-stories card. Uses THUMBNAIL spec (3:2) so cards stay editorial and
 * consistent even when uploaders submit mixed-aspect photos.
 */
function StoryCard({ post, number }: { post: BlogPost; number: number }) {
  const href = getBlogPostHref(post)
  const category = deriveBlogCategory(post)
  const date = post.publishedAt ? formatPublishedDate(post.publishedAt) : null
  const readTime = estimateReadingTimeMinutes(post.contentHtml)

  return (
    <article className="group flex min-w-0 flex-col">
      <BlogStoryThumbnail
        post={post}
        href={href}
        aspect="3/2"
        sizes="(min-width: 1024px) 30vw, (min-width: 768px) 32vw, 100vw"
      />
      <div className="mt-5 flex flex-col gap-3 sm:mt-6">
        <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          <span className="font-serif text-base leading-none tracking-normal text-foreground/40">
            No. {String(number).padStart(2, '0')}
          </span>
          <span className="truncate">{category}</span>
        </div>
        <Link href={href}>
          <h3 className="break-words font-serif text-xl leading-[1.15] tracking-[-0.018em] text-foreground transition group-hover:opacity-80 sm:text-2xl lg:text-[1.75rem]">
            {post.title}
          </h3>
        </Link>
        <p className="line-clamp-3 text-[14px] leading-7 text-muted-foreground sm:text-[15px]">
          {post.excerpt}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="truncate">By {post.authorName}</span>
          {date ? <span aria-hidden="true">·</span> : null}
          {date ? <time dateTime={post.publishedAt!.toISOString()}>{date}</time> : null}
          <span aria-hidden="true">·</span>
          <span>{readTime} min</span>
        </div>
      </div>
    </article>
  )
}

/**
 * Full-bleed photo-essay break. Uses HERO_DESKTOP (16:9) for the wide cinematic
 * impression CN Traveler is known for. On mobile we use the same 16:9 desktop
 * crop (rather than the portrait mobile variant) because portrait orientation
 * doesn't read as "photo essay" — it reads as "another hero".
 */
function LongReadBreak({ post }: { post: BlogPost }) {
  const href = getBlogPostHref(post)
  const category = deriveBlogCategory(post)
  const readTime = estimateReadingTimeMinutes(post.contentHtml)
  const hero = resolveBlogHeroImages(post, post.title)
  const wideUrl = hero.desktop?.url ?? hero.primary?.url
  const wideAlt = hero.desktop?.alt ?? hero.primary?.alt ?? post.title

  if (!wideUrl) return null

  return (
    <section className="border-t border-border/60" aria-labelledby="long-read">
      <Link href={href} aria-label={post.title} className="group block">
        {/* Full-bleed 16:9 — no Container so the image spans edge-to-edge */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={wideUrl}
            alt={wideAlt}
            className="absolute inset-0 h-full w-full object-cover transition duration-1000 ease-out group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
        </div>
      </Link>

      <Container className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
            <span>The Long Read</span>
            <span aria-hidden="true">·</span>
            <span>{category}</span>
            <span aria-hidden="true">·</span>
            <span>{readTime} min</span>
          </div>
          <Link href={href}>
            <h2
              id="long-read"
              className="mt-5 break-words font-serif text-3xl leading-[1.08] tracking-[-0.028em] text-foreground transition hover:opacity-80 sm:text-5xl lg:text-[3.5rem]"
            >
              {post.title}
            </h2>
          </Link>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-8 text-muted-foreground sm:text-lg sm:leading-9">
            {post.excerpt}
          </p>
          <Link
            href={href}
            className="group/cta mt-7 inline-flex items-center gap-2 border-b border-foreground/40 pb-1 text-sm font-medium tracking-wide text-foreground transition hover:border-foreground"
          >
            Read the essay
            <Arrow />
          </Link>
        </div>
      </Container>
    </section>
  )
}

/**
 * Department block — magazine ToC style. One large lead story on top with a
 * 3:2 thumbnail + a textual list of secondary stories beneath. Reads more like
 * a Vogue/CN Traveler section opener than a card grid.
 */
function DepartmentBlock({
  department,
}: {
  department: { category: string; count: number; posts: BlogPost[] }
}) {
  const [lead, ...rest] = department.posts
  if (!lead) return null
  const restCapped = rest.slice(0, 3)
  const leadHref = getBlogPostHref(lead)
  const leadReadTime = estimateReadingTimeMinutes(lead.contentHtml)
  const leadDate = lead.publishedAt ? formatPublishedDate(lead.publishedAt) : null

  return (
    <div>
      <header className="mb-6 flex items-baseline justify-between gap-3 border-b border-border/60 pb-4">
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
            Department
          </div>
          <h3 className="mt-1.5 break-words font-serif text-xl tracking-[-0.02em] text-foreground sm:text-2xl">
            {department.category}
          </h3>
        </div>
        <Link
          href="#archive"
          className="shrink-0 text-[10px] font-medium uppercase tracking-[0.22em] text-foreground/70 transition hover:text-foreground"
        >
          {String(department.count).padStart(2, '0')} stories →
        </Link>
      </header>

      <BlogStoryThumbnail
        post={lead}
        href={leadHref}
        aspect="3/2"
        sizes="(min-width: 1024px) 44vw, (min-width: 768px) 50vw, 100vw"
      />
      <div className="mt-4 sm:mt-5">
        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          {leadDate ? <span>{leadDate}</span> : null}
          {leadDate ? <span aria-hidden="true"> · </span> : null}
          <span>{leadReadTime} min</span>
        </div>
        <Link href={leadHref}>
          <h4 className="mt-2 break-words font-serif text-lg leading-snug tracking-[-0.018em] text-foreground transition hover:opacity-80 sm:text-xl">
            {lead.title}
          </h4>
        </Link>
        <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-muted-foreground sm:text-sm sm:leading-7">
          {lead.excerpt}
        </p>
      </div>

      {restCapped.length > 0 ? (
        <ul className="mt-6 divide-y divide-border/40 border-t border-border/40">
          {restCapped.map((post) => {
            const href = getBlogPostHref(post)
            const date = post.publishedAt ? formatPublishedDate(post.publishedAt) : null
            const minutes = estimateReadingTimeMinutes(post.contentHtml)
            return (
              <li key={post.id} className="group py-4">
                <Link href={href} className="grid grid-cols-[64px_1fr] items-start gap-4 sm:grid-cols-[88px_1fr]">
                  <div className="overflow-hidden">
                    <BlogStoryThumbnail
                      post={post}
                      href={href}
                      aspect="1/1"
                      sizes="88px"
                      className="!aspect-square"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                      {date ? <span>{date}</span> : null}
                      {date ? <span aria-hidden="true"> · </span> : null}
                      <span>{minutes} min</span>
                    </div>
                    <div className="mt-1.5 break-words text-sm font-medium leading-snug text-foreground transition group-hover:text-foreground/70 sm:text-[15px]">
                      {post.title}
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition group-hover/cta:translate-x-0.5" aria-hidden="true">
      <path
        d="M2 8h11M9 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
