import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPublicPropertyBySlug } from '@/lib/api'
import { Button } from '@/components/Button'

type Props = { params: Promise<{ slug: string }> }

export default async function BookPropertyPage({ params }: Props) {
  const { slug } = await params
  const property = await getPublicPropertyBySlug(slug)
  if (!property) notFound()

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-slate-900">
        Book {property.publicName}
      </h1>
      <p className="mt-2 text-slate-600">
        Select stay dates and occupancy, then choose a room type and rate plan.
      </p>

      <form
        method="GET"
        action={`/book/${slug}/rooms`}
        className="mt-8 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="checkIn" className="block text-sm font-medium text-slate-700">
            Check-in
          </label>
          <input
            id="checkIn"
            name="checkIn"
            type="date"
            required
            min={today}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="checkOut" className="block text-sm font-medium text-slate-700">
            Check-out
          </label>
          <input
            id="checkOut"
            name="checkOut"
            type="date"
            required
            min={today}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="occupancy" className="block text-sm font-medium text-slate-700">
            Occupancy
          </label>
          <select
            id="occupancy"
            name="occupancy"
            required
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="1">1 Adult</option>
            <option value="2">2 Adults</option>
            <option value="3">3 Adults</option>
            <option value="4">4 Adults</option>
          </select>
        </div>
        <Button type="submit" color="blue" className="w-full">
          See rooms & rates
        </Button>
      </form>

      <p className="mt-6">
        <Link href={`/hotels/${slug}`} className="text-sm text-blue-600 hover:underline">
          ← Back to property
        </Link>
      </p>
    </div>
  )
}
