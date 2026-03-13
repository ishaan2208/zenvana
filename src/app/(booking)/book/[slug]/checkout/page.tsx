import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BedDouble,
  CalendarRange,
  MapPin,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'

import { getPublicPropertyBySlug } from '@/lib/api'
import { Container } from '@/components/Container'
import { PriceWithTax } from '@/components/PriceWithTax'
import CheckoutForm from './CheckoutForm'
import MultiRoomCheckoutForm from './MultiRoomCheckoutForm'
import { BackToRoomsLink } from './BackToRoomsLink'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    multiRoom?: string
    checkIn?: string
    checkOut?: string
    roomTypeId?: string
    roomTypeName?: string
    nights?: string
    totalAmount?: string
    numRooms?: string
    ratePlan?: string
    ratePlanLabel?: string
    occupancy?: string
  }>
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { slug } = await params
  const q = await searchParams
  const isMultiRoom = q.multiRoom === '1'

  const property = await getPublicPropertyBySlug(slug)
  if (!property) notFound()

  if (isMultiRoom) {
    return (
      <main className="bg-background text-foreground">
        <section className="relative overflow-hidden border-b border-border/60 bg-background">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(219,230,76,0.08),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(116,195,101,0.06),transparent_22%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(219,230,76,0.05),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(116,195,101,0.05),transparent_22%)]" />

          <Container className="relative py-6 sm:py-10 lg:py-20">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-10 xl:items-start">
              <div className="max-w-4xl">
                <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Checkout
                </div>

                <h1 className="mt-3 font-serif text-3xl leading-[0.95] tracking-[-0.05em] text-foreground sm:mt-5 sm:text-5xl lg:text-6xl">
                  Complete your booking
                  <span className="block">{property.publicName}</span>
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:mt-5 sm:text-base sm:leading-8 lg:text-lg">
                  Review your multi-room selection and enter guest details to confirm the
                  stay.
                </p>

                {(property.city || property.state) && (
                  <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{[property.city, property.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="hidden xl:block xl:pt-6">
                <div className="rounded-[2rem] border border-border/60 bg-card/70 p-5 shadow-[0_18px_45px_rgba(8,17,31,0.04)] dark:bg-card/50">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                    Final step
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    Once confirmed, your booking reference will be generated immediately.
                  </p>

                  <div className="mt-5 border-t border-border/60 pt-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <p className="text-sm leading-7 text-muted-foreground">
                        You are booking directly with the property for a clearer and more
                        reliable arrival experience.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <Container className="py-10 sm:py-12 lg:py-16">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 max-w-4xl">
              <div className="flex gap-2 xl:hidden">
                <BackToRoomsLink slug={slug} />
                <Link
                  href={`/hotels/${slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to property
                </Link>
              </div>
              <MultiRoomCheckoutForm
                slug={slug}
                propertyName={property.publicName}
                primaryPhone={property.primaryPhone}
              />
            </div>

            <aside className="hidden min-w-0 xl:block">
              <div className="rounded-[1.8rem] border border-border/60 bg-card/70 p-5 text-card-foreground shadow-[0_14px_35px_rgba(8,17,31,0.04)] dark:bg-card/50 xl:sticky xl:top-8">
                <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Need to go back?
                </div>

                <div className="mt-5 flex flex-col gap-3">
                  <BackToRoomsLink slug={slug} />

                  <Link
                    href={`/hotels/${slug}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to property
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </main>
    )
  }

  const required = [
    'checkIn',
    'checkOut',
    'roomTypeId',
    'roomTypeName',
    'nights',
    'totalAmount',
  ]

  const missing = required.filter((k) => !q[k as keyof typeof q])
  if (missing.length > 0) {
    redirect(`/book/${slug}/rooms?checkIn=${q.checkIn ?? ''}&checkOut=${q.checkOut ?? ''}`)
  }

  const checkIn = q.checkIn!
  const checkOut = q.checkOut!
  const roomTypeName = q.roomTypeName!
  const nights = q.nights!
  const totalAmount = q.totalAmount!
  const numRooms = q.numRooms ? parseInt(q.numRooms, 10) : 1
  const occupancy = q.occupancy ? parseInt(q.occupancy, 10) : undefined

  const ratePlanLabel =
    q.ratePlanLabel ??
    (q.ratePlan === 'default' ? 'Room only' : q.ratePlan ?? 'Room only')

  return (
    <main className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border/60 bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(219,230,76,0.08),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(116,195,101,0.06),transparent_22%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(219,230,76,0.05),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(116,195,101,0.05),transparent_22%)]" />

        <Container className="relative py-6 sm:py-10 lg:py-20">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-10 xl:items-start">
            <div className="max-w-4xl">
              <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Checkout
              </div>

              <h1 className="mt-3 font-serif text-3xl leading-[0.95] tracking-[-0.05em] text-foreground sm:mt-5 sm:text-5xl lg:text-6xl">
                Complete your booking
                <span className="block">{property.publicName}</span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:mt-5 sm:text-base sm:leading-8 lg:text-lg">
                Review the stay details and enter guest information to confirm the booking.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 sm:mt-8 sm:gap-2.5">
                <SummaryChip
                  icon={<CalendarRange className="h-4 w-4" />}
                  text={`${checkIn} → ${checkOut}`}
                />
                <SummaryChip
                  icon={<BedDouble className="h-4 w-4" />}
                  text={`${roomTypeName}${numRooms > 1 ? ` × ${numRooms} rooms` : ''}`}
                />
                <SummaryChip
                  icon={<Receipt className="h-4 w-4" />}
                  text={<PriceWithTax amount={Number(totalAmount)} size="sm" inline showTaxBreakup={false} />}
                />
                {occupancy != null && (
                  <SummaryChip
                    icon={<Users className="h-4 w-4" />}
                    text={`${occupancy} guest${occupancy !== 1 ? 's' : ''}`}
                  />
                )}
              </div>
            </div>

            <div className="hidden xl:block xl:pt-6">
              <div className="rounded-[2rem] border border-border/60 bg-card/70 p-5 shadow-[0_18px_45px_rgba(8,17,31,0.04)] dark:bg-card/50">
                <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Final step
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Once confirmed, your booking reference will be generated immediately.
                </p>

                <div className="mt-5 border-t border-border/60 pt-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-7 text-muted-foreground">
                      Direct booking gives you a smoother line to the property before
                      arrival.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-10 sm:py-12 lg:py-16">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 max-w-4xl">
            <div className="flex flex-col gap-4 xl:hidden">
              <div className="rounded-[1.35rem] border border-border/60 bg-card/70 px-4 py-3 dark:bg-card/50">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Total
                  </span>
                  <span className="text-lg font-semibold tracking-tight text-foreground">
                    <PriceWithTax amount={Number(totalAmount)} size="lg" showTaxBreakup={false} />
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={(() => {
                    const params = new URLSearchParams({
                      checkIn,
                      checkOut,
                      rooms: String(numRooms),
                    })
                    if (occupancy != null) params.set('occupancy', String(occupancy))
                    return `/book/${slug}/rooms?${params.toString()}`
                  })()}
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to rooms
                </Link>
                <Link
                  href={`/hotels/${slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to property
                </Link>
              </div>
            </div>
            <CheckoutForm
              slug={slug}
              propertyName={property.publicName}
              primaryPhone={property.primaryPhone}
              checkIn={checkIn}
              checkOut={checkOut}
              roomTypeId={q.roomTypeId!}
              roomTypeName={roomTypeName}
              nights={nights}
              totalAmount={totalAmount}
              numRooms={numRooms}
              ratePlan={q.ratePlan}
              occupancy={occupancy}
            />
          </div>

          <aside className="hidden min-w-0 xl:block">
            <div className="rounded-[1.8rem] border border-border/60 bg-card/70 p-5 text-card-foreground shadow-[0_14px_35px_rgba(8,17,31,0.04)] dark:bg-card/50 xl:sticky xl:top-8">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Booking summary
              </div>

              <h2 className="mt-3 font-serif text-2xl tracking-[-0.04em] text-foreground">
                {property.publicName}
              </h2>

              {(property.city || property.state) && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{[property.city, property.state].filter(Boolean).join(', ')}</span>
                </div>
              )}

              <div className="mt-5 space-y-3 border-t border-border/60 pt-5">
                <SummaryRow label="Room" value={roomTypeName} />
                <SummaryRow label="Rate plan" value={ratePlanLabel} />
                <SummaryRow label="Check-in" value={checkIn} />
                <SummaryRow label="Check-out" value={checkOut} />
                <SummaryRow label="Nights" value={nights} />
                <SummaryRow
                  label="Rooms"
                  value={`${numRooms} room${numRooms !== 1 ? 's' : ''}`}
                />
                {occupancy != null && (
                  <SummaryRow
                    label="Guests"
                    value={`${occupancy} guest${occupancy !== 1 ? 's' : ''}`}
                  />
                )}
              </div>

              <div className="mt-5 rounded-[1.35rem] border border-border/60 bg-background/55 px-4 py-4 dark:bg-background/35">
                <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Total
                </div>
                <div className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                  <PriceWithTax amount={Number(totalAmount)} size="xl" showTaxBreakup={false} />
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-border/60 pt-6">
                <Link
                  href={(() => {
                    const params = new URLSearchParams({
                      checkIn,
                      checkOut,
                      rooms: String(numRooms),
                    })
                    if (occupancy != null) params.set('occupancy', String(occupancy))
                    return `/book/${slug}/rooms?${params.toString()}`
                  })()}
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to rooms
                </Link>

                <Link
                  href={`/hotels/${slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to property
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  )
}

function SummaryChip({
  icon,
  text,
}: {
  icon: React.ReactNode
  text: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm text-muted-foreground dark:bg-card/50">
      {icon}
      {text}
    </span>
  )
}

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm text-foreground">{value}</span>
    </div>
  )
}