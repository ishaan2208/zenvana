'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'

import { useNavigationLoading } from '@/components/navigation-loading-provider'

type PushOptions = { scroll?: boolean }

/**
 * Same as `useRouter` from next/navigation, but `push` / `replace` show the app-wide navigation loader.
 */
export function useAppRouter() {
  const router = useRouter()
  const { startNavigation } = useNavigationLoading()

  const push = useCallback(
    (href: string, options?: PushOptions) => {
      startNavigation()
      router.push(href, options)
    },
    [router, startNavigation],
  )

  const replace = useCallback(
    (href: string, options?: PushOptions) => {
      startNavigation()
      router.replace(href, options)
    },
    [router, startNavigation],
  )

  return useMemo(
    () => ({
      ...router,
      push,
      replace,
    }),
    [router, push, replace],
  )
}
