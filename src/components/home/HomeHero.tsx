import { Button } from '@/components/Button'
import { Container } from '@/components/Container'

export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-slate-50 pb-20 pt-16 lg:pb-28 lg:pt-24">
      <Container className="relative text-center">
        <h1 className="mx-auto max-w-4xl font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          Boutique & family stays{' '}
          <span className="text-blue-600">book direct</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Skip the middleman. Reserve your stay with us for the best rates and a
          personal touch at every Zenvana hotel.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button href="/hotels" color="blue" className="min-w-[180px]">
            Explore our hotels
          </Button>
          <Button href="/offers" variant="outline" color="slate">
            View offers
          </Button>
        </div>
      </Container>
    </section>
  )
}
