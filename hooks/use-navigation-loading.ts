'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { pageLoader } from '@/lib/page-loader'

export function useNavigationLoading() {
  const router = useRouter()
  const pathname = usePathname()
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    setIsNavigating(false)
    pageLoader.completeLoading()
  }, [pathname])

  const navigate = useCallback((url: string) => {
    if (url === pathname || isNavigating) return

    setIsNavigating(true)
    pageLoader.startLoading(10)
    progressIntervalRef.current = setInterval(() => {
      pageLoader.updateProgress((current) => Math.min(current + 8, 85))
    }, 200)
    router.push(url)
  }, [isNavigating, pathname, router])

  useEffect(() => () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
  }, [])

  return { navigate, isNavigating }
}
