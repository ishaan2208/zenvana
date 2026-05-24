import type { Metadata } from 'next'

import { Container } from '@/components/Container'
import { getAnalyticsAdminSession } from '@/lib/analyticsAdminAuth'
import { AnalyticsAdminClient } from './AnalyticsAdminClient'

export const metadata: Metadata = {
  title: 'Analytics Admin',
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = 'force-dynamic'

export default async function AnalyticsAdminPage() {
  const authorized = await getAnalyticsAdminSession()
  return (
    <section className="section-rule">
      <Container className="py-12 sm:py-16">
        <AnalyticsAdminClient authorized={authorized} />
      </Container>
    </section>
  )
}
