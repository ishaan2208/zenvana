import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { Container } from '@/components/Container'
import { JsonLd } from '@/components/JsonLd'
import {
  getAllPublishedBlogSlugs,
  getPublishedBlogPostBySlug,
  resolveBlogCanonicalPath,
} from '@/lib/blog'
import { getBlogSlugRedirectTarget } from '@/lib/blogRedirects'
import { estimateReadingTimeMinutes, formatPublishedDate } from '@/lib/blogReadingTime'
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/structured-data'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'

type BlogPostPageProps = {
  params: {
    slug: string
  }
}

export const revalidate = 86400
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
    return {
      title: 'Blog | Zenvana',
      robots: { index: false, follow: false },
    }
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
  const ogImage = post.ogImageUrl || post.heroImageUrl || undefined

  return {
    title: `${title} | Zenvana Blog`,
    description,
    keywords: post.seoKeywords.length ? post.seoKeywords : undefined,
    alternates: { canonical },
    openGraph: {
      title: post.ogTitle || title,
      description: post.ogDescription || description,
      url: `${SITE_URL}${canonical}`,
      type: 'article',
      images: ogImage ? [{ url: ogImage }] : undefined,
      publishedTime: post.publishedAt?.toISOString(),
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

  const readingTimeMinutes = estimateReadingTimeMinutes(post.contentHtml)
  const publishedLabel = post.publishedAt ? formatPublishedDate(post.publishedAt) : null

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
    section: 'Travel',
    image: post.heroImageUrl || post.ogImageUrl || undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    authorName: post.authorName,
  })

  const heroImage = post.heroImageUrl
  const images = post.media.filter((item) => item.type === 'IMAGE')
  const videos = post.media.filter((item) => item.type === 'VIDEO')

  return (
    <article className="section-rule">
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), article]} />
      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-3xl">
          <div className="eyebrow">Blog Post</div>
          <h1 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">{post.title}</h1>
          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>By {post.authorName}</span>
            {publishedLabel ? (
              <>
                <span aria-hidden="true">·</span>
                <time dateTime={post.publishedAt!.toISOString()}>{publishedLabel}</time>
              </>
            ) : null}
            <span aria-hidden="true">·</span>
            <span>{readingTimeMinutes} min read</span>
          </p>
          <p className="body-copy mt-5">{post.excerpt}</p>

          {heroImage ? (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl">
              <Image
                src={heroImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
                unoptimized={heroImage.startsWith('http')}
              />
            </div>
          ) : null}

          <div
            className="prose prose-neutral body-copy mt-8 max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

          {images.length > 0 ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {images.map((media) => (
                <div key={media.id} className="relative aspect-[4/3] overflow-hidden rounded-xl">
                  <Image
                    src={media.url}
                    alt={media.altText || post.title}
                    fill
                    className="object-cover"
                    unoptimized={media.url.startsWith('http')}
                  />
                </div>
              ))}
            </div>
          ) : null}

          {videos.length > 0 ? (
            <div className="mt-10 space-y-4">
              {videos.map((media) => (
                <video key={media.id} controls className="w-full rounded-xl" src={media.url}>
                  <track kind="captions" />
                </video>
              ))}
            </div>
          ) : null}

          <div className="mt-8">
            <Link href="/blog" className="site-button-light">
              Back to Blog
            </Link>
          </div>
        </div>
      </Container>
    </article>
  )
}
