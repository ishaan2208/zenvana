'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, MessageCircle } from 'lucide-react'

import { Container } from '@/components/Container'
import { GuestHubLoadingSkeleton } from '@/components/skeletons/GuestSkeletons'
import { guestStorage } from '@/features/guest-assistant/lib/guestStorage'

type GuestSession = {
  bookingId?: number
  phoneNumber?: string
}

export default function GuestHubPage() {
  const [session, setSession] = useState<GuestSession | null | undefined>(undefined)

  useEffect(() => {
    const stored = guestStorage.getSession() as GuestSession | undefined
    setSession(stored ?? null)
  }, [])

  const hasSession =
    session != null &&
    (session.bookingId != null || session.phoneNumber != null)

  if (session === undefined) {
    return <GuestHubLoadingSkeleton />
  }

  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 inline-flex rounded-full border border-border/60 bg-muted/40 p-3">
          <MessageCircle className="h-6 w-6 text-primary" aria-hidden />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Guest assistant
        </h1>
        <p className="mt-3 text-muted-foreground">
          Get help before, during, and after your stay — requests, dining, and
          hotel services in one place.
        </p>

        {hasSession ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-5 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              Select a booking
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose a reservation from your account to open stay assistance.
              Booking picker coming soon.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign in with the phone number on your reservation to continue.
            </p>
            <Link
              href="/guest/login"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Continue with phone
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        )}
      </div>
    </Container>
  )
}
