import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/skeleton'

const TABS = ['Overview', 'Acquisition', 'Funnel', 'Properties', 'Bookings', 'Behavior', 'Blog']

function MetricSkeleton() {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardContent className="p-4 sm:p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-9 w-28" />
        <Skeleton className="mt-2 h-3 w-32" />
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <div className="flex h-[250px] items-end gap-2 border-b border-l border-border/60 px-3 pb-3">
          {[38, 55, 44, 72, 61, 84, 69, 76, 58, 88, 74, 92].map((height, index) => (
            <Skeleton
              key={index}
              className="min-w-0 flex-1 rounded-t-md rounded-b-none"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TableSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border border-border/60">
          <div className="grid grid-cols-4 gap-4 bg-muted/40 px-3 py-3">
            {[72, 48, 56, 44].map((width, index) => (
              <Skeleton key={index} className="h-3" style={{ width: `${width}%` }} />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, row) => (
            <div
              key={row}
              className="grid grid-cols-4 gap-4 border-t border-border/50 px-3 py-3"
            >
              {[88, 54, 64, 46].map((width, column) => (
                <Skeleton
                  key={column}
                  className="h-3"
                  style={{ width: `${Math.max(32, width - row * 4)}%` }}
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function AnalyticsDashboardSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-live="polite"
      aria-label="Loading analytics dashboard"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
              Analytics
            </h1>
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Loading the latest acquisition, booking, property, behavior, and blog data.
          </p>
        </div>
        <div
          className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end"
          aria-hidden="true"
        >
          <Skeleton className="h-9 w-[120px] rounded-md" />
          <Skeleton className="h-9 w-[180px] rounded-md" />
          <Skeleton className="h-9 w-[170px] rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>

      <div
        className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg bg-muted/40 p-1"
        aria-hidden="true"
      >
        {TABS.map((tab) => (
          <div
            key={tab}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm text-muted-foreground/60"
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <MetricSkeleton key={index} />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <ChartSkeleton />
        <TableSkeleton />
      </div>

      <span className="sr-only">Loading analytics dashboard</span>
    </div>
  )
}
