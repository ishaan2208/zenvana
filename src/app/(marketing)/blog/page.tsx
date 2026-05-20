import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { BlogNewsletter } from '@/components/blog/BlogNewsletter'
import { BlogSearch, type BlogSearchItem } from '@/components/blog/BlogSearch'
import { Container } from '@/components/Container'
import { JsonLd } from '@/components/JsonLd'
import { getBlogPostHref, getPublishedBlogPosts } from '@/lib/blog'
import {
  deriveBlogCategory,
  groupPostsByCategory,
} from '@/lib/blogContent'
import {
  estimateReadingTimeMinutes,
  formatPublishedDate,
} from '@/lib/blogReadingTime'
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/structured-data'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'
const FALLBACK_HERO = '/images/dehradun/restaurantImage.png'

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

  // -------- EMPTY STATE --------
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

  // -------- DATA SHAPING --------
  const [featured, ...rest] = blogPosts
  const inThisIssue = rest.slice(0, 3)

  const categoryGroups = groupPostsByCategory(blogPosts)

  const postsByCategory: Record<string, BlogPost[]> = {}
  for (const post of blogPosts) {
    const cat = deriveBlogCategory(post)
    if (!postsByCategory[cat]) postsByCategory[cat] = []
    postsByCategory[cat].push(post)
  }

  const departments = categoryGroups
    .filter((g) => g.count >= 2)
    .map((g) => ({
      category: g.category,
      count: g.count,
      posts: postsByCategory[g.category] || [],
    }))

  const searchItems: BlogSearchItem[] = blogPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    href: getBlogPostHref(post),
    category: deriveBlogCategory(post),
    heroImageUrl: post.heroImageUrl,
    publishedLabel: post.publishedAt ? formatPublishedDate(post.publishedAt) : null,
    authorName: post.authorName,
    keywords: post.seoKeywords ?? [],
  }))

  const itemList = itemListJsonLd({
    name: 'Zenvana Journal · Dehradun Travel & Hotel Guides',
    url: `${SITE_URL}/blog`,
    items: blogPosts.slice(0, 12).map((post) => ({
      name: post.title,
      url: `${SITE_URL}${getBlogPostHref(post)}`,
      image: post.heroImageUrl || undefined,
      description: post.excerpt,
    })),
  })

  const featuredHref = getBlogPostHref(featured)
  const featuredImage = featured.heroImageUrl || FALLBACK_HERO
  const featuredCategory = deriveBlogCategory(featured)
  const featuredReadTime = estimateReadingTimeMinutes(featured.contentHtml)
  const featuredDate = featured.publishedAt ? formatPublishedDate(featured.publishedAt) : null

  return (
    <div className="overflow-x-clip">
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), itemList]} />

      <Masthead issue={issue} count={blogPosts.length} />

      {/* ----------- COVER STORY ----------- */}
      <section className="relative" aria-labelledby="cover-story">
        <Container className="pb-12 pt-8 sm:pb-20 sm:pt-12 lg:pb-28 lg:pt-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-14">
            <Link
              href={featuredHref}
              className="group relative block min-w-0 lg:col-span-7"
              aria-label={featured.title}
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[16/10] lg:aspect-[5/6]">
                <Image
                  src={featuredImage}
                  alt={featured.title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover transition duration-1000 ease-out group-hover:scale-[1.03]"
                  unoptimized={featuredImage.startsWith('http')}
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/5" aria-hidden="true" />
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                <span className="truncate">The Cover · {issue.label}</span>
                <span className="shrink-0">{featuredReadTime} min read</span>
              </div>
            </Link>

            <div className="min-w-0 lg:col-span-5 lg:pt-12 xl:pt-20">
              <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
                Cover Story · No. 01
              </div>
              <div className="mt-4">
                <span className="blog-chip blog-chip-accent">{featuredCategory}</span>
              </div>
              <Link href={featuredHref}>
                <h2
                  id="cover-story"
                  className="mt-5 break-words font-serif text-[1.75rem] leading-[1.08] tracking-[-0.025em] text-foreground transition hover:opacity-80 sm:text-4xl lg:text-5xl xl:text-[3.25rem]"
                >
                  {featured.title}
                </h2>
              </Link>
              <p className="mt-5 text-[15px] leading-7 text-muted-foreground sm:text-lg sm:leading-9">
                {featured.excerpt}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <span className="font-medium text-foreground/85">By {featured.authorName}</span>
                {featuredDate ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <time dateTime={featured.publishedAt!.toISOString()}>{featuredDate}</time>
                  </>
                ) : null}
              </div>
              <Link
                href={featuredHref}
                className="group/cta mt-7 inline-flex items-center gap-2 border-b border-foreground/40 pb-1 text-sm font-medium tracking-wide text-foreground transition hover:border-foreground"
              >
                Read the cover story
                <svg
                  viewBox="0 0 16 16"
                  className="h-3.5 w-3.5 transition group-hover/cta:translate-x-0.5"
                  aria-hidden="true"
                >
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
        </Container>
      </section>

      {/* ----------- ALSO IN THIS ISSUE ----------- */}
      {inThisIssue.length > 0 ? (
        <section className="border-t border-border/60" aria-labelledby="in-this-issue">
          <Container className="py-12 sm:py-20 lg:py-24">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-12">
              <div className="min-w-0">
                <div className="eyebrow">Also In This Issue</div>
                <h2
                  id="in-this-issue"
                  className="display-title mt-3 text-2xl tracking-[-0.025em] sm:text-3xl lg:text-4xl"
                >
                  Three more worth your time
                </h2>
              </div>
              <Link
                href="#archive"
                className="text-[11px] font-medium uppercase tracking-[0.22em] text-foreground/70 transition hover:text-foreground"
              >
                Full archive →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-14">
              {inThisIssue.map((post, idx) => (
                <IssueCard key={post.id} post={post} number={idx + 2} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* ----------- DEPARTMENTS ----------- */}
      {departments.length > 0 ? (
        <section
          className="border-t border-border/60 bg-muted/20 dark:bg-card/30"
          aria-labelledby="departments"
        >
          <Container className="py-12 sm:py-20 lg:py-28">
            <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-16">
              <div className="eyebrow">Departments</div>
              <h2
                id="departments"
                className="display-title mt-3 text-2xl tracking-[-0.025em] sm:text-3xl lg:text-4xl"
              >
                Browse by section
              </h2>
              <p className="body-copy mt-3 sm:mt-4">
                Each department is curated by the editors of the journal — slow guides, not listicles.
              </p>
            </div>

            <div className="space-y-14 sm:space-y-16 lg:space-y-24">
              {departments.map((dept) => (
                <DepartmentBlock key={dept.category} department={dept} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* ----------- ARCHIVE + SIDEBAR ----------- */}
      <section
        id="archive"
        className="scroll-mt-24 border-t border-border/60"
        aria-labelledby="archive-heading"
      >
        <Container className="py-12 sm:py-20 lg:py-28">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-16">
            <div className="min-w-0 lg:col-span-8">
              <header className="mb-8 sm:mb-12">
                <div className="eyebrow">The Archive</div>
                <h2
                  id="archive-heading"
                  className="display-title mt-3 text-[1.75rem] tracking-[-0.025em] sm:text-4xl lg:text-5xl"
                >
                  Every story, every issue.
                </h2>
                <p className="body-copy mt-3 max-w-2xl sm:mt-4">
                  Filter by section or search by hotel, neighbourhood, or season. Every guide is written by the
                  team that runs our properties — no AI padding, no SEO filler.
                </p>
              </header>
              <BlogSearch
                items={searchItems}
                categories={categoryGroups.map((g) => ({ category: g.category, count: g.count }))}
              />
            </div>

            <aside className="space-y-6 sm:space-y-8 lg:col-span-4">
              <div className="quiet-card p-6 sm:p-7">
                <div className="eyebrow">From the Editors</div>
                <h3 className="mt-3 font-serif text-lg leading-snug tracking-[-0.02em] text-foreground sm:mt-4 sm:text-xl">
                  Considered notes from Rajpur Road
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  The Zenvana Journal is written by the people who run our hotels, restaurants, and walking
                  routes. We publish a small number of long-form guides each month.
                </p>
                <Link
                  href="/about"
                  className="mt-4 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-foreground transition hover:opacity-70 sm:mt-5"
                >
                  Meet the team
                  <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
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

              <div className="quiet-card p-6 sm:p-7">
                <div className="eyebrow">Sections</div>
                <ul className="mt-4 divide-y divide-border/40">
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

              <div className="quiet-card p-6 sm:p-7">
                <div className="eyebrow">Most Recent</div>
                <ol className="mt-4 space-y-5 sm:mt-5">
                  {blogPosts.slice(0, 5).map((post, idx) => (
                    <li key={post.id} className="group">
                      <Link
                        href={getBlogPostHref(post)}
                        className="grid grid-cols-[auto_1fr] items-start gap-3 sm:gap-4"
                      >
                        <span className="font-serif text-lg leading-none text-muted-foreground/40 sm:text-xl">
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

      {/* ----------- CLOSING CTA ----------- */}
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
        <Container className="relative py-14 text-center sm:py-20 lg:py-28">
          <div className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/70 sm:text-[11px] sm:tracking-[0.32em]">
            Plan your stay
          </div>
          <h2
            id="visit-cta"
            className="mt-4 break-words font-serif text-[1.75rem] leading-[1.08] tracking-[-0.025em] text-white sm:mt-5 sm:text-4xl lg:text-5xl"
          >
            Come stay <span className="italic">with us</span> on Rajpur Road.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/85 sm:mt-5 sm:text-base">
            Four boutique hotels, one restaurant, and a team that knows Dehradun by heart.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-9">
            <Link href="/hotels" className="site-button-light bg-white/95 text-foreground hover:bg-white">
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
          <span className="truncate">Vol. IV · Issue No. {String(issue.issueNumber).padStart(2, '0')}</span>
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

function IssueCard({ post, number }: { post: BlogPost; number: number }) {
  const href = getBlogPostHref(post)
  const image = post.heroImageUrl || FALLBACK_HERO
  const category = deriveBlogCategory(post)
  const date = post.publishedAt ? formatPublishedDate(post.publishedAt) : null
  const readTime = estimateReadingTimeMinutes(post.contentHtml)

  return (
    <article className="group flex min-w-0 flex-col">
      <Link href={href} aria-label={post.title} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          <Image
            src={image}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
            unoptimized={image.startsWith('http')}
          />
        </div>
      </Link>
      <div className="mt-4 flex flex-col gap-3 sm:mt-5">
        <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          <span className="font-serif text-base leading-none tracking-normal text-foreground/40">
            No. {String(number).padStart(2, '0')}
          </span>
          <span className="truncate">{category}</span>
        </div>
        <Link href={href}>
          <h3 className="break-words font-serif text-lg leading-snug tracking-[-0.018em] text-foreground transition group-hover:opacity-80 sm:text-xl lg:text-2xl">
            {post.title}
          </h3>
        </Link>
        <p className="line-clamp-3 text-[13px] leading-6 text-muted-foreground sm:text-sm sm:leading-7">
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

function DepartmentBlock({
  department,
}: {
  department: { category: string; count: number; posts: BlogPost[] }
}) {
  const posts = department.posts.slice(0, 4)
  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-9">
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground sm:tracking-[0.36em]">
            Department
          </div>
          <h3 className="mt-2 break-words font-serif text-xl tracking-[-0.02em] text-foreground sm:text-3xl lg:text-4xl">
            {department.category}
          </h3>
        </div>
        <Link
          href="#archive"
          className="shrink-0 text-[10px] font-medium uppercase tracking-[0.22em] text-foreground/70 transition hover:text-foreground sm:text-[11px] sm:tracking-[0.24em]"
        >
          All {String(department.count).padStart(2, '0')} →
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4">
        {posts.map((post) => {
          const href = getBlogPostHref(post)
          const image = post.heroImageUrl || FALLBACK_HERO
          const readTime = estimateReadingTimeMinutes(post.contentHtml)
          const date = post.publishedAt ? formatPublishedDate(post.publishedAt) : null
          return (
            <article key={post.id} className="group flex min-w-0 flex-col">
              <Link href={href} className="block" aria-label={post.title}>
                <div className="relative aspect-[4/5] w-full overflow-hidden">
                  <Image
                    src={image}
                    alt={post.title}
                    fill
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                    className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                    unoptimized={image.startsWith('http')}
                  />
                </div>
                <div className="mt-3 sm:mt-4">
                  <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground sm:tracking-[0.28em]">
                    {date ? <span>{date}</span> : null}
                    {date ? <span aria-hidden="true"> · </span> : null}
                    <span>{readTime} min</span>
                  </div>
                  <h4 className="mt-2 break-words font-serif text-base leading-snug tracking-[-0.015em] text-foreground transition group-hover:opacity-80 sm:text-lg">
                    {post.title}
                  </h4>
                  <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-muted-foreground sm:text-sm">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            </article>
          )
        })}
      </div>
    </div>
  )
}