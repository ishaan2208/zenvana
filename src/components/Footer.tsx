import Link from 'next/link'
import { ArrowUpRight, Instagram, Mail, MapPin, Phone } from 'lucide-react'

import { FooterLocalTime } from '@/components/FooterLocalTime'
import { rankedProperties } from '@/lib/pyramid-cards'

const exploreLinks = [
  { href: '/hotels', label: 'All hotels' },
  { href: '/offers', label: 'Offers' },
  { href: '/restaurant', label: 'Feasta restaurant' },
  { href: '/weddings', label: 'Weddings & events' },
  { href: '/blog', label: 'The Journal' },
  { href: '/stay-direct', label: 'Why book direct' },
]

const companyLinks = [
  { href: '/about', label: 'About Zenvana' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacypolicy', label: 'Privacy policy' },
]

/** Gold underline that draws in on hover (composite-cheap background-size). */
const linkLabel =
  'bg-gradient-to-r from-gold-300 to-gold-300 bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 ' +
  'transition-[background-size] duration-300 ease-out group-hover:bg-[length:100%_1px]'

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-[15px] leading-relaxed text-white/65 transition-colors hover:text-sand-50"
    >
      <span className={linkLabel}>{label}</span>
      <ArrowUpRight className="h-3.5 w-3.5 -translate-x-1 text-gold-300 opacity-0 transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100" />
    </Link>
  )
}

function ColumnLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold-300/80">{children}</div>
  )
}

export function Footer() {
  const year = new Date().getFullYear()
  const collection = rankedProperties()

  return (
    <footer className="relative isolate overflow-hidden bg-ink-900 text-sand-50">
      {/* Atmosphere — gold aurora, top hairline, fine grain */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-44 left-1/2 h-80 w-[85%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(200,168,90,0.16),transparent_70%)] blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(200,168,90,0.55),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '3px 3px',
          }}
        />
      </div>

      <div className="container-shell relative">
        {/* ── Statement band ─────────────────────────────────────── */}
        <div className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.45fr_1fr] lg:items-end lg:gap-16">
          <div>
            <Link
              href="/"
              aria-label="Zenvana — Home"
              className="font-serif text-xl tracking-[0.28em] text-sand-50/90 transition hover:text-gold-200"
            >
              ZENVANA
            </Link>
            <h2 className="editorial-display mt-7 text-[clamp(2rem,5.5vw,3.5rem)] font-light leading-[0.98] tracking-[-0.04em] text-sand-50">
              Stay quietly.{' '}
              <span className="gold-text italic">Book directly.</span>
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-[1.85] text-white/65">
              An owner-operated collection of boutique hotels on Rajpur Road, Dehradun, shaped by the
              foothills, long mornings, and the calm of staying somewhere considered.
            </p>
            <div className="mt-7 inline-flex items-center gap-2.5 text-[12.5px] text-white/55">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-300 shadow-[0_0_8px_rgba(216,192,117,0.7)]" />
              It&apos;s <FooterLocalTime /> on Rajpur Road
            </div>
          </div>

          <div className="lg:justify-self-end lg:text-right">
            <div className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/45">
              Reservations · book direct
            </div>
            <a
              href="tel:+919084051774"
              className="mt-3 block font-serif text-2xl tracking-[-0.01em] text-sand-50 transition hover:text-gold-200 sm:text-[1.7rem]"
            >
              +91 90840 51774
            </a>
            <div className="mt-7 flex flex-wrap gap-3 lg:justify-end">
              <Link
                href="/hotels"
                className="pressable group inline-flex items-center gap-2 rounded-full bg-gold-300 px-5 py-3 text-sm font-medium text-ink-900 transition hover:bg-gold-200"
              >
                Explore the collection
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <a
                href="https://wa.me/919084051774"
                target="_blank"
                rel="noopener noreferrer"
                className="pressable inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/85 transition hover:border-white/30 hover:bg-white/[0.08]"
              >
                <WhatsAppGlyph className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* ── Link matrix ────────────────────────────────────────── */}
        <div className="grid gap-10 border-t border-white/10 py-12 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.85fr_0.85fr_1.05fr] lg:gap-12">
          <div>
            <ColumnLabel>The Collection</ColumnLabel>
            <ul className="mt-5 space-y-2.5">
              {collection.map((p) => (
                <li key={p.slug}>
                  <FooterLink href={`/hotels/${p.slug}`} label={p.name} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <ColumnLabel>Explore</ColumnLabel>
            <ul className="mt-5 space-y-2.5">
              {exploreLinks.map((l) => (
                <li key={l.href}>
                  <FooterLink href={l.href} label={l.label} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <ColumnLabel>Company</ColumnLabel>
            <ul className="mt-5 space-y-2.5">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <FooterLink href={l.href} label={l.label} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <ColumnLabel>Find us</ColumnLabel>
            <div className="mt-5 space-y-3.5 text-[15px] text-white/65">
              <a href="tel:+919084051774" className="flex items-center gap-3 transition hover:text-sand-50">
                <Phone className="h-4 w-4 shrink-0 text-gold-300/80" />
                +91 90840 51774
              </a>
              <a
                href="mailto:admin@zenvanahotels.com"
                className="flex items-center gap-3 transition hover:text-sand-50"
              >
                <Mail className="h-4 w-4 shrink-0 text-gold-300/80" />
                admin@zenvanahotels.com
              </a>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-300/80" />
                <span>Rajpur Road, Dehradun,
                  <br />Uttarakhand 248001</span>
              </div>
              <a
                href="https://www.instagram.com/zenvanahotels"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Zenvana on Instagram"
                className="pressable mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 transition hover:border-gold-300/50 hover:bg-white/[0.08] hover:text-gold-200"
              >
                <Instagram className="h-4.5 w-4.5" />
              </a>
            </div>
          </div>
        </div>

        {/* ── Signature wordmark + legal ─────────────────────────── */}
        <div className="border-t border-white/10 pt-10">
          <div
            aria-hidden
            className="select-none font-serif text-[clamp(3.5rem,16vw,11rem)] font-light leading-[0.8] tracking-[-0.05em] text-white/[0.055]"
          >
            Zenvana
          </div>
          <div className="mt-6 flex flex-col gap-3 pb-8 text-[13px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <p>© {year} Zenvana Hotels · Owner-operated on Rajpur Road, Dehradun</p>
            <div className="flex items-center gap-6">
              <Link href="/privacypolicy" className="transition hover:text-white/80">
                Privacy
              </Link>
              <Link href="/stay-direct" className="transition hover:text-gold-200">
                Best rate, booked direct
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.03 2C6.62 2 2.2 6.4 2.2 11.83c0 1.74.45 3.43 1.31 4.93L2 22l5.39-1.42a9.85 9.85 0 0 0 4.64 1.18h.01c5.41 0 9.83-4.4 9.83-9.83A9.77 9.77 0 0 0 19.05 4.9Zm-7.02 15.2h-.01a8.2 8.2 0 0 1-4.17-1.14l-.3-.18-3.2.84.85-3.12-.2-.32a8.08 8.08 0 0 1-1.25-4.36c0-4.46 3.63-8.09 8.1-8.09 2.16 0 4.18.84 5.7 2.36a7.99 7.99 0 0 1 2.37 5.73c0 4.47-3.63 8.1-8.09 8.1Zm4.44-6.06c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.18-.71-.63-1.19-1.4-1.33-1.64-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.42-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.31.98 2.47c.12.16 1.68 2.56 4.08 3.6.57.24 1.01.38 1.36.49.57.18 1.08.16 1.48.1.45-.06 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  )
}
