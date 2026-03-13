'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { Button } from '@/components/Button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  CalendarCheck,
  Minus,
  Plus,
  CalendarDays,
} from 'lucide-react'

const MAX_GUESTS_PER_ROOM = 3
const ROOMS_FOR_GUESTS_PER_ROOM_MODE = 6

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

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: today,
    to: tomorrow,
  })
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const [rooms, setRooms] = useState(1)
  const [guests, setGuests] = useState(2)
  const useGuestsPerRoomMode = rooms >= ROOMS_FOR_GUESTS_PER_ROOM_MODE
  const totalGuests = useGuestsPerRoomMode ? rooms * guests : guests
  const prevModeRef = useRef(useGuestsPerRoomMode)
  const prevRoomsRef = useRef(rooms)

  useEffect(() => {
    if (useGuestsPerRoomMode && !prevModeRef.current) {
      const oldTotal = guests
      const perRoom = Math.min(
        MAX_GUESTS_PER_ROOM,
        Math.max(1, Math.floor(oldTotal / rooms))
      )
      setGuests(perRoom)
    } else if (!useGuestsPerRoomMode && prevModeRef.current) {
      const total = prevRoomsRef.current * guests
      const maxTotal = rooms * MAX_GUESTS_PER_ROOM
      setGuests(Math.min(maxTotal, Math.max(1, total)))
    } else if (!useGuestsPerRoomMode) {
      const maxTotal = rooms * MAX_GUESTS_PER_ROOM
      if (guests > maxTotal) setGuests(maxTotal)
      if (guests < 1) setGuests(1)
    } else if (guests < 1 || guests > MAX_GUESTS_PER_ROOM) {
      setGuests(Math.min(MAX_GUESTS_PER_ROOM, Math.max(1, guests)))
    }

    prevModeRef.current = useGuestsPerRoomMode
    prevRoomsRef.current = rooms
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, useGuestsPerRoomMode])

  const isCheckOutValid = dateRange?.from && dateRange?.to && dateRange.to > dateRange.from

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range) return
    setDateRange(range)
    if (range.from && range.to) {
      setDatePickerOpen(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isCheckOutValid || !dateRange?.from || !dateRange?.to) return

    const params = new URLSearchParams({
      checkIn: toDateString(dateRange.from),
      checkOut: toDateString(dateRange.to),
      rooms: String(rooms),
      guests: String(totalGuests),
    })

    if (useGuestsPerRoomMode) {
      params.set('guestsPerRoom', String(guests))
    }

    router.push(`/book/${slug}/rooms?${params}`)
  }

  const dateRangeLabel = dateRange?.from ? (
    dateRange.to ? (
      <>
        {format(dateRange.from, 'MMM d, yyyy')} – {format(dateRange.to, 'MMM d, yyyy')}
      </>
    ) : (
      format(dateRange.from, 'MMM d, yyyy')
    )
  ) : (
    <span className="text-muted-foreground">Pick your dates</span>
  )

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 text-card-foreground shadow-[0_24px_60px_rgba(8,17,31,0.08)] backdrop-blur-sm dark:bg-card/50"
    >
      <div className="border-b border-border/60 px-5 py-5 sm:px-6">
        <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          Search your stay
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr]">
            <Field label="Dates" className="sm:col-span-2 lg:col-span-1">
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-14 w-full items-center gap-3 rounded-[1.1rem] border border-border/70 bg-background/70 px-4 text-left text-foreground shadow-none outline-none transition-colors hover:bg-background/90 focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-background/50 dark:hover:bg-background/70"
                  >
                    <CalendarDays className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <span>{dateRangeLabel}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                  side="bottom"
                  sideOffset={8}
                  collisionPadding={16}
                >
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from ?? today}
                    selected={dateRange}
                    onSelect={handleRangeSelect}
                    numberOfMonths={2}
                    disabled={(date) => date < today}
                    classNames={{
                      months: 'flex flex-col sm:flex-row gap-4',
                      month: 'flex flex-col gap-4',
                      caption: 'flex justify-center pt-1',
                      nav: 'flex gap-1',
                      table: 'w-full border-collapse',
                      head_row: 'flex',
                      head_cell: 'rounded-md w-9 font-normal text-[0.8rem] text-muted-foreground',
                      row: 'flex w-full mt-2',
                      cell: 'relative p-0 text-center text-sm focus-within:relative',
                      day: 'h-9 w-9 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md',
                    }}
                  />
                </PopoverContent>
              </Popover>
              {!isCheckOutValid && dateRange?.from && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  Select check-out date after check-in
                </p>
              )}
            </Field>

            <CounterCard
              label="Rooms"
              hint="Choose how many rooms you need"
              value={rooms}
              onDecrease={() => setRooms((r) => Math.max(1, r - 1))}
              onIncrease={() => setRooms((r) => Math.min(10, r + 1))}
              decreaseLabel="Decrease rooms"
              increaseLabel="Increase rooms"
            />

            <CounterCard
              label={
                useGuestsPerRoomMode
                  ? 'Guests per room'
                  : 'Guests'
              }
              hint={
                useGuestsPerRoomMode
                  ? 'Maximum 3 guests per room'
                  : `Up to ${rooms * MAX_GUESTS_PER_ROOM} guests`
              }
              value={guests}
              valueSuffix={useGuestsPerRoomMode ? ' per room' : ''}
              onDecrease={() => setGuests((g) => Math.max(1, g - 1))}
              onIncrease={() =>
                setGuests((g) =>
                  useGuestsPerRoomMode
                    ? Math.min(MAX_GUESTS_PER_ROOM, g + 1)
                    : Math.min(rooms * MAX_GUESTS_PER_ROOM, g + 1)
                )
              }
              decreaseLabel="Decrease guests"
              increaseLabel="Increase guests"
            />
          </div>

          <div className="rounded-[1.35rem] border border-border/60 bg-background/55 px-4 py-4 dark:bg-background/35">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Summary
                </div>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {rooms} room{rooms !== 1 ? 's' : ''},{' '}
                  {totalGuests} guest{totalGuests !== 1 ? 's' : ''}.
                  {useGuestsPerRoomMode ? ' Guests will be applied per room.' : ''}
                </p>
              </div>

              <div className="hidden rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground sm:block">
                Direct booking
              </div>
            </div>
          </div>

          <Button
            type="submit"
            color="blue"
            className="h-14 w-full rounded-[1.1rem] text-sm font-medium"
            disabled={!isCheckOutValid}
          >
            <CalendarCheck className="mr-2 h-4 w-4" aria-hidden />
            See rooms & rates
          </Button>
        </div>
      </div>
    </form>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

function CounterCard({
  label,
  hint,
  value,
  valueSuffix,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
}: {
  label: string
  hint: string
  value: number
  valueSuffix?: string
  onDecrease: () => void
  onIncrease: () => void
  decreaseLabel: string
  increaseLabel: string
}) {
  return (
    <div className="rounded-[1.35rem] border border-border/60 bg-background/55 p-4 dark:bg-background/35">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{hint}</p>
        </div>

        <div className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-sm font-medium text-foreground dark:bg-card/70">
          {value}
          {valueSuffix}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          aria-label={decreaseLabel}
          onClick={onDecrease}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition-colors hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-primary/15 dark:bg-card/70"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="min-w-[2.5rem] text-center text-lg font-medium tracking-tight text-foreground">
          {value}
        </div>

        <button
          type="button"
          aria-label={increaseLabel}
          onClick={onIncrease}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition-colors hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-primary/15 dark:bg-card/70"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function InfoPill({
  icon,
  text,
}: {
  icon: React.ReactNode
  text: string
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground dark:bg-background/40">
      {icon}
      {text}
    </span>
  )
}