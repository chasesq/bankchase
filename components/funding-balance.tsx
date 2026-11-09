'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const initialBalance = 0

export function FundingBalance() {
  const [balance, setBalance] = useState(initialBalance)
  const [lastPayment, setLastPayment] = useState<string | null>(null)
  const formattedBalance = useMemo(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(balance), [balance])

  useEffect(() => {
    function handlePayment(event: Event) {
      const amount = (event as CustomEvent<{ amount?: number }>).detail?.amount
      if (!amount || !Number.isFinite(amount) || amount <= 0) return
      setBalance((current) => current + amount)
      setLastPayment(new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount))
    }

    window.addEventListener('bankchase:payment-success', handlePayment)
    return () => window.removeEventListener('bankchase:payment-success', handlePayment)
  }, [])

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="dashboard-gradient text-primary-foreground">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardDescription className="text-primary-foreground/75">Available balance</CardDescription>
            <CardTitle className="mt-2 text-3xl tracking-tight">{formattedBalance}</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-background/15 text-primary-foreground">USD</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 pt-6 lg:grid-cols-[1fr_1.35fr]">
        <div>
          <p className="text-sm font-medium">Funding status</p>
          <p className="mt-1 text-sm text-muted-foreground">Completed PayPal and Braintree sandbox payments appear here for this session.</p>
          {lastPayment ? <p className="mt-3 text-sm text-emerald-600" role="status">Added {lastPayment} from the latest payment.</p> : null}
        </div>
        <div className="rounded-lg border bg-muted/20 p-4">
          <p className="font-medium">Fund by ACH or wire</p>
          <p className="mt-1 text-xs text-muted-foreground">Use the account details below and include your invoice number. All payments must be delivered in USD.</p>
          <Separator className="my-4" />
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="space-y-1">
              <p className="font-medium">United States</p>
              <p className="text-muted-foreground">Bank of America, N.A.<br />222 Broadway<br />New York, NY 10038</p>
              <p className="text-muted-foreground">Account: 4451738396<br />ACH routing: 111000012<br />Wire routing: 026009593<br />SWIFT: BOFAUS3N</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Europe and Australia</p>
              <p className="text-muted-foreground">UK IBAN: GB78 BOFA 1650 5073 1990 38<br />UK SWIFT: BOFAGB22<br />EU IBAN: IE67 BOFA 9900 6161 1760 16<br />EU SWIFT: BOFAIE3X<br />Australia BSB: 232001<br />Australia SWIFT: BOFAAUSX</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Verify beneficiary details and invoice instructions before sending funds.</p>
        </div>
      </CardContent>
    </Card>
  )
}
