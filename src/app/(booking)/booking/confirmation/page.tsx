import Link from 'next/link'
import { Button } from '@/components/Button'

export const metadata = {
  title: 'Booking confirmation',
  description: 'Your booking has been confirmed.',
}

type Props = {
  searchParams: Promise<{
    propertyName?: string
    checkIn?: string
    checkOut?: string
    roomTypeName?: string
    totalAmount?: string
  }>
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const q = await searchParams
  const hasDetails = q.propertyName && q.checkIn && q.checkOut && q.roomTypeName && q.totalAmount

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-slate-900">
        Booking request received
      </h1>
      <p className="mt-2 text-slate-600">
        Thank you for your interest in staying with Zenvana. We will confirm your
        reservation and send details to your email shortly.
      </p>
      {hasDetails && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="font-medium text-slate-900">{q.propertyName}</p>
          <p className="mt-1 text-sm text-slate-600">
            {q.roomTypeName} · {q.checkIn} to {q.checkOut}
          </p>
          <p className="mt-2 font-semibold text-slate-900">
            ₹{Number(q.totalAmount).toLocaleString('en-IN')}
          </p>
        </div>
      )}
      <Button href="/hotels" color="blue" className="mt-6">
        Browse hotels
      </Button>
      <p className="mt-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Home
        </Link>
      </p>
    </div>
  )
}
