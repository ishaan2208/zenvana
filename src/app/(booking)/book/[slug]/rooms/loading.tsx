import { Container } from '@/components/Container'

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted/60 ${className ?? ''}`} />
}

function RoomCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-background/55 shadow-[0_18px_45px_rgba(8,17,31,0.04)] backdrop-blur-2xl dark:bg-background/30">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,280px)_1fr]">
        <SkeletonBlock className="aspect-[4/3] rounded-none lg:aspect-auto lg:min-h-[220px]" />
        <div className="space-y-4 p-5 sm:p-6 lg:p-7">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-8 w-2/3 max-w-xs" />
          <SkeletonBlock className="h-4 w-full max-w-md" />
          <SkeletonBlock className="h-4 w-5/6 max-w-sm" />
          <div className="flex flex-wrap gap-2 pt-2">
            <SkeletonBlock className="h-8 w-20 rounded-full" />
            <SkeletonBlock className="h-8 w-24 rounded-full" />
            <SkeletonBlock className="h-8 w-28 rounded-full" />
          </div>
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <SkeletonBlock className="h-28 rounded-2xl" />
            <SkeletonBlock className="h-28 rounded-2xl" />
          </div>
          <SkeletonBlock className="h-12 w-full rounded-xl sm:w-48" />
        </div>
      </div>
    </div>
  )
}

function StaySummarySkeleton() {
  return (
    <div className="sticky top-8 rounded-[1.8rem] border border-border/60 bg-background/55 p-5 shadow-[0_18px_45px_rgba(8,17,31,0.05)] backdrop-blur-2xl dark:bg-background/30">
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="mt-3 h-8 w-4/5 max-w-[200px]" />
      <SkeletonBlock className="mt-3 h-4 w-32" />
      <div className="mt-5 space-y-3 border-t border-border/60 pt-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start justify-between gap-4">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BookRoomsLoading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(120,119,198,0.10),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_28%)]" />

      <Container className="relative py-5 sm:py-6 lg:py-10">
        <SkeletonBlock className="h-10 w-44 rounded-full" />

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-8">
          <div className="min-w-0 space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <RoomCardSkeleton key={i} />
            ))}
          </div>

          <aside className="hidden xl:block">
            <StaySummarySkeleton />
          </aside>
        </div>
      </Container>
    </main>
  )
}
