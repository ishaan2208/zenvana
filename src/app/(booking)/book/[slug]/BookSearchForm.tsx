'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import { CalendarCheck, Minus, Plus } from 'lucide-react'

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number): Date {
  const out = new Date(date)
  out.setDate(out.getDate() + days)
  return out
}

type BookSearchFormProps = { slug: string }

export function BookSearchForm({ slug }: BookSearchFormProps) {
  const router = useRouter()
  const today = useMemo(() => new Date(), [])
  const tomorrow = useMemo(() => addDays(today, 1), [today])

  const [checkIn, setCheckIn] = useState(toDateString(today))
  const [checkOut, setCheckOut] = useState(toDateString(tomorrow))
  const [rooms, setRooms] = useState(1)
  const [guests, setGuests] = useState(2)

  const checkInMin = toDateString(today)
  const checkOutMin = checkIn === checkInMin ? toDateString(tomorrow) : toDateString(addDays(new Date(checkIn), 1))
  const isCheckOutValid = checkOut > checkIn

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isCheckOutValid) return
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      rooms: String(rooms),
      guests: String(guests),
    })
    router.push(`/book/${slug}/rooms?${params}`)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="checkIn" className="block text-sm font-medium text-slate-700">
            Check-in
          </label>
          <input
            id="checkIn"
            type="date"
            required
            min={checkInMin}
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value)
              const next = addDays(new Date(e.target.value), 1)
              if (checkOut <= e.target.value) setCheckOut(toDateString(next))
            }}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="checkOut" className="block text-sm font-medium text-slate-700">
            Check-out
          </label>
          <input
            id="checkOut"
            type="date"
            required
            min={checkOutMin}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {!isCheckOutValid && (
            <p className="mt-1 text-xs text-amber-600">Check-out must be after check-in</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Rooms</label>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              aria-label="Decrease rooms"
              onClick={() => setRooms((r) => Math.max(1, r - 1))}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[2rem] text-center font-medium text-slate-900">{rooms}</span>
            <button
              type="button"
              aria-label="Increase rooms"
              onClick={() => setRooms((r) => Math.min(5, r + 1))}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Guests</label>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              aria-label="Decrease guests"
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[2rem] text-center font-medium text-slate-900">{guests}</span>
            <button
              type="button"
              aria-label="Increase guests"
              onClick={() => setGuests((g) => Math.min(8, g + 1))}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <Button type="submit" color="blue" className="w-full" disabled={!isCheckOutValid}>
        <CalendarCheck className="mr-2 h-4 w-4" aria-hidden />
        See rooms & rates
      </Button>
    </form>
  )
}
