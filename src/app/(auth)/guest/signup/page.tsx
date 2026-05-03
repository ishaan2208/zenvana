'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  HeartHandshake,
  KeyRound,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { useAppRouter } from '@/hooks/useAppRouter'
import { AuthShell } from '@/components/auth/AuthShell'
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton'
import { BrandField } from '@/components/auth/BrandField'
import { OtpInput } from '@/components/auth/OtpInput'
import {
  postGuestSignupRequestOtp,
  postGuestVerifySignup,
  type ZenvanaGuestTitle,
} from '@/lib/zenvanaGuestApi'

const RESEND_SECONDS = 30

export default function GuestSignupPage() {
  const router = useAppRouter()
  const [title, setTitle] = useState<ZenvanaGuestTitle>('MR')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [challengeId, setChallengeId] = useState<number | null>(null)
  const [otp, setOtp] = useState('')
  const [masked, setMasked] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  const phoneIsValid = /^\d{10}$/.test(phone)
  const namesOk = firstName.trim().length > 0 && lastName.trim().length > 0

  async function sendOtp() {
    setErr(null)
    setBusy(true)
    try {
      const data = await postGuestSignupRequestOtp(phone)
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
      await postGuestVerifySignup(phone, otp, challengeId, {
        title,
        firstName,
        lastName,
      })
      router.push('/account')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Signup failed')
    } finally {
      setBusy(false)
    }
  }

  const isOtpStep = challengeId != null

  return (
    <AuthShell
      eyebrow={isOtpStep ? 'Step 2 of 2 · Verify' : 'Create account'}
      title={isOtpStep ? <>Almost there.</> : <>Become a Zenvana guest.</>}
      subtitle={
        isOtpStep ? (
          <>We sent a 6-digit code on WhatsApp to {masked || `+91 ${phone}`}.</>
        ) : (
          <>
            Tell us your name, verify your mobile on WhatsApp, then track stays and earn loyalty
            points on every direct booking.
          </>
        )
      }
      imageSrc="/images/dehradun/family-stay-editorial.jpg"
      imageAlt="A welcoming Zenvana stay in Dehradun"
      quote={{
        text: 'A warm welcome, a quiet room, and a stay that feels considered from arrival to departure.',
        caption: 'Boutique hospitality · Zenvana',
      }}
      trustMarks={[
        { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: 'Verified by WhatsApp.' },
        { icon: <HeartHandshake className="h-3.5 w-3.5" />, label: 'Personal concierge support.' },
        { icon: <Sparkles className="h-3.5 w-3.5" />, label: 'Loyalty points from day one.' },
      ]}
      footer={
        !isOtpStep ? (
          <p>
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
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
            <div>
              <label
                htmlFor="guest-title"
                className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                Title
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/85 px-4 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                <select
                  id="guest-title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value as ZenvanaGuestTitle)}
                  className="h-12 w-full cursor-pointer bg-transparent text-sm text-foreground focus:outline-none"
                >
                  <option value="MR">Mr.</option>
                  <option value="MS">Ms.</option>
                  <option value="MRS">Mrs.</option>
                </select>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground/80">
                Shown in the app and as your booking name line (e.g. Ms. Sharma).
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <BrandField
                label="First name"
                name="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="e.g. Priya"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <BrandField
                label="Last name"
                name="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="e.g. Sharma"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

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
              hint="We'll send your account verification code on WhatsApp."
              required
            />

            {err && <ErrorBanner message={err} />}

            <AuthPrimaryButton
              type="button"
              loading={busy}
              disabled={!phoneIsValid || !namesOk}
              onClick={sendOtp}
              trailing={<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
            >
              <span className="inline-flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Send WhatsApp OTP
              </span>
            </AuthPrimaryButton>

            <p className="text-center text-xs text-muted-foreground/80">
              By creating an account you agree to our{' '}
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
              Verify &amp; create account
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
