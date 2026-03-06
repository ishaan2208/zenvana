import { Container } from '@/components/Container'

const faqs = [
  {
    question: 'How do I book?',
    answer:
      'Choose your hotel from our list, pick your dates and room, and complete the booking. You can also call the property directly if you prefer.',
  },
  {
    question: 'What is your cancellation policy?',
    answer:
      'Cancellation terms depend on the property and rate. You’ll see the exact policy before you confirm. We recommend booking flexible rates when your plans might change.',
  },
  {
    question: 'When is check-in and check-out?',
    answer:
      'Check-in and check-out times are shown on each hotel’s page. If you need different times, contact the property and we’ll try to accommodate when possible.',
  },
  {
    question: 'How can I get the best rate?',
    answer:
      'Booking on this site is already one of the best ways to get a good rate. We also run seasonal offers—check the Offers page for current deals.',
  },
]

export function HomeFaq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="border-t border-slate-200 bg-slate-50 py-16 sm:py-20"
    >
      <Container>
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2
            id="faq-title"
            className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
          >
            Frequently asked questions
          </h2>
          <p className="mt-3 text-slate-600">
            Common questions about booking and staying with Zenvana.
          </p>
        </div>
        <dl className="mx-auto mt-10 grid max-w-3xl gap-8 sm:grid-cols-2">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <dt className="font-medium text-slate-900">{faq.question}</dt>
              <dd className="mt-2 text-sm text-slate-600">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  )
}
