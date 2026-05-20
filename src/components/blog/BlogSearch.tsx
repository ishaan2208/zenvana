'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useDeferredValue, useMemo, useState } from 'react'

export type BlogSearchItem = {
  slug: string
  title: string
  excerpt: string
  href: string
  category: string
  heroImageUrl?: string | null
  publishedLabel?: string | null
  authorName: string
  keywords: string[]
}

type Props = {
  items: BlogSearchItem[]
  categories: Array<{ category: string; count: number }>
}

/**
 * Client-side filter/search for the blog index.
 * Stays interactive even on slow networks (no /api round-trip),
 * and degrades gracefully — if disabled, the surrounding SSR list still ships.
 */
export function BlogSearch({ items, categories }: Props) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const deferredQuery = useDeferredValue(query)

  const filtered = useMemo(() => {
    const trimmed = deferredQuery.trim().toLowerCase()
    return items.filter((item) => {
      if (activeCategory !== 'All' && item.category !== activeCategory) return false
      if (!trimmed) return true
      const haystack = [
        item.title,
        item.excerpt,
        item.category,
        item.authorName,
        item.keywords.join(' '),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(trimmed)
    })
  }, [items, deferredQuery, activeCategory])

  const showingAll = filtered.length === items.length && !query

  return (
    <div className="space-y-6">
      <div className="quiet-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-3 sm:p-3">
        <label className="relative flex flex-1 items-center">
          <span className="sr-only">Search articles</span>
          <svg
            viewBox="0 0 20 20"
            className="pointer-events-none absolute left-4 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          >
            <path
              d="M9 3a6 6 0 1 0 3.74 10.66l3.3 3.3a1 1 0 0 0 1.42-1.42l-3.3-3.3A6 6 0 0 0 9 3Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
              fill="currentColor"
            />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guides, hotels, neighbourhoods…"
            className="h-12 w-full rounded-full border border-border/60 bg-background/85 pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-foreground/40"
            aria-label="Search articles"
          />
        </label>
        <div className="hidden text-xs text-muted-foreground sm:block">
          {showingAll ? `${items.length} stories` : `${filtered.length} match${filtered.length === 1 ? '' : 'es'}`}
        </div>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CategoryChip
          label={`All · ${items.length}`}
          active={activeCategory === 'All'}
          onClick={() => setActiveCategory('All')}
        />
        {categories.map((cat) => (
          <CategoryChip
            key={cat.category}
            label={`${cat.category} · ${cat.count}`}
            active={activeCategory === cat.category}
            onClick={() => setActiveCategory(cat.category)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="quiet-card flex flex-col items-center gap-3 p-10 text-center">
          <div className="text-sm text-muted-foreground">
            No stories match {query ? <span className="text-foreground">“{query}”</span> : 'this filter'} yet.
          </div>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setActiveCategory('All')
            }}
            className="site-button-light"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item, index) => (
            <article key={item.slug} className="group blog-card">
              <Link href={item.href} className="blog-card-media" aria-label={item.title}>
                {item.heroImageUrl ? (
                  <Image
                    src={item.heroImageUrl}
                    alt={item.title}
                    fill
                    sizes="(min-width: 1280px) 380px, (min-width: 768px) 45vw, 100vw"
                    className="object-cover"
                    loading={index < 3 ? 'eager' : 'lazy'}
                    unoptimized={item.heroImageUrl.startsWith('http')}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-muted to-card" />
                )}
                <div className="absolute left-3 top-3">
                  <span className="blog-chip blog-chip-accent backdrop-blur">{item.category}</span>
                </div>
              </Link>
              <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
                <div className="blog-meta">
                  <span>{item.authorName}</span>
                  {item.publishedLabel ? (
                    <span className="blog-meta-dot">{item.publishedLabel}</span>
                  ) : null}
                </div>
                <Link href={item.href} className="block">
                  <h3 className="font-serif text-xl leading-snug tracking-[-0.02em] text-foreground transition group-hover:text-foreground/90 sm:text-[1.375rem]">
                    {item.title}
                  </h3>
                </Link>
                <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">{item.excerpt}</p>
                <div className="mt-auto pt-2">
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground/90 transition hover:gap-3"
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
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] transition ${
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border/70 bg-background/80 text-foreground/70 hover:border-foreground/40 hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
}
