'use client'

import { ArrowLeft } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useMemo } from 'react'

const parentRoutes: Record<string, { href: string; label: string }> = {
  '/account-management': { href: '/', label: 'Dashboard' },
  '/account_settings': { href: '/', label: 'Dashboard' },
  '/accounts': { href: '/', label: 'Dashboard' },
  '/transactions': { href: '/accounts', label: 'Accounts' },
  '/statements': { href: '/accounts', label: 'Accounts' },
  '/transfer': { href: '/', label: 'Dashboard' },
  '/send-money/transfer': { href: '/send-money', label: 'Send Money' },
  '/transfers': { href: '/transfer', label: 'Transfer' },
  '/send-money': { href: '/', label: 'Dashboard' },
  '/send-money/pay/start': { href: '/send-money', label: 'Send Money' },
  '/deposit': { href: '/', label: 'Dashboard' },
  '/add-funds/check/details': { href: '/deposit', label: 'Deposit' },
  '/bill-pay': { href: '/', label: 'Dashboard' },
  '/cards': { href: '/', label: 'Dashboard' },
  '/settings': { href: '/', label: 'Dashboard' },
  '/settings/account-security': { href: '/settings', label: 'Settings' },
  '/settings/security': { href: '/settings', label: 'Settings' },
  '/settings/notifications': { href: '/settings', label: 'Settings' },
  '/settings/my-profile': { href: '/settings', label: 'Settings' },
  '/settings/my-user-profile': { href: '/settings', label: 'Settings' },
  '/settings/integrations': { href: '/settings', label: 'Settings' },
  '/settings/company-profile': { href: '/settings', label: 'Settings' },
  '/profile': { href: '/', label: 'Dashboard' },
  '/help': { href: '/', label: 'Dashboard' },
}

export function ContextualBackButton() {
  const pathname = usePathname()
  const router = useRouter()
  const parent = useMemo(() => parentRoutes[pathname] || { href: '/', label: 'Dashboard' }, [pathname])
  const handleBack = () => {
    // Always use the known parent route so browser history cannot send users
    // outside the banking app or back to an unrelated page.
    router.push(parent.href)
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
