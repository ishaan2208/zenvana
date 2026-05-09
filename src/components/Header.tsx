'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BadgePercent,
  BedDouble,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Home,
  Info,
  LogIn,
  LogOut,
  Luggage,
  MapPinned,
  Menu,
  MoonStar,
  NotebookPen,
  PartyPopper,
  Phone,
  Sparkles,
  UserCircle2,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react'
import clsx from 'clsx'

import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  formatZenvanaGuestProfileName,
  formatZenvanaGuestSalutationName,
  getZenvanaGuestMe,
  postZenvanaGuestLogout,
  type ZenvanaGuestMe,
} from '@/lib/zenvanaGuestApi'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  blurb: string
}

const nav: NavItem[] = [
  { href: '/', label: 'Home', icon: Home, blurb: 'Start here' },
  { href: '/hotels', label: 'Hotels', icon: Building2, blurb: 'Find your stay' },
  { href: '/restaurant', label: 'Restaurant', icon: UtensilsCrossed, blurb: 'Dining & café' },
  { href: '/weddings', label: 'Weddings', icon: PartyPopper, blurb: 'Events & celebrations' },
  { href: '/blog', label: 'Blog', icon: NotebookPen, blurb: 'Stories & guides' },
  { href: '/contact', label: 'Contact', icon: Phone, blurb: 'Get in touch' },
  { href: '/about', label: 'About', icon: Info, blurb: 'Our philosophy' },
  { href: '/offers', label: 'Offers', icon: BadgePercent, blurb: 'Best current deals' },
]

const desktopNav: { href: string; label: string }[] = [
  { href: '/hotels', label: 'Hotels' },
  { href: '/restaurant', label: 'Restaurant' },
  { href: '/weddings', label: 'Weddings' },
  { href: '/offers', label: 'Offers' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Header() {
  const pathname = usePathname() ?? '/'
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [guest, setGuest] = useState<ZenvanaGuestMe | null>(null)

  useEffect(() => {
    void getZenvanaGuestMe().then(setGuest)
  }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }

    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      window.scrollTo(0, scrollY)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [mobileOpen])

  return (
    <>
      <header
        className={clsx(
          'sticky top-0 z-50 border-b border-border bg-background pt-[env(safe-area-inset-top)] transition-colors duration-300',
          scrolled && 'shadow-[0_10px_40px_-22px_rgba(0,0,0,0.32)]',
        )}
      >
        <div className="container-shell">
          <div className="flex h-[76px] items-center justify-between gap-2 sm:h-[84px] sm:gap-3">
            <Link
              href="/"
              aria-label="Zenvana home"
              className="group flex min-w-0 items-center gap-3"
            >
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
                <Logo className="relative h-12 w-auto sm:h-14" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[0.7rem] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    Zenvana Hotels
                  </span>
                  <span className="hidden rounded-full border border-border/60 bg-card/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground min-[430px]:inline-flex">
                    Boutique stays
                  </span>
                </div>


              </div>
            </Link>

            <nav
              aria-label="Primary navigation"
              className="hidden lg:flex"
            >
              <div className="flex items-center gap-0.5 rounded-full border border-border/60 bg-card/70 p-1 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.24)] backdrop-blur-xl">
                {desktopNav.map((item) => {
                  const active = isActivePath(pathname, item.href)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={clsx(
                        'relative inline-flex items-center rounded-full px-3.5 py-2 text-[0.875rem] font-medium tracking-tight transition-colors duration-200 xl:px-4',
                        active
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="desktop-nav-pill"
                          className="absolute inset-0 -z-10 rounded-full bg-background shadow-sm dark:bg-muted/80"
                          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        />
                      )}
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <div className="scale-[0.96] sm:scale-100">
                <ThemeToggle />
              </div>

              {guest ? (
                <DesktopGuestMenu guest={guest} onLogout={() => setGuest(null)} />
              ) : (
                <Link
                  href="/login"
                  className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-3 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur-xl transition-colors hover:bg-card lg:inline-flex"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Link>
              )}

              <Link
                href="/hotels"
                className="hidden h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_12px_28px_-16px_rgba(0,0,0,0.45)] transition-transform duration-200 hover:-translate-y-0.5 md:inline-flex"
              >
                <BedDouble className="h-4 w-4" />
                <span>Book a stay</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/hotels"
                aria-label="Book a stay"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card/80 text-foreground shadow-sm backdrop-blur-xl transition-colors hover:bg-card md:hidden"
              >
                <CalendarDays className="h-5 w-5" />
              </Link>

              <button
                type="button"
                aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((prev) => !prev)}
                className={clsx(
                  'inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card/80 text-foreground shadow-sm backdrop-blur-xl transition-all duration-200 hover:bg-card lg:hidden',
                  mobileOpen && 'bg-primary text-primary-foreground',
                )}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <MobileMenu
            pathname={pathname}
            guest={guest}
            onGuestChange={setGuest}
            onClose={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function DesktopGuestMenu({
  guest,
  onLogout,
}: {
  guest: ZenvanaGuestMe
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const salutation = formatZenvanaGuestSalutationName(guest) || 'Guest'
  const legal = formatZenvanaGuestProfileName(guest)
  const initial =
    (guest.lastName?.trim()?.charAt(0) ||
      guest.firstName?.trim()?.charAt(0) ||
      legal?.charAt(0) ||
      guest.phoneE164 ||
      'Z')
      .replace(/[^A-Za-z0-9]/g, '')
      .charAt(0)
      .toUpperCase() || 'Z'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className={clsx(
            'hidden h-11 items-center gap-2 rounded-full border border-border/60 bg-card/80 pl-1.5 pr-3 text-sm font-medium text-foreground shadow-sm backdrop-blur-xl transition-colors hover:bg-card lg:inline-flex',
            open && 'bg-card',
          )}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-serif text-sm font-semibold text-primary">
            {initial}
          </span>
          <span
            className="max-w-[8rem] truncate"
            title={legal || undefined}
          >
            {salutation}
          </span>
          <ChevronDown
            className={clsx(
              'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-72 rounded-2xl border-border/60 p-0 shadow-[0_22px_60px_-30px_rgba(0,0,0,0.45)]"
      >
        <div className="brand-gradient relative overflow-hidden rounded-t-2xl px-4 py-3.5 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(219,230,76,0.22),_transparent_60%)]" />
          <div className="relative flex items-center gap-3">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 font-serif text-base font-semibold backdrop-blur-md">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{salutation}</div>
              <div className="mt-0.5 truncate text-[11px] text-white/75">
                {guest.phoneE164}
              </div>
            </div>
          </div>
          <div className="relative mt-3 flex items-center justify-between rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/85 backdrop-blur-md">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Points
            </span>
            <span className="text-sm font-semibold tabular-nums tracking-normal text-white">
              {guest.pointsBalance.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="p-1.5">
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/70"
          >
            <UserCircle2 className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            <div className="min-w-0 flex-1">
              <div className="font-medium">Account</div>
              <div className="text-[11px] text-muted-foreground">Profile & email</div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/my-bookings"
            onClick={() => setOpen(false)}
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/70"
          >
            <Luggage className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            <div className="min-w-0 flex-1">
              <div className="font-medium">My bookings</div>
              <div className="text-[11px] text-muted-foreground">
                Past, present, future
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>

          <div className="my-1 h-px bg-border/70" />

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              void postZenvanaGuestLogout().then(() => onLogout())
            }}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="font-medium">Log out</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function MobileMenu({
  pathname,
  guest,
  onGuestChange,
  onClose,
}: {
  pathname: string
  guest: ZenvanaGuestMe | null
  onGuestChange: (g: ZenvanaGuestMe | null) => void
  onClose: () => void
}) {
  return (
    <>
      <motion.button
        type="button"
        aria-label="Close menu overlay"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/38 backdrop-blur-md lg:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.985 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 mx-auto w-[calc(100%-1.5rem)] max-w-md lg:hidden"
        style={{
          maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 1.5rem)',
        }}
      >
        <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-background/96 shadow-2xl backdrop-blur-2xl">
          <div className="max-h-[calc(100dvh-env(safe-area-inset-top)-1.5rem)] overflow-y-auto overscroll-contain p-3">
            <div className="rounded-[1.6rem] border border-border/60 bg-card/80 p-3.5">
              <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    <MoonStar className="h-3.5 w-3.5" />
                    <span>Zenvana Hotels</span>
                  </div>
                  <div className="mt-1 text-base font-semibold tracking-tight text-foreground">
                    Boutique stays
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <div className="scale-[0.95]">
                    <ThemeToggle />
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close navigation"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background text-foreground transition-colors hover:bg-muted"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {guest ? (
                <MobileIdentityCard guest={guest} onClose={onClose} />
              ) : (
                <MobileSignInCard onClose={onClose} />
              )}

              <Link
                href="/hotels"
                onClick={onClose}
                className="group mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-medium text-primary-foreground shadow-[0_14px_30px_-18px_rgba(0,31,63,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-18px_rgba(0,31,63,0.55)]"
              >
                <CalendarDays className="h-4 w-4" />
                <span>Book a stay</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <SectionEyebrow>Explore</SectionEyebrow>
              <div className="grid grid-cols-2 gap-2.5">
                {nav.map((item, index) => (
                  <MobileNavCard
                    key={item.href}
                    item={item}
                    active={isActivePath(pathname, item.href)}
                    index={index}
                    onClose={onClose}
                  />
                ))}
              </div>

              {guest && (
                <>
                  <SectionEyebrow>Your account</SectionEyebrow>
                  <div className="grid grid-cols-2 gap-2.5">
                    <MobileNavCard
                      item={{
                        href: '/account',
                        label: 'Account',
                        icon: UserCircle2,
                        blurb: 'Profile & email',
                      }}
                      active={isActivePath(pathname, '/account')}
                      index={0}
                      onClose={onClose}
                    />
                    <MobileNavCard
                      item={{
                        href: '/my-bookings',
                        label: 'My bookings',
                        icon: Luggage,
                        blurb: 'Past, present, future',
                      }}
                      active={isActivePath(pathname, '/my-bookings')}
                      index={1}
                      onClose={onClose}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void postZenvanaGuestLogout().then(() => {
                        onGuestChange(null)
                        onClose()
                      })
                    }}
                    className="group mt-2.5 flex w-full items-center justify-between gap-2 rounded-[1.35rem] border border-border/60 bg-background px-4 py-3.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted/60 hover:text-foreground"
                  >
                    <span className="inline-flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Log out
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

function MobileNavCard({
  item,
  active,
  index,
  onClose,
}: {
  item: NavItem
  active: boolean
  index: number
  onClose: () => void
}) {
  const Icon = item.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ delay: 0.03 * index, duration: 0.18 }}
    >
      <Link
        href={item.href}
        onClick={onClose}
        aria-current={active ? 'page' : undefined}
        className={clsx(
          'group flex min-h-[88px] flex-col justify-between rounded-[1.35rem] border p-3.5 transition-all duration-200',
          active
            ? 'border-primary/25 bg-primary/10 text-foreground shadow-sm dark:bg-primary/15'
            : 'border-border/60 bg-background text-foreground hover:border-border hover:bg-muted/60',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div
            className={clsx(
              'inline-flex h-9 w-9 items-center justify-center rounded-2xl border transition-colors',
              active
                ? 'border-primary/20 bg-background/90 text-primary dark:bg-background/15'
                : 'border-border/60 bg-card text-muted-foreground group-hover:text-foreground',
            )}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>

          <ChevronRight
            className={clsx(
              'h-4 w-4 transition-transform duration-200',
              active
                ? 'text-primary'
                : 'text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground',
            )}
          />
        </div>

        <div className="mt-3">
          <div className="text-sm font-semibold tracking-tight">{item.label}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{item.blurb}</div>
        </div>
      </Link>
    </motion.div>
  )
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 mt-4 flex items-center gap-3 px-1 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
      <span>{children}</span>
      <span className="h-px flex-1 bg-border/70" />
    </div>
  )
}

function MobileIdentityCard({
  guest,
  onClose,
}: {
  guest: ZenvanaGuestMe
  onClose: () => void
}) {
  const salutation = formatZenvanaGuestSalutationName(guest)
  const legal = formatZenvanaGuestProfileName(guest)
  const initial =
    (guest.lastName?.trim()?.charAt(0) ||
      guest.firstName?.trim()?.charAt(0) ||
      legal?.charAt(0) ||
      guest.phoneE164 ||
      'Z')
      .replace(/[^A-Za-z0-9]/g, '')
      .charAt(0)
      .toUpperCase() || 'Z'
  const primary = salutation || 'Zenvana guest'
  const secondary = guest.phoneE164

  return (
    <Link
      href="/account"
      onClick={onClose}
      aria-label="View account"
      className="group relative mt-3 block overflow-hidden rounded-[1.4rem] border border-border/60 bg-card p-3.5 transition-colors hover:border-border"
    >
      <div className="brand-gradient absolute inset-0 opacity-95" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(219,230,76,0.22),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-soft-light bg-[repeating-linear-gradient(135deg,_rgba(255,255,255,0.09),_rgba(255,255,255,0.09)_1px,_transparent_1px,_transparent_10px)]" />

      <div className="relative z-10 flex items-center gap-3 text-white">
        <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/10 font-serif text-xl font-semibold backdrop-blur-md">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-white/75">
            <Sparkles className="h-3 w-3" />
            Signed in
          </div>
          <div className="mt-0.5 truncate text-sm font-semibold">{primary}</div>
          <div className="mt-0.5 truncate text-xs text-white/75">{secondary}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white backdrop-blur-md">
            <Sparkles className="h-3 w-3" />
            {guest.pointsBalance.toLocaleString('en-IN')} pts
          </span>
          <ChevronRight className="h-4 w-4 text-white/70 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  )
}

function MobileSignInCard({ onClose }: { onClose: () => void }) {
  return (
    <Link
      href="/login"
      onClick={onClose}
      className="group mt-3 flex items-center gap-3 rounded-[1.4rem] border border-border/60 bg-background p-3.5 transition-colors hover:border-border hover:bg-muted/60"
    >
      <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card text-muted-foreground transition-colors group-hover:text-foreground">
        <LogIn className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Guest access
        </div>
        <div className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">
          Sign in or create account
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          WhatsApp OTP — no password to remember
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  )
}