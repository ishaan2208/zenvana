import type { Metadata } from 'next'

import { ContactForm } from '@/components/ContactForm'
import { Container } from '@/components/Container'
import { HomeLimewoodMap } from '@/components/HomeLimewoodMap'
import { getPublicPropertyBySlug } from '@/lib/api'
import { Mail, MapPin, Phone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Zenvana Hotels.',
}

export default async function ContactPage() {
  const limewood = await getPublicPropertyBySlug('limewood')
  const directionsUrl =
    limewood?.latitude != null && limewood?.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          `${limewood.latitude},${limewood.longitude}`,
        )}&travelmode=driving`
      : limewood?.googleMapPlaceUrl

  return (
    <div className="section-rule bg-muted/5">
      <Container className="py-16 sm:py-20 lg:py-24">
        {/* SECTION 1 — CONTACT TITLE */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="eyebrow">Connect With Us</div>
          <h1 className="display-title mt-4 text-3xl sm:text-4xl lg:text-5xl">
            We Would Love To Hear From You
          </h1>
          <p className="body-copy mt-5 text-muted-foreground">
            Reach out for reservations, event enquiries, dining questions, or anything that
            helps you plan a calmer stay.
          </p>
        </div>

        {/* SECTION 2 — CONTACT INFORMATION */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="quiet-card p-6 transition hover:-translate-y-0.5 hover:shadow-xl">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
              <MapPin className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-foreground">
              Location
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Rajpur Road, Dehradun, Uttarakhand, India.
            </p>
          </div>

          <div className="quiet-card p-6 transition hover:-translate-y-0.5 hover:shadow-xl">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-foreground">
              Email
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              admin@zenvanahotels.com
            </p>
          </div>

          <div className="quiet-card p-6 transition hover:-translate-y-0.5 hover:shadow-xl">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
              <Phone className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-foreground">
              Phone
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              +91 9084702208
            </p>
          </div>
        </div>

        {/* SECTION 3 — CONTACT FORM */}
        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="quiet-card lg:col-span-7 p-6 sm:p-7">
            <div className="eyebrow">Send a message</div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
              Contact Form
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Share a few details and our team will get back with the next steps.
            </p>

            <ContactForm />
          </div>

          <div className="quiet-card lg:col-span-5 p-6 sm:p-7">
            <div className="eyebrow">Support</div>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
              Quick assistance
            </h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              For urgent questions, use the phone line or email. For reservations, use the
              hotel pages for property-specific details.
            </p>

            <div className="mt-6 grid gap-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-4 w-4 text-foreground/70" />
                <span>+91 9084702208</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-4 w-4 text-foreground/70" />
                <span>admin@zenvanahotels.com</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-4 w-4 text-foreground/70" />
                <span>Rajpur Road, Dehradun, Uttarakhand, India.</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4 — MAP / LOCATION */}
        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:items-stretch">
          <div className="quiet-card lg:col-span-5 p-6 sm:p-7">
            <div className="eyebrow">How to reach</div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
              Location & directions
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Find us easily with a clear route plan. This space can include travel tips,
              landmarks, and expected arrival time ranges.
            </p>

            <div className="mt-7 grid gap-3 text-sm leading-7 text-muted-foreground">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-4 w-4 text-primary" />
                <span>Robbers Cave, Dehradun</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-4 w-4 text-primary" />
                <span>Dehradun Zoo, Dehradun</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-4 w-4 text-primary" />
                <span>Buddha Temple, Dehradun</span>
              </div>
            </div>

            <div className="mt-7">
              {directionsUrl ? (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-button-light inline-flex"
                >
                  Get Directions
                </a>
              ) : (
                <button type="button" className="site-button-light" disabled>
                  Get Directions
                </button>
              )}
            </div>
          </div>

          <div className="quiet-card lg:col-span-7 overflow-hidden p-0">
            <div className="relative min-h-[320px] w-full bg-muted sm:min-h-[360px]">
              <HomeLimewoodMap
                latitude={limewood?.latitude}
                longitude={limewood?.longitude}
                mapPlaceUrl={limewood?.googleMapPlaceUrl}
              />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.22),transparent_58%),linear-gradient(to_bottom,_rgba(0,0,0,0.05),rgba(0,0,0,0.12))]" />
            </div>
          </div>
        </div>

        {/* SECTION 5 — SUPPORT MESSAGE / CTA */}
        <div className="mt-12">
          <div className="brand-gradient overflow-hidden rounded-[2rem] px-6 py-10 text-white sm:px-8 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/70">
                Support
              </div>
              <h2 className="mt-4 font-serif text-3xl tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                Need help planning the stay?
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/80 sm:text-base">
                Send an inquiry and we&apos;ll respond with practical options, timing, and next steps.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  className="site-button-light border-white/20 bg-white/12 text-white hover:bg-white/16"
                >
                  Send Inquiry
                </button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}

