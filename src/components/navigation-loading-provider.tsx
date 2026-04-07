'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

type NavigationLoadingContextValue = {
  startNavigation: () => void
}

const NavigationLoadingContext = createContext<NavigationLoadingContextValue | null>(
  null,
)

function useNavigationLoadingInternal(): NavigationLoadingContextValue {
  const ctx = useContext(NavigationLoadingContext)
  if (!ctx) {
    throw new Error('useNavigationLoading must be used within NavigationLoadingProvider')
  }
  return ctx
}

export function useNavigationLoading(): NavigationLoadingContextValue {
  return useNavigationLoadingInternal()
}

function isModifiedClick(e: MouseEvent): boolean {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
}

/** Primary button only (keyboard Enter produces button 0). */
function isActivatingButton(e: MouseEvent): boolean {
  return e.button === 0
}

function shouldIgnoreAnchor(a: HTMLAnchorElement): boolean {
  if (a.hasAttribute('download')) return true
  if (a.target === '_blank') return true
  const href = a.getAttribute('href')
  if (!href || href.startsWith('#')) return true
  return false
}

function NavigationLoadingInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryKey = searchParams.toString()
  const [isNavigating, setIsNavigating] = useState(false)

  const startNavigation = useCallback(() => {
    setIsNavigating(true)
  }, [])

  useEffect(() => {
    setIsNavigating(false)
  }, [pathname, queryKey])

  useEffect(() => {
    if (!isNavigating) return
    const id = window.setTimeout(() => setIsNavigating(false), 15000)
    return () => window.clearTimeout(id)
  }, [isNavigating])

  useEffect(() => {
    const onClickCapture = (e: MouseEvent) => {
      if (e.defaultPrevented || isModifiedClick(e) || !isActivatingButton(e)) return
      const el = (e.target as HTMLElement | null)?.closest?.('a[href]')
      if (!el || !(el instanceof HTMLAnchorElement)) return
      if (shouldIgnoreAnchor(el)) return
      let url: URL
      try {
        url = new URL(el.href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      const nextPath = `${url.pathname}${url.search}`
      const currentPath = `${window.location.pathname}${window.location.search}`
      if (nextPath === currentPath) return
      setIsNavigating(true)
    }

    document.addEventListener('click', onClickCapture, true)
    return () => document.removeEventListener('click', onClickCapture, true)
  }, [])

  return (
    <NavigationLoadingContext.Provider value={{ startNavigation }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-busy={isNavigating}
        className={cn(
          'fixed inset-0 z-[200] flex items-center justify-center bg-background/70 backdrop-blur-sm transition-opacity duration-200',
          isNavigating ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        {isNavigating ? (
          <>
            <span className="sr-only">Loading page</span>
            <Loader2
              className="h-12 w-12 animate-spin text-primary"
              aria-hidden
            />
          </>
        ) : null}
      </div>
    </NavigationLoadingContext.Provider>
  )
}

/** Suspense boundary required for useSearchParams (Next.js App Router). */
export function NavigationLoadingProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <NavigationLoadingInner>{children}</NavigationLoadingInner>
}
