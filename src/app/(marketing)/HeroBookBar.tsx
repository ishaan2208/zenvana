'use client'

import CloudinaryImage from '@/components/CloudinaryImage'
import { useMemo, useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAppRouter } from '@/hooks/useAppRouter'
import { usePrefetchBookRooms } from '@/hooks/usePrefetchBookRooms'
import {
  buildBookRoomsPath,
  buildBookHourlyRoomsPath,
} from '@/lib/book-rooms-url'
import type { PublicHourlyStaySummary } from '@/lib/api'
import { buildHourlyStartTimeOptions, nextHourlyStartTime, toLocalDateString } from '@/lib/hourly-start-times'
import * as SelectPrimitive from '@radix-ui/react-select'
import {
  Calendar as CalendarIcon,
  Check,
  ChevronRight,
  Clock,
  MapPinned,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
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

import {
  MAX_GUESTS_PER_ROOM,
  ROOMS_FOR_GUESTS_PER_ROOM_MODE,
  getMaxTotalGuests,
  clampGuestsPerRoom,
  clampTotalGuests,
} from '@/lib/booking-constants'
import { cn } from '@/lib/utils'

const calendarClassNames = {
  months: 'flex flex-col gap-4',
  month: 'flex flex-col gap-4',
  caption: 'flex justify-center pt-1',
  nav: 'flex gap-1',
  table: 'w-full border-collapse',
  head_row: 'flex',
  head_cell: 'rounded-md w-9 font-normal text-[0.8rem] text-muted-foreground',
  row: 'flex w-full mt-2',
  cell: 'relative p-0 text-center text-sm focus-within:relative',
  day: 'h-9 w-9 rounded-md p-0 font-normal hover:bg-accent hover:text-accent-foreground aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:hover:bg-primary aria-selected:hover:text-primary-foreground',
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function startOfDay(d: Date): Date {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  return out
}

export type HeroBookBarProperty = {
  slug: string
  publicName: string
  heroImageUrl?: string
  fullAddress?: string
  hourlyStayEnabled?: boolean
  hourlyStay?: PublicHourlyStaySummary
}

type HeroBookBarProps = {
  properties: HeroBookBarProperty[]
}

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

type StayMode = 'overnight' | 'hourly'

export function HeroBookBar({ properties }: HeroBookBarProps) {
  const router = useAppRouter()
  const pathname = usePathname()
  const today = useMemo(() => new Date(), [])
  const tomorrow = useMemo(() => {
    const d = new Date(today)
    d.setDate(d.getDate() + 1)
    return d
  }, [today])

  const hourlyProperties = useMemo(
    () =>
      properties.filter(
        (p) => p.hourlyStayEnabled === true || p.hourlyStay?.enabled === true,
      ),
    [properties],
  )
  const anyHourly = hourlyProperties.length > 0

  const [stayMode, setStayMode] = useState<StayMode>('overnight')
  const [slug, setSlug] = useState('')
  const [checkIn, setCheckIn] = useState<Date | undefined>(today)
  const [checkOut, setCheckOut] = useState<Date | undefined>(tomorrow)
  const [rooms, setRooms] = useState('1')
  const [guests, setGuests] = useState('2')
  const [durationHours, setDurationHours] = useState(3)
  const [startTime, setStartTime] = useState(() =>
    nextHourlyStartTime({
      windowStart: '10:00',
      windowEnd: '21:00',
      durationHours: 3,
      dateYmd: toLocalDateString(new Date()),
      forceEarliest: true,
    }) ?? '10:00',
  )
  const [nowTick, setNowTick] = useState(() => Date.now())

  const propertyOptions = stayMode === 'hourly' ? hourlyProperties : properties

  const roomsNum = parseInt(rooms, 10) || 1
  const useGuestsPerRoomMode = roomsNum >= ROOMS_FOR_GUESTS_PER_ROOM_MODE
  const guestsNum = parseInt(guests, 10) || 1
  const totalGuests = useGuestsPerRoomMode ? roomsNum * guestsNum : guestsNum
  const prevModeRef = useRef(useGuestsPerRoomMode)
  const prevRoomsRef = useRef(roomsNum)

  useEffect(() => {
    if (useGuestsPerRoomMode && !prevModeRef.current) {
      const perRoom = clampGuestsPerRoom(Math.floor(guestsNum / roomsNum))
      setGuests(String(perRoom))
    } else if (!useGuestsPerRoomMode && prevModeRef.current) {
      setGuests(
        String(clampTotalGuests(roomsNum, prevRoomsRef.current * guestsNum)),
      )
    } else if (!useGuestsPerRoomMode) {
      if (guestsNum > getMaxTotalGuests(roomsNum) || guestsNum < 1) {
        setGuests(String(clampTotalGuests(roomsNum, guestsNum)))
      }
    } else if (guestsNum < 1 || guestsNum > MAX_GUESTS_PER_ROOM) {
      setGuests(String(clampGuestsPerRoom(guestsNum)))
    }
    prevModeRef.current = useGuestsPerRoomMode
    prevRoomsRef.current = roomsNum
  }, [roomsNum, useGuestsPerRoomMode, totalGuests, guestsNum])

  const selectedProperty = useMemo(
    () => propertyOptions.find((p) => p.slug === slug),
    [propertyOptions, slug],
  )

  const hourlyConfig = selectedProperty?.hourlyStay
  const durations = hourlyConfig?.durationsHours?.length
    ? hourlyConfig.durationsHours
    : [3, 6, 9]
  const windowStart = hourlyConfig?.windowStart ?? '10:00'
  const windowEnd = hourlyConfig?.windowEnd ?? '21:00'

  useEffect(() => {
    if (stayMode !== 'hourly') return
    if (slug && !propertyOptions.some((p) => p.slug === slug)) {
      setSlug('')
    }
  }, [stayMode, slug, propertyOptions])

  useEffect(() => {
    if (stayMode !== 'hourly') return
    if (!durations.includes(durationHours)) {
      setDurationHours(durations[0] ?? 3)
    }
  }, [stayMode, durations, durationHours])

  useEffect(() => {
    if (stayMode !== 'hourly') return
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [stayMode])

  const startTimeOptions = useMemo(() => {
    const dateYmd = checkIn ? toLocalDateString(checkIn) : toLocalDateString(new Date())
    return buildHourlyStartTimeOptions({
      windowStart,
      windowEnd,
      durationHours,
      dateYmd,
      now: new Date(nowTick),
    })
  }, [windowStart, windowEnd, durationHours, checkIn, nowTick])

  useEffect(() => {
    if (stayMode !== 'hourly') return
    const dateYmd = checkIn
      ? toLocalDateString(checkIn)
      : toLocalDateString(new Date())
    const next = nextHourlyStartTime({
      windowStart,
      windowEnd,
      durationHours,
      dateYmd,
      now: new Date(nowTick),
      current: startTime,
    })
    if (next && next !== startTime) setStartTime(next)
    else if (!next && startTime) setStartTime('')
  }, [
    stayMode,
    windowStart,
    windowEnd,
    durationHours,
    checkIn,
    nowTick,
    startTime,
  ])

  const checkInMin = today
  const checkOutMin = useMemo(() => {
    if (!checkIn) return tomorrow
    const d = new Date(checkIn)
    d.setDate(d.getDate() + 1)
    return d
  }, [checkIn, tomorrow])

  const isCheckOutValid =
    checkIn != null && checkOut != null && checkOut > checkIn
  const isHourlyValid =
    Boolean(slug) &&
    checkIn != null &&
    startTimeOptions.length > 0 &&
    durations.includes(durationHours)

  const canSubmit =
    stayMode === 'hourly' ? isHourlyValid : Boolean(slug) && isCheckOutValid

  const roomsUrl = useMemo(() => {
    if (!canSubmit || !checkIn || !slug) return null
    if (stayMode === 'hourly') {
      return buildBookHourlyRoomsPath({
        slug,
        date: toDateString(checkIn),
        startTime,
        durationHours,
        guests: guestsNum,
        returnTo: pathname ?? '/',
      })
    }
    if (!checkOut) return null
    return buildBookRoomsPath({
      slug,
      checkIn: toDateString(checkIn),
      checkOut: toDateString(checkOut),
      rooms: roomsNum,
      totalGuests,
      ...(useGuestsPerRoomMode ? { guestsPerRoom: guestsNum } : {}),
      returnTo: pathname ?? '/',
    })
  }, [
    stayMode,
    slug,
    checkIn,
    checkOut,
    startTime,
    durationHours,
    roomsNum,
    totalGuests,
    useGuestsPerRoomMode,
    guestsNum,
    canSubmit,
    pathname,
  ])

  const { prefetchRooms } = usePrefetchBookRooms(roomsUrl)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!roomsUrl) return
    prefetchRooms()
    router.push(roomsUrl)
  }

  const submitHint = !slug
    ? 'Select a property to continue'
    : stayMode === 'hourly'
      ? !isHourlyValid
        ? 'Choose a date, duration, and start time'
        : null
      : !isCheckOutValid
        ? 'Choose valid check-in and check-out dates'
        : null

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full"
      aria-label="Book your stay"
    >
      {anyHourly ? (
        <div
          className="mb-2 flex w-full overflow-hidden rounded-lg border border-border bg-muted/40 p-0.5"
          role="group"
          aria-label="Stay type"
        >
          <button
            type="button"
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition',
              stayMode === 'overnight'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setStayMode('overnight')}
          >
            Overnight
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition',
              stayMode === 'hourly'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => {
              setStayMode('hourly')
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
            }}
          >
            Hourly stay
          </button>
        </div>
      ) : null}
      <div
        className={cn(
          'flex flex-col gap-2 rounded-lg border bg-card p-3 text-card-foreground shadow-sm',
          'sm:flex-row sm:flex-wrap sm:items-center sm:gap-3',
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <label className="sr-only">Property</label>
            <Select value={slug} onValueChange={setSlug}>
              <SelectTrigger className="h-10 w-full border-input bg-background">
                <MapPinned className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Choose property">
                  {selectedProperty?.publicName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={6}
                collisionPadding={{ top: 80, bottom: 96, left: 12, right: 12 }}
                className="max-h-[min(20rem,calc(100dvh-10rem))] w-[max(var(--radix-select-trigger-width),18rem)]"
              >
                {propertyOptions.map((p) => (
                  <SelectPrimitive.Item
                    key={p.slug}
                    value={p.slug}
                    textValue={p.publicName}
                    className={cn(
                      'group/property-option relative flex w-full cursor-default select-none rounded-sm py-2.5 pl-2 pr-8 outline-none',
                      'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
                      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                    )}
                  >
                    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Check className="h-4 w-4" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <span className="flex min-w-0 flex-1 items-start gap-3">
                      {p.heroImageUrl ? (
                        <CloudinaryImage
                          src={p.heroImageUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                          aria-hidden
                        >
                          {p.publicName.slice(0, 2)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 text-left">
                        <SelectPrimitive.ItemText className="block truncate text-sm font-medium leading-snug">
                          {p.publicName}
                        </SelectPrimitive.ItemText>
                        {p.fullAddress ? (
                          <span className="mt-0.5 block truncate text-xs font-normal leading-snug text-muted-foreground transition-colors group-data-[highlighted]/property-option:text-black">
                            {p.fullAddress}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </SelectPrimitive.Item>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'h-10 min-w-0 flex-1 justify-start text-left font-normal',
                  !checkIn && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                {checkIn
                  ? stayMode === 'hourly'
                    ? formatDate(checkIn)
                    : formatDate(checkIn)
                  : stayMode === 'hourly'
                    ? 'Date'
                    : 'Check-in'}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              align="start"
              side="bottom"
              sideOffset={6}
              collisionPadding={16}
            >
              <Calendar
                mode="single"
                selected={checkIn}
                onSelect={(d) => {
                  setCheckIn(d)
                  if (d && checkOut && checkOut <= d) {
                    const next = new Date(d)
                    next.setDate(next.getDate() + 1)
                    setCheckOut(next)
                  }
                }}
                disabled={(date) => startOfDay(date) < startOfDay(checkInMin)}
                className="p-2"
                classNames={calendarClassNames}
              />
            </PopoverContent>
          </Popover>

          {stayMode === 'overnight' ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'h-10 min-w-0 flex-1 justify-start text-left font-normal',
                    !checkOut && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  {checkOut ? formatDate(checkOut) : 'Check-out'}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="start"
                side="bottom"
                sideOffset={6}
                collisionPadding={16}
              >
                <Calendar
                  mode="single"
                  selected={checkOut}
                  onSelect={setCheckOut}
                  disabled={(date) =>
                    startOfDay(date) < startOfDay(checkOutMin)
                  }
                  className="p-2"
                  classNames={calendarClassNames}
                />
              </PopoverContent>
            </Popover>
          ) : (
            <>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {durations.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setDurationHours(h)}
                    className={cn(
                      'h-10 min-w-[3.5rem] rounded-md border px-3 text-sm font-medium transition',
                      durationHours === h
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background text-foreground hover:bg-accent',
                    )}
                  >
                    {h}h
                  </button>
                ))}
              </div>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger className="h-10 w-full border-input bg-background sm:w-[120px]">
                  <Clock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Start" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={6}
                  collisionPadding={{
                    top: 80,
                    bottom: 96,
                    left: 12,
                    right: 12,
                  }}
                  className="max-h-[min(16rem,calc(100dvh-10rem))]"
                >
                  {startTimeOptions.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      No starts left today for this duration — pick another date
                      or shorter package
                    </div>
                  ) : (
                    startTimeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {stayMode === 'overnight' ? (
            <Select value={rooms} onValueChange={setRooms}>
              <SelectTrigger className="h-10 w-full border-input bg-background sm:w-[90px]">
                <SelectValue placeholder="Rooms" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={6}
                collisionPadding={{ top: 80, bottom: 96, left: 12, right: 12 }}
                className="max-h-[min(16rem,calc(100dvh-10rem))]"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} room{n !== 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger className="h-10 w-full border-input bg-background sm:w-[120px]">
              <Users className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue
                placeholder={
                  useGuestsPerRoomMode ? 'Guests per room' : 'Guests'
                }
              />
            </SelectTrigger>
            <SelectContent
              position="popper"
              sideOffset={6}
              collisionPadding={{ top: 80, bottom: 96, left: 12, right: 12 }}
              className="max-h-[min(16rem,calc(100dvh-10rem))]"
            >
              {stayMode === 'hourly' || !useGuestsPerRoomMode
                ? Array.from(
                    {
                      length:
                        stayMode === 'hourly'
                          ? 3
                          : roomsNum * MAX_GUESTS_PER_ROOM,
                    },
                    (_, i) => i + 1,
                  ).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} guest{n !== 1 ? 's' : ''}
                    </SelectItem>
                  ))
                : [1, 2, 3].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} guest{n !== 1 ? 's' : ''} per room
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>

          <Button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              'group/book relative h-10 shrink-0 touch-manipulation',
              'inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-full px-6 text-sm font-semibold tracking-tight',
              'transition-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-card',
              'w-full md:w-auto md:min-w-[7.5rem]',
              canSubmit
                ? [
                    'bg-gold-300 text-ink-800 shadow-[0_1px_2px_rgba(10,14,26,0.1)]',
                    'ring-1 ring-inset ring-white/20',
                    'transition-[transform,background-color,box-shadow] duration-200 ease-editorial',
                    'motion-safe:active:scale-[0.97]',
                    'motion-reduce:transition-none motion-reduce:active:scale-100',
                    'hover:bg-gold-200',
                    'focus-visible:ring-gold-400/55',
                    '[@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_4px_16px_-4px_rgba(200,168,90,0.5)]',
                    'before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent',
                  ]
                : [
                    'cursor-not-allowed bg-muted text-muted-foreground/75',
                    'shadow-none ring-1 ring-inset ring-border/50',
                    'focus-visible:ring-muted-foreground/25',
                  ],
            )}
            aria-describedby={submitHint ? 'hero-book-hint' : undefined}
            onMouseEnter={prefetchRooms}
            onFocus={prefetchRooms}
          >
            <span className="relative z-[1]">Book stay</span>
            <ChevronRight
              className={cn(
                'relative z-[1] h-4 w-4 shrink-0 transition-transform duration-200 ease-editorial',
                canSubmit &&
                  'motion-safe:[@media(hover:hover)_and_(pointer:fine)]:group-hover/book:translate-x-0.5',
              )}
              aria-hidden
            />
          </Button>
        </div>
      </div>

      {submitHint ? (
        <p
          id="hero-book-hint"
          className="mt-2 text-xs text-white/90"
          role="status"
        >
          {submitHint}
        </p>
      ) : null}

      {!isCheckOutValid && checkIn && checkOut && slug ? (
        <p className="mt-2 text-xs text-destructive">
          Check-out must be after check-in.
        </p>
      ) : null}
    </form>
  )
}
