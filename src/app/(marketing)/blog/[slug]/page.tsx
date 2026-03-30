import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Container } from '@/components/Container'
import { blogPosts, getBlogPostBySlug } from '@/lib/blogPosts'

type BlogPostPageProps = {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  return blogPosts
    .filter((post) => !post.href)
    .map((post) => ({
      slug: post.slug,
    }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = getBlogPostBySlug(params.slug)
  if (!post) {
    return {
      title: 'Blog | Zenvana',
      description: 'Read stories and stay guides from Zenvana.',
    }
  }

  return {
    title: `${post.title} | Zenvana Blog`,
    description: post.excerpt,
  }
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getBlogPostBySlug(params.slug)
  if (!post || post.href) notFound()

  return (
    <article className="section-rule">
      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-3xl">
          <div className="eyebrow">Blog Post</div>
          <h1 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">{post.title}</h1>
          <p className="body-copy mt-5">{post.excerpt}</p>

          <div className="body-copy mt-8 space-y-4">
            <p>
              This article page is ready for publishing. Replace this placeholder section with your
              full SEO blog content, images, and internal links whenever you are ready.
            </p>
            <p>
              You can structure this page with hotel highlights, local travel guidance, pricing
              tips, and booking recommendations to improve search visibility and user engagement.
            </p>
          </div>

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

