import { Inter, Lexend } from 'next/font/google'
import clsx from 'clsx'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Analytics } from '@vercel/analytics/react'
import { GoogleTagManager } from '@next/third-parties/google'

import '@/styles/tailwind.css'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s - StaySystems',
    default: 'StaySystems - Efficient hotel management software',
  },
  description:
    ' StaySystems is a hotel management software that helps you manage your hotel efficiently. It is a cloud-based software that helps you manage your hotel from anywhere in the world.',
}

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const lexend = Lexend({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lexend',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={clsx(
        'h-full scroll-smooth bg-white antialiased',
        inter.variable,
        lexend.variable,
      )}
    >
      <body className="flex h-full flex-col">
        <Analytics />
        {children}
      </body>
      <GoogleAnalytics gaId="AW-16548808937" />
      <GoogleTagManager gtmId="GTM-NF3MGFXC" />
      <GoogleTagManager gtmId="GTM-WM48VD8D" />
    </html>
  )
}
