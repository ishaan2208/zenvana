'use client'

import * as React from 'react'
import CloudinaryImage from '@/components/CloudinaryImage'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type EmblaImageGalleryProps = {
  images: Array<{ url: string; alt: string }>
  aspectClassName?: string
  autoPlay?: boolean
  showThumbs?: boolean
  priorityFirstImage?: boolean
}

export function EmblaImageGallery({
  images,
  aspectClassName = 'aspect-[4/3]',
  autoPlay = true,
  showThumbs = true,
  priorityFirstImage = false,
}: EmblaImageGalleryProps) {
  const autoplay = React.useRef(
    Autoplay({ delay: 4200, stopOnInteraction: false, stopOnMouseEnter: true })
  )

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: images.length > 1, align: 'start' },
    autoPlay && images.length > 1 ? [autoplay.current] : []
  )

  const [selectedIndex, setSelectedIndex] = React.useState(0)

  React.useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap())

    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)

    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi])

  if (images.length === 0) return null

  return (
    <div className="space-y-3">
      <div
        className="group relative overflow-hidden rounded-[1.6rem] border border-border/60 bg-card/50"
        ref={emblaRef}
      >
        <div className="flex">
          {images.map((image, idx) => (
            <div
              key={`${image.url}-${idx}`}
              className="min-w-0 shrink-0 grow-0 basis-full"
            >
              <div className={`relative w-full ${aspectClassName}`}>
                <CloudinaryImage
                  src={image.url}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 55vw"
                  priority={priorityFirstImage && idx === 0}
                />
              </div>
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3 sm:p-4">
              <div className="rounded-full border border-white/12 bg-black/35 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-xl">
                {selectedIndex + 1} / {images.length}
              </div>
            </div>

            <button
              type="button"
              aria-label="Previous image"
              onClick={() => emblaApi?.scrollPrev()}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/12 bg-black/35 p-2.5 text-white opacity-100 backdrop-blur-xl transition hover:bg-black/50 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              aria-label="Next image"
              onClick={() => emblaApi?.scrollNext()}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/12 bg-black/35 p-2.5 text-white opacity-100 backdrop-blur-xl transition hover:bg-black/50 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {showThumbs && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, idx) => {
            const active = selectedIndex === idx

            return (
              <button
                key={`${image.url}-thumb-${idx}`}
                type="button"
                aria-label={`Go to image ${idx + 1}`}
                onClick={() => emblaApi?.scrollTo(idx)}
                className={`relative shrink-0 overflow-hidden rounded-2xl border transition ${active
                  ? 'border-foreground shadow-[0_10px_26px_rgba(8,17,31,0.10)]'
                  : 'border-border/60 opacity-75 hover:opacity-100'
                  }`}
              >
                <div className="relative h-16 w-24 sm:h-20 sm:w-28">
                  <CloudinaryImage
                    src={image.url}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                </div>
              </button>
            )
          })}
        </div>
      )}

      {images.length > 1 && !showThumbs && (
        <div className="flex items-center justify-center gap-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Go to image ${idx + 1}`}
              className={`h-2 rounded-full transition-all ${selectedIndex === idx ? 'w-7 bg-foreground' : 'w-2 bg-foreground/25'
                }`}
              onClick={() => emblaApi?.scrollTo(idx)}
            />
          ))}
        </div>
      )}
    </div>
  )
}