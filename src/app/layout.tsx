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

export const metadata: Metadata = {
  title: {
    template: '%s | Zenvana Hotels',
    default: 'Zenvana Hotels | Boutique & Family Stays | Book Direct',
  },
  description:
    'Book direct at Zenvana Hotels. Boutique and family-friendly stays with the best rates. Explore our properties and reserve your stay.',
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
