import { Container } from '@/components/Container'

export const metadata = {
  title: 'About Us',
  description: 'Learn about Zenvana Hotels. Boutique and family-friendly stays.',
}

export default function AboutPage() {
  return (
    <Container className="py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        About Zenvana
      </h1>
      <p className="mt-4 text-slate-600">
        Zenvana Hotels offers boutique and family-friendly stays. We believe in
        warm hospitality and the best rates when you book direct.
      </p>
    </Container>
  )
}
