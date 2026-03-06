import { Container } from '@/components/Container'

export const metadata = {
  title: 'Offers',
  description: 'Special offers and packages at Zenvana Hotels. Book direct for the best rates.',
}

export default function OffersPage() {
  return (
    <Container className="py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Offers
      </h1>
      <p className="mt-2 text-slate-600">
        Special offers and packages will be listed here. Check back soon.
      </p>
    </Container>
  )
}
