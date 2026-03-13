'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar as CalendarIcon, ChevronRight, MapPinned, Users } from 'lucide-react'

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

import { cn } from '@/lib/utils'

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

export function HeroBookBar({ properties }: HeroBookBarProps) {
  const router = useRouter()
  const today = useMemo(() => new Date(), [])
  const tomorrow = useMemo(() => {
    const d = new Date(today)
    d.setDate(d.getDate() + 1)
    return d
  }, [today])

  const MAX_GUESTS_PER_ROOM = 3
  const ROOMS_FOR_GUESTS_PER_ROOM_MODE = 6 // When rooms >= this, show "guests per room" instead of "total guests"

  const [slug, setSlug] = useState('')
  const [checkIn, setCheckIn] = useState<Date | undefined>(today)
  const [checkOut, setCheckOut] = useState<Date | undefined>(tomorrow)
  const [rooms, setRooms] = useState('1')
  const [guests, setGuests] = useState('2') // total guests when rooms < 6, or guests-per-room when rooms >= 6 (stored as string)

  const roomsNum = parseInt(rooms, 10) || 1
  const useGuestsPerRoomMode = roomsNum >= ROOMS_FOR_GUESTS_PER_ROOM_MODE
  const guestsNum = parseInt(guests, 10) || 1
  const totalGuests = useGuestsPerRoomMode ? roomsNum * guestsNum : guestsNum
  const prevModeRef = useRef(useGuestsPerRoomMode)
  const prevRoomsRef = useRef(roomsNum)

  // When switching between total-guests and guests-per-room modes, convert the value
  useEffect(() => {
    if (useGuestsPerRoomMode && !prevModeRef.current) {
      // Switching to per-room: guests still holds old total, convert to per-room (e.g. 12 total in 6 rooms → 2 per room)
      const oldTotal = guestsNum
      const perRoom = Math.min(MAX_GUESTS_PER_ROOM, Math.max(1, Math.floor(oldTotal / roomsNum)))
      setGuests(String(perRoom))
    } else if (!useGuestsPerRoomMode && prevModeRef.current) {
      // Switching to total: preserve total guests (prevRooms * perRoom) and clamp to max
      const total = prevRoomsRef.current * guestsNum
      const maxTotal = roomsNum * MAX_GUESTS_PER_ROOM
      setGuests(String(Math.min(maxTotal, Math.max(1, total))))
    } else if (!useGuestsPerRoomMode) {
      const maxTotal = roomsNum * MAX_GUESTS_PER_ROOM
      if (guestsNum > maxTotal) setGuests(String(maxTotal))
      if (guestsNum < 1) setGuests('1')
    } else if (guestsNum < 1 || guestsNum > MAX_GUESTS_PER_ROOM) {
      setGuests(String(Math.min(MAX_GUESTS_PER_ROOM, Math.max(1, guestsNum))))
    }
    prevModeRef.current = useGuestsPerRoomMode
    prevRoomsRef.current = roomsNum
  }, [roomsNum, useGuestsPerRoomMode, totalGuests, guestsNum])

  const checkInMin = today
  const checkOutMin = useMemo(() => {
    if (!checkIn) return tomorrow
    const d = new Date(checkIn)
    d.setDate(d.getDate() + 1)
    return d
  }, [checkIn, tomorrow])

  const isCheckOutValid =
    checkIn != null && checkOut != null && checkOut > checkIn
  const canSubmit = Boolean(slug) && isCheckOutValid

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSubmit || !checkIn || !checkOut) return
    const params = new URLSearchParams({
      checkIn: toDateString(checkIn),
      checkOut: toDateString(checkOut),
      rooms,
      guests: String(totalGuests),
    })
    if (useGuestsPerRoomMode) params.set('guestsPerRoom', guests)
    router.push(`/book/${slug}/rooms?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={cn(
          'flex flex-col gap-2 rounded-lg border bg-card p-3 text-card-foreground shadow-sm',
          'sm:flex-row sm:flex-wrap sm:gap-3 sm:items-center'
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <label className="sr-only">Property</label>
            <Select value={slug} onValueChange={setSlug}>
              <SelectTrigger className="h-10 w-full border-input bg-background">
                <MapPinned className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Choose property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>
                    {p.publicName}
                  </SelectItem>
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
                  !checkIn && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                {checkIn ? formatDate(checkIn) : 'Check-in'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
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
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'h-10 min-w-0 flex-1 justify-start text-left font-normal',
                  !checkOut && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                {checkOut ? formatDate(checkOut) : 'Check-out'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={checkOut}
                onSelect={setCheckOut}
                disabled={(date) => startOfDay(date) < startOfDay(checkOutMin)}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Select value={rooms} onValueChange={setRooms}>
            <SelectTrigger className="h-10 w-full border-input bg-background sm:w-[90px]">
              <SelectValue placeholder="Rooms" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} room{n !== 1 ? 's' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger className="h-10 w-full border-input bg-background sm:w-[120px]">
              <Users className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder={useGuestsPerRoomMode ? 'Guests per room' : 'Guests'} />
            </SelectTrigger>
            <SelectContent>
              {useGuestsPerRoomMode ? (
                [1, 2, 3].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} guest{n !== 1 ? 's' : ''} per room
                  </SelectItem>
                ))
              ) : (
                Array.from({ length: roomsNum * MAX_GUESTS_PER_ROOM }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} guest{n !== 1 ? 's' : ''}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Button type="submit" disabled={!canSubmit} className="h-10 shrink-0 w-full md:w-fit">
            Book
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isCheckOutValid && checkIn && checkOut && (
        <p className="mt-2 text-xs text-destructive">
          Check-out must be after check-in.
        </p>
      )}
    </form>
  )
}
