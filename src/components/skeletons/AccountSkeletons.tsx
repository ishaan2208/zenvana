import { Skeleton } from '@/components/ui/skeleton'

function AccountHeroSkeleton() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="brand-gradient absolute inset-0 opacity-95" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(219,230,76,0.18),_transparent_55%)]" />

      <div className="container-shell relative z-10 py-12 sm:py-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Skeleton className="h-20 w-20 rounded-3xl bg-white/20" />
          <div className="min-w-0">
            <Skeleton className="h-8 w-44 rounded-full bg-white/20" />
            <Skeleton className="mt-4 h-10 w-64 max-w-full bg-white/25 sm:h-12" />
            <Skeleton className="mt-3 h-4 w-full max-w-xl bg-white/20" />
          </div>
        </div>
      </div>
    </section>
  )
}

export function MyBookingsLoadingSkeleton() {
  return (
    <div>
      <AccountHeroSkeleton />
      <section className="container-shell py-10 sm:py-14">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full" />
          ))}
        </div>
        <ul className="mt-8 grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="quiet-card overflow-hidden p-0">
              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-7 w-44" />
                  </div>
                  <Skeleton className="h-7 w-24 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/60 p-4 sm:grid-cols-3">
                  <Skeleton className="h-10 rounded-xl" />
                  <Skeleton className="h-10 rounded-xl" />
                  <Skeleton className="col-span-2 h-10 rounded-xl sm:col-span-1" />
                </div>
                <div className="flex items-center justify-between border-t border-border/60 pt-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export function AccountPageLoadingSkeleton() {
  return (
    <div>
      <AccountHeroSkeleton />
      <section className="container-shell py-10 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="quiet-card space-y-4 p-5 sm:p-6">
              <div className="flex items-start gap-3 border-b border-border/60 pb-4">
                <Skeleton className="h-11 w-11 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-7 w-36" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-12 rounded-2xl" />
                <Skeleton className="h-12 rounded-2xl" />
              </div>
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-full" />
            </div>
            <div className="quiet-card space-y-4 p-5 sm:p-6">
              <div className="flex items-start gap-3 border-b border-border/60 pb-4">
                <Skeleton className="h-11 w-11 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-48" />
                </div>
              </div>
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-full" />
            </div>
          </div>
          <div className="quiet-card space-y-4 p-5 sm:p-6">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </section>
    </div>
  )
}
