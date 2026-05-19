import { Inter, Lexend, Fraunces } from 'next/font/google'
import clsx from 'clsx'

import './globals.css'
import { type Metadata, type Viewport } from 'next'
import { Suspense } from 'react'

import { organizationJsonLd, webSiteJsonLd } from '@/lib/structured-data'
import { AppToaster } from '@/components/app-toaster'
import { NavigationLoadingProvider } from '@/components/navigation-loading-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Analytics } from '@vercel/analytics/next'
import { JsonLd } from '@/components/JsonLd'
import { SiteAnalytics, GtmNoscript } from '@/components/SiteAnalytics'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'

const GOOGLE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
const BING_VERIFICATION = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
const FB_DOMAIN_VERIFICATION = process.env.NEXT_PUBLIC_FB_DOMAIN_VERIFICATION

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s · Zenvana Hotels',
    default: 'Zenvana Hotels · Boutique stays on Rajpur Road, Dehradun',
  },
  description:
    'A quietly considered collection of boutique hotels on Rajpur Road, Dehradun. Owner-operated, family-friendly, and built for calm. Book direct for the best rate.',
  applicationName: 'Zenvana Hotels',
  authors: [{ name: 'Zenvana Hotels', url: SITE_URL }],
  generator: 'Next.js',
  keywords: [
    'hotels in Dehradun',
    'best hotel in Dehradun',
    'boutique hotel Dehradun',
    'Rajpur Road hotels',
    'family hotels Dehradun',
    'hotels near Mussoorie',
    'Zenvana Hotels',
    'book direct hotel Dehradun',
    'wedding venue Dehradun',
    'rooftop restaurant Dehradun',
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'Zenvana Hotels',
  publisher: 'Zenvana Hotels',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-IN': SITE_URL,
      'en-US': SITE_URL,
      'x-default': SITE_URL,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Zenvana Hotels',
    url: SITE_URL,
    title: 'Zenvana Hotels · Boutique stays on Rajpur Road, Dehradun',
    description:
      'Owner-operated boutique hotels in Dehradun. Calm interiors, real hospitality, and direct-booking value.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Zenvana Hotels — boutique stays on Rajpur Road, Dehradun',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zenvana Hotels · Boutique stays on Rajpur Road, Dehradun',
    description:
      'Owner-operated boutique hotels in Dehradun. Book direct for the best rate.',
    images: ['/twitter-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  // Icons: auto-mapped by Next from app/icon.svg + app/apple-icon.tsx.
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Zenvana',
  },
  category: 'travel',
  ...(GOOGLE_VERIFICATION || BING_VERIFICATION || FB_DOMAIN_VERIFICATION
    ? {
      verification: {
        ...(GOOGLE_VERIFICATION && { google: GOOGLE_VERIFICATION }),
        ...(BING_VERIFICATION && {
          other: { 'msvalidate.01': BING_VERIFICATION },
        }),
        ...(FB_DOMAIN_VERIFICATION && {
          other: {
            ...(BING_VERIFICATION && { 'msvalidate.01': BING_VERIFICATION }),
            'facebook-domain-verification': FB_DOMAIN_VERIFICATION,
          },
        }),
      },
    }
    : {}),
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F7ED' },
    { media: '(prefers-color-scheme: dark)', color: '#001F3F' },
  ],
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
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

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  // Keep only actively used editorial weights to reduce critical font bytes.
  weight: ['400', '600'],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-IN" className="h-full scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
      </head>
      <body
        className={clsx(
          'flex h-full flex-col antialiased',
          inter.variable,
          lexend.variable,
          fraunces.variable,
        )}
      >
        <GtmNoscript />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          // enableSystem
          disableTransitionOnChange
        >
          <Analytics />
          <SiteAnalytics />
          <Suspense fallback={null}>
            <NavigationLoadingProvider>
              <AppToaster />
              <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />
              {children}
            </NavigationLoadingProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  )
}
