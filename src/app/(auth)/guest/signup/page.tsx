'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAppRouter } from '@/hooks/useAppRouter'
import { Button } from '@/components/Button'
import { TextField } from '@/components/Fields'
import { Logo } from '@/components/Logo'
import { SlimLayout } from '@/components/SlimLayout'
import {
  postGuestSignupRequestOtp,
  postGuestVerifySignup,
} from '@/lib/zenvanaGuestApi'

export default function GuestSignupPage() {
  const router = useAppRouter()
  const [phone, setPhone] = useState('')
  const [challengeId, setChallengeId] = useState<number | null>(null)
  const [otp, setOtp] = useState('')
  const [masked, setMasked] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function sendOtp() {
    setErr(null)
    setBusy(true)
    try {
      const data = await postGuestSignupRequestOtp(phone)
      setChallengeId(data.challengeId)
      setMasked(data.maskedPhone ?? '')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to send OTP')
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    if (challengeId == null) return
    setErr(null)
    setBusy(true)
    try {
      await postGuestVerifySignup(phone, otp, challengeId)
      router.push('/account')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Signup failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SlimLayout>
      <div className="flex">
        <Link href="/" aria-label="Home">
          <Logo className="h-10 w-auto" />
        </Link>
      </div>
      <h2 className="mt-12 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Create guest account
      </h2>
      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>

      {err && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {err}
        </p>
      )}

      {challengeId == null ? (
        <div className="mt-8 space-y-6">
          <TextField
            label="Mobile number"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Button type="button" color="blue" className="w-full" disabled={busy} onClick={sendOtp}>
            Send WhatsApp OTP
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Code sent to {masked || phone}
          </p>
          <TextField
            label="6-digit OTP"
            name="otp"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
          />
          <Button type="button" color="blue" className="w-full" disabled={busy} onClick={verify}>
            Verify & create account
          </Button>
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline"
            onClick={() => {
              setChallengeId(null)
              setOtp('')
            }}
          >
            Use a different number
          </button>
        </div>
      )}
    </SlimLayout>
  )
}
