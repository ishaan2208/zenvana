'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/Logo'
import { SlimLayout } from '@/components/SlimLayout'
import {
  getZenvanaGuestBookings,
  getZenvanaGuestMe,
  type ZenvanaGuestBookingRow,
} from '@/lib/zenvanaGuestApi'

export default function MyBookingsPage() {
  const [rows, setRows] = useState<ZenvanaGuestBookingRow[] | null>(null)
  const [auth, setAuth] = useState<boolean | null>(null)

  useEffect(() => {
    void (async () => {
      const me = await getZenvanaGuestMe()
      if (!me) {
        setAuth(false)
        return
      }
      setAuth(true)
      try {
        const b = await getZenvanaGuestBookings()
        setRows(b)
      } catch {
        setRows([])
      }
    })()
  }, [])

  if (auth === false) {
    return (
      <SlimLayout>
        <p className="mt-12 text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>{' '}
          to see your website bookings.
        </p>
      </SlimLayout>
    )
  }

  if (rows === null) {
    return (
      <SlimLayout>
        <p className="mt-12 text-sm text-muted-foreground">Loading…</p>
      </SlimLayout>
    )
  }

  return (
    <SlimLayout>
      <Link href="/" className="inline-block">
        <Logo className="h-10 w-auto" />
      </Link>
      <h1 className="mt-10 text-xl font-semibold">My bookings</h1>
      <p className="mt-2 text-sm text-muted-foreground">Website bookings linked to your phone.</p>
      {rows.length === 0 ? (
        <p className="mt-8 text-sm">No bookings yet.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {rows.map((b) => (
            <li
              key={b.id}
              className="rounded-xl border border-border bg-card/60 px-4 py-3 text-sm"
            >
              <div className="font-medium">{b.propertyName}</div>
              <div className="text-muted-foreground">
                {b.checkIn} → {b.checkOut} · {b.bookingReference}
              </div>
              <div className="mt-1">₹{b.totalAmount.toFixed(2)} · {b.bookingStatus}</div>
            </li>
          ))}
        </ul>
      )}
    </SlimLayout>
  )
}
