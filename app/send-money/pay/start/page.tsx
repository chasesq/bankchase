'use client'

import { useState } from 'react'
import { useBanking } from '@/lib/banking-context'
import { TransferDialog } from '@/components/transfer-dialog'
import { PayBillsDrawer } from '@/components/pay-bills-drawer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Banknote, Receipt, Smartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PayStartPage() {
  const router = useRouter()
  const { userProfile, accounts } = useBanking()
  const [transferType, setTransferType] = useState<'zelle' | 'internal' | 'bank_transfer'>('zelle')
  const [transferOpen, setTransferOpen] = useState(false)
  const [billsOpen, setBillsOpen] = useState(false)

  const openTransfer = (type: 'zelle' | 'internal' | 'bank_transfer') => {
    setTransferType(type)
    setTransferOpen(true)
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Go back" onClick={() => router.back()}>
            <ArrowLeft data-icon="inline-start" />
          </Button>
          <div>
            <p className="text-sm font-medium text-primary">Chase payments</p>
            <h1 className="text-3xl font-semibold tracking-tight">Send money, pay bills</h1>
            <p className="mt-1 text-muted-foreground">Choose how you want to move money from your Chase account.</p>
          </div>
        </div>

        <section aria-labelledby="payment-options" className="grid gap-4 md:grid-cols-3">
          <h2 id="payment-options" className="sr-only">Payment options</h2>
          <Card className="cursor-pointer transition hover:border-primary/60" onClick={() => openTransfer('zelle')}>
            <CardHeader><Smartphone className="mb-2 text-primary" /><CardTitle>Send with Zelle®</CardTitle><CardDescription>Send money quickly to friends and family.</CardDescription></CardHeader>
            <CardContent><Button className="w-full" onClick={() => openTransfer('zelle')}>Start Zelle transfer</Button></CardContent>
          </Card>
          <Card className="cursor-pointer transition hover:border-primary/60" onClick={() => openTransfer('internal')}>
            <CardHeader><Banknote className="mb-2 text-primary" /><CardTitle>Transfer money</CardTitle><CardDescription>Move money between Chase accounts.</CardDescription></CardHeader>
            <CardContent><Button className="w-full" variant="outline" onClick={() => openTransfer('internal')}>Start transfer</Button></CardContent>
          </Card>
          <Card className="cursor-pointer transition hover:border-primary/60" onClick={() => setBillsOpen(true)}>
            <CardHeader><Receipt className="mb-2 text-primary" /><CardTitle>Pay bills</CardTitle><CardDescription>Pay a bill now or schedule it for later.</CardDescription></CardHeader>
            <CardContent><Button className="w-full" variant="outline" onClick={() => setBillsOpen(true)}>Open bill pay</Button></CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader><CardTitle>Need a bank wire?</CardTitle><CardDescription>Send funds to an external bank account with the secure transfer flow.</CardDescription></CardHeader>
          <CardContent><Button variant="secondary" onClick={() => openTransfer('bank_transfer')}>Start bank transfer</Button></CardContent>
        </Card>
      </div>

      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} transferType={transferType} userId={userProfile?.id || 'demo-user'} userAccounts={accounts} />
      <PayBillsDrawer open={billsOpen} onOpenChange={setBillsOpen} />
    </main>
  )
}
