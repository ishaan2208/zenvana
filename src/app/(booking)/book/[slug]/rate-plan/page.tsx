import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BedDouble,
  CalendarRange,
  MapPin,
  Receipt,
  Sparkles,
  Users,
} from 'lucide-react'

import { getPublicPropertyBySlug, getPublicRatesWithPlans } from '@/lib/api'
import { Container } from '@/components/Container'
import { RatePlanSelector } from './RatePlanSelector'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    checkIn?: string
    checkOut?: string
    roomTypeId?: string
    roomTypeName?: string
    occupancy?: string
    availableRooms?: string
    rooms?: string
    guests?: string
    guestsPerRoom?: string
    ratePlan?: string
    ratePlanLabel?: string
  }>
}

export default async function RatePlanPage({ params, searchParams }: Props) {
  const { slug } = await params
  const q = await searchParams

  const required = ['checkIn', 'checkOut', 'roomTypeId', 'roomTypeName']
  const missing = required.filter((k) => !q[k as keyof typeof q])

  if (missing.length > 0) {
    const roomParams = new URLSearchParams({
      checkIn: q.checkIn ?? '',
      checkOut: q.checkOut ?? '',
    })
    if (q.occupancy) roomParams.set('occupancy', q.occupancy)
    if (q.rooms) roomParams.set('rooms', q.rooms)
    if (q.guests) roomParams.set('guests', q.guests)
    if (q.guestsPerRoom) roomParams.set('guestsPerRoom', q.guestsPerRoom)
    redirect(`/book/${slug}/rooms?${roomParams}`)
  }

  const property = await getPublicPropertyBySlug(slug)
  if (!property) notFound()

  const occupancy = q.occupancy ? parseInt(q.occupancy, 10) : undefined

  const ratesWithPlans = await getPublicRatesWithPlans(
    slug,
    Number(q.roomTypeId),
    q.checkIn!,
    q.checkOut!,
    occupancy
  )

  if (!ratesWithPlans) {
    return (
      <main className="bg-background text-foreground">
        <section className="relative overflow-hidden border-b border-border/60 bg-background">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(219,230,76,0.08),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(116,195,101,0.06),transparent_22%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(219,230,76,0.05),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(116,195,101,0.05),transparent_22%)]" />

          <Container className="relative py-6 sm:py-10 lg:py-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Rate plans
              </div>

              <h1 className="mt-5 font-serif text-4xl leading-[0.95] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">
                We couldn’t load rate plans.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Please return to room selection and try again.
              </p>
            </div>
          </Container>
        </section>

        <Container className="py-6 sm:py-10 lg:py-16">
          <div className="rounded-[2rem] border border-border/60 bg-card/70 p-6 shadow-[0_18px_45px_rgba(8,17,31,0.04)] dark:bg-card/50 sm:p-7">
            <p className="text-sm leading-7 text-muted-foreground">
              We were not able to load meal plans and rate options for this room at the
              moment.
            </p>

            <Link
              href={`/book/${slug}/rooms?checkIn=${q.checkIn}&checkOut=${q.checkOut}&occupancy=${q.occupancy ?? ''}`}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to rooms
            </Link>
          </div>
        </Container>
      </main>
    )
  }

  return (
    <main className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border/60 bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(219,230,76,0.08),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(116,195,101,0.06),transparent_22%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(219,230,76,0.05),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(116,195,101,0.05),transparent_22%)]" />

        <Container className="relative py-6 sm:py-10 lg:py-20">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-10 xl:items-start">
            <div className="max-w-4xl">
              <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Rate plans
              </div>

              <h1 className="mt-3 font-serif text-3xl leading-[0.95] tracking-[-0.05em] text-foreground sm:mt-5 sm:text-5xl lg:text-6xl">
                Choose your rate plan
                <span className="block">{q.roomTypeName}</span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:mt-5 sm:text-base sm:leading-8 lg:text-lg">
                Select the stay plan that suits you best, then continue to checkout.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 sm:mt-8 sm:gap-2.5">
                <SummaryChip
                  icon={<CalendarRange className="h-4 w-4" />}
                  text={`${q.checkIn} → ${q.checkOut}`}
                />
                <SummaryChip
                  icon={<Receipt className="h-4 w-4" />}
                  text={`${ratesWithPlans.nights} night${ratesWithPlans.nights !== 1 ? 's' : ''}`}
                />
                {occupancy != null && (
                  <SummaryChip
                    icon={<Users className="h-4 w-4" />}
                    text={`${occupancy} adult${occupancy !== 1 ? 's' : ''}`}
                  />
                )}
                <SummaryChip
                  icon={<BedDouble className="h-4 w-4" />}
                  text={q.roomTypeName!}
                />
              </div>
            </div>

            <div className="hidden xl:block xl:pt-6">
              <div className="rounded-[2rem] border border-border/60 bg-card/70 p-5 shadow-[0_18px_45px_rgba(8,17,31,0.04)] dark:bg-card/50">
                <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Stay summary
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

                <div className="mt-5 border-t border-border/60 pt-5">
                  <p className="text-sm leading-7 text-muted-foreground">
                    Rate plans usually differ by meal inclusion and booking conditions.
                    Choose the one that feels right for your stay.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-6 sm:py-10 lg:py-16">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-10">
          <div className="min-w-0 max-w-4xl">
            <div className="flex flex-wrap gap-2 pb-4 xl:hidden">
              <Link
                href={`/book/${slug}/rooms?${new URLSearchParams({
                  checkIn: q.checkIn!,
                  checkOut: q.checkOut!,
                  ...(q.occupancy && { occupancy: q.occupancy }),
                  ...(q.rooms && { rooms: q.rooms }),
                  ...(q.guests && { guests: q.guests }),
                  ...(q.guestsPerRoom && { guestsPerRoom: q.guestsPerRoom }),
                })}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to room types
              </Link>
              <Link
                href={`/hotels/${slug}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to property
              </Link>
            </div>
            <RatePlanSelector
              slug={slug}
              checkIn={q.checkIn!}
              checkOut={q.checkOut!}
              roomTypeId={q.roomTypeId!}
              roomTypeName={q.roomTypeName!}
              nights={String(ratesWithPlans.nights)}
              occupancy={q.occupancy ?? ''}
              plans={ratesWithPlans.plans}
              availableRooms={Math.max(1, parseInt(q.availableRooms ?? '1', 10) || 1)}
              requestedRooms={Math.max(1, parseInt(q.rooms ?? '1', 10) || 1)}
              initialRatePlan={q.ratePlan ?? undefined}
              initialRatePlanLabel={q.ratePlanLabel ?? undefined}
            />
          </div>

          <aside className="hidden min-w-0 xl:block">
            <div className="rounded-[1.8rem] border border-border/60 bg-card/70 p-5 text-card-foreground shadow-[0_14px_35px_rgba(8,17,31,0.04)] dark:bg-card/50 xl:sticky xl:top-8">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Need to adjust?
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href={`/book/${slug}/rooms?${new URLSearchParams({
                    checkIn: q.checkIn!,
                    checkOut: q.checkOut!,
                    ...(q.occupancy && { occupancy: q.occupancy }),
                    ...(q.rooms && { rooms: q.rooms }),
                    ...(q.guests && { guests: q.guests }),
                    ...(q.guestsPerRoom && { guestsPerRoom: q.guestsPerRoom }),
                  })}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to room types
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
  text: string
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm text-muted-foreground dark:bg-card/50">
      {icon}
      {text}
    </span>
  )
}