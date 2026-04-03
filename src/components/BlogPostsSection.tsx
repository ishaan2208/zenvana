'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import type { BlogPost } from '@/lib/blogPosts'

type BlogPostsSectionProps = {
  posts: BlogPost[]
}

const STEP = 6

export function BlogPostsSection({ posts }: BlogPostsSectionProps) {
  const [visibleCount, setVisibleCount] = useState(STEP)
  const visiblePosts = useMemo(() => posts.slice(0, visibleCount), [posts, visibleCount])
  const hasMore = visibleCount < posts.length

  return (
    <section className="section-rule">
      <div className="container-shell py-14 sm:py-16 lg:py-20">
        <div className="max-w-3xl">
          <div className="eyebrow">Our Blog</div>
          <h2 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">Explore Recent Posts</h2>
          <p className="body-copy mt-4">
            Practical hotel guides, Dehradun travel insights, and booking tips from the Zenvana team.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visiblePosts.map((post) => (
            <article key={post.slug} className="quiet-card p-6">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">{post.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
              <div className="mt-6">
                <Link href={post.href ?? `/blog/${post.slug}`} className="site-button-light">
                  Read More
                </Link>
              </div>
            </article>
          ))}
        </div>

        {hasMore ? (
          <div className="mt-10 flex justify-center">
            <button type="button" onClick={() => setVisibleCount((c) => c + STEP)} className="site-button-dark">
              Load More
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}

