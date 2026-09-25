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
    <main className="min-h-screen bg-background px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex items-start gap-4">
          <ContextualBackButton />
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">Send money</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Send | Zelle®</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Send money to people you know and trust, or move funds between your connected accounts.
            </p>
          </div>
        </header>

        {accounts.length === 0 && (
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Connect an account to continue</AlertTitle>
            <AlertDescription>
              Add a funding account before sending money. Your connected accounts will appear in the secure review step.
            </AlertDescription>
          </Alert>
        )}

        <section aria-labelledby="payment-options" className="grid gap-5 md:grid-cols-3">
          <h2 id="payment-options" className="sr-only">Ways to send money</h2>
          <Card className="flex flex-col border-primary/30 bg-primary/[0.04] shadow-sm">
            <CardHeader className="flex-1 gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Smartphone aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle>Send with Zelle®</CardTitle>
                <CardDescription>Send money in minutes using a recipient&apos;s email or mobile number.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled={accounts.length === 0} onClick={() => openTransfer('zelle')}>Send with Zelle®</Button>
            </CardContent>
          </Card>
          <Card className="flex flex-col bg-card shadow-sm">
            <CardHeader className="flex-1 gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
                <Banknote aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle>Between accounts</CardTitle>
                <CardDescription>Move money between two connected accounts with a clear review step.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled={accounts.length < 2} onClick={() => openTransfer('internal')}>Transfer funds</Button>
            </CardContent>
          </Card>
          <Card className="flex flex-col bg-card shadow-sm">
            <CardHeader className="flex-1 gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
                <Receipt aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle>Pay a bill</CardTitle>
                <CardDescription>Pay a bill now or schedule a future payment from your account.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => setBillsOpen(true)}>Open bill pay</Button>
            </CardContent>
          </Card>
        </section>

        <Card className="bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Send to a bank account</CardTitle>
            <CardDescription>Use a bank transfer when you need to send funds outside your connected accounts.</CardDescription>
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
