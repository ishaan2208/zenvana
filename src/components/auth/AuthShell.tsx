'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles } from 'lucide-react'

import { Logo } from '@/components/Logo'

export type TrustMark = {
  icon?: React.ReactNode
  label: string
}

type AuthShellProps = {
  eyebrow?: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  imageSrc: string
  imageAlt?: string
  quote?: { text: string; caption?: string }
  trustMarks?: TrustMark[]
  footer?: React.ReactNode
  children: React.ReactNode
}

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  imageSrc,
  imageAlt = '',
  quote,
  trustMarks,
  footer,
  children,
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-dvh w-full bg-background text-foreground">
      <div className="relative z-10 flex w-full flex-col px-5 py-8 sm:px-10 sm:py-10 md:w-[55%] md:px-12 lg:w-[48%] lg:px-16 xl:px-24">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" aria-label="Zenvana home" className="group inline-flex items-center">
            <Logo className="h-12 w-auto sm:h-14" />
          </Link>
          <Link
            href="/"
            className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur transition hover:bg-card hover:text-foreground sm:inline-flex"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to site
          </Link>
        </div>

        <motion.main
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-10 flex w-full max-w-md flex-1 flex-col justify-center sm:mt-14"
        >
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h1 className="display-title mt-3 text-3xl sm:text-[2.4rem] sm:leading-[1.08] lg:text-[2.6rem]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{subtitle}</p>
          )}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-8 text-sm text-muted-foreground">{footer}</div>}

          {trustMarks && trustMarks.length > 0 && (
            <div className="mt-12 grid gap-3 border-t border-border/60 pt-6 sm:grid-cols-3">
              {trustMarks.map((m) => (
                <div
                  key={m.label}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  {m.icon && <span className="text-foreground/70">{m.icon}</span>}
                  <span className="leading-snug">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </motion.main>
      </div>

      <div className="relative hidden md:block md:w-[45%] lg:w-[52%]">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="(min-width: 1024px) 52vw, 45vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(0,31,63,0.62)_0%,_rgba(30,72,143,0.45)_50%,_rgba(0,128,76,0.32)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(0,0,0,0.05)_0%,_rgba(0,0,0,0.12)_45%,_rgba(0,0,0,0.6)_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-soft-light bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_60%),repeating-linear-gradient(135deg,_rgba(255,255,255,0.09),_rgba(255,255,255,0.09)_1px,_transparent_1px,_transparent_10px)]" />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 lg:p-14">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 self-start rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-white/85 backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Zenvana Hotels · Dehradun
          </motion.div>

          {quote && (
            <motion.figure
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-xl"
            >
              <blockquote className="font-serif text-2xl font-medium leading-snug tracking-[-0.02em] text-white sm:text-3xl lg:text-[2.25rem] lg:leading-[1.18]">
                &ldquo;{quote.text}&rdquo;
              </blockquote>
              {quote.caption && (
                <figcaption className="mt-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-white/70">
                  <span className="h-px w-8 bg-white/40" />
                  {quote.caption}
                </figcaption>
              )}
            </motion.figure>
          )}
        </div>
      </div>
    </div>
  )
}
