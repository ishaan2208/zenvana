import { Container } from '@/components/Container'

const points = [
  {
    title: 'Best rates',
    description:
      'Booking direct means no commission markups. You get the best price we offer.',
  },
  {
    title: 'Personal service',
    description:
      'Reach us directly for requests, changes, or questions. We’re here to help.',
  },
  {
    title: 'Family-friendly',
    description:
      'Our properties are chosen with families and longer stays in mind.',
  },
]

export function WhyBookDirect() {
  return (
    <section
      id="why-book-direct"
      aria-label="Why book with Zenvana"
      className="border-t border-slate-200 bg-white py-16 sm:py-20"
    >
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Why book with us
          </h2>
          <p className="mt-3 text-slate-600">
            Simple, honest hospitality. No hidden fees, no runaround.
          </p>
        </div>
        <ul
          role="list"
          className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {points.map((item) => (
            <li
              key={item.title}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-6"
            >
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
