import Image from 'next/image'

import { Container } from '@/components/Container'
import backgroundImage from '@/images/background-faqs.jpg'

const faqs = [
  [
    {
      question: 'What is Zenvana Hotels?',
      answer:
        'Zenvana Hotels is a collection of boutique and family-friendly properties. We focus on comfortable, personal stays and the best rates when you book direct with us.',
    },
    {
      question: 'Why should I book direct with Zenvana?',
      answer:
        'Booking direct with Zenvana gives you the best rates, no hidden fees, and a direct line to our team. We can help with special requests and make your stay more personal.',
    },
    {
      question: 'What types of properties does Zenvana offer?',
      answer:
        'We offer boutique hotels and family-friendly stays suited to both leisure and business travellers. Each property is chosen for comfort, location, and a calm, welcoming atmosphere.',
    },
  ],
  [
    {
      question: 'How do I modify or cancel my booking?',
      answer:
        'Contact us by phone or email and we’ll help you modify or cancel your booking. Our team is available to assist with any changes.',
    },
    {
      question: 'Does Zenvana have a loyalty or repeat-guest programme?',
      answer:
        'We value our returning guests. Ask our team about special rates and benefits when you book direct for your next stay.',
    },
    {
      question: 'Are Zenvana properties suitable for families?',
      answer:
        'Yes. Many of our properties are family-friendly with space and amenities suited to children and longer stays. Check each property page for details.',
    },
  ],
  [
    {
      question: 'How can I get in touch with Zenvana?',
      answer:
        'You can reach us by phone at +91 9084702208 or by email. We’re happy to help with bookings, questions, or special requests.',
    },
    {
      question: 'How do I get started and book a stay?',
      answer:
        'Browse our hotels on the website, choose your dates, and book direct for the best rate. You can also call us and we’ll help you find the right property and complete your reservation.',
    },
  ],
]

export function Faqs() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative overflow-hidden bg-muted py-20 sm:py-32"
    >
      <Image
        className="absolute left-1/2 top-0 max-w-none -translate-y-1/4 translate-x-[-30%]"
        src={backgroundImage}
        alt=""
        width={1558}
        height={946}
        unoptimized
      />
      <Container className="relative">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2
            id="faq-title"
            className="font-display text-3xl tracking-tight text-foreground sm:text-4xl"
          >
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg tracking-tight text-muted-foreground">
            If you can’t find what you’re looking for, email us at{' '}
            <a
              href="mailto:support@zenvana.com"
              className="font-medium italic text-primary"
            >
              support@zenvana.com
            </a>
          </p>
        </div>
        <ul
          role="list"
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3"
        >
          {faqs.map((column, columnIndex) => (
            <li key={columnIndex}>
              <ul role="list" className="flex flex-col gap-y-8">
                {column.map((faq, faqIndex) => (
                  <li key={faqIndex}>
                    <h3 className="font-display text-lg leading-7 text-foreground">
                      {faq.question}
                    </h3>
                    <p className="mt-4 text-sm text-muted-foreground">{faq.answer}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
