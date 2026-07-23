'use client'

import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppRouter } from '@/hooks/useAppRouter'
import { usePrefetchBookRooms } from '@/hooks/usePrefetchBookRooms'
import {
  buildBookHourlyRoomsPath,
  buildBookRoomsPath,
} from '@/lib/book-rooms-url'
import type { PublicHourlyStaySummary } from '@/lib/api'
import { differenceInCalendarDays, format } from 'date-fns'
import {
  BedDouble,
  CalendarCheck,
  Clock,
  LogIn,
  LogOut,
  Minus,
  MoonStar,
  Plus,
  Users,
} from 'lucide-react'

import { Button } from '@/components/Button'
import { Calendar } from '@/components/ui/calendar'
import { StayModeToggle, type StayMode } from '@/components/StayModeToggle'
import { track } from '@/lib/analytics/client'
import { cn } from '@/lib/utils'
import {
  buildHourlyStartTimeOptions,
  nextHourlyStartTime,
  toLocalDateString,
} from '@/lib/hourly-start-times'
import { addDaysYmd, kolkataYmd, ymdToLocalDate } from '@/lib/kolkata-calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

import {
  MAX_GUESTS_PER_ROOM,
  ROOMS_FOR_GUESTS_PER_ROOM_MODE,
  clampGuestsPerRoom,
  clampTotalGuests,
  getMaxTotalGuests,
} from '@/lib/booking-constants'

const HOURLY_MAX_GUESTS = 3
const DEFAULT_DURATIONS = [3, 6, 9]

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

function formatStartTimeLabel(hhMm: string): string {
  const [hRaw, mRaw] = hhMm.split(':').map(Number)
  const h = hRaw ?? 0
  const m = mRaw ?? 0
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

type BookSearchFormProps = {
  slug: string
  propertyName?: string
  location?: string
  initialCouponCode?: string
  hourlyStay?: PublicHourlyStaySummary | null
  initialStayKind?: StayMode
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
  initialCouponCode,
  hourlyStay,
  initialStayKind = 'overnight',
}: BookSearchFormProps) {
  const router = useAppRouter()
  const todayYmd = useMemo(() => kolkataYmd(), [])
  const today = useMemo(() => ymdToLocalDate(todayYmd), [todayYmd])
  const tomorrow = useMemo(
    () => ymdToLocalDate(addDaysYmd(todayYmd, 1)),
    [todayYmd],
  )

  const hourlyEnabled = hourlyStay?.enabled === true
  const [stayMode, setStayMode] = useState<StayMode>(
    hourlyEnabled && initialStayKind === 'hourly' ? 'hourly' : 'overnight',
  )

  const [checkIn, setCheckIn] = useState<Date | undefined>(today)
  const [checkOut, setCheckOut] = useState<Date | undefined>(tomorrow)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [checkOutOpen, setCheckOutOpen] = useState(false)
  const [hourlyDateOpen, setHourlyDateOpen] = useState(false)

  const [rooms, setRooms] = useState(1)
  const [guests, setGuests] = useState(2)

  const durations = hourlyStay?.durationsHours?.length
    ? hourlyStay.durationsHours
    : DEFAULT_DURATIONS
  const windowStart = hourlyStay?.windowStart ?? '10:00'
  const windowEnd = hourlyStay?.windowEnd ?? '21:00'

  const [durationHours, setDurationHours] = useState(durations[0] ?? 3)
  const [startTime, setStartTime] = useState(() => {
    const dateYmd = toLocalDateString(new Date())
    return (
      nextHourlyStartTime({
        windowStart,
        windowEnd,
        durationHours: durations[0] ?? 3,
        dateYmd,
        forceEarliest: true,
      }) ?? windowStart
    )
  })
  /** Recompute available starts as the clock advances (today only). */
  const [nowTick, setNowTick] = useState(() => Date.now())

  const isHourly = stayMode === 'hourly' && hourlyEnabled

  const useGuestsPerRoomMode =
    !isHourly && rooms >= ROOMS_FOR_GUESTS_PER_ROOM_MODE
  const totalGuests = useGuestsPerRoomMode ? rooms * guests : guests

  const nights =
    checkIn && checkOut && startOfDay(checkOut) > startOfDay(checkIn)
      ? differenceInCalendarDays(startOfDay(checkOut), startOfDay(checkIn))
      : 0

  const prevModeRef = useRef(useGuestsPerRoomMode)
  const prevRoomsRef = useRef(rooms)
  const prevStayModeRef = useRef(stayMode)

  useEffect(() => {
    if (!hourlyEnabled && stayMode === 'hourly') {
      setStayMode('overnight')
    }
  }, [hourlyEnabled, stayMode])

  useEffect(() => {
    if (!isHourly) return
    if (!durations.includes(durationHours)) {
      setDurationHours(durations[0] ?? 3)
    }
  }, [isHourly, durations, durationHours])

  useEffect(() => {
    if (!isHourly) return
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [isHourly])

  const hourlyDateYmd = checkIn ? toLocalDateString(checkIn) : toLocalDateString(new Date())

  const startTimeOptions = useMemo(
    () =>
      buildHourlyStartTimeOptions({
        windowStart,
        windowEnd,
        durationHours,
        dateYmd: hourlyDateYmd,
        now: new Date(nowTick),
      }),
    [windowStart, windowEnd, durationHours, hourlyDateYmd, nowTick],
  )

  // Snap to the next valid slot whenever date/duration/window/time makes the
  // current selection invalid — or when switching into hourly / changing day.
  useEffect(() => {
    if (!isHourly) return
    const next = nextHourlyStartTime({
      windowStart,
      windowEnd,
      durationHours,
      dateYmd: hourlyDateYmd,
      now: new Date(nowTick),
      current: startTime,
    })
    if (next && next !== startTime) {
      setStartTime(next)
    } else if (!next && startTime) {
      setStartTime('')
    }
  }, [
    isHourly,
    windowStart,
    windowEnd,
    durationHours,
    hourlyDateYmd,
    nowTick,
    startTime,
  ])

  useEffect(() => {
    if (prevStayModeRef.current === stayMode) return

    if (stayMode === 'hourly') {
      setGuests((current) => Math.min(HOURLY_MAX_GUESTS, Math.max(1, current)))
      const dateYmd = checkIn
        ? toLocalDateString(checkIn)
        : toLocalDateString(new Date())
      const next = nextHourlyStartTime({
        windowStart,
        windowEnd,
        durationHours,
        dateYmd,
        forceEarliest: true,
      })
      if (next) setStartTime(next)
    }

    prevStayModeRef.current = stayMode
  }, [stayMode, checkIn, windowStart, windowEnd, durationHours])

  useEffect(() => {
    if (isHourly) return

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
  }, [rooms, useGuestsPerRoomMode, isHourly])

  const checkOutMin = checkIn ? addDays(checkIn, 1) : tomorrow
  const isCheckOutValid =
    checkIn != null &&
    checkOut != null &&
    startOfDay(checkOut) > startOfDay(checkIn)

  const isHourlyValid =
    checkIn != null &&
    startTimeOptions.length > 0 &&
    durations.includes(durationHours) &&
    startTimeOptions.includes(startTime)

  const canSubmit = isHourly ? isHourlyValid : isCheckOutValid

  const maxGuestsValue = isHourly
    ? HOURLY_MAX_GUESTS
    : useGuestsPerRoomMode
      ? MAX_GUESTS_PER_ROOM
      : getMaxTotalGuests(rooms)

  const roomsUrl = useMemo(() => {
    if (!canSubmit || !checkIn) return null

    if (isHourly) {
      return buildBookHourlyRoomsPath({
        slug,
        date: toDateString(checkIn),
        startTime,
        durationHours,
        guests,
      })
    }

    if (!checkOut) return null
    return buildBookRoomsPath({
      slug,
      checkIn: toDateString(checkIn),
      checkOut: toDateString(checkOut),
      rooms,
      totalGuests,
      ...(useGuestsPerRoomMode ? { guestsPerRoom: guests } : {}),
      ...(initialCouponCode ? { couponCode: initialCouponCode } : {}),
    })
  }, [
    slug,
    checkIn,
    checkOut,
    rooms,
    totalGuests,
    useGuestsPerRoomMode,
    guests,
    initialCouponCode,
    canSubmit,
    isHourly,
    startTime,
    durationHours,
  ])

  const { prefetchRooms } = usePrefetchBookRooms(roomsUrl)

  const handleCheckInSelect = (date: Date | undefined) => {
    setCheckIn(date ?? undefined)

    if (date) {
      setCheckInOpen(false)
      setHourlyDateOpen(false)

      if (checkOut && startOfDay(checkOut) <= startOfDay(date)) {
        setCheckOut(addDays(date, 1))
      }
    }
  }

  const handleCheckOutSelect = (date: Date | undefined) => {
    setCheckOut(date ?? undefined)
    if (date) setCheckOutOpen(false)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!roomsUrl || !checkIn) return

    if (isHourly) {
      track(
        'dates_selected',
        {
          stayKind: 'hourly',
          checkIn: toDateString(checkIn),
          startTime,
          durationHours,
          guests,
        },
        slug,
      )
    } else {
      if (!checkOut) return
      track(
        'dates_selected',
        {
          checkIn: toDateString(checkIn),
          checkOut: toDateString(checkOut),
          nights: differenceInCalendarDays(checkOut, checkIn),
          rooms,
          totalGuests,
          guestsPerRoom: useGuestsPerRoomMode ? guests : null,
        },
        slug,
      )
    }

    prefetchRooms()
    router.push(roomsUrl)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-full overflow-hidden rounded-[1.5rem] border border-border/60 bg-background/60 text-card-foreground shadow-[0_28px_80px_rgba(8,17,31,0.10)] backdrop-blur-2xl dark:bg-background/30 sm:rounded-[2rem]"
    >
      <div className="border-b border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),transparent)] px-4 py-5 sm:px-6 sm:py-6">
        <div className="min-w-0 max-w-sm">
          <h2 className="font-serif text-2xl tracking-[-0.04em] text-foreground">
            {isHourly
              ? 'Select date and duration'
              : 'Select dates and occupancy'}
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
        {hourlyEnabled ? (
          <StayModeToggle value={stayMode} onChange={setStayMode} prominent />
        ) : null}

        {isHourly ? (
          <>
            <section className="bg-background/72 overflow-hidden rounded-[1.35rem] border border-border/60 p-4 backdrop-blur-xl dark:bg-background/35 sm:rounded-[1.6rem] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                    Stay date
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Pick a date, then choose how long you want to stay and when
                    to arrive.
                  </p>
                </div>

                <div className="self-start rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground dark:bg-background/40">
                  {`${durationHours} hour${durationHours === 1 ? '' : 's'}`}
                </div>
              </div>

              <div className="mt-5">
                <Field label="Date">
                  <Popover
                    open={hourlyDateOpen}
                    onOpenChange={setHourlyDateOpen}
                  >
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
                            Day of stay
                          </div>
                          <div className="mt-1 truncate text-sm font-medium text-foreground sm:text-base">
                            {checkIn
                              ? format(checkIn, 'EEE, MMM d, yyyy')
                              : 'Select date'}
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
              </div>

              <div className="mt-5 space-y-3">
                <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Duration
                </div>
                <div className="flex flex-wrap gap-2">
                  {durations.map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setDurationHours(hours)}
                      className={cn(
                        'min-h-11 min-w-[4.25rem] rounded-full border px-4 text-sm font-medium transition',
                        durationHours === hours
                          ? 'border-primary bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(37,99,235,0.18)]'
                          : 'border-border/70 bg-background/80 text-foreground hover:bg-background dark:bg-background/40',
                      )}
                    >
                      {hours}h
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <Field label="Start time">
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger className="flex h-auto min-h-[4.25rem] w-full items-center gap-3 rounded-[1.15rem] border border-border/70 bg-background/80 px-4 text-left text-foreground shadow-none outline-none transition hover:bg-background focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-background/40 [&>svg]:ml-auto">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/90 dark:bg-background/45">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Arrival window
                          </div>
                          <div className="mt-1 truncate text-sm font-medium text-foreground sm:text-base">
                            <SelectValue placeholder="Select time">
                              {startTime
                                ? formatStartTimeLabel(startTime)
                                : 'Select time'}
                            </SelectValue>
                          </div>
                        </div>
                      </div>
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      sideOffset={8}
                      collisionPadding={12}
                      className="max-h-[min(16rem,calc(100dvh-10rem))] rounded-[1.15rem]"
                    >
                      {startTimeOptions.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          No starts left today for this duration — pick another
                          date or a shorter package
                        </div>
                      ) : (
                        startTimeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {formatStartTimeLabel(time)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </section>

            <section className="bg-background/72 overflow-hidden rounded-[1.35rem] border border-border/60 p-4 backdrop-blur-xl dark:bg-background/35 sm:rounded-[1.6rem] sm:p-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Guests
              </div>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Hourly stays are for up to {HOURLY_MAX_GUESTS} guests.
              </p>

              <div className="mt-5">
                <CounterCard
                  icon={<Users className="h-4 w-4" />}
                  label="Guests"
                  hint={`Up to ${HOURLY_MAX_GUESTS} guests`}
                  value={guests}
                  valueBadge="Total"
                  min={1}
                  max={HOURLY_MAX_GUESTS}
                  onDecrease={() =>
                    setGuests((current) => Math.max(1, current - 1))
                  }
                  onIncrease={() =>
                    setGuests((current) =>
                      Math.min(HOURLY_MAX_GUESTS, current + 1),
                    )
                  }
                  decreaseLabel="Decrease guests"
                  increaseLabel="Increase guests"
                />
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="bg-background/72 overflow-hidden rounded-[1.35rem] border border-border/60 p-4 backdrop-blur-xl dark:bg-background/35 sm:rounded-[1.6rem] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                    Stay dates
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Pick check-in and check-out first. The next step will show
                    room types and plans.
                  </p>
                </div>

                <div className="self-start rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground dark:bg-background/40">
                  {nights > 0
                    ? `${nights} night${nights === 1 ? '' : 's'}`
                    : 'Choose dates'}
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
                            {checkIn
                              ? format(checkIn, 'EEE, MMM d, yyyy')
                              : 'Select date'}
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
                            {checkOut
                              ? format(checkOut, 'EEE, MMM d, yyyy')
                              : 'Select date'}
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
                        disabled={(date) =>
                          startOfDay(date) < startOfDay(checkOutMin)
                        }
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

            <section className="bg-background/72 overflow-hidden rounded-[1.35rem] border border-border/60 p-4 backdrop-blur-xl dark:bg-background/35 sm:rounded-[1.6rem] sm:p-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Occupancy
              </div>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Set rooms and guests now so the next page shows the right
                availability and pricing.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <CounterCard
                  icon={<BedDouble className="h-4 w-4" />}
                  label="Rooms"
                  hint="How many rooms do you need?"
                  value={rooms}
                  min={1}
                  max={10}
                  onDecrease={() =>
                    setRooms((current) => Math.max(1, current - 1))
                  }
                  onIncrease={() =>
                    setRooms((current) => Math.min(10, current + 1))
                  }
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
                  onDecrease={() =>
                    setGuests((current) => Math.max(1, current - 1))
                  }
                  onIncrease={() =>
                    setGuests((current) =>
                      useGuestsPerRoomMode
                        ? clampGuestsPerRoom(current + 1)
                        : clampTotalGuests(rooms, current + 1),
                    )
                  }
                  decreaseLabel="Decrease guests"
                  increaseLabel="Increase guests"
                />
              </div>
            </section>
          </>
        )}

        <section className="overflow-hidden rounded-[1.35rem] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03))] p-4 backdrop-blur-2xl dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] sm:rounded-[1.6rem]">
          <div className="flex flex-wrap gap-2">
            {isHourly ? (
              <>
                <SummaryPill
                  icon={<Clock className="h-3.5 w-3.5" />}
                  text={`${durationHours} hour${
                    durationHours === 1 ? '' : 's'
                  }`}
                />
                <SummaryPill
                  icon={<Users className="h-3.5 w-3.5" />}
                  text={`${guests} guest${guests === 1 ? '' : 's'}`}
                />
                <SummaryPill
                  icon={<Clock className="h-3.5 w-3.5" />}
                  text={
                    startTime
                      ? `Starts ${formatStartTimeLabel(startTime)}`
                      : 'Choose start time'
                  }
                />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          <Separator className="my-4 bg-border/60" />

          <p className="text-sm leading-7 text-muted-foreground">
            {isHourly
              ? `You have selected a ${durationHours}-hour stay for ${guests} guest${
                  guests === 1 ? '' : 's'
                }${
                  startTime
                    ? ` starting at ${formatStartTimeLabel(startTime)}`
                    : ''
                }.`
              : useGuestsPerRoomMode
                ? `You have selected ${rooms} rooms with ${guests} guest${
                    guests === 1 ? '' : 's'
                  } per room.`
                : `You have selected ${rooms} room${
                    rooms === 1 ? '' : 's'
                  } for ${totalGuests} guest${totalGuests === 1 ? '' : 's'}.`}
          </p>
        </section>

        <div className="space-y-3">
          <Button
            type="submit"
            color="blue"
            className="h-14 w-full rounded-[1.15rem] text-sm font-medium shadow-[0_14px_34px_rgba(37,99,235,0.22)]"
            disabled={!canSubmit}
            onMouseEnter={prefetchRooms}
            onFocus={prefetchRooms}
          >
            <CalendarCheck className="mr-2 h-4 w-4" aria-hidden />
            See rooms & rates
          </Button>

          <p className="px-1 text-center text-xs leading-6 text-muted-foreground">
            {isHourly
              ? 'Nothing is booked yet — next, we’ll show rooms available for your time slot.'
              : 'Nothing is booked yet — next, we’ll show rooms and prices for your dates.'}
          </p>
        </div>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
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

function SummaryPill({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="bg-background/72 inline-flex max-w-full items-center gap-2 rounded-full border border-border/70 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-xl dark:bg-background/35">
      {icon}
      <span className="truncate">{text}</span>
    </span>
  )
}
