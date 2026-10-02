'use client'

import { ArrowLeft } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'

const fallbackRoutes: Record<string, { href: string; label: string }> = {
  '/account-management': { href: '/', label: 'Dashboard' },
  '/account_settings': { href: '/settings', label: 'Settings' },
  '/accounts': { href: '/', label: 'Dashboard' },
  '/cards': { href: '/', label: 'Dashboard' },
  '/credit-card': { href: '/', label: 'Dashboard' },
  '/transactions': { href: '/accounts', label: 'Accounts' },
  '/statements': { href: '/accounts', label: 'Accounts' },
  '/transfer': { href: '/', label: 'Dashboard' },
  '/transfers': { href: '/transfer', label: 'Transfer' },
  '/send-money': { href: '/', label: 'Dashboard' },
  '/send-money/transfer': { href: '/send-money', label: 'Send Money' },
  '/send-money/pay/start': { href: '/send-money', label: 'Send Money' },
  '/deposit': { href: '/', label: 'Dashboard' },
  '/add-funds': { href: '/', label: 'Dashboard' },
  '/add-funds/check/details': { href: '/deposit', label: 'Deposit' },
  '/bill-pay': { href: '/', label: 'Dashboard' },
  '/payments': { href: '/', label: 'Dashboard' },
  '/pay-transfer': { href: '/', label: 'Dashboard' },
  '/spending': { href: '/', label: 'Dashboard' },
  '/rewards': { href: '/', label: 'Dashboard' },
  '/offers': { href: '/', label: 'Dashboard' },
  '/profile': { href: '/', label: 'Dashboard' },
  '/settings': { href: '/', label: 'Dashboard' },
  '/settings/account-security': { href: '/settings', label: 'Settings' },
  '/settings/security': { href: '/settings', label: 'Settings' },
  '/settings/notifications': { href: '/settings', label: 'Settings' },
  '/settings/my-profile': { href: '/settings', label: 'Settings' },
  '/help': { href: '/', label: 'Dashboard' },
  '/messages': { href: '/', label: 'Dashboard' },
  '/notifications': { href: '/', label: 'Dashboard' },
  '/documents/upload': { href: '/documents', label: 'Documents' },
  '/terms-of-service': { href: '/', label: 'Dashboard' },
}

export function GlobalBackButton() {
  const pathname = usePathname()
  const router = useRouter()
  const [hasHistory, setHasHistory] = useState(false)

  useEffect(() => {
    try {
      const entries = JSON.parse(sessionStorage.getItem('navigationHistory') || '[]')
      setHasHistory(Array.isArray(entries) && entries.length > 1)
    } catch {
      setHasHistory(false)
    }
  }, [pathname])

  const fallback = useMemo(() => {
    if (fallbackRoutes[pathname]) return fallbackRoutes[pathname]
    const topLevel = pathname.split('/').filter(Boolean)[0]
    return topLevel ? { href: '/', label: 'Dashboard' } : null
  }, [pathname])

  if (!fallback || pathname === '/landing' || pathname === '/login' || pathname === '/sign-in' || pathname === '/sign-up' || pathname === '/signup') {
    return null
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => (hasHistory ? router.back() : router.push(fallback.href))}
      className="fixed bottom-5 left-5 z-40 gap-2 rounded-full bg-card/95 shadow-lg backdrop-blur-sm"
      aria-label={`Go back to ${fallback.label}`}
    >
      <ArrowLeft aria-hidden="true" />
      <span className="hidden sm:inline">Back</span>
    </Button>
  )
}
