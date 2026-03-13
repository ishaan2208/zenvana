'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Popover, Transition } from '@headlessui/react'
import { Menu, MessageCircle, Phone, Search, X } from 'lucide-react'
import clsx from 'clsx'

import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'

const nav = [
  { href: '/', label: 'Home' },
  { href: '/hotels', label: 'Hotels' },
  { href: '/restaurant', label: 'Restaurant' },
  { href: '/offers', label: 'Offers' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={clsx(
        'sticky top-0 z-50 transition duration-300 relative',
        scrolled
          ? 'border-b border-border/60 bg-background/82 backdrop-blur-xl'
          : 'border-b border-white/10 bg-transparent backdrop-blur-xl',
      )}
    >
      <div
        aria-hidden="true"
        className={clsx(
          'pointer-events-none absolute inset-0',
          scrolled
            ? 'opacity-0'
            : 'opacity-100 bg-gradient-to-r from-amber-500/35 via-black/10 to-black/35',
        )}
      />
      <div className="container-shell">
        <div className="flex h-[80px] items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Zenvana home">
            <Logo className="h-10 w-auto sm:h-12" />
          </Link>

          <nav className="hidden items-center gap-10 lg:flex" aria-label="Primary navigation">
            {nav.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'text-[11px] font-medium uppercase tracking-[0.24em] text-foreground/80 transition hover:text-foreground',
                    'pb-1',
                    isActive && 'text-foreground',
                  )}
                >
                  <span
                    className={clsx(
                      'relative inline-block pb-1',
                      isActive &&
                        'after:absolute after:inset-x-0 after:-bottom-[2px] after:h-[2px] after:rounded-full after:bg-foreground',
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                aria-label="Search"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground/80 hover:bg-card hover:text-foreground"
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Open messages"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground/80 hover:bg-card hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
              <div className="hidden items-center gap-2 lg:flex">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="text-xs font-medium tracking-[0.16em] text-foreground/80">
                  +91 9084702208
                </div>
              </div>
            </div>

            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  )
}

function MobileMenu() {
  return (
    <Popover className="lg:hidden">
      {({ open }) => (
        <>
          <Popover.Button
            aria-label="Toggle navigation"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-card/80 text-foreground"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Popover.Button>

          <Transition appear>
            <Transition.Child
              as="div"
              enter="transition duration-200 ease-out"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition duration-150 ease-in"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              className="fixed inset-0 z-40"
            >
              <Popover.Overlay className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            </Transition.Child>

            <Transition.Child
              as="div"
              enter="transition duration-250 ease-out"
              enterFrom="opacity-0 translate-y-3 scale-[0.985]"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="transition duration-150 ease-in"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-2 scale-[0.985]"
              className="fixed inset-x-4 top-[88px] z-50"
            >
              <Popover.Panel className="rounded-[1.75rem] border border-border/70 bg-card/95 p-4 shadow-2xl backdrop-blur-xl">
                <div className="rounded-[1.4rem] border border-border/60 bg-background p-4">
                  <div className="border-b border-border/60 pb-4">
                    <div className="eyebrow">Boutique & family stays</div>
                    <div className="mt-2 text-lg font-medium tracking-tight text-foreground">
                      A calmer way to stay in Dehradun
                    </div>
                  </div>

                  <div className="grid gap-2 py-4">
                    {nav.map((item) => (
                      <Popover.Button
                        key={item.href}
                        as={Link}
                        href={item.href}
                        className="rounded-2xl px-3 py-3 text-left text-sm text-foreground/85 transition hover:bg-card hover:text-foreground"
                      >
                        {item.label}
                      </Popover.Button>
                    ))}
                  </div>
                </div>
              </Popover.Panel>
            </Transition.Child>
          </Transition>
        </>
      )}
    </Popover>
  )
}