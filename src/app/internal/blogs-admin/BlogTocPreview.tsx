'use client'

import { useMemo } from 'react'

import { decorateBlogHtmlWithToc } from '@/lib/blogContent'

type Props = {
  contentHtml: string
}

/**
 * Live preview of the Table of Contents that will render on the public post.
 *
 * The TOC isn't a separate block — it's auto-generated server-side from the
 * H2/H3 headings in the article body (see `decorateBlogHtmlWithToc` +
 * `BlogTableOfContents` in the marketing app). Showing the writer exactly
 * what their headings produce, in the same order, removes the mystery and
 * doubles as a structural lint check (no headings → no TOC).
 *
 * Mirrors the public TOC styling so the writer can verify hierarchy + length
 * before they hit publish.
 */
export function BlogTocPreview({ contentHtml }: Props) {
  const toc = useMemo(() => decorateBlogHtmlWithToc(contentHtml).toc, [contentHtml])
  const h2Count = toc.filter((item) => item.level === 2).length
  const h3Count = toc.filter((item) => item.level === 3).length

  return (
    <section
      aria-labelledby="toc-preview-heading"
      className="rounded-2xl border border-border bg-background/60 p-5"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h3
            id="toc-preview-heading"
            className="text-[11px] font-medium uppercase tracking-[0.22em] text-foreground/80"
          >
            Table of Contents preview
          </h3>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            Built automatically from the H2 and H3 headings in your article. Use the{' '}
            <span className="font-medium text-foreground">H2</span> button for major sections and{' '}
            <span className="font-medium text-foreground">H3</span> for sub-sections — the TOC on the
            live post will mirror this list and update as you write.
          </p>
        </div>
        <div className="shrink-0 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {h2Count} H2{h2Count === 1 ? '' : 's'} · {h3Count} H3{h3Count === 1 ? '' : 's'}
        </div>
      </header>

      {toc.length === 0 ? (
        <EmptyHint />
      ) : toc.length === 1 ? (
        <SingleHeadingHint single={toc[0]} />
      ) : (
        <ol className="mt-4 space-y-1.5 border-l border-border/60 pl-4 text-sm">
          {toc.map((item, index) => (
            <li
              key={`${item.id}-${index}`}
              className={item.level === 3 ? 'pl-3' : ''}
            >
              <div
                className={`flex items-baseline gap-2 leading-snug ${
                  item.level === 2 ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
                  {item.level === 2 ? `0${index + 1}`.slice(-2) : '·'}
                </span>
                <span className="min-w-0 break-words">{item.text}</span>
              </div>
              <div className="ml-[18px] mt-0.5 truncate text-[10px] text-muted-foreground/70">
                /blog/…#{item.id}
              </div>
            </li>
          ))}
        </ol>
      )}

      {toc.length >= 2 ? (
        <div className="mt-4 rounded-lg bg-emerald-500/5 px-3 py-2 text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300">
          Looks good — the public post will show a sticky sidebar TOC on desktop and a “On this page”
          drawer on mobile, with scroll-spy highlighting the section you’re reading.
        </div>
      ) : null}
    </section>
  )
}

function EmptyHint() {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-border bg-background/30 p-4 text-[12px] leading-relaxed text-muted-foreground">
      <p className="font-medium text-foreground">No headings yet.</p>
      <p className="mt-1">
        Add a section heading by selecting a line and clicking{' '}
        <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-foreground">
          H2
        </kbd>{' '}
        in the editor toolbar above. We recommend 3–6 H2 sections for a strong reading experience and
        better SEO rich results.
      </p>
    </div>
  )
}

function SingleHeadingHint({ single }: { single: { text: string; level: 2 | 3 } }) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-border bg-background/30 p-4 text-[12px] leading-relaxed text-muted-foreground">
      <p className="font-medium text-foreground">
        Only one heading found{single.level === 3 ? ' (and it’s an H3)' : ''}.
      </p>
      <p className="mt-1">
        The Table of Contents needs at least two headings to render. Add another{' '}
        <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-foreground">
          H2
        </kbd>{' '}
        to define the next section.
      </p>
    </div>
  )
}
