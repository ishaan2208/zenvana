import { Container } from '@/components/Container'
import { Skeleton } from '@/components/ui/skeleton'

function HotelBookingSidebarSkeleton() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 shadow-[0_24px_60px_rgba(8,17,31,0.08)] backdrop-blur-xl dark:bg-card/55">
      <div className="border-b border-border/60 px-6 py-6 sm:px-7">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="mt-4 h-9 w-4/5 max-w-[220px]" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
      </div>
      <div className="space-y-4 px-6 py-6 sm:px-7">
        <Skeleton className="h-12 w-full rounded-full" />
        <div className="space-y-3 border-t border-border/60 pt-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HotelRoomCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 shadow-[0_18px_45px_rgba(8,17,31,0.04)] dark:bg-card/60">
      <div className="flex items-baseline justify-between border-b border-border/60 px-5 py-4 sm:px-6">
        <div className="flex items-baseline gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-40" />
          </div>
        </div>
        <Skeleton className="hidden h-3 w-24 sm:block" />
      </div>
      <div className="grid gap-0 p-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(250px,0.75fr)] lg:gap-7 sm:p-6 lg:p-7">
        <Skeleton className="aspect-[16/11] rounded-[1.25rem]" />
        <div className="space-y-4 pt-5 lg:pt-0">
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-4 w-11/12 max-w-xs" />
          <Skeleton className="h-4 w-10/12 max-w-sm" />
          <Skeleton className="h-12 w-full rounded-full" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </article>
  )
}

export function HotelPropertyLoading() {
  return (
    <main className="bg-background pb-24 text-foreground xl:pb-0" aria-busy="true" aria-label="Loading hotel">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#08111f]">
        <div className="relative min-h-[76svh] sm:min-h-[88svh]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#08111f_0%,#0d2037_50%,#143626_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,16,0.20)_0%,rgba(4,8,16,0.88)_100%)]" />

          <Container className="relative z-10 flex min-h-[76svh] flex-col justify-between py-5 sm:min-h-[88svh] sm:py-8">
            <Skeleton className="h-9 w-36 rounded-full bg-white/15" />

            <div className="max-w-5xl pt-16 sm:pt-24">
              <Skeleton className="h-12 w-full max-w-2xl rounded-md bg-white/15 sm:h-16 lg:h-20" />
              <Skeleton className="mt-4 h-4 w-48 rounded-md bg-white/12" />
              <Skeleton className="mt-6 h-4 w-full max-w-2xl rounded-md bg-white/10" />
              <Skeleton className="mt-2 h-4 w-5/6 max-w-xl rounded-md bg-white/10" />
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Skeleton className="h-12 w-full rounded-full bg-white/15 sm:w-44" />
                <Skeleton className="h-12 w-full rounded-full bg-white/10 sm:w-40" />
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <Skeleton className="h-3 w-28 rounded-md bg-white/12" />
                <Skeleton className="h-4 w-32 rounded-md bg-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[1.15/1] rounded-2xl bg-white/10" />
                ))}
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* Quick facts */}
      <section className="border-b border-border/60 bg-background">
        <Container className="py-4 sm:py-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[1.35rem] border border-border/60 bg-card/80 p-4 dark:bg-card/60"
              >
                <div className="flex items-start gap-3">
                  <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Anchor nav */}
      <section className="border-b border-border/60 bg-background/82 backdrop-blur-xl">
        <Container className="overflow-x-auto py-3">
          <div className="flex min-w-max gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-8 sm:py-10 lg:py-16">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.12fr)_380px] xl:gap-10">
          <div className="min-w-0 space-y-14 sm:space-y-16">
            {/* Overview */}
            <section>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-4 h-10 w-full max-w-lg sm:h-12" />
              <Skeleton className="mt-6 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-4/5" />
              <div className="mt-8 grid grid-cols-2 gap-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
                ))}
              </div>
            </section>

            {/* Gallery */}
            <section>
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-4 h-9 w-56" />
              <Skeleton className="mt-8 aspect-[16/9] w-full rounded-[2rem]" />
            </section>

            {/* Rooms */}
            <section className="space-y-6">
              <div>
                <Skeleton className="h-3 w-14" />
                <Skeleton className="mt-4 h-9 w-64" />
              </div>
              <HotelRoomCardSkeleton />
              <HotelRoomCardSkeleton />
            </section>

            {/* Map */}
            <Skeleton className="h-64 w-full rounded-[2rem] sm:h-80" />

            {/* FAQ */}
            <section>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-4 h-10 w-80 max-w-full" />
              <div className="mt-8 border-t border-border/60">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border/60 py-5">
                    <Skeleton className="h-7 w-3/4" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="hidden min-w-0 xl:block">
            <div className="xl:sticky xl:top-8">
              <HotelBookingSidebarSkeleton />
            </div>
          </aside>
        </div>
      </Container>

      {/* Compare properties */}
      <section className="border-t border-border/60 bg-card/25">
        <Container className="py-12 sm:py-14">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-10 w-72 max-w-[70vw]" />
            </div>
            <Skeleton className="hidden h-10 w-28 rounded-full sm:block" />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-[1.25rem] border border-border/60 bg-card/70">
                <Skeleton className="aspect-[4/5] w-full rounded-none" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-border/60 bg-background">
        <Container className="py-8">
          <Skeleton className="h-4 w-36" />
        </Container>
      </section>

      {/* Mobile booking bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 p-4 backdrop-blur-xl xl:hidden">
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </main>
  )
}
