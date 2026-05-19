'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { Container } from '@/components/Container'
import { fetchStayContext } from '@/features/guest-assistant/api/chatbotClient'
import { guestStorage } from '@/features/guest-assistant/lib/guestStorage'
import { hydrateStayFromContext } from '@/features/guest-assistant/lib/guestLoginHelpers'
import { useStayStore } from '@/features/guest-assistant/stores/stayStore'
import type { GuestStayPhase } from '@/features/guest-assistant/types'
import { useAppRouter } from '@/hooks/useAppRouter'
import { fetchBookingStayContext, getZenvanaGuestMe } from '@/lib/zenvanaGuestApi'

type GuestSession = {
  bookingId?: number | string
  phoneNumber?: string
}

type LoadState =
  | { status: 'loading' }
  | { status: 'expired'; slug: string | null }
  | { status: 'ready' }
  | { status: 'error'; message: string }

export default function GuestStayPage() {
  const router = useAppRouter()
  const searchParams = useSearchParams()
  const bookingIdParam = searchParams?.get('bookingId')
  const ctx = useStayStore((s) => s.ctx)

  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function load() {
      const session = guestStorage.getSession() as GuestSession | undefined
      const bookingId = Number(bookingIdParam ?? session?.bookingId)
      if (!bookingId || Number.isNaN(bookingId)) {
        router.replace('/guest/login')
        return
      }

      try {
        const zenvanaMe = await getZenvanaGuestMe()
        if (zenvanaMe && bookingIdParam) {
          const data = await fetchBookingStayContext(bookingId)
          if (cancelled) return
          guestStorage.setSession({
            bookingId,
            phoneNumber: data.phoneNumber,
          })
          hydrateStayFromContext(
            'zenvana',
            bookingId,
            data.phoneNumber,
            data.phase,
            data.slug,
            data.booking,
          )
          if (data.phase === 'expired') {
            setLoadState({ status: 'expired', slug: data.slug })
            return
          }
          setLoadState({ status: 'ready' })
          return
        }

        const phone = session?.phoneNumber ? String(session.phoneNumber) : ''
        if (!phone) {
          router.replace('/guest/login')
          return
        }

        const data = await fetchStayContext(bookingId, phone)
        if (cancelled) return

        const roomNumberId = localStorage.getItem('roomNumberId')
        hydrateStayFromContext(
          roomNumberId ? 'qr' : 'walkin',
          bookingId,
          phone,
          data.phase,
          data.slug,
          data.booking,
          roomNumberId ? Number(roomNumberId) : undefined,
        )

        if (data.phase === 'expired') {
          setLoadState({ status: 'expired', slug: data.slug })
          return
        }

        setLoadState({ status: 'ready' })
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Could not load your stay'
        if (message.toLowerCase().includes('not found') || message.toLowerCase().includes('401')) {
          router.replace('/guest/login')
          return
        }
        setLoadState({ status: 'error', message })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [bookingIdParam, router])

  if (loadState.status === 'loading') {
    return (
      <Container className="py-12 sm:py-16">
        <p className="text-sm text-muted-foreground">Loading your stay…</p>
      </Container>
    )
  }

  if (loadState.status === 'error') {
    return (
      <Container className="py-12 sm:py-16">
        <h1 className="font-display text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-sm text-muted-foreground">{loadState.message}</p>
        <Link
          href="/guest/login"
          className="mt-6 inline-flex text-sm font-medium text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </Container>
    )
  }

  if (loadState.status === 'expired') {
    const bookHref = loadState.slug ? `/book/${loadState.slug}` : '/hotels'
    return (
      <Container className="py-12 sm:py-16">
        <h1 className="font-display text-2xl font-semibold">Stay assistance has ended</h1>
        <p className="mt-3 max-w-lg text-muted-foreground">
          The window for in-stay guest services for this reservation has closed. You can browse our
          hotels or book your next stay with Zenvana.
        </p>
        
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={bookHref}
              className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Book again
            </Link>
            <Link
              href="/hotels"
              className="inline-flex rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted/50"
            >
              Browse hotels
            </Link>
          </div>
        
      </Container>
    )
  }

  const phase = ctx?.phase as GuestStayPhase | undefined

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center">
        <p className="text-sm font-medium text-foreground">Assistant loading</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {phase
            ? `Your stay is in the ${phase} phase. The full assistant UI will appear here next.`
            : 'Preparing your guest assistant…'}
        </p>
      </div>
    </Container>
  )
}

