import type { Metadata } from 'next'

import ThankYouClient from './ThankYouClient'

export const metadata: Metadata = {
  title: 'Thank You',
  robots: {
    index: false,
    follow: true,
  },
}

export default function Page() {
  return <ThankYouClient />
}
