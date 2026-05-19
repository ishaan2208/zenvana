import { Container } from '@/components/Container'
import { Skeleton } from '@/components/ui/skeleton'

export function GuestHubLoadingSkeleton() {
  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-lg">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="mt-6 h-9 w-52" />
        <Skeleton className="mt-3 h-4 w-full max-w-md" />
        <Skeleton className="mt-3 h-4 w-5/6 max-w-sm" />
        <div className="mt-8 space-y-4">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-10 w-44 rounded-full" />
        </div>
      </div>
    </Container>
  )
}

export function GuestStayLoadingSkeleton() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <div className="mt-6 rounded-2xl border border-border/60 bg-card/70 p-5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-4 h-[420px] w-full rounded-xl" />
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
        </div>

        <div className="rounded-xl border border-border/50 bg-card/70 p-5 shadow-lg">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-2 h-4 w-full max-w-sm" />
        </div>

        <div className="space-y-3">
          <Skeleton className="mx-auto h-6 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
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
