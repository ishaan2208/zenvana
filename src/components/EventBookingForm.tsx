'use client'

import { useState } from 'react'

function getTodayIsoDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function EventBookingForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [eventType, setEventType] = useState('')
  const [date, setDate] = useState('')
  const [guests, setGuests] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const minEventDate = getTodayIsoDate()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (date < minEventDate) {
      setError('Please select a valid event date (today or later).')
      return
    }

    setBusy(true)

    try {
      const response = await fetch('/api/event-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          eventType,
          date,
          guests,
          message,
        }),
      })

      const json = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!response.ok || !json.ok) {
        setError(json.error || 'Failed to send booking request')
        return
      }

      setSent(true)
      setName('')
      setEmail('')
      setPhone('')
      setEventType('')
      setDate('')
      setGuests('')
      setMessage('')
    } catch {
      setError('Failed to send booking request')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
      <label className="grid gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
          Name
        </span>
        <input
          required
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
          Email
        </span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={200}
          className="h-12 rounded-2xl border border-border/70 bg-background px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
          placeholder="you@example.com"
          autoComplete="email"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
          Phone
        </span>
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={40}
          className="h-12 rounded-2xl border border-border/70 bg-background px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
          placeholder="+91 00000 00000"
          autoComplete="tel"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
          Event Type
        </span>
        <input
          required
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          maxLength={120}
          className="h-12 rounded-2xl border border-border/70 bg-background px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
          placeholder="Birthday, corporate, etc."
        />
      </label>

      <label className="grid gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
          Date
        </span>
        <input
          required
          type="date"
          min={minEventDate}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-12 rounded-2xl border border-border/70 bg-background px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
          Number of Guests
        </span>
        <input
          required
          type="number"
          min={1}
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className="h-12 rounded-2xl border border-border/70 bg-background px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
          placeholder="50"
        />
      </label>

      <label className="grid gap-2 sm:col-span-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
          Message
        </span>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={5000}
          className="min-h-[140px] resize-none rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
          placeholder="Tell us about event type, timing, and special requirements."
        />
      </label>

      {sent ? (
        <div
          className="sm:col-span-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-foreground"
          role="status"
        >
          Booking request sent successfully
        </div>
      ) : null}

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
          {busy ? 'Sending...' : 'Book Event'}
        </button>
      </div>
    </form>
  )
}
