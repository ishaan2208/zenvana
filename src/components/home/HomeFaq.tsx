import { ChevronDown } from 'lucide-react'
import { Container } from '@/components/Container'

export const faqs = [
  {
    question: 'How do I book a Zenvana hotel?',
    answer:
      'Browse our hotels, choose your dates and room, and complete the booking directly on the site. If you prefer speaking to a person, you can also contact the property directly.',
  },
  {
    question: 'Why should I book direct instead of using an OTA?',
    answer:
      'Direct booking helps you access cleaner pricing, faster support, and a more direct relationship with the hotel team when you need changes, requests, or help before arrival.',
  },
  {
    question: 'What is your cancellation policy?',
    answer:
      'Cancellation terms vary by property and rate. The exact policy is shown before you confirm the booking, so you can choose the option that best matches your plans.',
  },
  {
    question: 'When are check-in and check-out times?',
    answer:
      'Check-in and check-out times are listed on each hotel page. If you need a different timing, contact the property directly and the team will try to accommodate based on availability.',
  },
  {
    question: 'Are Zenvana hotels suitable for families?',
    answer:
      'Yes. Zenvana focuses on comfortable, practical, family-friendly stays while still keeping the experience boutique and thoughtfully designed.',
  },
  {
    question: 'Do you offer special deals or seasonal offers?',
    answer:
      'Yes. Direct bookings may include seasonal offers or special value packages. Visit the Offers page to view currently available options.',
  },
]

export function HomeFaq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="border-t border-border/60 bg-muted/30 py-16 sm:py-20"
    >
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-border/70 bg-background px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Frequently asked questions
          </span>

          <h2
            id="faq-title"
            className="mt-5 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            The practical stuff, without the fog machine.
          </h2>

          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Common questions about booking, rates, support, and staying with
            Zenvana.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-4xl space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-[1.5rem] border border-border/60 bg-card/80 p-5 shadow-soft backdrop-blur"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <span className="text-left text-base font-semibold text-foreground sm:text-lg">
                  {faq.question}
                </span>
                <span className="mt-0.5 rounded-full border border-border/60 bg-background p-2 transition duration-300 group-open:rotate-180">
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </span>
              </summary>

              <div className="pt-4 pr-2">
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </Container>
    </section>
  )
}