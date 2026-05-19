'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Container } from '@/components/Container'
import { Logo } from '@/components/Logo'

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isFullScreenAssistant =
    pathname?.startsWith('/guest/stay') || pathname?.startsWith('/guest/room')

  if (isFullScreenAssistant) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Container className="flex h-16 items-center justify-between sm:h-[4.5rem]">
          <Link href="/" className="shrink-0" aria-label="Zenvana home">
            <Logo showText={false} className="h-12 sm:h-14" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to site
          </Link>
        </Container>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
