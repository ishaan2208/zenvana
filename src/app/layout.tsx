import { Inter, Lexend } from 'next/font/google'
import clsx from 'clsx'

import './globals.css'
import { type Metadata } from 'next'
import { Suspense } from 'react'

import { organizationJsonLd, webSiteJsonLd } from '@/lib/structured-data'
import { AppToaster } from '@/components/app-toaster'
import { NavigationLoadingProvider } from '@/components/navigation-loading-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Analytics } from "@vercel/analytics/next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s | Zenvana Hotels',
    default: 'Zenvana Hotels — Luxury Stays in Dehradun',
  },
  description:
    'Curated luxury hotels in Dehradun and Rajpur Road. Book direct for the best rate.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Zenvana Hotels',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
    <html lang="en" className="h-full scroll-smooth" suppressHydrationWarning>
      <body
        className={clsx(
          'flex h-full flex-col antialiased',
          inter.variable,
          lexend.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          // enableSystem
          disableTransitionOnChange
        >
          <Analytics />
          <Suspense fallback={null}>
            <NavigationLoadingProvider>
              <AppToaster />
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify(organizationJsonLd()),
                }}
              />
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify(webSiteJsonLd()),
                }}
              />
              {children}
            </NavigationLoadingProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  )
}
