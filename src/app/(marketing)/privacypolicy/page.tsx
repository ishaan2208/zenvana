import { Container } from '@/components/Container'

export const revalidate = 86400

export const metadata = {
  title: 'Privacy Policy',
  description: 'How Zenvana Hotels collects, uses, and protects guest information.',
  alternates: { canonical: '/privacypolicy' },
  robots: { index: true, follow: true },
}

export default function PrivacyPolicyPage() {
  return (
    <Container className="py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-4 text-slate-600">
        Our privacy policy will be published here.
      </p>
    </Container>
  )
}
