import { Container } from '@/components/Container'
import { Skeleton } from '@/components/ui/skeleton'

export function GuestHubLoadingSkeleton() {
  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-lg">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="mt-6 h-9 w-48" />
        <Skeleton className="mt-3 h-4 w-full max-w-md" />
        <Skeleton className="mt-3 h-4 w-5/6 max-w-sm" />
        <div className="mt-8 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-5 py-8">
          <Skeleton className="mx-auto h-4 w-36" />
          <Skeleton className="mx-auto mt-3 h-4 w-full max-w-xs" />
        </div>
      </div>
    </Container>
  )
}

export function GuestStayLoadingSkeleton() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="mt-6 rounded-2xl border border-border/60 bg-card/70 p-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-64 w-full rounded-xl" />
        </motion.div>
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-full" />
          <Skeleton className="h-10 flex-1 rounded-full" />
        </div>
      </div>
    </Container>
  )
}

export function GuestRoomLoadingSkeleton() {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-background via-background/95 to-primary/5 p-4 pb-12">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-8 w-56" />
          <Skeleton className="mx-auto h-4 w-64" />
        </motion.div>

        <div className="rounded-xl border border-border/50 bg-card/70 p-5 shadow-lg">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-full max-w-xs" />
        </div>

        <div className="space-y-3">
          <Skeleton className="mx-auto h-6 w-40" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-border/50 bg-card/80 p-5"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
