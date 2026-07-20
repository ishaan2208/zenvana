'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
  getNewsletterStatus,
  subscribeNewsletter,
  unsubscribeNewsletter,
  type NewsletterStatus,
} from '@/lib/blogGuestApi'
import { useGuestSession } from '@/lib/useGuestSession'

type Props = {
  variant?: 'card' | 'inline'
  eyebrow?: string
  heading?: string
  copy?: string
}

/**
 * Newsletter subscribe — only available to signed-in ZenvanaGuests so the
 * email always belongs to a verified profile. Backend dispatches a welcome
 * email through the existing SMTP pipeline.
 *
 * UX flow:
 *   1. Not signed in → "Sign in to subscribe" CTA (returns to current page after auth).
 *   2. Signed in, not subscribed → confirm form with the guest's email pre-filled.
 *   3. Already subscribed → quiet confirmation with an unsubscribe option.
 */
export function BlogNewsletter({
  variant = 'card',
  eyebrow = 'The Zenvana Journal',
  heading = 'Slow stories from Dehradun, in your inbox',
  copy = 'A monthly note with new guides, seasonal openings, and quiet places worth your time. No spam — unsubscribe anytime.',
}: Props) {
  const pathname = usePathname()
  const { guest, signedIn, loading: sessionLoading } = useGuestSession()
  const [status, setStatus] = useState<NewsletterStatus | null>(null)
  const [email, setEmail] = useState('')
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Hydrate subscription state once the session is known.
  useEffect(() => {
    if (!signedIn) {
      setStatus(null)
      return
    }
    let cancelled = false
    void getNewsletterStatus().then((result) => {
      if (cancelled) return
      if (result.ok) {
        setStatus(result.data)
        setEmail((current) => current || result.data.email || guest?.email || '')
      }
    })
    return () => {
      cancelled = true
    }
  }, [signedIn, guest?.email])

  async function handleSubscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setWorking(true)
    const result = await subscribeNewsletter(email || undefined)
    setWorking(false)

    if (!result.ok) {
      setError(result.error)
      return
    }
    setStatus(result.data)
    setMessage('You’re on the list. We’ve sent a quiet welcome to your inbox.')
    try {
      const { track } = await import('@/lib/analytics/client')
      track('newsletter_subscribed', {
        page_path: pathname,
        email_domain: email.includes('@') ? email.split('@')[1] : null,
      })
    } catch {
      /* ignore */
    }
  }

  async function handleUnsubscribe() {
    setWorking(true)
    setError(null)
    const result = await unsubscribeNewsletter()
    setWorking(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setStatus(result.data)
    setMessage('Unsubscribed. You won’t hear from us again unless you opt back in.')
  }

  const containerClass =
    variant === 'card'
      ? 'rounded-[1.75rem] border border-border/60 bg-card/80 p-6 shadow-[0_10px_30px_rgba(0,31,63,0.06)] backdrop-blur sm:p-8'
      : 'border-y border-border/60 py-10 sm:py-14'

  // -------- Loading state --------
  if (sessionLoading) {
    return (
      <section className={containerClass} aria-labelledby="blog-newsletter-heading">
        <div className="mx-auto max-w-xl space-y-4 text-center">
          <div className="mx-auto h-3 w-32 animate-pulse rounded-full bg-muted/60" />
          <div className="mx-auto h-8 w-3/4 animate-pulse rounded bg-muted/60" />
          <div className="mx-auto h-3 w-full max-w-md animate-pulse rounded bg-muted/60" />
        </div>
      </section>
    )
  }

  // -------- Logged out --------
  if (!signedIn) {
    const redirect = encodeURIComponent(pathname || '/blog')
    return (
      <section className={containerClass} aria-labelledby="blog-newsletter-heading">
        <div className="mx-auto max-w-xl text-center">
          <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-foreground/60">{eyebrow}</div>
          <h2
            id="blog-newsletter-heading"
            className="mt-3 font-serif text-2xl tracking-[-0.025em] text-foreground sm:text-3xl"
          >
            {heading}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{copy}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href={`/login?redirect=${redirect}`} className="site-button-dark">
              Sign in to subscribe
            </Link>
            <Link href={`/register?redirect=${redirect}`} className="site-button-light">
              Create an account
            </Link>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground/80">
            We only email subscribers we can identify, so the conversation stays calm and honest.
          </p>
        </div>
      </section>
    )
  }

  // -------- Already subscribed --------
  if (status?.subscribed) {
    return (
      <section className={containerClass} aria-labelledby="blog-newsletter-heading">
        <div className="mx-auto max-w-xl text-center">
          <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-foreground/60">{eyebrow}</div>
          <h2
            id="blog-newsletter-heading"
            className="mt-3 font-serif text-2xl tracking-[-0.025em] text-foreground sm:text-3xl"
          >
            You’re on the list.
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
            We’ll send the next issue to{' '}
            <span className="font-medium text-foreground">{status.email}</span>. Reply to any note any time —
            we read them all.
          </p>
          {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
          {message ? <p className="mt-3 text-xs text-emerald-700">{message}</p> : null}
          <div className="mt-5">
            <button
              type="button"
              onClick={() => void handleUnsubscribe()}
              disabled={working}
              className="text-xs font-medium text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline"
            >
              {working ? 'Working…' : 'Unsubscribe'}
            </button>
          </div>
        </div>
      </section>
    )
  }

  // -------- Logged in, not subscribed --------
  return (
    <section className={containerClass} aria-labelledby="blog-newsletter-heading">
      <div className="mx-auto max-w-xl text-center">
        <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-foreground/60">{eyebrow}</div>
        <h2
          id="blog-newsletter-heading"
          className="mt-3 font-serif text-2xl tracking-[-0.025em] text-foreground sm:text-3xl"
        >
          {heading}
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{copy}</p>

        <form
          onSubmit={handleSubscribe}
          className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-stretch"
          aria-describedby="blog-newsletter-status"
        >
          <label className="flex-1">
            <span className="sr-only">Email address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={guest?.email || 'you@example.com'}
              className="h-12 w-full rounded-full border border-border/60 bg-background/80 px-5 text-sm text-foreground outline-none transition focus:border-foreground/40"
              autoComplete="email"
              inputMode="email"
            />
          </label>
          <button
            type="submit"
            disabled={working}
            className="site-button-dark h-12 justify-center sm:px-6 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {working ? 'Subscribing…' : 'Subscribe'}
          </button>
        </form>

        <p
          id="blog-newsletter-status"
          className={`mt-3 min-h-[1.25rem] text-xs ${
            error ? 'text-red-600' : message ? 'text-emerald-700' : 'text-muted-foreground'
          }`}
          aria-live="polite"
        >
          {error || message || 'We’ll send a confirmation to your inbox before adding you to the list.'}
        </p>
      </div>
    </section>
  )
}
