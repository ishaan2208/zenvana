import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { BlogHeroPicture } from '@/components/blog/BlogHeroPicture'
import { BlogShare } from '@/components/blog/BlogShare'
import { BlogTableOfContents } from '@/components/blog/BlogTableOfContents'
import { ReadingProgress } from '@/components/blog/ReadingProgress'
import { BlogNewsletter } from '@/components/blog/BlogNewsletter'
import { Container } from '@/components/Container'
import { JsonLd } from '@/components/JsonLd'
import {
  getAllPublishedBlogSlugs,
  getBlogPostHref,
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
  resolveBlogCanonicalPath,
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
import { getBlogSlugRedirectTarget } from '@/lib/blogRedirects'
import { estimateReadingTimeMinutes, formatPublishedDate } from '@/lib/blogReadingTime'
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/structured-data'

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
  const redirectSlug = await getBlogSlugRedirectTarget(params.slug)
  const resolvedSlug = redirectSlug ?? params.slug
  const post = await getPublishedBlogPostBySlug(resolvedSlug)

  if (redirectSlug && !post) {
    return { title: 'Blog | Zenvana', robots: { index: false, follow: false } }
  }

  if (!post) {
    return {
      title: 'Blog | Zenvana',
      description: 'Read stories and stay guides from Zenvana.',
      robots: { index: false, follow: true },
    }
  }

  if (redirectSlug) {
    return {
      title: `${post.seoTitle || post.title} | Zenvana Blog`,
      alternates: { canonical: `/blog/${resolvedSlug}` },
      robots: { index: false, follow: true },
    }
  }

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
  const redirectSlug = await getBlogSlugRedirectTarget(params.slug)
  if (redirectSlug) {
    permanentRedirect(`/blog/${redirectSlug}`)
  }

  const post = await getPublishedBlogPostBySlug(params.slug)
  if (!post) notFound()

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
  const article = articleJsonLd({
    title: post.title,
    description: post.excerpt,
    url,
    section: category,
    image: post.heroImageUrl || post.ogImageUrl || undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    authorName: post.authorName,
  })

  const hero = resolveBlogHeroImages(post, post.title)
  const galleryImages = resolveBlogGallery(post)
  const videos = post.media.filter((item) => item.type === 'VIDEO')
  const { html: decoratedHtml, toc } = decorateBlogHtmlWithToc(post.contentHtml)
  const related = getRelatedBlogPosts(post, allPosts, 3)

  return (
    <article id="blog-article" className="relative">
      <ReadingProgress />
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), article]} />

      {/* HERO */}
      <header className="relative isolate overflow-hidden">
        {hero.primary ? (
          <>
            <div className="absolute inset-0 -z-10">
              <BlogHeroPicture hero={hero} className="absolute inset-0 h-full w-full" priority />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/85" />
            </div>
            <Container className="relative pb-12 pt-24 sm:pb-16 sm:pt-28 lg:pb-24 lg:pt-36">
              <Breadcrumbs current={post.title} onDark />
              <div className="mt-6 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="blog-chip border-white/30 bg-white/15 text-white">{category}</span>
                </div>
                <h1 className="mt-4 font-serif text-3xl leading-[1.05] tracking-[-0.025em] text-white sm:text-4xl lg:text-[3.25rem]">
                  {post.title}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/90 sm:text-lg sm:leading-8">
                  {post.excerpt}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/85">
                  <ByLineAvatar name={post.authorName} onDark />
                  {publishedLabel ? (
                    <>
                      <span aria-hidden="true" className="opacity-50">·</span>
                      <time dateTime={post.publishedAt!.toISOString()}>{publishedLabel}</time>
                    </>
                  ) : null}
                  <span aria-hidden="true" className="opacity-50">·</span>
                  <span>{readingTimeMinutes} min read</span>
                </div>
              </div>
            </Container>
          </>
        ) : (
          <div className="brand-gradient">
            <Container className="pb-14 pt-20 sm:pb-16 sm:pt-24 lg:pb-20 lg:pt-32">
              <Breadcrumbs current={post.title} onDark />
              <div className="mt-6 max-w-3xl">
                <span className="blog-chip border-white/30 bg-white/15 text-white">{category}</span>
                <h1 className="mt-4 font-serif text-3xl leading-[1.05] tracking-[-0.025em] text-white sm:text-4xl lg:text-[3.25rem]">
                  {post.title}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/90 sm:text-lg">{post.excerpt}</p>
                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/85">
                  <ByLineAvatar name={post.authorName} onDark />
                  {publishedLabel ? (
                    <>
                      <span aria-hidden="true" className="opacity-50">·</span>
                      <time dateTime={post.publishedAt!.toISOString()}>{publishedLabel}</time>
                    </>
                  ) : null}
                  <span aria-hidden="true" className="opacity-50">·</span>
                  <span>{readingTimeMinutes} min read</span>
                </div>
              </div>
            </Container>
          </div>
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
                        <Image
                          src={media.url}
                          alt={media.altText || post.title}
                          fill
                          sizes="(min-width: 640px) 45vw, 100vw"
                          className="object-cover"
                          loading="lazy"
                          unoptimized={media.url.startsWith('http')}
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

              {/* Inline share + meta */}
              <div className="mx-auto mt-12 flex max-w-[68ch] flex-wrap items-center justify-between gap-4 border-y border-border/60 py-5">
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

            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {related.map((item) => {
                const href = getBlogPostHref(item)
                const thumbnail = resolveBlogThumbnail(item, item.title)
                const itemCategory = deriveBlogCategory(item)
                return (
                  <article key={item.id} className="group blog-card">
                    <Link href={href} className="blog-card-media" aria-label={item.title}>
                      {thumbnail ? (
                        <Image
                          src={thumbnail.url}
                          alt={thumbnail.alt}
                          fill
                          sizes="(min-width: 1024px) 360px, (min-width: 768px) 45vw, 100vw"
                          className="object-cover"
                          loading="lazy"
                          unoptimized={thumbnail.url.startsWith('http')}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-muted to-card" />
                      )}
                      <div className="absolute left-3 top-3">
                        <span className="blog-chip blog-chip-accent">{itemCategory}</span>
                      </div>
                    </Link>
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <h3 className="font-serif text-lg leading-snug tracking-[-0.015em] text-foreground">
                        <Link href={href}>{item.title}</Link>
                      </h3>
                      <p className="line-clamp-2 text-sm leading-7 text-muted-foreground">{item.excerpt}</p>
                      <div className="mt-auto pt-1 blog-meta">
                        {item.publishedAt ? (
                          <span>{formatPublishedDate(item.publishedAt)}</span>
                        ) : null}
                        <span className="blog-meta-dot">
                          {estimateReadingTimeMinutes(item.contentHtml)} min read
                        </span>
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
    <nav aria-label="Breadcrumb" className="text-[11px] font-medium uppercase tracking-[0.22em]">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
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
    <span className="inline-flex items-center gap-2">
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
