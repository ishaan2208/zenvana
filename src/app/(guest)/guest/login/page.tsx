'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  QrCode,
  Smartphone,
} from 'lucide-react'

import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton'
import { AuthShell } from '@/components/auth/AuthShell'
import { BrandField } from '@/components/auth/BrandField'
import {
  fetchGuestByRoom,
  postChatbotLogin,
} from '@/features/guest-assistant/api/chatbotClient'
import { guestStorage } from '@/features/guest-assistant/lib/guestStorage'
import {
  guestDestinationPath,
  persistGuestSession,
  redirectAfterGuestLogin,
} from '@/features/guest-assistant/lib/guestLoginHelpers'
import { useAppRouter } from '@/hooks/useAppRouter'

type QrState = {
  isProcessing: boolean
  isSuccess: boolean
  isError: boolean
  errorMessage: string
}

type GuestSession = {
  bookingId?: number | string
  phoneNumber?: string
}

export default function GuestAssistantLoginPage() {
  const router = useAppRouter()
  const searchParams = useSearchParams()
  const bookingRoomId = searchParams?.get('bookingRoomId')
  const roomId = searchParams?.get('roomId')
  const urlBookingId = searchParams?.get('bookingId')
  const urlPhoneNumber = searchParams?.get('phoneNumber')
  const hasQrParam = Boolean(bookingRoomId || roomId)

  const [tab, setTab] = useState<'inhotel' | 'account'>('inhotel')
  const [phone, setPhone] = useState('')
  const [bookingRef, setBookingRef] = useState('')
  const [submitDisabled, setSubmitDisabled] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [qrState, setQrState] = useState<QrState>({
    isProcessing: false,
    isSuccess: false,
    isError: false,
    errorMessage: '',
  })

  const qrLoginAttemptRef = useRef<string | null>(null)
  const initEffectRanRef = useRef(false)

  const storedSession = guestStorage.getSession() as GuestSession | undefined
  const phoneIsValid = /^\d{10,12}$/.test(phone.replace(/\D/g, ''))

  useEffect(() => {
    const storedPhone = storedSession?.phoneNumber
    if (storedPhone && !phone) {
      setPhone(String(storedPhone).replace(/\D/g, '').slice(-10))
    }
  }, [storedSession?.phoneNumber, phone])

  const handleBookingRoomLogin = useCallback(
    async (bookingRoomIdParam: string, fallbackRoomId?: string | null) => {
      setQrState({ isProcessing: true, isSuccess: false, isError: false, errorMessage: '' })
      try {
        const data = await fetchGuestByRoom({ bookingRoomId: bookingRoomIdParam })
        persistGuestSession(data, data.guestPhoneNumber, 'qr')
        setQrState({ isProcessing: false, isSuccess: true, isError: false, errorMessage: '' })
        setTimeout(() => router.push(guestDestinationPath(data)), 1200)
      } catch (error) {
        if (fallbackRoomId) {
          try {
            const data = await fetchGuestByRoom({ roomId: fallbackRoomId })
            persistGuestSession(data, data.guestPhoneNumber, 'qr')
            setQrState({ isProcessing: false, isSuccess: true, isError: false, errorMessage: '' })
            setTimeout(() => router.push(guestDestinationPath(data)), 1200)
            return
          } catch {
            // fall through
          }
        }
        const message =
          error instanceof Error
            ? error.message
            : 'Something went wrong with QR sign-in. Please try again or use your phone number.'
        setQrState({
          isProcessing: false,
          isSuccess: false,
          isError: true,
          errorMessage: message,
        })
      }
    },
    [router],
  )

  const handleQRLogin = useCallback(
    async (roomIdParam: string) => {
      setQrState({ isProcessing: true, isSuccess: false, isError: false, errorMessage: '' })
      try {
        const data = await fetchGuestByRoom({ roomId: roomIdParam })
        persistGuestSession(data, data.guestPhoneNumber, 'qr')
        setQrState({ isProcessing: false, isSuccess: true, isError: false, errorMessage: '' })
        setTimeout(() => router.push(guestDestinationPath(data)), 1200)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Something went wrong with QR sign-in. Please try again or use your phone number.'
        setQrState({
          isProcessing: false,
          isSuccess: false,
          isError: true,
          errorMessage: message,
        })
      }
    },
    [router],
  )

  useEffect(() => {
    if (urlBookingId && urlPhoneNumber) {
      guestStorage.setSession({
        bookingId: urlBookingId,
        phoneNumber: urlPhoneNumber,
      })
      const roomNumberId = localStorage.getItem('roomNumberId')
      if (roomNumberId) {
        router.replace(`/guest/stay?bookingId=${urlBookingId}`)
      } else {
        router.replace(`/guest/room?bookingId=${urlBookingId}`)
      }
      return
    }

    const loginKey = bookingRoomId
      ? `bookingRoomId:${bookingRoomId}`
      : roomId
        ? `roomId:${roomId}`
        : null

    if (!loginKey) {
      qrLoginAttemptRef.current = null
      return
    }

    if (qrLoginAttemptRef.current === loginKey) return
    qrLoginAttemptRef.current = loginKey

    if (bookingRoomId) {
      void handleBookingRoomLogin(bookingRoomId, roomId)
      return
    }
    if (roomId) {
      void handleQRLogin(roomId)
    }
  }, [
    bookingRoomId,
    roomId,
    urlBookingId,
    urlPhoneNumber,
    handleBookingRoomLogin,
    handleQRLogin,
    router,
  ])

  useEffect(() => {
    if (initEffectRanRef.current || hasQrParam) return
    initEffectRanRef.current = true

    if (storedSession?.bookingId && storedSession?.phoneNumber) {
      router.replace(`/guest/stay?bookingId=${storedSession.bookingId}`)
    }
  }, [hasQrParam, router, storedSession?.bookingId, storedSession?.phoneNumber])

  async function onPhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSubmitDisabled(true)

    const digits = phone.replace(/\D/g, '')
    try {
      const data = await postChatbotLogin(digits)
      if (bookingRef.trim()) {
        const ref = bookingRef.trim().toUpperCase()
        const bookingRefField =
          (data as { bookingReference?: string }).bookingReference ??
          (data as { bookingRef?: string }).bookingRef
        if (bookingRefField && bookingRefField.toUpperCase() !== ref) {
          throw new Error('Booking reference does not match this phone number.')
        }
      }
      redirectAfterGuestLogin(router, data, digits, 'walkin')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setSubmitDisabled(false)
    }
  }

  const zenvanaLoginHref = urlBookingId
    ? `/login?redirect=${encodeURIComponent(`/guest/stay?bookingId=${urlBookingId}`)}`
    : '/login?redirect=%2Fguest'

  if (hasQrParam && (qrState.isProcessing || qrState.isSuccess)) {
    return (
      
        
          <div className="flex min-h-dvh items-center justify-center bg-background px-4">
            <div className="mx-auto max-w-sm text-center">
              {qrState.isProcessing ? (
                <>
                  <QrCode className="mx-auto h-14 w-14 animate-pulse text-primary" aria-hidden />
                  <h2 className="mt-6 text-xl font-semibold">Signing you in…</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Welcome to your room. We&apos;re setting everything up.
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle className="mx-auto h-14 w-14 text-emerald-600" aria-hidden />
                  <h2 className="mt-6 text-xl font-semibold">Welcome to Zenvana</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Redirecting to guest services…
                  </p>
                </>
              )}
            </div>
          </div>
        
      
    )
  }

  return (
    <AuthShell
      eyebrow="Guest assistant"
      title="Access your stay"
      subtitle="Sign in with the phone on your reservation, scan the room QR code, or use your Zenvana account."
      imageSrc="/images/dehradun/foothills-editorial.jpg"
      imageAlt="Foothills near Dehradun at golden hour"
      quote={{
        text: 'Everything you need during your stay — requests, dining, and help — in one place.',
        caption: 'In-room · Zenvana Hotels',
      }}
    >
      <div className="mb-6 flex rounded-full border border-border/70 bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => setTab('inhotel')}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
            tab === 'inhotel'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          In-hotel
        </button>
        <button
          type="button"
          onClick={() => setTab('account')}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
            tab === 'account'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Zenvana account
        </button>
      </div>

      {qrState.isError && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
          <div>
            <p className="font-medium text-foreground">QR sign-in issue</p>
            <p className="mt-1 text-muted-foreground">{qrState.errorMessage}</p>
          </div>
        </div>
      )}

      {tab === 'account' ? (
        <div>
          <p className="text-sm text-muted-foreground">
            Use your Zenvana guest account to open stay assistance for a booking you made on the
            website.
          </p>
          <AuthPrimaryButton
            type="button"
            className="mt-6"
            trailing={<ArrowRight className="h-4 w-4" aria-hidden />}
            onClick={() => router.push(zenvanaLoginHref)}
          >
            Continue with Zenvana account
          </AuthPrimaryButton>
        </div>
      ) : (
        <div>
          {!hasQrParam && (
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
              <QrCode className="h-4 w-4" aria-hidden />
              Scan the QR in your room for instant access
            </div>
          )}

          <div className="mb-4 flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="text-base font-semibold">Sign in with phone</h2>
          </div>

          <form onSubmit={onPhoneSubmit} className="space-y-4">
            <BrandField
              label="Phone number"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
              error={formError ?? undefined}
            />
            <BrandField
              label="Booking reference (optional)"
              placeholder="e.g. ZV-12345"
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value)}
              hint="Only if you have multiple active stays on this number"
            />
            <AuthPrimaryButton
              type="submit"
              disabled={!phoneIsValid}
              loading={submitDisabled}
              trailing={
                !submitDisabled ? <ArrowRight className="h-4 w-4" aria-hidden /> : undefined
              }
            >
              Sign in
            </AuthPrimaryButton>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Enter the phone number used for your booking
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/guest" className="font-medium text-foreground hover:underline">
          Back to guest hub
        </Link>
      </p>
    </AuthShell>
  )
}
