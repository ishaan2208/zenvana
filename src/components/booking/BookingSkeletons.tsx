import { Container } from '@/components/Container'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type GradientVariant = 'purple' | 'green'

const GRADIENTS: Record<GradientVariant, string> = {
  purple:
    'bg-[radial-gradient(circle_at_top_left,rgba(120,119,198,0.10),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_28%)]',
  green:
    'bg-[radial-gradient(circle_at_top_left,rgba(219,230,76,0.08),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(116,195,101,0.06),transparent_22%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(219,230,76,0.05),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(116,195,101,0.05),transparent_22%)]',
}

export function BookingPageShell({
  variant = 'purple',
  children,
  className,
}: {
  variant?: GradientVariant
  children: React.ReactNode
  className?: string
}) {
  return (
    <main className={cn('relative min-h-screen bg-background text-foreground', className)}>
      <div
        className={cn('pointer-events-none absolute inset-0', GRADIENTS[variant])}
        aria-hidden
      />
      {children}
    </main>
  )
}

export function RoomCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-background/55 shadow-[0_18px_45px_rgba(8,17,31,0.04)] backdrop-blur-2xl dark:bg-background/30">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,280px)_1fr]">
        <Skeleton className="aspect-[4/3] rounded-none lg:aspect-auto lg:min-h-[220px]" />
        <div className="space-y-4 p-5 sm:p-6 lg:p-7">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-2/3 max-w-xs" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-5/6 max-w-sm" />
          <div className="flex flex-wrap gap-2 pt-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl sm:w-48" />
        </div>
      </div>
    </div>
  )
}

export function StaySummarySkeleton() {
  return (
    <div className="sticky top-8 rounded-[1.8rem] border border-border/60 bg-background/55 p-5 shadow-[0_18px_45px_rgba(8,17,31,0.05)] backdrop-blur-2xl dark:bg-background/30">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-4/5 max-w-[200px]" />
      <Skeleton className="mt-3 h-4 w-32" />
      <div className="mt-5 space-y-3 border-t border-border/60 pt-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start justify-between gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function BookRoomsLoading() {
  return (
    <BookingPageShell variant="purple">
      <Container className="relative py-5 sm:py-6 lg:py-10">
        <Skeleton className="h-10 w-44 rounded-full" />

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-8">
          <div className="min-w-0 space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <RoomCardSkeleton key={i} />
            ))}
          </div>

          <aside className="min-w-0 xl:block">
            <StaySummarySkeleton />
          </aside>
        </div>
      </Container>
    </BookingPageShell>
  )
}

export function BookPropertyLoading() {
  return (
    <BookingPageShell variant="purple">
      <Container className="relative py-4 sm:py-6 lg:py-10">
        <Skeleton className="h-10 w-40 rounded-full" />

        <div className="mt-6 space-y-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-full max-w-lg" />
          <Skeleton className="h-4 w-full max-w-md" />
          <div className="flex flex-wrap gap-2 pt-1">
            <Skeleton className="h-8 w-32 rounded-full" />
            <Skeleton className="h-8 w-36 rounded-full" />
          </div>
        </div>

        <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:items-start xl:gap-8">
          <aside className="order-1 min-w-0 space-y-4">
            <div className="rounded-[2rem] border border-border/60 bg-background/55 p-5 shadow-[0_18px_45px_rgba(8,17,31,0.04)] backdrop-blur-2xl dark:bg-background/30">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-4 h-10 w-full" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
              <Skeleton className="mt-5 h-12 w-full rounded-full" />
            </div>
          </aside>

          <div className="order-2 min-w-0 space-y-4">
            <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-background/55 p-5 backdrop-blur-2xl dark:bg-background/30 sm:p-6">
              <Skeleton className="h-6 w-36 rounded-full" />
              <Skeleton className="mt-4 h-8 w-4/5 max-w-md" />
              <Skeleton className="mt-3 h-4 w-full max-w-lg" />
              <Skeleton className="mt-6 aspect-[16/10] w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </Container>
    </BookingPageShell>
  )
}

function CheckoutFormSkeleton() {
  return (
    <div className="space-y-6 rounded-[2rem] border border-border/60 bg-card/70 p-5 shadow-[0_18px_45px_rgba(8,17,31,0.04)] dark:bg-card/50 sm:p-6">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-8 w-2/3 max-w-sm" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl sm:col-span-2" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  )
}

function CheckoutAsideSkeleton() {
  return (
    <div className="rounded-[1.8rem] border border-border/60 bg-card/70 p-5 shadow-[0_14px_35px_rgba(8,17,31,0.04)] dark:bg-card/50 xl:sticky xl:top-8">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-3 h-8 w-4/5" />
      <div className="mt-5 space-y-3 border-t border-border/60 pt-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex justify-between gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-6 h-10 w-full rounded-full" />
    </div>
  )
}

export function CheckoutPageLoading() {
  return (
    <BookingPageShell variant="green" className="bg-background">
      <section className="relative overflow-hidden border-b border-border/60">
        <Container className="relative py-6 sm:py-10 lg:py-20">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start xl:gap-10">
            <div className="max-w-4xl space-y-4">
              <Skeleton className="hidden h-8 w-32 rounded-full sm:block" />
              <Skeleton className="h-12 w-full max-w-xl sm:h-16" />
              <Skeleton className="h-12 w-3/4 max-w-lg sm:h-14" />
              <Skeleton className="h-4 w-full max-w-2xl" />
              <div className="flex flex-wrap gap-2 pt-2">
                <Skeleton className="h-9 w-40 rounded-full" />
                <Skeleton className="h-9 w-36 rounded-full" />
                <Skeleton className="h-9 w-28 rounded-full" />
              </div>
            </div>
            <div className="hidden xl:block">
              <div className="rounded-[2rem] border border-border/60 bg-card/70 p-5 dark:bg-card/50">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-5 h-16 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container className="relative py-10 sm:py-12 lg:py-16">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 max-w-4xl space-y-4">
            <Skeleton className="h-14 w-full rounded-[1.35rem] xl:hidden" />
            <CheckoutFormSkeleton />
          </div>
          <aside className="hidden min-w-0 xl:block">
            <CheckoutAsideSkeleton />
          </aside>
        </div>
      </Container>
    </BookingPageShell>
  )
}

export function ConfirmationPageLoading() {
  return (
    <BookingPageShell variant="green">
      <section className="relative overflow-hidden border-b border-border/60">
        <Container className="relative py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <Skeleton className="mx-auto h-20 w-20 rounded-full" />
            <Skeleton className="mx-auto mt-6 h-12 w-full max-w-md sm:h-14" />
            <Skeleton className="mx-auto mt-5 h-4 w-full max-w-2xl" />
            <Skeleton className="mx-auto mt-2 h-4 w-4/5 max-w-xl" />
          </div>
        </Container>
      </section>

      <Container className="relative py-10 sm:py-12 lg:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 dark:bg-card/50">
            <div className="border-b border-border/60 px-5 py-5 sm:px-6">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-9 w-2/3 max-w-xs" />
            </div>
            <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
              <Skeleton className="h-20 w-full rounded-[1.4rem]" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-24 rounded-[1.35rem]" />
                <Skeleton className="h-24 rounded-[1.35rem]" />
              </div>
              <Skeleton className="h-16 w-full rounded-[1.4rem]" />
            </div>
          </div>

          <aside>
            <div className="rounded-[1.8rem] border border-border/60 bg-card/70 p-5 dark:bg-card/50">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-5/6" />
              <Skeleton className="mt-6 h-12 w-full rounded-[1rem]" />
              <Skeleton className="mt-3 h-4 w-24" />
            </div>
          </aside>
        </div>
      </Container>
    </BookingPageShell>
  )
}
