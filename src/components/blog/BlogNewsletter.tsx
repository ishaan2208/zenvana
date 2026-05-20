'use client'

import { useState } from 'react'

type Props = {
  variant?: 'card' | 'inline'
  eyebrow?: string
  heading?: string
  copy?: string
}

/**
 * Lightweight subscribe form. Posts to a single endpoint if present
 * (`NEXT_PUBLIC_BLOG_SUBSCRIBE_URL`), otherwise falls back to a mailto:.
 * The aim: zero-config wiring, but instant upgrade when an integration
 * (Mailchimp/Beehiiv/etc) is provided via env.
 */
export function BlogNewsletter({
  variant = 'card',
  eyebrow = 'The Zenvana Journal',
  heading = 'Slow stories from Dehradun, straight to your inbox',
  copy = 'A monthly note with new guides, seasonal restaurant openings, and quiet places worth your time. No spam — unsubscribe anytime.',
}: Props) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState('error')
      setMessage('Please enter a valid email address.')
      return
    }

    const endpoint = process.env.NEXT_PUBLIC_BLOG_SUBSCRIBE_URL
    if (!endpoint) {
      window.location.href = `mailto:hello@zenvanahotels.com?subject=Subscribe%20to%20Journal&body=${encodeURIComponent(
        `Please add ${email} to the Zenvana Journal mailing list.`,
      )}`
      setState('ok')
      setMessage('Opening your mail app to confirm.')
      return
    }

    try {
      setState('loading')
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, source: 'blog' }),
      })
      if (!response.ok) throw new Error('Subscribe failed')
      setState('ok')
      setMessage('You’re on the list. Check your inbox to confirm.')
      setEmail('')
    } catch {
      setState('error')
      setMessage('Something went wrong. Please try again in a moment.')
    }
  }

  const containerClass =
    variant === 'card'
      ? 'rounded-[1.75rem] border border-border/60 bg-card/80 p-6 shadow-[0_10px_30px_rgba(0,31,63,0.06)] backdrop-blur sm:p-8'
      : 'border-y border-border/60 py-10 sm:py-14'

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
          onSubmit={handleSubmit}
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
              placeholder="you@example.com"
              className="h-12 w-full rounded-full border border-border/60 bg-background/80 px-5 text-sm text-foreground outline-none transition focus:border-foreground/40"
              autoComplete="email"
              inputMode="email"
            />
          </label>
          <button
            type="submit"
            disabled={state === 'loading'}
            className="site-button-dark h-12 justify-center sm:px-6"
          >
            {state === 'loading' ? 'Subscribing…' : 'Subscribe'}
          </button>
        </form>

        <p
          id="blog-newsletter-status"
          className={`mt-3 min-h-[1.25rem] text-xs ${
            state === 'error' ? 'text-red-600' : 'text-muted-foreground'
          }`}
          aria-live="polite"
        >
          {message ?? 'We’ll only email when we have something worth your morning coffee.'}
        </p>
      </div>
    </section>
  )
}
