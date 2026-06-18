import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import CloudinaryImage from '@/components/CloudinaryImage'

import { BlogComments } from '@/components/blog/BlogComments'
import { BlogCoverPicture } from '@/components/blog/BlogCoverPicture'
import { BlogShare } from '@/components/blog/BlogShare'
import { BlogStoryThumbnail } from '@/components/blog/BlogStoryThumbnail'
import { BlogTableOfContents } from '@/components/blog/BlogTableOfContents'
import { ReadingProgress } from '@/components/blog/ReadingProgress'
import { BlogNewsletter } from '@/components/blog/BlogNewsletter'
import { Container } from '@/components/Container'
import { JsonLd } from '@/components/JsonLd'
import {
  getAllPublishedBlogSlugs,
  getBlogPostHref,
  getPublishedBlogPosts,
  resolveBlogCanonicalPath,
  resolveBlogPostRoute,
} from '@/lib/blog'
import {
  decorateBlogHtmlWithToc,
  deriveBlogCategory,
  getRelatedBlogPosts,
} from '@/lib/blogContent'
import {
  resolveBlogGallery,
  resolveBlogHeroImages,
  resolveBlogOgImage,
  resolveBlogThumbnail,
} from '@/lib/blogImageResolver'
import { estimateReadingTimeMinutes, formatPublishedDate } from '@/lib/blogReadingTime'
import { articleJsonLd, breadcrumbJsonLd, type ArticleJsonLdInput } from '@/lib/structured-data'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'

type BlogPostPageProps = {
  params: {
    slug: string
  }
}

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getAllPublishedBlogSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const route = await resolveBlogPostRoute(params.slug)

  if (route.kind === 'missing') {
    return {
      title: 'Blog | Zenvana',
      description: 'Read stories and stay guides from Zenvana.',
      robots: { index: false, follow: true },
    }
  }

  if (route.kind === 'redirect') {
    return {
      title: 'Blog | Zenvana',
      alternates: { canonical: route.destination },
      robots: { index: false, follow: true },
    }
  }

  const post = route.post

  const title = post.seoTitle || post.title
  const description = post.seoDescription || post.excerpt
  const canonical = resolveBlogCanonicalPath(post)
  const ogVariant = resolveBlogOgImage(post)
  const ogImage = ogVariant?.url

  return {
    title: `${title} | Zenvana Blog`,
    description,
    keywords: post.seoKeywords.length ? post.seoKeywords : undefined,
    alternates: { canonical },
    authors: [{ name: post.authorName }],
    openGraph: {
      title: post.ogTitle || title,
      description: post.ogDescription || description,
      url: `${SITE_URL}${canonical}`,
      type: 'article',
      siteName: 'Zenvana Hotels',
      images: ogImage
        ? [
            {
              url: ogImage,
              width: ogVariant?.width ?? 1200,
              height: ogVariant?.height ?? 630,
              alt: ogVariant?.alt ?? post.title,
            },
          ]
        : undefined,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.authorName],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.twitterTitle || title,
      description: post.twitterDescription || description,
      images: post.twitterImageUrl || ogImage ? [post.twitterImageUrl || ogImage!] : undefined,
    },
    robots: {
      index: post.isIndexable,
      follow: true,
      googleBot: {
        index: post.isIndexable,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const route = await resolveBlogPostRoute(params.slug)

  if (route.kind === 'redirect') {
    permanentRedirect(route.destination)
  }

  if (route.kind === 'missing') {
    notFound()
  }

  const post = route.post

  const [allPosts] = await Promise.all([getPublishedBlogPosts()])
  const readingTimeMinutes = estimateReadingTimeMinutes(post.contentHtml)
  const publishedLabel = post.publishedAt ? formatPublishedDate(post.publishedAt) : null
  const updatedLabel = formatPublishedDate(post.updatedAt)
  const category = deriveBlogCategory(post)

  const canonicalPath = resolveBlogCanonicalPath(post)
  const url = `${SITE_URL}${canonicalPath}`
  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Journal', url: `${SITE_URL}/blog` },
    { name: post.title, url },
  ]
  const articleInput: ArticleJsonLdInput = {
    title: post.title,
    description: post.excerpt,
    url,
    section: category,
    image: post.heroImageUrl || post.ogImageUrl || undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    authorName: post.authorName,
    ...(post.seoKeywords.length > 0 ? { keywords: post.seoKeywords } : {}),
  }
  const article = articleJsonLd(articleInput)

  const hero = resolveBlogHeroImages(post, post.title)
  const galleryImages = resolveBlogGallery(post)
  const videos = post.media.filter((item) => item.type === 'VIDEO')
  const { html: decoratedHtml, toc } = decorateBlogHtmlWithToc(post.contentHtml)
  const related = getRelatedBlogPosts(post, allPosts, 3)

  return (
    <article id="blog-article" className="relative">
      <ReadingProgress />
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), article]} />

      {/* ═════════════════════════════════════════════════════════ */}
      {/*  HEADLINE BLOCK — Condé Nast Traveler-style: text first,   */}
      {/*  generous, centred, then a full-bleed hero photograph.     */}
      {/* ═════════════════════════════════════════════════════════ */}
      <header className="relative">
        <Container className="pb-8 pt-10 sm:pb-12 sm:pt-16 lg:pb-16 lg:pt-20">
          <Breadcrumbs current={post.title} />
          <div className="mx-auto mt-8 max-w-3xl text-center sm:mt-12">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
              <span className="text-gold-600 dark:text-gold-300">{category}</span>
              <span aria-hidden="true">·</span>
              <span>{readingTimeMinutes} min read</span>
              {publishedLabel ? (
                <>
                  <span aria-hidden="true">·</span>
                  <time dateTime={post.publishedAt!.toISOString()}>{publishedLabel}</time>
                </>
              ) : null}
            </div>

            <h1 className="mt-6 break-words font-serif text-[2rem] leading-[1.02] tracking-[-0.03em] text-foreground sm:mt-8 sm:text-5xl lg:text-6xl xl:text-[4.25rem]">
              {post.title}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-balance text-[15px] leading-8 text-muted-foreground sm:mt-8 sm:text-lg sm:leading-9">
              {post.excerpt}
            </p>

            <div className="mt-7 flex items-center justify-center gap-3 sm:mt-9">
              <ByLineAvatar name={post.authorName} size="sm" />
            </div>
          </div>
        </Container>

        {/* Full-bleed hero photograph — 16:9 desktop, 4:5 mobile (matches our upload spec). */}
        {hero.primary ? (
          <div className="border-y border-border/40">
            <BlogCoverPicture hero={hero} priority className="block w-full" />
          </div>
        ) : (
          <div className="brand-gradient h-2" aria-hidden="true" />
        )}
      </header>

      {/* BODY: TOC ↔ Article ↔ Share */}
      <section className="section-rule">
        <Container className="py-10 sm:py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)_80px] lg:gap-12">
            <div className="order-2 lg:order-1">
              <BlogTableOfContents items={toc} />
            </div>

            <div className="order-1 lg:order-2">
              <div
                className="blog-prose mx-auto max-w-[68ch]"
                dangerouslySetInnerHTML={{ __html: decoratedHtml }}
              />

              {/* Media gallery — only GALLERY-role media */}
              {galleryImages.length > 0 ? (
                <figure className="mx-auto mt-12 max-w-[80ch]">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {galleryImages.map((media) => (
                      <div
                        key={media.id}
                        className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted shadow-[0_8px_30px_rgba(0,31,63,0.08)]"
                      >
                        <CloudinaryImage
                          src={media.url}
                          alt={media.altText || post.title}
                          fill
                          sizes="(min-width: 640px) 45vw, 100vw"
                          className="object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </figure>
              ) : null}

              {videos.length > 0 ? (
                <div className="mx-auto mt-10 max-w-[80ch] space-y-4">
                  {videos.map((media) => (
                    <video
                      key={media.id}
                      controls
                      playsInline
                      preload="metadata"
                      className="aspect-video w-full rounded-2xl bg-black"
                      src={media.url}
                    >
                      <track kind="captions" />
                    </video>
                  ))}
                </div>
              ) : null}

              {/* Tag strip — links into the archive's fuzzy search */}
              {post.seoKeywords.length > 0 ? (
                <div className="mx-auto mt-12 max-w-[68ch]">
                  <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
                    Filed under
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {post.seoKeywords.map((tag) => {
                      const display = tag.trim()
                      if (!display) return null
                      const href = `/blog?q=${encodeURIComponent(display)}#all-stories`
                      return (
                        <li key={display}>
                          <Link
                            href={href}
                            className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[12px] font-medium text-foreground/80 transition hover:border-foreground/40 hover:bg-card hover:text-foreground"
                          >
                            #{display}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}

              {/* Inline share + meta */}
              <div className="mx-auto mt-10 flex max-w-[68ch] flex-wrap items-center justify-between gap-4 border-y border-border/60 py-5">
                <div className="text-xs text-muted-foreground">
                  Last updated{' '}
                  <time dateTime={post.updatedAt.toISOString()} className="text-foreground">
                    {updatedLabel}
                  </time>
                </div>
                <BlogShare url={url} title={post.title} excerpt={post.excerpt} />
              </div>

              {/* Author card */}
              <div className="mx-auto mt-8 flex max-w-[68ch] items-center gap-4 rounded-[1.5rem] border border-border/60 bg-card/80 p-5 backdrop-blur">
                <ByLineAvatar name={post.authorName} size="lg" />
                <div className="flex-1">
                  <div className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                    Written by
                  </div>
                  <div className="font-serif text-lg text-foreground">{post.authorName}</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Stories from the team behind Zenvana&apos;s boutique hotels on Rajpur Road, Dehradun.
                  </p>
                </div>
              </div>

              <div className="mx-auto mt-12 max-w-[68ch]">
                <BlogNewsletter
                  variant="card"
                  eyebrow="Liked this read?"
                  heading="Get the next story in your inbox"
                  copy="A monthly note with new guides, seasonal openings, and quiet places worth your time."
                />
              </div>

              <BlogComments postSlug={post.slug} postTitle={post.title} />
            </div>

            <div className="order-3 lg:order-3">
              <BlogShare url={url} title={post.title} excerpt={post.excerpt} variant="sidebar" />
            </div>
          </div>
        </Container>
      </section>

      {/* RELATED */}
      {related.length > 0 ? (
        <section className="section-rule bg-muted/30 dark:bg-card/40">
          <Container className="py-14 sm:py-16 lg:py-20">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="eyebrow">Keep Reading</div>
                <h2 className="display-title mt-2 text-2xl sm:text-3xl">More from the Journal</h2>
              </div>
              <Link href="/blog" className="site-button-light">
                Back to journal
              </Link>
            </div>

            <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-x-6 md:gap-y-12 lg:gap-x-10">
              {related.map((item, idx) => {
                const href = getBlogPostHref(item)
                const itemCategory = deriveBlogCategory(item)
                const itemDate = item.publishedAt ? formatPublishedDate(item.publishedAt) : null
                const itemMinutes = estimateReadingTimeMinutes(item.contentHtml)
                return (
                  <article key={item.id} className="group flex min-w-0 flex-col">
                    <BlogStoryThumbnail
                      post={item}
                      href={href}
                      aspect="3/2"
                      sizes="(min-width: 1024px) 30vw, (min-width: 768px) 32vw, 100vw"
                    />
                    <div className="mt-5 flex flex-col gap-3">
                      <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                        <span className="font-serif text-base leading-none tracking-normal text-foreground/40">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="truncate">{itemCategory}</span>
                      </div>
                      <Link href={href}>
                        <h3 className="break-words font-serif text-lg leading-[1.18] tracking-[-0.018em] text-foreground transition group-hover:opacity-80 sm:text-xl lg:text-2xl">
                          {item.title}
                        </h3>
                      </Link>
                      <p className="line-clamp-2 text-[13px] leading-6 text-muted-foreground sm:text-sm sm:leading-7">
                        {item.excerpt}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {itemDate ? <time dateTime={item.publishedAt!.toISOString()}>{itemDate}</time> : null}
                        {itemDate ? <span aria-hidden="true">·</span> : null}
                        <span>{itemMinutes} min</span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </Container>
        </section>
      ) : null}

      <BlogShare url={url} title={post.title} excerpt={post.excerpt} variant="dock" />
    </article>
  )
}

function Breadcrumbs({ current, onDark = false }: { current: string; onDark?: boolean }) {
  const linkClass = onDark
    ? 'text-white/75 hover:text-white'
    : 'text-muted-foreground hover:text-foreground'
  const currentClass = onDark ? 'text-white/95' : 'text-foreground/80'

  return (
    <nav
      aria-label="Breadcrumb"
      className="text-[10px] font-medium uppercase tracking-[0.32em]"
    >
      <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <li>
          <Link href="/" className={`transition ${linkClass}`}>
            Home
          </Link>
        </li>
        <li aria-hidden="true" className={onDark ? 'text-white/40' : 'text-muted-foreground/60'}>/</li>
        <li>
          <Link href="/blog" className={`transition ${linkClass}`}>
            Journal
          </Link>
        </li>
        <li aria-hidden="true" className={onDark ? 'text-white/40' : 'text-muted-foreground/60'}>/</li>
        <li className={`max-w-[60vw] truncate ${currentClass}`}>{current}</li>
      </ol>
    </nav>
  )
}

function ByLineAvatar({
  name,
  onDark = false,
  size = 'md',
}: {
  name: string
  onDark?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'Z'

  const sizeClass =
    size === 'lg'
      ? 'h-12 w-12 text-base'
      : size === 'sm'
      ? 'h-7 w-7 text-[10px]'
      : 'h-8 w-8 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.24em] ${
        onDark ? 'text-white/85' : 'text-foreground/80'
      }`}
    >
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeClass} ${
          onDark ? 'bg-white/15 text-white ring-1 ring-white/30' : 'bg-foreground/10 text-foreground ring-1 ring-border/70'
        }`}
        aria-hidden="true"
      >
        {initials}
      </span>
      <span>By {name}</span>
    </span>
  )
}
