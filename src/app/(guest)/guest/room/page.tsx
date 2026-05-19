'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bed, MapPin, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import axios from '@/features/guest-assistant/lib/axios.config'
import { guestStorage } from '@/features/guest-assistant/lib/guestStorage'
import { hardSignout } from '@/features/guest-assistant/lib/sessionGuard'
import { useGuestProfile } from '@/features/guest-assistant/stores/guestProfile'
import { useStayStore } from '@/features/guest-assistant/stores/stayStore'
import type { Booking } from '@/features/guest-assistant/types/booking.types'

type GuestSession = {
  bookingId?: number | string
  phoneNumber?: string
}

function normalizeRoomStatus(status: string | null | undefined) {
  return (status ?? '').replace(/[^a-z]/gi, '').toUpperCase()
}

function isRoomInhouse(status: string | null | undefined) {
  const normalized = normalizeRoomStatus(status)
  return normalized === 'INHOUSE' || normalized === 'CHECKEDIN' || normalized === 'OCCUPIED'
}

export default function GuestRoomPage() {
  const router = useRouter()
  const { getContextualGreeting, updateProfile } = useGuestProfile()
  const setStay = useStayStore((s) => s.setStay)
  const ctx = useStayStore((s) => s.ctx)

  const storedSession = useMemo(
    () => guestStorage.getSession() as GuestSession | undefined,
    [],
  )
  const bookingId = storedSession?.bookingId
  const phoneNumber = storedSession?.phoneNumber

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const redirectToStay = useCallback(
    (roomId: string) => {
      localStorage.setItem('roomNumberId', roomId)
      const id = Number(bookingId)
      if (ctx && booking) {
        setStay(
          { ...ctx, bookingRoomId: Number(roomId) },
          booking,
        )
      }
      router.push(`/guest/stay?bookingId=${id}`)
    },
    [booking, bookingId, ctx, router, setStay],
  )

  useEffect(() => {
    if (!bookingId || !phoneNumber) {
      router.replace('/guest/login')
    }
  }, [bookingId, phoneNumber, router])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!bookingId || !phoneNumber) return

      try {
        const response = await axios.get('chatbot/booking', {
          params: { bookingId, phoneNumber },
        })
        const data = response.data.data as Booking
        if (cancelled) return

        const roomNumberId = localStorage.getItem('roomNumberId')
        const selectedRoom = roomNumberId
          ? data.BookingRoom.find((room) => String(room.id) === roomNumberId)
          : undefined

        if (roomNumberId && (!selectedRoom || !isRoomInhouse(selectedRoom.status))) {
          throw new Error('Your room assignment changed. Please sign in again.')
        }
        if (!roomNumberId && !data.BookingRoom.some((room) => isRoomInhouse(room.status))) {
          throw new Error('Your stay is no longer active. Please sign in again.')
        }

        setBooking(data)
        setStay(
          ctx ?? {
            source: roomNumberId ? 'qr' : 'walkin',
            bookingId: Number(bookingId),
            phoneNumber: String(phoneNumber),
            bookingRoomId: roomNumberId ? Number(roomNumberId) : undefined,
            phase: 'inhouse',
            slug: null,
          },
          data,
        )

        updateProfile({
          guestName: data.guestName,
          phoneNumber: data.guestPhoneNumber,
        })

        if (roomNumberId && selectedRoom) {
          router.replace(`/guest/stay?bookingId=${bookingId}`)
          return
        }

        if (data.BookingRoom.length === 1) {
          redirectToStay(String(data.BookingRoom[0].id))
          return
        }
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : 'Unable to load booking details'
        setError(message)
        hardSignout()
        setTimeout(() => router.replace('/guest/login'), 1500)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [bookingId, phoneNumber, ctx, redirectToStay, router, setStay, updateProfile])

  const handleRoomClick = (roomId: string, roomNumber: string) => {
    updateProfile({ roomNumber })
    redirectToStay(roomId)
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading your stay…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={() => router.replace('/guest/login')}>Return to sign in</Button>
      </div>
    )
  }

  if (!booking) return null

  return (
    <div className="min-h-dvh bg-gradient-to-br from-background via-background/95 to-primary/5 p-4 pb-12">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Welcome to your stay</h1>
          </div>
          <p className="text-muted-foreground">{getContextualGreeting()}</p>
          {booking.BookingRoom.length > 1 && (
            <p className="text-sm text-muted-foreground">
              Select your room to open the guest assistant.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border/50 bg-card/70 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-semibold">{booking.property.name}</h2>
              <p className="text-sm text-muted-foreground">{booking.property.address}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-center text-lg font-semibold">Select your room</h2>
          {booking.BookingRoom.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => handleRoomClick(String(room.id), room.roomNumber)}
              className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-card/80 p-5 text-left shadow-md transition hover:border-primary/40 hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Bed className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Room {room.roomNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {room.roomPlan} · {room.occupancy} guests
                  </p>
                </div>
              </div>
              <span className="text-sm font-medium text-primary">Continue</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
