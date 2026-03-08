import Link from 'next/link'
import { Instagram, MapPin, Phone, Mail } from 'lucide-react'

import { Logo } from '@/components/Logo'

const footerNav = {
  stay: [
    { href: '/hotels', label: 'Hotels' },
    { href: '/offers', label: 'Offers' },
    { href: '/destinations', label: 'Destinations' },
  ],
  company: [
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacypolicy', label: 'Privacy Policy' },
  ],
}

export function Footer() {
  return (
    <footer className="section-rule bg-muted/30">
      <div className="container-shell">
        <div className="grid gap-10 py-12 sm:py-14 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div className="max-w-md">
            <Logo className="h-12 w-auto" />
            <p className="mt-5 body-copy">
              Zenvana is a Dehradun-rooted hospitality brand shaped by hills,
              long mornings, calmer stays, and direct-booking ease.
            </p>
          </div>

          <div>
            <div className="eyebrow">Stay</div>
            <div className="mt-4 grid gap-3">
              {footerNav.stay.map((item) => (
                <Link key={item.href} href={item.href} className="site-link">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="eyebrow">Company</div>
            <div className="mt-4 grid gap-3">
              {footerNav.company.map((item) => (
                <Link key={item.href} href={item.href} className="site-link">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="eyebrow">Contact</div>
            <div className="mt-4 grid gap-3 text-sm text-foreground/80">
              <a href="tel:+919084702208" className="inline-flex items-center gap-3 hover:text-foreground">
                <Phone className="h-4 w-4" />
                +91 9084702208
              </a>
              <a
                href="mailto:admin@zenvanahotels.com"
                className="inline-flex items-center gap-3 hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
                admin@zenvanahotels.com
              </a>
              <div className="inline-flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4" />
                Rajpur Road, Dehradun
              </div>
              <div className="pt-2">
                <a
                  href="#"
                  aria-label="Instagram"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/80 hover:bg-card"
                >
                  <Instagram className="h-4.5 w-4.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="section-rule flex flex-col gap-2 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Zenvana Hotels. All rights reserved.</p>
          <p>Designed for story, built for booking.</p>
        </div>
      </div>
    </footer>
  )
}