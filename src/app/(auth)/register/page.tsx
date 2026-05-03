'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  HeartHandshake,
  Loader2,
  Phone,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'

import { useAppRouter } from '@/hooks/useAppRouter'
import { AuthShell } from '@/components/auth/AuthShell'
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton'
import { BrandField } from '@/components/auth/BrandField'

type FormValues = {
  first_name: string
  last_name: string
  phone: string
  email: string
}

export default function PartnerRegisterPage() {
  const router = useAppRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: { first_name: '', last_name: '', phone: '', email: '' },
  })

  const onSubmit = (values: FormValues) => {
    setLoading(true)
    axios
      .post(`${process.env.NEXT_PUBLIC_API_URL}/leads`, {
        firstName: values.first_name,
        lastName: values.last_name,
        phone: values.phone,
        email: values.email,
      })
      .then(() => {
        reset()
        router.push('/thankyou')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <AuthShell
      eyebrow="Partner with Zenvana"
      title={<>List your property.</>}
      subtitle={
        <>
          Join a curated portfolio of boutique stays across Dehradun. We handle direct bookings,
          guest communication, and revenue tools so you can focus on hospitality.
        </>
      }
      imageSrc="/images/dehradun/rajpur-road-editorial.jpg"
      imageAlt="Rajpur Road, Dehradun — Zenvana partners"
      quote={{
        text: 'A growing portfolio of properties shaped by Rajpur Road, foothill calm, and direct-booking ease.',
        caption: 'Zenvana partner network',
      }}
      trustMarks={[
        { icon: <TrendingUp className="h-3.5 w-3.5" />, label: 'Higher direct booking conversion.' },
        { icon: <Building2 className="h-3.5 w-3.5" />, label: 'Tools built for boutique hotels.' },
        { icon: <HeartHandshake className="h-3.5 w-3.5" />, label: 'Personal onboarding support.' },
      ]}
      footer={
        <p>
          Booking as a guest?{' '}
          <Link
            href="/guest/signup"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create a guest account
          </Link>{' '}
          instead.
        </p>
      }
    >
      <CallCtaCard />

      <div className="my-8 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/80">
        <span className="h-px flex-1 bg-border/70" />
        Or share details
        <span className="h-px flex-1 bg-border/70" />
      </div>

      {loading ? (
        <SubmittingState />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <BrandField
              label="First name"
              placeholder="Aarav"
              error={errors.first_name?.message}
              {...register('first_name', {
                required: 'Required',
                maxLength: { value: 20, message: 'Max 20 characters' },
              })}
            />
            <BrandField
              label="Last name"
              placeholder="Sharma"
              error={errors.last_name?.message}
              {...register('last_name', {
                required: 'Required',
                maxLength: { value: 20, message: 'Max 20 characters' },
              })}
            />
          </div>

          <BrandField
            label="Phone"
            placeholder="98XXX XXXXX"
            inputMode="numeric"
            leading={<>+91</>}
            error={errors.phone?.message}
            {...register('phone', {
              required: 'Required',
              pattern: { value: /^[0-9]{10}$/, message: 'Enter a valid 10-digit number' },
            })}
          />

          <BrandField
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'Required',
              pattern: {
                value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: 'Enter a valid email',
              },
            })}
          />

          <AuthPrimaryButton
            type="submit"
            trailing={<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
          >
            Get started
          </AuthPrimaryButton>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground/80">
            <CheckCircle2 className="h-3.5 w-3.5 text-foreground/60" />
            We&rsquo;ll reach out within one business day.
          </p>
        </form>
      )}
    </AuthShell>
  )
}

function CallCtaCard() {
  return (
    <div className="quiet-card overflow-hidden">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Talk to our team
            </div>
            <div className="mt-1 text-base font-semibold tracking-tight text-foreground">
              Prefer a quick call?
            </div>
          </div>
        </div>
        <a
          href="tel:+919084702208"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_12px_28px_-16px_rgba(0,0,0,0.45)] transition hover:-translate-y-0.5"
        >
          <Phone className="h-4 w-4" />
          +91 90847 02208
        </a>
      </div>
      <div className="h-1 bg-gradient-to-r from-primary/30 via-accent/25 to-primary/30" />
    </div>
  )
}

function SubmittingState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="quiet-card flex items-center gap-4 p-6"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <div>
        <div className="text-sm font-semibold text-foreground">Submitting your details</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Please don&rsquo;t refresh or close this tab while we save your information.
        </p>
      </div>
    </motion.div>
  )
}
