import Link from 'next/link'
import { getPublicProperties } from '@/lib/api'
import { Container } from '@/components/Container'
import { Card, CardContent } from '@/components/ui/Card'

export const metadata = {
  title: 'Our Hotels',
  description:
    'Explore Zenvana Hotels. Boutique and family-friendly stays. Book direct for the best rates.',
}

export default async function HotelsPage() {
  const properties = await getPublicProperties()

  return (
    <Container className="py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Our Hotels
      </h1>
      <p className="mt-2 text-slate-600">
        Boutique and family-friendly stays. Book direct for the best rates.
      </p>

      {properties.length === 0 ? (
        <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="font-medium text-slate-900">
            No hotels are showing yet.
          </p>
          {process.env.NODE_ENV === 'development' ? (
            <ol className="mt-4 list-inside list-decimal space-y-2 text-left text-sm text-slate-600">
              <li>
                Start the backend: in the <code className="rounded bg-slate-200 px-1 py-0.5">backend</code> folder run{' '}
                <code className="rounded bg-slate-200 px-1 py-0.5">pnpm dev</code> or <code className="rounded bg-slate-200 px-1 py-0.5">npm run dev</code> (it should listen on port 3000).
              </li>
              <li>
                Set <code className="rounded bg-slate-200 px-1 py-0.5">NEXT_PUBLIC_BACKEND_URL=http://localhost:3000</code> in <code className="rounded bg-slate-200 px-1 py-0.5">website/.env.local</code> (optional; defaults to this). Restart the Next dev server after changing env.
              </li>
              <li>
                Seed the DB: in the <code className="rounded bg-slate-200 px-1 py-0.5">backend</code> folder run{' '}
                <code className="rounded bg-slate-200 px-1 py-0.5">npx ts-node ts/scripts/seed-zenvana-public.ts</code> (same <code className="rounded bg-slate-200 px-1 py-0.5">DATABASE_URL</code> as the backend).
              </li>
            </ol>
          ) : (
            <p className="mt-2 text-sm text-slate-600">Check back soon.</p>
          )}
        </div>
      ) : (
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <li key={p.id}>
              <Link href={`/hotels/${p.slug}`} className="group block">
                <Card className="transition shadow-sm hover:shadow-md">
                  {p.heroImageUrl ? (
                    <img
                      src={p.heroImageUrl}
                      alt=""
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="h-48 w-full bg-slate-200" />
                  )}
                  <CardContent>
                    <h2 className="font-semibold text-slate-900 group-hover:text-blue-600">
                      {p.publicName}
                    </h2>
                    {(p.city || p.state) && (
                      <p className="mt-1 text-sm text-slate-500">
                        {[p.city, p.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {p.shortDescription && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                        {p.shortDescription}
                      </p>
                    )}
                    <span className="mt-2 inline-block text-sm font-medium text-blue-600 group-hover:underline">
                      View details →
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  )
}
