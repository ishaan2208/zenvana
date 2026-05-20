'use client'

import { useEffect, useState } from 'react'

import type { BlogTocItem } from '@/lib/blogContent'

type Props = {
  items: BlogTocItem[]
}

/**
 * Sticky in-page Table of Contents.
 *
 * - On desktop: appears in the sidebar with scroll-spy highlighting.
 * - On mobile: collapses into a dropdown "On this page" disclosure.
 */
export function BlogTableOfContents({ items }: Props) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (items.length === 0) return
    const ids = items.map((item) => item.id)
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el))

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost intersecting heading.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-96px 0px -65% 0px', threshold: [0, 1] },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  if (items.length < 2) return null

  return (
    <>
      {/* Mobile: collapsible disclosure right above the article. */}
      <details
        className="mb-6 rounded-2xl border border-border/60 bg-card/80 p-4 lg:hidden"
        open={mobileOpen}
        onToggle={(event) => setMobileOpen((event.target as HTMLDetailsElement).open)}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-foreground/70">
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 4h10M3 8h10M3 12h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            On this page
          </div>
          <svg
            className={`h-4 w-4 text-foreground/60 transition-transform ${mobileOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
        <nav aria-label="Table of contents" className="mt-4">
          <ol className="space-y-1.5 text-sm">
            {items.map((item) => (
              <li key={item.id} className={item.level === 3 ? 'pl-4' : ''}>
                <a
                  href={`#${item.id}`}
                  className={`block rounded-md px-2 py-1.5 transition ${
                    activeId === item.id
                      ? 'bg-foreground/5 font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </details>

      {/* Desktop: sticky sidebar list. */}
      <nav aria-label="Table of contents" className="hidden lg:block">
        <div className="sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto pr-2">
          <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-foreground/60">
            On this page
          </div>
          <ol className="mt-4 space-y-1.5 border-l border-border/60 pl-4 text-sm">
            {items.map((item) => {
              const isActive = activeId === item.id
              return (
                <li key={item.id} className={item.level === 3 ? 'pl-3' : ''}>
                  <a
                    href={`#${item.id}`}
                    className={`group relative block py-1 leading-snug transition ${
                      isActive
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isActive ? (
                      <span
                        className="absolute -left-[17px] top-1/2 h-4 w-px -translate-y-1/2 bg-foreground"
                        aria-hidden="true"
                      />
                    ) : null}
                    {item.text}
                  </a>
                </li>
              )
            })}
          </ol>
        </div>
      </nav>
    </>
  )
}
