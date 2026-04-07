'use client'

import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppRouter } from '@/hooks/useAppRouter'
import { differenceInCalendarDays, format } from 'date-fns'
import {
  BedDouble,
  CalendarCheck,
  Loader2,
  LogIn,
  LogOut,
  Minus,
  MoonStar,
  Plus,
  Users,
} from 'lucide-react'

import { Button } from '@/components/Button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

import {
  MAX_GUESTS_PER_ROOM,
  ROOMS_FOR_GUESTS_PER_ROOM_MODE,
  clampGuestsPerRoom,
  clampTotalGuests,
  getMaxTotalGuests,
} from '@/lib/booking-constants'

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(date: Date, days: number): Date {
  const out = new Date(date)
  out.setDate(out.getDate() + days)
  return out
}

function startOfDay(d: Date): Date {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  return out
}

type BookSearchFormProps = {
  slug: string
  propertyName?: string
  location?: string
}

const calendarClassNames = {
  months: 'flex flex-col gap-4',
  month: 'flex flex-col gap-4',
  caption: 'relative flex items-center justify-center pt-1',
  caption_label: 'text-sm font-medium text-foreground',
  nav: 'flex items-center gap-1',
  nav_button:
    'inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background text-foreground hover:bg-muted',
  nav_button_previous: 'absolute left-1',
  nav_button_next: 'absolute right-1',
  table: 'w-full border-collapse',
  head_row: 'flex',
  head_cell: 'w-9 rounded-md text-[0.78rem] font-normal text-muted-foreground',
  row: 'mt-2 flex w-full',
  cell: 'relative p-0 text-center text-sm focus-within:relative',
  day: 'h-9 w-9 rounded-md p-0 font-normal text-foreground transition hover:bg-accent hover:text-accent-foreground aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:hover:bg-primary aria-selected:hover:text-primary-foreground',
  day_today: 'bg-muted text-foreground',
  day_selected:
    'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
  day_disabled: 'text-muted-foreground/40 opacity-50',
  day_outside: 'text-muted-foreground/35 opacity-40',
  day_hidden: 'invisible',
}

export function BookSearchForm({
  slug,
  propertyName,
  location,
}: BookSearchFormProps) {
  const router = useAppRouter()
  const today = useMemo(() => startOfDay(new Date()), [])
  const tomorrow = useMemo(() => addDays(today, 1), [today])

  const [checkIn, setCheckIn] = useState<Date | undefined>(today)
  const [checkOut, setCheckOut] = useState<Date | undefined>(tomorrow)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [checkOutOpen, setCheckOutOpen] = useState(false)

  const [rooms, setRooms] = useState(1)
  const [guests, setGuests] = useState(2)
  const [isLoading, setIsLoading] = useState(false)

  const useGuestsPerRoomMode = rooms >= ROOMS_FOR_GUESTS_PER_ROOM_MODE
  const totalGuests = useGuestsPerRoomMode ? rooms * guests : guests

  const nights =
    checkIn && checkOut && startOfDay(checkOut) > startOfDay(checkIn)
      ? differenceInCalendarDays(startOfDay(checkOut), startOfDay(checkIn))
      : 0

  const prevModeRef = useRef(useGuestsPerRoomMode)
  const prevRoomsRef = useRef(rooms)

  useEffect(() => {
    if (useGuestsPerRoomMode && !prevModeRef.current) {
      const perRoom = clampGuestsPerRoom(Math.floor(guests / rooms) || 1)
      setGuests(perRoom)
    } else if (!useGuestsPerRoomMode && prevModeRef.current) {
      setGuests(clampTotalGuests(rooms, prevRoomsRef.current * guests))
    } else if (!useGuestsPerRoomMode) {
      if (guests > getMaxTotalGuests(rooms) || guests < 1) {
        setGuests(clampTotalGuests(rooms, guests))
      }
    } else {
      setGuests((current) => clampGuestsPerRoom(current))
    }

    prevModeRef.current = useGuestsPerRoomMode
    prevRoomsRef.current = rooms
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, useGuestsPerRoomMode])

  const checkOutMin = checkIn ? addDays(checkIn, 1) : tomorrow
  const isCheckOutValid =
    checkIn != null &&
    checkOut != null &&
    startOfDay(checkOut) > startOfDay(checkIn)

  const maxGuestsValue = useGuestsPerRoomMode
    ? MAX_GUESTS_PER_ROOM
    : getMaxTotalGuests(rooms)

  const handleCheckInSelect = (date: Date | undefined) => {
    setCheckIn(date ?? undefined)

    if (date) {
      setCheckInOpen(false)

      if (checkOut && startOfDay(checkOut) <= startOfDay(date)) {
        setCheckOut(addDays(date, 1))
      }
    }
  }

  const handleCheckOutSelect = (date: Date | undefined) => {
    setCheckOut(date ?? undefined)
    if (date) setCheckOutOpen(false)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isCheckOutValid || !checkIn || !checkOut) return

    const params = new URLSearchParams({
      checkIn: toDateString(checkIn),
      checkOut: toDateString(checkOut),
      rooms: String(rooms),
      guests: String(totalGuests),
    })

    if (useGuestsPerRoomMode) {
      params.set('guestsPerRoom', String(guests))
    }

    setIsLoading(true)

    try {
      router.push(`/book/${slug}/rooms?${params.toString()}`)
    } catch {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-full overflow-hidden rounded-[1.5rem] border border-border/60 bg-background/60 text-card-foreground shadow-[0_28px_80px_rgba(8,17,31,0.10)] backdrop-blur-2xl sm:rounded-[2rem] dark:bg-background/30"
    >
      <div className="border-b border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),transparent)] px-4 py-5 sm:px-6 sm:py-6">
        <div className="min-w-0 max-w-sm">
          <h2 className="font-serif text-2xl tracking-[-0.04em] text-foreground">
            Select dates and occupancy
          </h2>

          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {propertyName
              ? `Choose your stay details for ${propertyName}.`
              : 'Choose your stay details to see available room types and plans.'}
          </p>

          {location ? (
            <p className="mt-1 hidden text-xs leading-6 text-muted-foreground sm:block">
              {location}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">
        <section className="overflow-hidden rounded-[1.35rem] border border-border/60 bg-background/72 p-4 backdrop-blur-xl sm:rounded-[1.6rem] sm:p-5 dark:bg-background/35">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Stay dates
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Pick check-in and check-out first. The next step will show room types and plans.
              </p>
            </div>

            <div className="self-start rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground dark:bg-background/40">
              {nights > 0 ? `${nights} night${nights === 1 ? '' : 's'}` : 'Choose dates'}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Check-in">
              <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex min-h-[4.25rem] w-full min-w-0 items-center gap-3 rounded-[1.15rem] border border-border/70 bg-background/80 px-4 text-left text-foreground shadow-none outline-none transition hover:bg-background focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-background/40"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/90 dark:bg-background/45">
                      <LogIn className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Arrival
                      </div>
                      <div className="mt-1 truncate text-sm font-medium text-foreground sm:text-base">
                        {checkIn ? format(checkIn, 'EEE, MMM d, yyyy') : 'Select date'}
                      </div>
                    </div>
                  </button>
                </PopoverTrigger>

                <PopoverContent
                  className="w-[calc(100vw-1rem)] max-w-[23rem] rounded-[1.35rem] border border-border/60 bg-popover/95 p-2.5 shadow-[0_24px_60px_rgba(8,17,31,0.16)] backdrop-blur-2xl sm:rounded-[1.5rem] sm:p-3"
                  align="start"
                  side="bottom"
                  sideOffset={10}
                  collisionPadding={8}
                >
                  <Calendar
                    mode="single"
                    defaultMonth={checkIn ?? today}
                    selected={checkIn}
                    onSelect={handleCheckInSelect}
                    disabled={(date) => startOfDay(date) < today}
                    className="rounded-[1.1rem]"
                    classNames={calendarClassNames}
                  />
                </PopoverContent>
              </Popover>
            </Field>

            <Field label="Check-out">
              <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex min-h-[4.25rem] w-full min-w-0 items-center gap-3 rounded-[1.15rem] border border-border/70 bg-background/80 px-4 text-left text-foreground shadow-none outline-none transition hover:bg-background focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-background/40"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/90 dark:bg-background/45">
                      <LogOut className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Departure
                      </div>
                      <div className="mt-1 truncate text-sm font-medium text-foreground sm:text-base">
                        {checkOut ? format(checkOut, 'EEE, MMM d, yyyy') : 'Select date'}
                      </div>
                    </div>
                  </button>
                </PopoverTrigger>

                <PopoverContent
                  className="w-[calc(100vw-1rem)] max-w-[23rem] rounded-[1.35rem] border border-border/60 bg-popover/95 p-2.5 shadow-[0_24px_60px_rgba(8,17,31,0.16)] backdrop-blur-2xl sm:rounded-[1.5rem] sm:p-3"
                  align="start"
                  side="bottom"
                  sideOffset={10}
                  collisionPadding={8}
                >
                  <Calendar
                    mode="single"
                    defaultMonth={checkOut ?? checkOutMin}
                    selected={checkOut}
                    onSelect={handleCheckOutSelect}
                    disabled={(date) => startOfDay(date) < startOfDay(checkOutMin)}
                    className="rounded-[1.1rem]"
                    classNames={calendarClassNames}
                  />
                </PopoverContent>
              </Popover>

              {!isCheckOutValid && checkIn && checkOut ? (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  Check-out must be after check-in.
                </p>
              ) : null}
            </Field>
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.35rem] border border-border/60 bg-background/72 p-4 backdrop-blur-xl sm:rounded-[1.6rem] sm:p-5 dark:bg-background/35">
          <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            Occupancy
          </div>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Set rooms and guests now so the next page shows the right availability and pricing.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <CounterCard
              icon={<BedDouble className="h-4 w-4" />}
              label="Rooms"
              hint="How many rooms do you need?"
              value={rooms}
              min={1}
              max={10}
              onDecrease={() => setRooms((current) => Math.max(1, current - 1))}
              onIncrease={() => setRooms((current) => Math.min(10, current + 1))}
              decreaseLabel="Decrease rooms"
              increaseLabel="Increase rooms"
            />

            <CounterCard
              icon={<Users className="h-4 w-4" />}
              label={useGuestsPerRoomMode ? 'Guests per room' : 'Guests'}
              hint={
                useGuestsPerRoomMode
                  ? `Maximum ${MAX_GUESTS_PER_ROOM} guests per room`
                  : `Up to ${getMaxTotalGuests(rooms)} guests in total`
              }
              value={guests}
              valueBadge={useGuestsPerRoomMode ? 'Per room' : 'Total'}
              min={1}
              max={maxGuestsValue}
              onDecrease={() => setGuests((current) => Math.max(1, current - 1))}
              onIncrease={() =>
                setGuests((current) =>
                  useGuestsPerRoomMode
                    ? clampGuestsPerRoom(current + 1)
                    : clampTotalGuests(rooms, current + 1)
                )
              }
              decreaseLabel="Decrease guests"
              increaseLabel="Increase guests"
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.35rem] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03))] p-4 backdrop-blur-2xl sm:rounded-[1.6rem] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]">
          <div className="flex flex-wrap gap-2">
            <SummaryPill
              icon={<MoonStar className="h-3.5 w-3.5" />}
              text={
                nights > 0
                  ? `${nights} night${nights === 1 ? '' : 's'}`
                  : 'Choose stay length'
              }
            />
            <SummaryPill
              icon={<BedDouble className="h-3.5 w-3.5" />}
              text={`${rooms} room${rooms === 1 ? '' : 's'}`}
            />
            <SummaryPill
              icon={<Users className="h-3.5 w-3.5" />}
              text={`${totalGuests} guest${totalGuests === 1 ? '' : 's'}`}
            />
          </div>

          <Separator className="my-4 bg-border/60" />

          <p className="text-sm leading-7 text-muted-foreground">
            {useGuestsPerRoomMode
              ? `You have selected ${rooms} rooms with ${guests} guest${guests === 1 ? '' : 's'} per room.`
              : `You have selected ${rooms} room${rooms === 1 ? '' : 's'} for ${totalGuests} guest${totalGuests === 1 ? '' : 's'}.`}
          </p>
        </section>

        <div className="space-y-3">
          <Button
            type="submit"
            color="blue"
            className="h-14 w-full rounded-[1.15rem] text-sm font-medium shadow-[0_14px_34px_rgba(37,99,235,0.22)]"
            disabled={!isCheckOutValid || isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <CalendarCheck className="mr-2 h-4 w-4" aria-hidden />
            )}
            {isLoading ? 'Loading rooms…' : 'See rooms & rates'}
          </Button>

          <p className="px-1 text-center text-xs leading-6 text-muted-foreground">
            Next, we’ll show available room types and plans for your selected dates.
          </p>
        </div>
      </div>
    </form>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

function CounterCard({
  icon,
  label,
  hint,
  value,
  valueBadge,
  min,
  max,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
}: {
  icon: ReactNode
  label: string
  hint: string
  value: number
  valueBadge?: string
  min: number
  max: number
  onDecrease: () => void
  onIncrease: () => void
  decreaseLabel: string
  increaseLabel: string
}) {
  const canDecrease = value > min
  const canIncrease = value < max

  return (
    <div className="min-w-0 rounded-[1.25rem] border border-border/60 bg-background/80 p-4 shadow-[0_10px_28px_rgba(8,17,31,0.03)] dark:bg-background/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/90 text-foreground dark:bg-background/45">
              {icon}
            </span>
            <span className="truncate">{label}</span>
          </div>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">{hint}</p>
        </div>

        <div className="inline-flex shrink-0 self-start rounded-full border border-border/60 bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground dark:bg-background/45">
          {valueBadge ?? value}
          {valueBadge ? ` · ${value}` : ''}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label={decreaseLabel}
          onClick={onDecrease}
          disabled={!canDecrease}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/90 text-foreground transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-background/45"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="min-w-[3rem] text-center text-2xl font-medium tracking-tight text-foreground">
          {value}
        </div>

        <button
          type="button"
          aria-label={increaseLabel}
          onClick={onIncrease}
          disabled={!canIncrease}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/90 text-foreground transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-background/45"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function SummaryPill({
  icon,
  text,
}: {
  icon: ReactNode
  text: string
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-background/72 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-xl dark:bg-background/35">
      {icon}
      <span className="truncate">{text}</span>
    </span>
  )
}