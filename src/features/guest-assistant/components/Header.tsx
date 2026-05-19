'use client'

import type { FC } from 'react'
import { LogOut, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import ChatAvatar from './Avatar'
import { hardSignout } from '@/features/guest-assistant/lib/sessionGuard'
import { useStayStore } from '@/features/guest-assistant/stores/stayStore'

const Header: FC = () => {
  const router = useRouter()
  const slug = useStayStore((s) => s.ctx?.slug)

  const handleLogout = () => {
    hardSignout()
    router.replace('/guest/login')
  }

  return (
    <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-1 border-b border-border bg-background/80 px-4 py-5 shadow-sm supports-[backdrop-filter]:backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <ChatAvatar sender="bot" />
        <div className="flex flex-col">
          <h1 className="text-base font-medium capitalize tracking-normal text-foreground">
            Zenvana Concierge
          </h1>
          <p className="text-xs text-muted-foreground">At your service</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {slug ? (
          <>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href={`/book/${slug}`}>Book again</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/my-bookings">My bookings</Link>
            </Button>
          </>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => window.location.reload()}
          aria-label="Refresh concierge"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button onClick={handleLogout} variant="outline" size="icon" aria-label="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

export default Header
