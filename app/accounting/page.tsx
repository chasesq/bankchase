'use client'

import { Navigation } from '@/components/Navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const providers = [
  {
    name: 'QuickBooks Online',
    description: 'Connect your accounting workspace to reconcile Mercury and Chase activity side-by-side.',
    href: 'https://quickbooks.intuit.com/login/',
  },
  {
    name: 'Xero',
    description: 'Open Xero to connect bank feeds and keep reporting aligned with your unified account view.',
    href: 'https://login.xero.com/',
  },
]

export default function AccountingPage() {
  return (
    <ProtectedRoute>
      <Navigation />
      <main className="min-h-screen bg-background px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex max-w-3xl flex-col gap-3">
            <p className="font-mono text-sm uppercase tracking-[0.2em] text-primary">Unified accounting</p>
            <h1 className="text-balance text-4xl font-bold text-foreground">Bring Mercury and Chase into one view</h1>
            <p className="text-pretty leading-6 text-muted-foreground">Connect through an authorized QuickBooks Online or Xero workflow. Bank credentials stay with the financial institution and provider; this app only presents your connected account data.</p>
          </header>

          <section className="grid gap-4 md:grid-cols-2" aria-label="Accounting providers">
            {providers.map((provider) => (
              <Card key={provider.name} className="flex flex-col">
                <CardHeader><CardTitle>{provider.name}</CardTitle></CardHeader>
                <CardContent className="flex flex-1 flex-col gap-5">
                  <p className="text-sm leading-6 text-muted-foreground">{provider.description}</p>
                  <Button asChild className="mt-auto w-fit"><a href={provider.href} target="_blank" rel="noopener noreferrer">Open {provider.name}</a></Button>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card className="border-primary/30 bg-primary/5">
            <CardHeader><CardTitle className="text-base">Before you connect</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
              <p>First link both institutions from <Link href="/plaid-setup" className="font-medium text-primary hover:underline">Connect accounts</Link>. Then authorize your preferred accounting provider in its official site.</p>
              <p>QuickBooks Online and Xero may request their own permissions and account-feed authorization. Review those permissions before approving.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </ProtectedRoute>
  )
}
