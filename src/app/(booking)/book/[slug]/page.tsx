import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPublicPropertyBySlug } from '@/lib/api'
import { BookSearchForm } from './BookSearchForm'

type Props = { params: Promise<{ slug: string }> }

export default async function BookPropertyPage({ params }: Props) {
  const { slug } = await params
  const property = await getPublicPropertyBySlug(slug)
  if (!property) notFound()

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-slate-900">
        Book {property.publicName}
      </h1>
      <p className="mt-2 text-slate-600">
        Select stay dates, rooms and guests, then choose a room type and rate plan.
      </p>

      <BookSearchForm slug={slug} />

      <p className="mt-6">
        <Link href={`/hotels/${slug}`} className="text-sm text-blue-600 hover:underline">
          ← Back to property
        </Link>
      </p>
    </div>
  )
}
