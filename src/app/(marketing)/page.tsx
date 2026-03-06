import { Button } from '@/components/Button'
import { HomeHero } from '@/components/home/HomeHero'
import { WhyBookDirect } from '@/components/home/WhyBookDirect'
import { HomeFaq } from '@/components/home/HomeFaq'

export default function Home() {
  return (
    <>
      <HomeHero />
      <WhyBookDirect />
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
            Explore our hotels
          </h2>
          <p className="mt-2 text-slate-600">
            Boutique and family-friendly stays. Book direct for the best rates.
          </p>
          <Button href="/hotels" color="blue" className="mt-6">
            View all hotels
          </Button>
        </div>
      </section>
      <HomeFaq />
    </>
  )
}
