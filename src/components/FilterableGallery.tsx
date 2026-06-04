'use client'

import { useMemo, useState } from 'react'

import { EmblaImageGallery } from '@/components/EmblaImageGallery'
import type { GalleryImage } from '@/lib/media'
import { cn } from '@/lib/utils'

function titleCase(s: string): string {
  return s
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function matches(img: GalleryImage, tag: string): boolean {
  return img.classification === tag || (img.tags?.includes(tag) ?? false)
}

/**
 * Gallery with classification/tag filter chips. The chips are derived from the
 * images' own `classification` + `tags` (parsed in lib/media). If images carry
 * no usable tags, the chips simply don't render and it behaves like a plain
 * gallery — so it's safe to ship before the admin tagging work lands.
 */
export function FilterableGallery({
  images,
  propertyName,
}: {
  images: GalleryImage[]
  propertyName: string
}) {
  const tags = useMemo(() => {
    const set = new Set<string>()
    for (const img of images) {
      if (img.classification && img.classification !== 'hero') set.add(img.classification)
      img.tags?.forEach((t) => t && set.add(t))
    }
    return Array.from(set)
  }, [images])

  const [active, setActive] = useState<string | null>(null)

  const filtered = useMemo(
    () => (active ? images.filter((img) => matches(img, active)) : images),
    [images, active],
  )

  return (
    <div>
      {tags.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter photographs by area">
          <Chip label="All" count={images.length} active={active === null} onClick={() => setActive(null)} />
          {tags.map((t) => (
            <Chip
              key={t}
              label={titleCase(t)}
              count={images.filter((img) => matches(img, t)).length}
              active={active === t}
              onClick={() => setActive(t)}
            />
          ))}
        </div>
      )}

      <EmblaImageGallery
        key={active ?? 'all'}
        images={filtered.map((img, i) => ({
          url: img.url,
          alt: `${propertyName} — ${img.classification ? titleCase(img.classification) : 'photograph'} ${i + 1}`,
        }))}
        aspectClassName="aspect-[16/11]"
        autoPlay
        showThumbs
      />

      <div className="mt-4 text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
        {active ? `${filtered.length} in ${titleCase(active)}` : 'Use arrows or swipe to view'}
      </div>
    </div>
  )
}

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'pressable inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors',
        active
          ? 'border-gold-400/60 bg-gold-400/15 text-foreground'
          : 'border-border/70 bg-background/70 text-muted-foreground hover:border-border hover:text-foreground',
      )}
    >
      {label}
      <span className={cn('text-[10px] tabular-nums', active ? 'text-gold-600 dark:text-gold-300' : 'text-muted-foreground/70')}>
        {count}
      </span>
    </button>
  )
}
