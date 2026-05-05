'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BedDouble,
  KeyRound,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { useAppRouter } from '@/hooks/useAppRouter'
import { AuthShell } from '@/components/auth/AuthShell'
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton'
import { BrandField } from '@/components/auth/BrandField'
import { OtpInput } from '@/components/auth/OtpInput'
import {
  postGuestLoginRequestOtp,
  postGuestVerifyLogin,
} from '@/lib/zenvanaGuestApi'

const RESEND_SECONDS = 30

export default function GuestLoginPage() {
  const router = useAppRouter()
  const searchParams = useSearchParams()
  const [phone, setPhone] = useState('')
  const [challengeId, setChallengeId] = useState<number | null>(null)
  const [otp, setOtp] = useState('')
  const [masked, setMasked] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(0)
  const redirectTo = searchParams.get('redirect') || '/account'

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  const phoneIsValid = /^\d{10}$/.test(phone)

  async function sendOtp() {
    setErr(null)
    setBusy(true)
    try {
      const data = await postGuestLoginRequestOtp(phone)
      setChallengeId(data.challengeId)
      setMasked(data.maskedPhone ?? '')
      setResendIn(RESEND_SECONDS)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to send OTP')
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    if (challengeId == null || otp.length < 6) return
    setErr(null)
    setBusy(true)
    try {
      await postGuestVerifyLogin(phone, otp, challengeId)
      router.push(redirectTo)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  const isOtpStep = challengeId != null

  return (
    <AuthShell
      eyebrow={isOtpStep ? 'Step 2 of 2 · Verify' : 'Guest access'}
      title={isOtpStep ? <>Enter your code.</> : <>Welcome back.</>}
      subtitle={
        isOtpStep ? (
          <>We sent a 6-digit code on WhatsApp to {masked || `+91 ${phone}`}.</>
        ) : (
          <>
            Sign in to view your bookings, manage stays, and pick up your loyalty points where you
            left off.
          </>
        )
      }
      imageSrc="/images/dehradun/foothills-editorial.jpg"
      imageAlt="Foothills near Dehradun at golden hour"
      quote={{
        text: 'Mornings start slow. The hills, in the distance. The same calm, kept for you inside the hotel.',
        caption: 'Rajpur Road · Dehradun',
      }}
      trustMarks={[
        { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: 'WhatsApp OTP. No password.' },
        { icon: <BedDouble className="h-3.5 w-3.5" />, label: 'Best rate, booked direct.' },
        { icon: <Sparkles className="h-3.5 w-3.5" />, label: 'Loyalty points on every stay.' },
      ]}
      footer={
        !isOtpStep ? (
          <p>
            New to Zenvana?{' '}
            <Link
              href={`/guest/signup?redirect=${encodeURIComponent(redirectTo)}`}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Create a guest account
            </Link>
          </p>
        ) : null
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {!isOtpStep ? (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <BrandField
              label="Mobile number"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="numeric"
              placeholder="98XXX XXXXX"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
              }
              leading={<>+91</>}
              hint="We'll send you a one-time code on WhatsApp."
              required
            />

            {err && <ErrorBanner message={err} />}

            <AuthPrimaryButton
              type="button"
              loading={busy}
              disabled={!phoneIsValid}
              onClick={sendOtp}
              trailing={<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
            >
              <span className="inline-flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Send WhatsApp OTP
              </span>
            </AuthPrimaryButton>

            <p className="text-center text-xs text-muted-foreground/80">
              By continuing, you agree to our{' '}
              <Link href="/privacypolicy" className="underline-offset-4 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <div>
              <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <KeyRound className="h-3.5 w-3.5" />
                One-time passcode
              </div>
              <OtpInput value={otp} onChange={setOtp} autoFocus hasError={Boolean(err)} />
              <div className="mt-3 flex items-center justify-between text-xs">
                <button
                  type="button"
                  className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  onClick={() => {
                    setChallengeId(null)
                    setOtp('')
                    setErr(null)
                    setResendIn(0)
                  }}
                >
                  Use a different number
                </button>
                {resendIn > 0 ? (
                  <span className="text-muted-foreground">
                    Resend in <span className="tabular-nums">{resendIn}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-50"
                    disabled={busy}
                    onClick={sendOtp}
                  >
                    Resend code
                  </button>
                )}
              </div>
            </div>

            {err && <ErrorBanner message={err} />}

            <AuthPrimaryButton
              type="button"
              loading={busy}
              disabled={otp.length < 6}
              onClick={verify}
              trailing={<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
            >
              Verify &amp; sign in
            </AuthPrimaryButton>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      role="alert"
      className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
      <span className="leading-snug">{message}</span>
    </motion.div>
  )
}
