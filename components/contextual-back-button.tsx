'use client'

import { ArrowLeft } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useEffect, useMemo, useState } from 'react'

const parentRoutes: Record<string, { href: string; label: string }> = {
  '/account-management': { href: '/', label: 'Dashboard' },
  '/accounts': { href: '/', label: 'Dashboard' },
  '/transactions': { href: '/accounts', label: 'Accounts' },
  '/statements': { href: '/accounts', label: 'Accounts' },
  '/transfer': { href: '/', label: 'Dashboard' },
  '/transfers': { href: '/transfer', label: 'Transfer' },
  '/send-money': { href: '/', label: 'Dashboard' },
  '/deposit': { href: '/', label: 'Dashboard' },
  '/bill-pay': { href: '/', label: 'Dashboard' },
  '/cards': { href: '/', label: 'Dashboard' },
  '/settings': { href: '/', label: 'Dashboard' },
  '/profile': { href: '/', label: 'Dashboard' },
  '/help': { href: '/', label: 'Dashboard' },
}

export function ContextualBackButton() {
  const pathname = usePathname()
  const router = useRouter()
  const [historyLength, setHistoryLength] = useState(0)

  useEffect(() => {
    try {
      const history = JSON.parse(sessionStorage.getItem('navigationHistory') || '[]')
      setHistoryLength(Array.isArray(history) ? history.length : 0)
    } catch {
      setHistoryLength(0)
    }
  }, [pathname])

  const parent = useMemo(() => parentRoutes[pathname] || { href: '/', label: 'Dashboard' }, [pathname])
  const canGoBack = historyLength > 1

  const handleBack = () => {
    if (canGoBack) {
      router.back()
    } else {
      router.push(parent.href)
    }
  }

  if (pathname === '/' || pathname === '/landing' || pathname === '/login' || pathname === '/sign-in') return null

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className="shrink-0 gap-2 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
      aria-label={`Back to ${parent.label}`}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Back to {parent.label}</span>
      <span className="sm:hidden">Back</span>
    </Button>
  )
}
