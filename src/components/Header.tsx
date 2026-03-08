'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { Menu, X } from 'lucide-react'
import clsx from 'clsx'

import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'

const nav = [
  { href: '/hotels', label: 'Hotels' },
  { href: '/destinations', label: 'Destinations' },
  { href: '/offers', label: 'Offers' },
  { href: '/experiences', label: 'Experiences' },
  { href: '/about', label: 'About' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={clsx(
        'sticky top-0 z-50 transition duration-300',
        scrolled
          ? 'border-b border-border/60 bg-background/82 backdrop-blur-xl'
          : 'bg-transparent',
      )}
    >
      <div className="container-shell">
        <div className="flex h-[76px] items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3" aria-label="Zenvana home">
            <Logo className="h-10 w-auto sm:h-12" />
            <div className="hidden sm:block">
              <div className="eyebrow">Zenvana Hotels</div>
              <div className="mt-1 text-sm text-foreground/80">
                Dehradun stays, book direct
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="site-link">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            <Link href="/hotels" className="site-button-dark hidden md:inline-flex">
              Book a stay
            </Link>

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
                    <div className="eyebrow">Zenvana Hotels</div>
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

                  <Link href="/hotels" className="site-button-dark w-full">
                    Book a stay
                  </Link>
                </div>
              </Popover.Panel>
            </Transition.Child>
          </Transition>
        </>
      )}
    </Popover>
  )
}