'use client'

import { useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Mobile-only CSS collapse for long editorial copy. The FULL text stays in the
 * DOM at all times — collapse is pure max-height + overflow, so search engines
 * index every word (never conditional rendering). Expands with a measured
 * max-height transition; `lg:` and up always shows everything.
 */
export function ReadMoreText({
  children,
  collapsedClassName = 'max-h-[15.5rem]',
  className,
}: {
  children: React.ReactNode
  /** Collapsed preview height (Tailwind max-h-* class). */
  collapsedClassName?: string
  className?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const contentId = useId()

  return (
    <div className={className}>
      <div
        ref={contentRef}
        id={contentId}
        className={cn(
          'ease-[cubic-bezier(0.16,0.84,0.34,1)] relative overflow-hidden transition-[max-height] duration-500 motion-reduce:transition-none lg:!max-h-none',
          !expanded && collapsedClassName,
        )}
        style={
          expanded
            ? { maxHeight: contentRef.current?.scrollHeight ?? undefined }
            : undefined
        }
      >
        {children}
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent transition-opacity duration-300 lg:hidden',
            expanded && 'opacity-0',
          )}
        />
      </div>

      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-foreground/80 transition hover:text-foreground lg:hidden"
      >
        {expanded ? 'Read less' : 'Read more'}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-300 motion-reduce:transition-none',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
    </div>
  )
}
