'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, ChevronRight, CircleHelp, ExternalLink, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navigation } from '@/components/Navigation'

const mappings = [
  ['Sales or Service Income', 'Income'],
  ['PayPal Merchant Wallet', 'Bank'],
  ['Merchant External Bank Account', 'Bank'],
  ['Merchant Fees', 'Expense'],
  ['PayPal Holding Account', 'Asset'],
  ['Chargeback Receivable', 'Asset / Accounts Receivable'],
]

export default function AccountingSyncPage() {
  const [step, setStep] = useState<'permission' | 'connect' | 'setting-up' | 'complete'>('permission')
  const [selectedCurrency, setSelectedCurrency] = useState('USD · Primary currency')

  function startSetup() {
    setStep('connect')
  }

  function connectQuickBooks() {
    setStep('setting-up')
    window.setTimeout(() => setStep('complete'), 1400)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <Link href="/settings/integrations" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to integrations
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <section className="space-y-8">
            <header className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><RefreshCw className="size-3.5" /> Accounting Sync</div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Keep your books up to date automatically</h1>
              <p className="max-w-2xl text-muted-foreground">Sync sales, fees, refunds, transfers, and currency fees from PayPal to QuickBooks every day. We&apos;ll match each transaction to the right account for you.</p>
            </header>

            <div className="flex items-center gap-2" aria-label="Setup progress">
              {[['permission', 'Permission'], ['connect', 'Connect'], ['setting-up', 'Setup'], ['complete', 'Done']].map(([value, label], index) => {
                const active = value === step
                const done = ['connect', 'setting-up', 'complete'].indexOf(step) >= index
                return <div key={value} className="flex min-w-0 flex-1 items-center gap-2"><div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${done || active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{done && !active ? <Check className="size-4" /> : index + 1}</div><span className={`hidden text-xs font-medium sm:block ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>{index < 3 && <div className="h-px flex-1 bg-border" />}</div>
              })}
            </div>

            {step === 'permission' && <section className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8"><div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><ShieldCheck className="size-6" /></div><h2 className="text-xl font-semibold">Allow PayPal to sync your transactions</h2><p className="mt-2 text-sm text-muted-foreground">This gives Accounting Sync permission to send the following activity to your accounting platform.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{[['Sales', 'Customer payments'], ['Fees', 'PayPal processing charges'], ['Refunds', 'Money returned to customers'], ['Transfers', 'Payouts to your bank'], ['Currency fees', 'Foreign exchange charges']].map(([title, description]) => <div key={title} className="flex gap-3 rounded-xl bg-muted/50 p-3"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" /><div><p className="text-sm font-medium">{title}</p><p className="text-xs text-muted-foreground">{description}</p></div></div>)}</div><div className="mt-8 flex flex-wrap items-center gap-3"><Button onClick={startSetup}>Allow and continue <ChevronRight className="ml-1 size-4" /></Button><span className="text-xs text-muted-foreground">You can disconnect this anytime.</span></div></section>}

            {step === 'connect' && <section className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8"><h2 className="text-xl font-semibold">Connect QuickBooks</h2><p className="mt-2 text-sm text-muted-foreground">Log in securely to QuickBooks and choose the company where you want your PayPal activity synced.</p><div className="mt-6 rounded-xl border border-dashed p-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-[#2ca01c] text-lg font-bold text-white">Q</div><div><p className="font-medium">QuickBooks Online</p><p className="text-sm text-muted-foreground">PayPal never stores your QuickBooks password.</p></div></div></div><Button className="mt-6" onClick={connectQuickBooks}>Connect QuickBooks <ExternalLink className="ml-2 size-4" /></Button></section>}

            {step === 'setting-up' && <section className="rounded-2xl border bg-card p-8 text-center shadow-sm"><Loader2 className="mx-auto size-10 animate-spin text-primary" /><h2 className="mt-5 text-xl font-semibold">Setting up your Accounting Sync…</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">We&apos;re connecting your PayPal account to QuickBooks and matching your accounts. This only takes a moment.</p></section>}

            {step === 'complete' && <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm sm:p-8"><div className="flex size-12 items-center justify-center rounded-full bg-emerald-600 text-white"><Check className="size-6" /></div><h2 className="mt-5 text-xl font-semibold">You&apos;re all set!</h2><p className="mt-2 text-sm text-muted-foreground">New PayPal transactions will sync automatically. Past transactions will import over the next few hours.</p><div className="mt-6 flex flex-wrap gap-3"><Button variant="outline" onClick={() => setStep('connect')}>Review connection</Button><Button asChild><Link href="/settings/integrations">Done</Link></Button></div></section>}

            <section className="rounded-2xl border bg-card p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">What goes where</h2><p className="mt-1 text-sm text-muted-foreground">Your PayPal wallet and external bank always stay separate for clean reconciliation.</p></div><CircleHelp className="size-5 text-muted-foreground" /></div><div className="mt-5 divide-y">{mappings.map(([source, destination]) => <div key={source} className="flex items-center justify-between gap-4 py-3 text-sm"><span>{source}</span><span className="text-right text-muted-foreground">{destination}</span></div>)}</div></section>
          </section>

          <aside className="space-y-4"><div className="rounded-2xl border bg-card p-5 shadow-sm"><h2 className="font-semibold">Currency settings</h2><p className="mt-1 text-sm text-muted-foreground">Set up each currency held in your PayPal account.</p><label htmlFor="currency" className="sr-only">Currency</label><select id="currency" value={selectedCurrency} onChange={(event) => setSelectedCurrency(event.target.value)} className="mt-4 w-full rounded-lg border bg-background px-3 py-2 text-sm"><option>USD · Primary currency</option><option>EUR · Additional currency</option><option>GBP · Additional currency</option></select><p className="mt-3 text-xs text-muted-foreground">Primary currency is configured first. Additional currencies can be added after your QuickBooks connection.</p></div><div className="rounded-2xl border bg-muted/40 p-5"><h2 className="font-semibold">Need help?</h2><p className="mt-1 text-sm text-muted-foreground">Already using the PayPal Connector app? Disconnect it first to avoid duplicate entries.</p><Link href="/settings/integrations" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">View integrations <ChevronRight className="size-4" /></Link></div></aside>
        </div>
      </main>
    </div>
  )
}
