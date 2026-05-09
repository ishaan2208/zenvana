'use client'

import { useState } from 'react'

/**
 * Avatar with an initials-circle fallback for when the remote image fails
 * to load (Google profile photos can 403, expire, or be CORS-blocked).
 *
 * Used inside server-rendered review cards. Stays a thin client component
 * so the parent server component doesn't have to opt into client rendering.
 */
export function ReviewAvatar({
  name,
  imageSrc,
  size = 40,
  className,
}: {
  name: string
  imageSrc?: string
  size?: number
  className?: string
}) {
  const [errored, setErrored] = useState(false)
  const showImage = !!imageSrc && !errored

  // Use Array.from + uppercase so non-Latin scripts and emoji stay intact.
  const initial = (Array.from(name.trim())[0] ?? '?').toUpperCase()

  const dim = `${size}px`
  const wrapperStyle: React.CSSProperties = { width: dim, height: dim }

  if (showImage) {
    return (
      <div
        className={[
          'relative shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border/40',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={wrapperStyle}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={`${name} — Zenvana guest`}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      aria-label={name}
      role="img"
      className={[
        'grid shrink-0 place-items-center rounded-full bg-foreground/8 text-foreground/80',
        'font-serif text-base ring-1 ring-border/50',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={wrapperStyle}
    >
      <span className="select-none">{initial}</span>
    </div>
  )
}
