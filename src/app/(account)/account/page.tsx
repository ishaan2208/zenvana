'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  AtSign,
  BadgeCheck,
  CheckCircle2,
  Contact,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
  User,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton'
import { BrandField } from '@/components/auth/BrandField'
import { OtpInput } from '@/components/auth/OtpInput'
import {
  formatZenvanaGuestProfileName,
  formatZenvanaGuestSalutationName,
  getZenvanaGuestMe,
  patchZenvanaGuestMe,
  postZenvanaGuestLogout,
  type ZenvanaGuestMe,
  type ZenvanaGuestTitle,
} from '@/lib/zenvanaGuestApi'

export default function GuestAccountPage() {
  const [me, setMe] = useState<ZenvanaGuestMe | null | undefined>(undefined)
  const [email, setEmail] = useState('')
  const [emailChallengeId, setEmailChallengeId] = useState<number | null>(null)
  const [emailOtp, setEmailOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    void getZenvanaGuestMe().then(setMe)
  }, [])

  async function logout() {
    await postZenvanaGuestLogout()
    window.location.href = '/login'
  }

  async function requestEmail() {
    setErr(null)
    setNotice(null)
    setBusy(true)
    try {
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
      if (!res.ok) throw new Error(json?.error ?? 'Failed to send code')
      setEmailChallengeId(json.data.challengeId)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to send code')
    } finally {
      setBusy(false)
    }
  }

  async function verifyEmail() {
    if (emailChallengeId == null) return
    setErr(null)
    setBusy(true)
    try {
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
      if (!res.ok) throw new Error(json?.error ?? 'Verification failed')
      const m = await getZenvanaGuestMe()
      setMe(m)
      setEmailChallengeId(null)
      setEmailOtp('')
      setEmail('')
      setNotice('Email verified.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setBusy(false)
    }
  }

  if (me === undefined) return <LoadingState />
  if (!me) return <SignedOutState />

  const salutationName = formatZenvanaGuestSalutationName(me)
  const legalName = formatZenvanaGuestProfileName(me)
  const initial = (
    me.lastName?.trim()?.charAt(0) ||
    me.firstName?.trim()?.charAt(0) ||
    legalName.charAt(0) ||
    me.phoneE164 ||
    'Z'
  )
    .toString()
    .trim()
    .charAt(0)
    .toUpperCase()
  const emailVerified = Boolean(me.emailVerifiedAt && me.email)

  return (
    <div>
      <AccountHero initial={initial} salutationName={salutationName} />

      <section className="container-shell py-10 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ProfileCard me={me} emailVerified={emailVerified} onProfileUpdated={setMe} />

            <div className="quiet-card overflow-hidden">
              <div className="flex items-start gap-3 border-b border-border/60 p-5 sm:p-6">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Email address
                  </div>
                  <h2 className="mt-1 font-serif text-xl font-semibold tracking-[-0.02em] text-foreground">
                    {emailVerified ? 'Update your email' : 'Add a verified email'}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A verified email gives you booking receipts, trip reminders, and a faster way to
                    reach our concierge.
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {notice && (
                  <div className="mb-4 flex items-start gap-2 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{notice}</span>
                  </div>
                )}
                {err && (
                  <div className="mb-4 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                    <span>{err}</span>
                  </div>
                )}

                {emailChallengeId == null ? (
                  <div className="space-y-5">
                    <BrandField
                      label="Email address"
                      type="email"
                      placeholder="you@example.com"
                      leading={<AtSign className="h-4 w-4" />}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <AuthPrimaryButton
                      type="button"
                      loading={busy}
                      disabled={!/^\S+@\S+\.\S+$/.test(email)}
                      onClick={requestEmail}
                      trailing={<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                    >
                      <span className="inline-flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Send verification code
                      </span>
                    </AuthPrimaryButton>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        <KeyRound className="h-3.5 w-3.5" />
                        Code sent to {email}
                      </div>
                      <OtpInput
                        value={emailOtp}
                        onChange={setEmailOtp}
                        autoFocus
                        hasError={Boolean(err)}
                      />
                      <button
                        type="button"
                        className="mt-3 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        onClick={() => {
                          setEmailChallengeId(null)
                          setEmailOtp('')
                          setErr(null)
                        }}
                      >
                        Use a different email
                      </button>
                    </div>
                    <AuthPrimaryButton
                      type="button"
                      loading={busy}
                      disabled={emailOtp.length < 6}
                      onClick={verifyEmail}
                      trailing={<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                    >
                      Verify email
                    </AuthPrimaryButton>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <PointsCard points={me.pointsBalance} />
            <QuickActionsCard onLogout={logout} />
          </div>
        </div>
      </section>
    </div>
  )
}

function AccountHero({
  initial,
  salutationName,
}: {
  initial: string
  salutationName: string
}) {
  const name = salutationName || 'Welcome'
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="brand-gradient absolute inset-0 opacity-95" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(219,230,76,0.18),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-soft-light bg-[repeating-linear-gradient(135deg,_rgba(255,255,255,0.09),_rgba(255,255,255,0.09)_1px,_transparent_1px,_transparent_10px)]" />
      <div className="container-shell relative z-10 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6 sm:flex-row sm:items-center"
        >
          <div className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-white/25 bg-white/10 font-serif text-3xl font-semibold text-white backdrop-blur-md">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-white/85 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              Your Zenvana account
            </div>
            <h1 className="mt-4 font-serif text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
              {name === 'Welcome' ? 'Hello, traveller.' : `Hello, ${name}.`}
            </h1>
            <p className="mt-2 text-sm text-white/80 sm:text-base">
              Manage your details, points, and preferences — all in one quiet place.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function ProfileCard({
  me,
  emailVerified,
  onProfileUpdated,
}: {
  me: ZenvanaGuestMe
  emailVerified: boolean
  onProfileUpdated: (next: ZenvanaGuestMe) => void
}) {
  const [draftTitle, setDraftTitle] = useState<ZenvanaGuestTitle>(() => me.title ?? 'MR')
  const [draftFirst, setDraftFirst] = useState(() => me.firstName ?? '')
  const [draftLast, setDraftLast] = useState(() => me.lastName ?? '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileErr, setProfileErr] = useState<string | null>(null)
  const [profileNotice, setProfileNotice] = useState<string | null>(null)

  useEffect(() => {
    setDraftTitle(me.title ?? 'MR')
    setDraftFirst(me.firstName ?? '')
    setDraftLast(me.lastName ?? '')
    setProfileErr(null)
  }, [me.id, me.title, me.firstName, me.lastName])

  const baselineTitle = me.title ?? 'MR'
  const baselineFirst = (me.firstName ?? '').trim()
  const baselineLast = (me.lastName ?? '').trim()
  const namesOk = draftFirst.trim().length > 0 && draftLast.trim().length > 0
  const profileDirty =
    draftTitle !== baselineTitle ||
    draftFirst.trim() !== baselineFirst ||
    draftLast.trim() !== baselineLast

  const previewMe = {
    title: draftTitle,
    firstName: draftFirst,
    lastName: draftLast,
    displayName: me.displayName,
  }
  const previewBooking = formatZenvanaGuestSalutationName(previewMe)
  const previewLegal = formatZenvanaGuestProfileName(previewMe)

  async function saveProfile() {
    if (!namesOk || !profileDirty) return
    setProfileErr(null)
    setProfileNotice(null)
    setProfileSaving(true)
    try {
      await patchZenvanaGuestMe({
        title: draftTitle,
        firstName: draftFirst.trim(),
        lastName: draftLast.trim(),
      })
      const fresh = await getZenvanaGuestMe()
      if (!fresh) throw new Error('Session expired')
      onProfileUpdated(fresh)
      setProfileNotice('Profile updated.')
    } catch (e) {
      setProfileErr(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setProfileSaving(false)
    }
  }

  return (
    <div className="quiet-card overflow-hidden">
      <div className="flex items-start gap-3 border-b border-border/60 p-5 sm:p-6">
        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
          <BadgeCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Profile
          </div>
          <h2 className="mt-1 font-serif text-xl font-semibold tracking-[-0.02em] text-foreground">
            Your details
          </h2>
        </div>
      </div>

      <div className="space-y-5 border-b border-border/60 p-5 sm:p-6">
        <div>
          <label
            htmlFor="account-guest-title"
            className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
          >
            Courtesy title
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/85 px-4 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
            <select
              id="account-guest-title"
              name="title"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value as ZenvanaGuestTitle)}
              className="h-12 w-full cursor-pointer bg-transparent text-sm text-foreground focus:outline-none"
            >
              <option value="MR">Mr.</option>
              <option value="MS">Ms.</option>
              <option value="MRS">Mrs.</option>
            </select>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground/80">
            Used in greetings and as your booking name line (e.g. Ms. Sharma).
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <BrandField
            label="First name (legal)"
            name="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="e.g. Priya"
            value={draftFirst}
            onChange={(e) => setDraftFirst(e.target.value)}
          />
          <BrandField
            label="Last name (legal)"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="e.g. Sharma"
            value={draftLast}
            onChange={(e) => setDraftLast(e.target.value)}
          />
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <User className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Booking name
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">
                {previewBooking || '—'}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-3 border-t border-border/50 pt-4">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Contact className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Legal full name
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">
                {previewLegal || '—'}
              </div>
            </div>
          </div>
        </div>

        {profileNotice && (
          <div className="flex items-start gap-2 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{profileNotice}</span>
          </div>
        )}
        {profileErr && (
          <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
            <span>{profileErr}</span>
          </div>
        )}

        <AuthPrimaryButton
          type="button"
          loading={profileSaving}
          disabled={!profileDirty || !namesOk}
          onClick={saveProfile}
          trailing={<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
        >
          Save profile
        </AuthPrimaryButton>
      </div>

      <dl className="grid gap-px bg-border/60 sm:grid-cols-2">
        <ProfileRow
          icon={<Phone className="h-4 w-4" />}
          label="Mobile number"
          value={me.phoneE164}
          badge={
            <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-success">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </span>
          }
        />
        <ProfileRow
          icon={<Mail className="h-4 w-4" />}
          label="Email"
          value={me.email || 'Not added yet'}
          muted={!me.email}
          badge={
            emailVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-success">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            ) : me.email ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">
                Unverified
              </span>
            ) : null
          }
        />
      </dl>
    </div>
  )
}

function ProfileRow({
  icon,
  label,
  value,
  badge,
  muted,
}: {
  icon: React.ReactNode
  label: string
  value: string
  badge?: React.ReactNode
  muted?: boolean
}) {
  return (
    <div className="flex items-start gap-3 bg-card/80 p-5">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <div
          className={[
            'mt-1 truncate text-sm font-medium',
            muted ? 'text-muted-foreground' : 'text-foreground',
          ].join(' ')}
        >
          {value}
        </div>
      </div>
      {badge}
    </div>
  )
}

function PointsCard({ points }: { points: number }) {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-border/60 bg-card/80 shadow-card backdrop-blur">
      <div className="brand-gradient absolute inset-0 opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(219,230,76,0.28),_transparent_60%)]" />
      <div className="relative z-10 p-6 text-white">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-white/85 backdrop-blur-md">
          <Sparkles className="h-3 w-3" />
          Loyalty
        </div>
        <div className="mt-4 font-serif text-5xl font-semibold tabular-nums tracking-[-0.03em]">
          {points.toLocaleString('en-IN')}
        </div>
        <div className="mt-1 text-sm text-white/80">points balance</div>
        <p className="mt-4 text-xs leading-6 text-white/75">
          Earn points on every direct booking and use them toward future stays at any Zenvana
          property.
        </p>
        <Link
          href="/hotels"
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
        >
          Earn more
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

function QuickActionsCard({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="quiet-card overflow-hidden">
      <div className="flex items-start gap-3 border-b border-border/60 p-5">
        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Quick actions
          </div>
          <h2 className="mt-1 font-serif text-lg font-semibold tracking-[-0.02em] text-foreground">
            Get around faster
          </h2>
        </div>
      </div>
      <ul className="divide-y divide-border/60">
        <ActionRow href="/my-bookings" label="My bookings" hint="Stays past, present, future" />
        <ActionRow href="/hotels" label="Browse stays" hint="Direct bookings, best rates" />
        <ActionRow href="/contact" label="Contact concierge" hint="We’re here to help" />
      </ul>
      <button
        type="button"
        onClick={onLogout}
        className="group flex w-full items-center justify-between border-t border-border/60 bg-background/50 px-5 py-4 text-sm font-medium text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
      >
        <span className="inline-flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Log out
        </span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  )
}

function ActionRow({
  href,
  label,
  hint,
}: {
  href: string
  label: string
  hint: string
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-muted/40"
      >
        <div>
          <div className="text-sm font-semibold text-foreground">{label}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </Link>
    </li>
  )
}

function LoadingState() {
  return (
    <div className="container-shell py-20">
      <div className="quiet-card flex items-center gap-4 p-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading your account…</span>
      </div>
    </div>
  )
}

function SignedOutState() {
  return (
    <div className="container-shell flex min-h-[60vh] items-center justify-center py-16">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="quiet-card max-w-md p-8 text-center"
      >
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-accent/20 text-accent-foreground">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="mt-5 font-serif text-2xl font-semibold tracking-[-0.02em] text-foreground">
          Please sign in.
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Your account, points, and bookings are one WhatsApp OTP away.
        </p>
        <div className="mt-6">
          <Link href="/login" className="inline-block w-full">
            <AuthPrimaryButton
              type="button"
              trailing={<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
            >
              Sign in
            </AuthPrimaryButton>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
