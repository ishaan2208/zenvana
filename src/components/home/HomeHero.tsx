'use client'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Leaf,
  MapPinned,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'

const highlights = [
  {
    title: 'Better direct rates',
    description: 'Book on our site for cleaner pricing and direct-only value.',
    icon: BadgeCheck,
  },
  {
    title: 'Flexible human support',
    description: 'Questions, changes, and requests handled without platform ping-pong.',
    icon: ShieldCheck,
  },
  {
    title: 'Curated stays',
    description: 'Boutique and family-friendly hotels designed for comfort, ease, and warmth.',
    icon: Leaf,
  },
]

const quickFacts = [
  'Boutique & family-friendly stays',
  'Direct booking support',
  'Offers and seasonal value',
]

export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden bg-background pb-16 pt-20 sm:pb-24 sm:pt-24 lg:min-h-[92svh] lg:pb-20 lg:pt-28">
      <HeroBackdrop />

      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(440px,0.98fr)]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.26em] text-muted-foreground shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Book direct with Zenvana
            </div>

            <h1 className="mt-6 max-w-4xl font-display text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl sm:leading-[1.02] lg:text-7xl">
              Boutique stays
              <span className="block text-primary/90">
                with a calmer way to arrive.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Discover Zenvana Hotels for boutique and family-friendly stays,
              direct booking offers, and thoughtful hospitality designed to make
              every arrival feel smoother, warmer, and more personal.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                href="/hotels"
                className="group min-w-[190px] bg-primary text-primary-foreground shadow-card transition duration-300 hover:-translate-y-0.5 hover:bg-primary/90"
              >
                <span className="inline-flex items-center gap-2">
                  Explore our hotels
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Button>

              <Button
                href="/offers"
                variant="outline"
                color="slate"
                className="min-w-[190px] border-border bg-background/70 text-foreground backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-background"
              >
                View offers
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {quickFacts.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-2 shadow-sm"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {item}
                </span>
              ))}
            </div>

            <dl className="mt-10 grid gap-3 sm:grid-cols-3">
              {highlights.map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.55,
                      delay: 0.12 + index * 0.08,
                      ease: 'easeOut',
                    }}
                    className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-soft backdrop-blur"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-2xl border border-border/60 bg-background p-2.5">
                        <Icon className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div>
                        <dt className="text-sm font-semibold text-foreground">
                          {item.title}
                        </dt>
                        <dd className="mt-1 text-sm leading-6 text-muted-foreground">
                          {item.description}
                        </dd>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </dl>
          </motion.div>

          <HeroShowcase />
        </div>
      </Container>
    </section>
  )
}

function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          background:
            'radial-gradient(circle at 12% 14%, rgba(219,230,76,0.20), transparent 22%), radial-gradient(circle at 88% 18%, rgba(0,128,76,0.14), transparent 22%), radial-gradient(circle at 72% 86%, rgba(30,72,143,0.12), transparent 28%), linear-gradient(180deg, #F6F7ED 0%, #F6F7ED 52%, rgba(255,255,255,1) 100%)',
        }}
      />
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background:
            'radial-gradient(circle at 15% 12%, rgba(219,230,76,0.10), transparent 24%), radial-gradient(circle at 85% 14%, rgba(0,128,76,0.16), transparent 22%), radial-gradient(circle at 70% 82%, rgba(30,72,143,0.24), transparent 30%), linear-gradient(180deg, #001F3F 0%, #06274D 52%, #001529 100%)',
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.45] dark:opacity-[0.16]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,31,63,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,31,63,0.07) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl dark:bg-accent/10" />
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl dark:bg-primary/10" />
      <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-400/10" />
    </div>
  )
}

function HeroShowcase() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.08, ease: 'easeOut' }}
      className="relative mx-auto w-full max-w-[640px]"
    >
      <div className="absolute -left-3 top-10 hidden h-28 w-28 rounded-full border border-accent/30 bg-accent/10 blur-2xl sm:block" />
      <div className="absolute -right-6 bottom-8 hidden h-36 w-36 rounded-full border border-primary/20 bg-primary/10 blur-2xl sm:block" />

      <div className="group relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/85 p-3 shadow-[0_20px_80px_rgba(0,31,63,0.14)] backdrop-blur-xl dark:shadow-[0_24px_90px_rgba(0,0,0,0.38)]">
        <div className="rounded-[1.5rem] border border-border/60 bg-background/90 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Editorial preview
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                The Zenvana arrival feeling
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs text-muted-foreground">
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Direct booking
            </div>
          </div>

          <div className="relative mt-4 overflow-hidden rounded-[1.6rem] border border-border/60 bg-[linear-gradient(135deg,rgba(0,31,63,0.98),rgba(30,72,143,0.88)_52%,rgba(0,128,76,0.78))] p-5 text-white sm:p-6">
            {/* 
              Optional future hero image slot.

              AI image prompt:
              "Ultra-premium editorial hotel website hero image, boutique Indian hillside retreat at blue hour,
              warm architectural lighting, calm water reflection, stone and wood textures, subtle luxury,
              cinematic composition, negative space for headline, midnight navy + olive-lime palette,
              high-end travel magazine aesthetic, no text, no watermark, no people close-up, 16:10"

              Example usage later:
              <Image
                src="/images/zenvana/hero-editorial.webp"
                alt="Zenvana boutique hotel exterior at dusk"
                fill
                className="object-cover"
                priority
              />
            */}

            <div className="absolute inset-0 opacity-30 mix-blend-screen">
              <div className="absolute inset-x-0 top-0 h-px bg-white/50" />
              <div className="absolute left-[14%] top-[16%] h-44 w-44 rounded-full bg-[#DBE64C] blur-3xl" />
              <div className="absolute right-[12%] top-[10%] h-48 w-48 rounded-full bg-[#74C365] blur-3xl" />
              <div className="absolute bottom-[-12%] left-[30%] h-52 w-52 rounded-full bg-white/20 blur-3xl" />
            </div>

            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />

            <div className="relative z-10 flex min-h-[360px] flex-col justify-between">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-xs">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/70">
                    Boutique hospitality
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Where quiet luxury meets practical comfort.
                  </h2>
                </div>

                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="hidden rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-md sm:block"
                >
                  <Sparkles className="h-5 w-5 text-[#DBE64C]" />
                </motion.div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="max-w-[240px] rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/70">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Arrival ease
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/90">
                    Faster coordination, cleaner communication, and a direct line to the property.
                  </p>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 7, 0] }}
                  transition={{ duration: 8.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="justify-self-end rounded-2xl border border-white/15 bg-black/15 p-4 backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/70">
                    <MapPinned className="h-3.5 w-3.5" />
                    Stay style
                  </div>
                  <p className="mt-2 text-sm font-medium text-white">
                    Boutique rooms • family comfort • direct offers
                  </p>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniTile
              title="Calm arrival"
              body="Designed to feel smoother from booking to check-in."
            />
            <MiniTile
              title="Thoughtful value"
              body="Better direct-booking logic, fewer platform headaches."
            />
            <MiniTile
              title="Real hospitality"
              body="Warm support, flexible help, and a more personal stay."
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function MiniTile({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-soft">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  )
}