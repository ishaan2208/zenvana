'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { TextField } from '@/components/Fields'
import { Logo } from '@/components/Logo'
import { SlimLayout } from '@/components/SlimLayout'
import {
  getZenvanaGuestMe,
  postZenvanaGuestLogout,
  type ZenvanaGuestMe,
} from '@/lib/zenvanaGuestApi'

export default function GuestAccountPage() {
  const [me, setMe] = useState<ZenvanaGuestMe | null | undefined>(undefined)
  const [email, setEmail] = useState('')
  const [emailChallengeId, setEmailChallengeId] = useState<number | null>(null)
  const [emailOtp, setEmailOtp] = useState('')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    void getZenvanaGuestMe().then(setMe)
  }, [])

  async function logout() {
    await postZenvanaGuestLogout()
    window.location.href = '/login'
  }

  async function requestEmail() {
    setErr(null)
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
    const t = base.replace(/\/$/, '')
    const api = t.endsWith('/api/v1') ? t : `${t}/api/v1`
    const res = await fetch(`${api}/public/zenvana-guest/me/email/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.error ?? 'Failed')
    setEmailChallengeId(json.data.challengeId)
  }

  async function verifyEmail() {
    if (emailChallengeId == null) return
    setErr(null)
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
    const t = base.replace(/\/$/, '')
    const api = t.endsWith('/api/v1') ? t : `${t}/api/v1`
    const res = await fetch(`${api}/public/zenvana-guest/me/email/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, otp: emailOtp, challengeId: emailChallengeId }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.error ?? 'Failed')
    const m = await getZenvanaGuestMe()
    setMe(m)
    setEmailChallengeId(null)
    setEmailOtp('')
  }

  if (me === undefined) {
    return (
      <SlimLayout>
        <p className="mt-12 text-sm text-muted-foreground">Loading…</p>
      </SlimLayout>
    )
  }

  if (!me) {
    return (
      <SlimLayout>
        <p className="mt-12 text-sm">
          Please{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            sign in
          </Link>
          .
        </p>
      </SlimLayout>
    )
  }

  return (
    <SlimLayout>
      <Link href="/" className="inline-block">
        <Logo className="h-10 w-auto" />
      </Link>
      <h1 className="mt-10 text-xl font-semibold">Your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">Phone: {me.phoneE164}</p>
      <p className="mt-1 text-sm text-muted-foreground">Points balance: {me.pointsBalance}</p>
      {me.email && (
        <p className="mt-1 text-sm text-muted-foreground">
          Email: {me.email}
          {me.emailVerifiedAt ? ' (verified)' : ''}
        </p>
      )}

      <div className="mt-8 space-y-4 border-t border-border pt-6">
        <h2 className="text-sm font-medium">Add or change email</h2>
        {err && <p className="text-sm text-red-600">{err}</p>}
        {emailChallengeId == null ? (
          <>
            <TextField label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="button" color="blue" onClick={() => void requestEmail().catch((e) => setErr(String(e)))}>
              Send verification code
            </Button>
          </>
        ) : (
          <>
            <TextField label="Email OTP" name="eotp" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            <Button type="button" color="blue" onClick={() => void verifyEmail().catch((e) => setErr(String(e)))}>
              Verify email
            </Button>
          </>
        )}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/my-bookings" className="text-sm text-blue-600 hover:underline">
          My bookings
        </Link>
        <button type="button" className="text-sm text-blue-600 hover:underline" onClick={() => void logout()}>
          Log out
        </button>
      </div>
    </SlimLayout>
  )
}
