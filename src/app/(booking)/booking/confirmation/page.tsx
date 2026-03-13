import Link from 'next/link'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarRange,
  Receipt,
  Sparkles,
} from 'lucide-react'

import { Container } from '@/components/Container'
import { Button } from '@/components/Button'
import { PriceWithTax } from '@/components/PriceWithTax'

export const metadata = {
  title: 'Booking confirmation',
  description: 'Your booking has been confirmed.',
}

type Props = {
  searchParams: Promise<{
    propertyName?: string
    checkIn?: string
    checkOut?: string
    roomTypeName?: string
    totalAmount?: string
    bookingReference?: string
  }>
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const q = await searchParams

  const hasDetails =
    q.propertyName &&
    q.checkIn &&
    q.checkOut &&
    q.roomTypeName &&
    q.totalAmount

  const hasRef = !!q.bookingReference

  return (
    <main className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border/60 bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(219,230,76,0.08),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(116,195,101,0.06),transparent_22%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(219,230,76,0.05),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(116,195,101,0.05),transparent_22%)]" />

        <Container className="relative py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Zenvana Booking
            </div>

            <div className="mt-6 inline-flex h-20 w-20 items-center justify-center rounded-full border border-border/60 bg-card text-foreground shadow-[0_18px_45px_rgba(8,17,31,0.06)] dark:bg-card/70">
              <BadgeCheck className="h-9 w-9" />
            </div>

            <h1 className="mt-6 font-serif text-4xl leading-[0.95] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">
              {hasRef ? 'Booking confirmed' : 'Booking request received'}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              {hasRef
                ? 'Your stay has been confirmed. We will share the booking details with you shortly.'
                : 'Thank you for choosing Zenvana. Your request has been received and the booking details will be shared with you shortly.'}
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-10 sm:py-12 lg:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            {hasDetails ? (
              <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 text-card-foreground shadow-[0_18px_45px_rgba(8,17,31,0.05)] dark:bg-card/50">
                <div className="border-b border-border/60 px-5 py-5 sm:px-6">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    Stay summary
                  </div>
                  <h2 className="mt-3 font-serif text-3xl tracking-[-0.04em] text-foreground">
                    {q.propertyName}
                  </h2>
                </div>

                <div className="px-5 py-5 sm:px-6 sm:py-6">
                  {hasRef && (
                    <div className="rounded-[1.4rem] border border-border/60 bg-background/55 p-4 dark:bg-background/35">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                        Booking reference
                      </div>
                      <p className="mt-2 font-mono text-lg text-foreground">
                        {q.bookingReference}
                      </p>
                    </div>
                  )}

                  <div className={`grid gap-4 ${hasRef ? 'mt-5' : ''} sm:grid-cols-2`}>
                    <SummaryCard
                      icon={<CalendarRange className="h-4.5 w-4.5" />}
                      label="Stay dates"
                      value={`${q.checkIn} → ${q.checkOut}`}
                    />
                    <SummaryCard
                      icon={<Receipt className="h-4.5 w-4.5" />}
                      label="Total"
                      value={<PriceWithTax amount={Number(q.totalAmount)} size="default" />}
                    />
                  </div>

                  <div className="mt-5 rounded-[1.4rem] border border-border/60 bg-background/55 p-4 dark:bg-background/35">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                      Room type
                    </div>
                    <p className="mt-2 text-base font-medium text-foreground">
                      {q.roomTypeName}
                    </p>
                  </div>
                </div>
              </section>
            ) : (
              <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 text-card-foreground shadow-[0_18px_45px_rgba(8,17,31,0.05)] dark:bg-card/50">
                <div className="px-5 py-6 sm:px-6">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    Thank you
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    Your booking message has been received. We will share the final stay
                    details shortly.
                  </p>
                </div>
              </section>
            )}
          </div>

          <aside className="min-w-0">
            <div className="rounded-[1.8rem] border border-border/60 bg-card/70 p-5 text-card-foreground shadow-[0_14px_35px_rgba(8,17,31,0.04)] dark:bg-card/50 xl:sticky xl:top-8">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Next
              </div>

              <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                <p>
                  Keep your booking reference handy for any changes or assistance.
                </p>
                <p>
                  For anything urgent, contact the property team directly from the hotel page.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-border/60 pt-6">
                <Button href="/hotels" color="blue" className="h-12 rounded-[1rem]">
                  Browse hotels
                </Button>

                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Home
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  )
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-[1.35rem] border border-border/60 bg-background/55 p-4 dark:bg-background/35">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </div>
          <p className="mt-2 text-sm font-medium leading-7 text-foreground">{value}</p>
        </div>
      </div>
    </div>
  )
}