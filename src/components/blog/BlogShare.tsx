'use client'

import { useState } from 'react'

import { buildShareUrls } from '@/lib/blogContent'

type Props = {
  url: string
  title: string
  excerpt?: string
  /** "sidebar" = stacked vertical icon list, "dock" = mobile bottom bar */
  variant?: 'sidebar' | 'dock' | 'inline'
}

export function BlogShare({ url, title, excerpt, variant = 'inline' }: Props) {
  const [copied, setCopied] = useState(false)
  const share = buildShareUrls({ url, title, excerpt })

  async function handleNativeShare() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & {
          share: (data: { url: string; title: string; text?: string }) => Promise<void>
        }).share({ url, title, text: excerpt })
        return
      } catch {
        // user cancelled — fall through to copy
      }
    }
    void handleCopy()
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const items = [
    {
      key: 'twitter',
      href: share.twitter,
      label: 'Share on Twitter',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            fill="currentColor"
            d="M18.244 2H21l-6.49 7.41L22 22h-6.59l-4.66-6.1L5.2 22H2.44l6.95-7.94L2 2h6.74l4.2 5.55L18.24 2Zm-2.31 18h1.9L8.16 4H6.18l9.75 16Z"
          />
        </svg>
      ),
    },
    {
      key: 'facebook',
      href: share.facebook,
      label: 'Share on Facebook',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            fill="currentColor"
            d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.8c0-.9.3-1.5 1.6-1.5h1.7V4.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.3H7.7V14h2.7v8h3.1Z"
          />
        </svg>
      ),
    },
    {
      key: 'linkedin',
      href: share.linkedin,
      label: 'Share on LinkedIn',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5ZM3 9.5h4V21H3V9.5Zm6.5 0h3.83v1.6h.05c.53-1 1.84-2.06 3.79-2.06 4.05 0 4.8 2.67 4.8 6.15V21h-4v-5.2c0-1.24-.02-2.83-1.72-2.83-1.73 0-2 1.35-2 2.74V21h-4V9.5Z"
          />
        </svg>
      ),
    },
    {
      key: 'whatsapp',
      href: share.whatsapp,
      label: 'Share on WhatsApp',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            fill="currentColor"
            d="M20.5 3.5A10.5 10.5 0 0 0 3.7 16L2 22l6.2-1.6a10.5 10.5 0 0 0 12.3-16.9ZM12 20a8 8 0 0 1-4.1-1.1l-.3-.2-3.7 1 1-3.6-.2-.3A8 8 0 1 1 12 20Zm4.5-5.9c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1c-.7-.4-1.4-.8-2-1.4s-1-1.3-1.4-2c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5s0-.4 0-.5-.6-1.4-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.8-1 1.7-1 2.7 0 1.5.8 3 1.5 4 1.2 1.5 2.6 2.7 4.3 3.3.6.2 1.1.3 1.5.4.6.1 1.2.1 1.7-.1.5-.2 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.3-.2-.5-.3Z"
          />
        </svg>
      ),
    },
  ]

  if (variant === 'sidebar') {
    return (
      <div className="sticky top-28 hidden lg:flex lg:flex-col lg:items-center lg:gap-3">
        <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-foreground/50">
          Share
        </div>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <a
              key={item.key}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground/70 transition hover:-translate-y-0.5 hover:bg-foreground hover:text-background"
              aria-label={item.label}
            >
              {item.icon}
            </a>
          ))}
          <button
            type="button"
            onClick={handleCopy}
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground/70 transition hover:-translate-y-0.5 hover:bg-foreground hover:text-background"
            aria-label={copied ? 'Link copied' : 'Copy link'}
          >
            {copied ? (
              <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M3 8.5l3 3 7-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M6 10L10 6M5 11l-1 1a2 2 0 1 1-3-3l1-1M11 5l1-1a2 2 0 1 1 3 3l-1 1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    )
  }

  if (variant === 'dock') {
    return (
      <div className="blog-share-dock lg:hidden">
        <button
          type="button"
          onClick={handleNativeShare}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-medium text-background"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
            <path
              d="M8 2v8M5 5l3-3 3 3M3 9v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Share article
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background text-foreground"
          aria-label={copied ? 'Link copied' : 'Copy link'}
        >
          {copied ? (
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
              <path
                d="M3 8.5l3 3 7-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
              <path
                d="M6 10L10 6M5 11l-1 1a2 2 0 1 1-3-3l1-1M11 5l1-1a2 2 0 1 1 3 3l-1 1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground/70 transition hover:bg-foreground hover:text-background"
          aria-label={item.label}
        >
          {item.icon}
        </a>
      ))}
      <button
        type="button"
        onClick={handleCopy}
        className="ml-1 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground/70 transition hover:bg-foreground hover:text-background"
      >
        {copied ? 'Link copied' : 'Copy link'}
      </button>
    </div>
  )
}
