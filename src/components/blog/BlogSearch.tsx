'use client'

import Fuse, { type FuseResultMatch } from 'fuse.js'
import CloudinaryImage from '@/components/CloudinaryImage'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'

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
 * Fuzzy, URL-stateful, instantly-interactive blog index search.
 *
 * - Uses Fuse.js for typo-tolerant matching across title, excerpt, keywords,
 *   category, and author. Threshold tuned for editorial content: matches "rajpur"
 *   to "Rajpur Road" but doesn't pull in unrelated stories.
 * - Highlights matched ranges with <mark>, styled to match the brand palette
 *   (subtle gold underline rather than the default yellow brick).
 * - Persists query + active category to URL search params (?q=…&topic=…) so
 *   back/forward navigation works and the search state is shareable.
 * - Stays 100% client-side — fast on slow networks; no server round-trip.
 */
export function BlogSearch({ items, categories }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialQuery = searchParams?.get('q') ?? ''
  const initialCategory = searchParams?.get('topic') ?? 'All'

  const [query, setQuery] = useState(initialQuery)
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory)
  const deferredQuery = useDeferredValue(query)

  // Build the Fuse index once per items[] change. Including matches/score is
  // ~free; we use them for the highlight pass below.
  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: [
          { name: 'title', weight: 0.45 },
          { name: 'excerpt', weight: 0.25 },
          { name: 'keywords', weight: 0.15 },
          { name: 'category', weight: 0.1 },
          { name: 'authorName', weight: 0.05 },
        ],
        includeMatches: true,
        includeScore: true,
        ignoreLocation: true,
        threshold: 0.36,
        minMatchCharLength: 2,
        useExtendedSearch: false,
      }),
    [items],
  )

  type Result = { item: BlogSearchItem; matches?: readonly FuseResultMatch[] }

  const filtered: Result[] = useMemo(() => {
    const trimmed = deferredQuery.trim()
    if (!trimmed) {
      return items
        .filter((item) => activeCategory === 'All' || item.category === activeCategory)
        .map((item) => ({ item }))
    }
    const ranked = fuse.search(trimmed)
    return ranked
      .filter((hit) => activeCategory === 'All' || hit.item.category === activeCategory)
      .map((hit) => ({ item: hit.item, matches: hit.matches }))
  }, [items, deferredQuery, activeCategory, fuse])

  // Sync URL state on debounced query / category change.
  useEffect(() => {
    const params = new URLSearchParams(
      searchParams ? Array.from(searchParams.entries()) : [],
    )
    if (deferredQuery.trim()) params.set('q', deferredQuery.trim())
    else params.delete('q')
    if (activeCategory !== 'All') params.set('topic', activeCategory)
    else params.delete('topic')

    const next = params.toString()
    const current = searchParams?.toString() ?? ''
    if (next !== current) {
      router.replace(`?${next}#all-stories`, { scroll: false })
    }
    // We deliberately omit searchParams + router to avoid an effect-loop with
    // router.replace — they're effectively stable identities here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredQuery, activeCategory])

  const reset = useCallback(() => {
    setQuery('')
    setActiveCategory('All')
  }, [])

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
            className="h-12 w-full rounded-full border border-border/60 bg-background/85 pl-11 pr-12 text-sm text-foreground outline-none transition focus:border-foreground/40"
            aria-label="Search articles"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ) : null}
        </label>
        <div className="hidden text-xs text-muted-foreground sm:block">
          {showingAll
            ? `${items.length} stories`
            : `${filtered.length} match${filtered.length === 1 ? '' : 'es'}`}
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
            No stories match{' '}
            {query ? <span className="text-foreground">“{query}”</span> : 'this filter'} yet.
          </div>
          <button type="button" onClick={reset} className="site-button-light">
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ item, matches }, index) => {
            const titleHtml = highlightMatches(item.title, getRanges(matches, 'title'))
            const excerptHtml = highlightMatches(item.excerpt, getRanges(matches, 'excerpt'))
            return (
              <article key={item.slug} className="group blog-card">
                <Link href={item.href} className="blog-card-media" aria-label={item.title}>
                  {item.heroImageUrl ? (
                    <CloudinaryImage
                      src={item.heroImageUrl}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1280px) 380px, (min-width: 768px) 45vw, 100vw"
                      className="object-cover"
                      loading={index < 3 ? 'eager' : 'lazy'}
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
                    <h3
                      className="font-serif text-xl leading-snug tracking-[-0.02em] text-foreground transition group-hover:text-foreground/90 sm:text-[1.375rem] [&_mark]:bg-transparent [&_mark]:text-foreground [&_mark]:underline-gold"
                      dangerouslySetInnerHTML={{ __html: titleHtml }}
                    />
                  </Link>
                  <p
                    className="line-clamp-3 text-sm leading-7 text-muted-foreground [&_mark]:bg-transparent [&_mark]:text-foreground [&_mark]:underline-gold"
                    dangerouslySetInnerHTML={{ __html: excerptHtml }}
                  />
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
            )
          })}
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

/* ─────────────────────────────────────────────────────────────── */
/* HIGHLIGHTING                                                    */
/* Wraps Fuse's match ranges with <mark>. HTML-escapes everything   */
/* in between so user-provided strings can't inject markup.         */
/* ─────────────────────────────────────────────────────────────── */

function getRanges(
  matches: readonly FuseResultMatch[] | undefined,
  key: string,
): Array<[number, number]> {
  if (!matches) return []
  const found = matches.find((m) => m.key === key)
  if (!found) return []
  // Fuse provides [start, end] inclusive — copy so we don't mutate.
  return found.indices.map(([start, end]) => [start, end] as [number, number])
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function highlightMatches(text: string, ranges: Array<[number, number]>): string {
  if (ranges.length === 0 || !text) return escapeHtml(text)
  // Merge overlapping ranges, sort by start.
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  const merged: Array<[number, number]> = []
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1]
    if (last && start <= last[1] + 1) {
      last[1] = Math.max(last[1], end)
    } else {
      merged.push([start, end])
    }
  }
  let out = ''
  let cursor = 0
  for (const [start, end] of merged) {
    if (start > text.length) break
    out += escapeHtml(text.slice(cursor, start))
    out += `<mark>${escapeHtml(text.slice(start, end + 1))}</mark>`
    cursor = end + 1
  }
  out += escapeHtml(text.slice(cursor))
  return out
}
