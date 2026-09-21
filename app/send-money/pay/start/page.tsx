'use client'

import { useState } from 'react'
import { useBanking } from '@/lib/banking-context'
import { TransferDialog } from '@/components/transfer-dialog'
import { PayBillsDrawer } from '@/components/pay-bills-drawer'
import { ContextualBackButton } from '@/components/contextual-back-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Banknote, Receipt, Smartphone, ShieldCheck } from 'lucide-react'

export default function PayStartPage() {
  const { userProfile, accounts } = useBanking()
  const [transferType, setTransferType] = useState<'zelle' | 'internal' | 'bank_transfer'>('zelle')
  const [transferOpen, setTransferOpen] = useState(false)
  const [billsOpen, setBillsOpen] = useState(false)

  const openTransfer = (type: 'zelle' | 'internal' | 'bank_transfer') => {
    setTransferType(type)
    setTransferOpen(true)
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex items-start gap-4">
          <ContextualBackButton />
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">Send money</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Send or pay</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Choose a secure way to move money from your connected account. You can review every transfer before it is submitted.
            </p>
          </div>
        </header>

        {accounts.length === 0 && (
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Connect an account to continue</AlertTitle>
            <AlertDescription>
              Add a funding account before starting a payment or transfer. Your money movement options will appear here once an account is available.
            </AlertDescription>
          </Alert>
        )}

        <section aria-labelledby="payment-options" className="grid gap-4 md:grid-cols-3">
          <h2 id="payment-options" className="sr-only">Payment options</h2>
          <Card className="flex flex-col border-primary/20 bg-card shadow-sm">
            <CardHeader className="flex-1">
              <Smartphone className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle>Send with Zelle®</CardTitle>
              <CardDescription>Send money quickly to friends and family using their email address.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled={accounts.length === 0} onClick={() => openTransfer('zelle')}>Start Zelle transfer</Button>
            </CardContent>
          </Card>
          <Card className="flex flex-col bg-card shadow-sm">
            <CardHeader className="flex-1">
              <Banknote className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle>Transfer money</CardTitle>
              <CardDescription>Move money between your connected accounts with a clear review step.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled={accounts.length < 2} onClick={() => openTransfer('internal')}>Start transfer</Button>
            </CardContent>
          </Card>
          <Card className="flex flex-col bg-card shadow-sm">
            <CardHeader className="flex-1">
              <Receipt className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle>Pay bills</CardTitle>
              <CardDescription>Pay a bill now or open bill pay to schedule a future payment.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => setBillsOpen(true)}>Open bill pay</Button>
            </CardContent>
          </Card>
        </section>

        <Card className="bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Need a bank wire?</CardTitle>
            <CardDescription>Send funds to an external bank account with the same secure review flow.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" disabled={accounts.length === 0} onClick={() => openTransfer('bank_transfer')}>Start bank transfer</Button>
          </CardContent>
        </Card>
      </div>

      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} transferType={transferType} userId={userProfile?.id || 'demo-user'} userAccounts={accounts} />
      <PayBillsDrawer open={billsOpen} onOpenChange={setBillsOpen} />
    </main>
  )
}
