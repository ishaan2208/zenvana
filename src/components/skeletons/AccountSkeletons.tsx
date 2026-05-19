import { Skeleton } from '@/components/ui/skeleton'

function AccountHeroSkeleton() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="brand-gradient absolute inset-0 opacity-95" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(219,230,76,0.18),_transparent_55%)]" />

      <div className="container-shell relative z-10 py-12 sm:py-16">
        <Skeleton className="h-8 w-32 rounded-full bg-white/20" />
        <Skeleton className="mt-5 h-10 w-56 bg-white/25 sm:h-12" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl bg-white/20" />
        <div className="mt-7 flex flex-wrap gap-3">
          <Skeleton className="h-10 w-28 rounded-full bg-white/20" />
          <Skeleton className="h-10 w-32 rounded-full bg-white/20" />
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
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
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
              <Skeleton className="h-11 w-11 rounded-2xl" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full max-w-md" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
            </div>
            <div className="quiet-card space-y-4 p-5 sm:p-6">
              <Skeleton className="h-11 w-11 rounded-2xl" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-full" />
            </div>
          </div>
          <div className="quiet-card space-y-4 p-5 sm:p-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
        </div>
      </section>
    </div>
  )
}
