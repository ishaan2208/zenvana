import Link from 'next/link'
import { Logo } from '@/components/Logo'

/**
 * Minimal layout for booking flow: no marketing header/footer.
 */
export default function BookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Zenvana home">
            <Logo className="h-8" />
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  )
}
