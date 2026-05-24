import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Container } from '@/components/Container'
import { getAnalyticsAdminSession } from '@/lib/analyticsAdminAuth'
import { getSessionDetail } from '@/lib/analytics/queries'

export const metadata: Metadata = {
  title: 'Session detail',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function AnalyticsSessionPage({ params }: Props) {
  const { id } = await params
  const authorized = await getAnalyticsAdminSession()
  if (!authorized) {
    return (
      <section className="section-rule">
        <Container className="py-12">
          <p className="text-sm">
            Unauthorized.{' '}
            <Link href="/internal/analytics" className="text-indigo-600 underline">
              Log in
            </Link>
            .
          </p>
        </Container>
      </section>
    )
  }

  const session = await getSessionDetail(id)
  if (!session) notFound()

  return (
    <section className="section-rule">
      <Container className="py-10 space-y-6">
        <div>
          <Link
            href="/internal/analytics"
            className="text-sm text-indigo-600 hover:underline"
            prefetch={false}
          >
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Session {session.id}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <Row k="Created" v={new Date(session.createdAt).toLocaleString()} />
              <Row k="Last seen" v={new Date(session.lastSeenAt).toLocaleString()} />
              <Row k="Landing path" v={session.landingPath} />
              <Row k="Referrer" v={session.referrer ?? '—'} />
              <Row k="UTM source" v={session.utmSource ?? '—'} />
              <Row k="UTM medium" v={session.utmMedium ?? '—'} />
              <Row k="UTM campaign" v={session.utmCampaign ?? '—'} />
              <Row k="Device" v={session.deviceType ?? '—'} />
              <Row k="Country" v={session.country ?? '—'} />
              <Row k="Events" v={String(session.events.length)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {session.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events recorded.</p>
            ) : (
              <ol className="space-y-3">
                {session.events.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{event.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.occurredAt).toLocaleString()} · {event.source}
                        {event.propertySlug ? ` · ${event.propertySlug}` : ''}
                      </span>
                    </div>
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
                      {JSON.stringify(event.properties, null, 2)}
                    </pre>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </Container>
    </section>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/40 py-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  )
}
