import type { Metadata } from 'next'

import { Container } from '@/components/Container'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read stories, updates, and notes from Zenvana.',
}

export default function BlogPage() {
  return (
    <div className="section-rule">
      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-3xl">
          <div className="eyebrow">Journal</div>
          <h1 className="display-title mt-3 text-3xl sm:text-4xl lg:text-5xl">
            Blog
          </h1>
          <p className="body-copy mt-4 text-muted-foreground">
            This is a placeholder blog page. In the future, use this space to publish
            stories, updates, and quieter notes about hospitality, Dehradun, and Zenvana.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="quiet-card p-6">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Featured post
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Add a highlighted story or announcement here once your publishing flow is
              ready.
            </p>
          </div>

          <div className="quiet-card p-6">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Future articles
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Use this section to tease upcoming topics or categories you plan to cover on
              the blog.
            </p>
          </div>
        </div>
      </Container>
    </div>
  )
}

