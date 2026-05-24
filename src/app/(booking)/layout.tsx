import { Suspense } from 'react'

import { Header } from '@/components/Header'
import { PageViewTracker } from '@/components/analytics/PageViewTracker'

export const dynamic = 'force-dynamic'

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <Header />
      <main className="flex-1">
        <div className=" w-full ">{children}</div>
      </main>
    </div>
  )
}
