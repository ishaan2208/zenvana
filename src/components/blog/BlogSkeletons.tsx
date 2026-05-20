/**
 * Layout-matched skeletons for blog surfaces. Match the real components
 * pixel-for-pixel — same aspect ratios, paddings, line heights — so
 * the swap from skeleton → content is imperceptible.
 *
 * Reduces perceived load time + bounce rate on slower connections.
 */

import { Container } from '@/components/Container'

const SHIMMER = 'animate-pulse bg-muted/70'

export function BlogCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="blog-card overflow-hidden">
      <div className={`${SHIMMER} ${compact ? 'aspect-[16/10]' : 'aspect-[3/2]'}`} />
      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <div className="flex gap-2">
          <div className={`${SHIMMER} h-4 w-20 rounded-full`} />
          <div className={`${SHIMMER} h-4 w-16 rounded-full`} />
        </div>
        <div className="space-y-2">
          <div className={`${SHIMMER} h-5 w-[85%] rounded`} />
          <div className={`${SHIMMER} h-5 w-[70%] rounded`} />
        </div>
        <div className="space-y-1.5">
          <div className={`${SHIMMER} h-3 w-full rounded`} />
          <div className={`${SHIMMER} h-3 w-[92%] rounded`} />
          <div className={`${SHIMMER} h-3 w-[60%] rounded`} />
        </div>
        <div className="mt-2 flex gap-2">
          <div className={`${SHIMMER} h-3 w-24 rounded`} />
          <div className={`${SHIMMER} h-3 w-20 rounded`} />
        </div>
      </div>
    </div>
  )
}

export function BlogIndexSkeleton() {
  return (
    <div>
      {/* Masthead band */}
      <div className="brand-gradient">
        <Container className="py-14 sm:py-20 lg:py-28">
          <div className="max-w-3xl space-y-5">
            <div className="h-3 w-40 animate-pulse rounded-full bg-white/15" />
            <div className="h-12 w-[80%] animate-pulse rounded-md bg-white/15 sm:h-16 lg:h-20" />
            <div className="h-3 w-full max-w-xl animate-pulse rounded-md bg-white/10" />
            <div className="h-3 w-3/4 max-w-md animate-pulse rounded-md bg-white/10" />
          </div>
        </Container>
      </div>

      {/* Cover story area */}
      <section className="section-rule">
        <Container className="py-10 sm:py-14 lg:py-16">
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-8">
              <div className={`${SHIMMER} aspect-[16/10] rounded-[1.75rem] sm:aspect-[16/9]`} />
            </div>
            <div className="grid gap-5 lg:col-span-4">
              <BlogCardSkeleton compact />
              <BlogCardSkeleton compact />
            </div>
          </div>
        </Container>
      </section>

      {/* Archive grid */}
      <section className="section-rule bg-muted/30 dark:bg-card/40">
        <Container className="py-14 sm:py-16 lg:py-20">
          <div className="space-y-6">
            <div className={`${SHIMMER} h-12 rounded-full`} />
            <div className="flex gap-2 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`${SHIMMER} h-8 w-24 shrink-0 rounded-full`} />
              ))}
            </div>
            <div className="grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <BlogCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </Container>
      </section>
    </div>
  )
}

export function BlogPostSkeleton() {
  return (
    <article className="relative">
      {/* Hero band */}
      <header className="relative isolate overflow-hidden">
        <div className={`${SHIMMER} h-[60vh] min-h-[420px]`} />
      </header>

      <section className="section-rule">
        <Container className="py-10 sm:py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)_80px] lg:gap-12">
            {/* TOC skeleton */}
            <div className="hidden space-y-3 lg:block">
              <div className={`${SHIMMER} h-3 w-28 rounded`} />
              <div className="space-y-2 border-l border-border/60 pl-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`${SHIMMER} h-3 rounded`} style={{ width: `${60 + ((i * 13) % 35)}%` }} />
                ))}
              </div>
            </div>

            {/* Article skeleton */}
            <div className="mx-auto w-full max-w-[68ch] space-y-4">
              {Array.from({ length: 4 }).map((_, paragraph) => (
                <div key={paragraph} className="space-y-3">
                  {paragraph === 1 ? <div className={`${SHIMMER} mt-8 h-7 w-2/3 rounded`} /> : null}
                  {Array.from({ length: 5 }).map((_, line) => (
                    <div
                      key={line}
                      className={`${SHIMMER} h-4 rounded`}
                      style={{ width: `${78 + ((line + paragraph) % 4) * 5}%` }}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="hidden lg:block" />
          </div>
        </Container>
      </section>
    </article>
  )
}

export function BlogCommentsSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className={`${SHIMMER} h-9 w-9 shrink-0 rounded-full`} />
          <div className="flex-1 space-y-2">
            <div className="flex gap-3">
              <div className={`${SHIMMER} h-3 w-24 rounded`} />
              <div className={`${SHIMMER} h-3 w-16 rounded`} />
            </div>
            <div className={`${SHIMMER} h-3 w-[92%] rounded`} />
            <div className={`${SHIMMER} h-3 w-[78%] rounded`} />
          </div>
        </div>
      ))}
    </div>
  )
}
