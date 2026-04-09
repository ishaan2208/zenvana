'use client'

import { useState } from 'react'
import { submitPublicContact } from '@/lib/api'

export function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const result = await submitPublicContact({
      name,
      email,
      phone,
      message,
      website,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSent(true)
    setName('')
    setEmail('')
    setPhone('')
    setMessage('')
    setWebsite('')
  }

  if (sent) {
    return (
      <div
        className="mt-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-4 text-sm text-foreground"
        role="status"
      >
        Thanks — your message was sent. We&apos;ll get back to you soon.
      </div>
    )
  }

  return (
    <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
      <label className="grid gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
          Full Name
        </span>
        <input
          required
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          className="h-12 rounded-2xl border border-border/70 bg-background px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
          placeholder="Your name"
          autoComplete="name"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
          Email Address
        </span>
        <input
          required
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={200}
          className="h-12 rounded-2xl border border-border/70 bg-background px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
          placeholder="you@example.com"
          autoComplete="email"
        />
      </label>

      <label className="grid gap-2 sm:col-span-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
          Phone Number
        </span>
        <input
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={40}
          className="h-12 rounded-2xl border border-border/70 bg-background px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
          placeholder="+91 00000 00000"
          autoComplete="tel"
        />
      </label>

      <input
        tabIndex={-1}
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <label className="grid gap-2 sm:col-span-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
          Message
        </span>
        <textarea
          required
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={5000}
          className="min-h-[140px] resize-none rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
          placeholder="How can we help?"
        />
      </label>

      {error ? (
        <div className="sm:col-span-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="sm:col-span-2 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="site-button-dark w-full sm:w-auto disabled:pointer-events-none disabled:opacity-60"
        >
          {busy ? 'Sending…' : 'Submit'}
        </button>
      </div>
    </form>
  )
}
