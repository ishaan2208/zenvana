import { Container } from '@/components/Container'

export const metadata = {
  title: 'Contact',
  description: 'Get in touch with Zenvana Hotels.',
}

export default function ContactPage() {
  return (
    <Container className="py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Contact
      </h1>
      <p className="mt-4 text-slate-600">
        For reservations and enquiries, please use the contact details on each
        hotel page or book online.
      </p>
    </Container>
  )
}
