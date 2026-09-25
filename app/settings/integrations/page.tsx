'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Check, ChevronRight, Plug, Search } from 'lucide-react'
import { Navigation } from '@/components/Navigation'

const apps = [
  { name: 'Finch', description: 'Connect payroll and HR data securely.', href: '/settings/integrations/finch', providerUrl: 'https://www.tryfinch.com/', category: 'Payroll' },
  { name: 'QuickBooks', description: 'Sync transactions and account activity.', href: '#', providerUrl: 'https://quickbooks.intuit.com/', category: 'Accounting' },
  { name: 'Xero', description: 'Keep your books and banking in sync.', href: '#', providerUrl: 'https://www.xero.com/', category: 'Accounting' },
  { name: 'Gusto', description: 'Manage payroll funding and employee payments.', href: '#', providerUrl: 'https://gusto.com/', category: 'Payroll' },
]

export default function IntegrationsPage() {
  const [query, setQuery] = useState('')
  const [connected, setConnected] = useState<string[]>([])
  const visibleApps = apps.filter((app) => `${app.name} ${app.category}`.toLowerCase().includes(query.toLowerCase()))

  function toggleConnection(name: string) {
    setConnected((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name])
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">Settings / Integrations</p>
          <h1 className="text-3xl font-semibold tracking-tight">Apps and integrations</h1>
          <p className="max-w-2xl text-muted-foreground">Connect the tools your business already uses. Connections open securely in the provider&apos;s flow and never require you to install anything inside this app.</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
          <Search className="size-4 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="integration-search" className="sr-only">Search integrations</label>
          <input id="integration-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search apps" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </div>
        <section className="grid gap-4 sm:grid-cols-2" aria-label="Available integrations">
          {visibleApps.map((app) => {
            const isConnected = connected.includes(app.name)
            return (
              <article key={app.name} className="flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted"><Plug className="size-5" aria-hidden="true" /></div>
                    <div><h2 className="font-semibold">{app.name}</h2><p className="text-sm text-muted-foreground">{app.category}</p></div>
                  </div>
                  {isConnected && <span className="inline-flex items-center gap-1 text-sm text-primary"><Check className="size-4" />Connected</span>}
                </div>
                <p className="text-sm text-muted-foreground">{app.description}</p>
                <div className="mt-auto flex items-center justify-between gap-3">
                  {app.href !== '#' ? <Link href={app.href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">View details <ChevronRight className="size-4" /></Link> : <span />}
                  <button type="button" onClick={() => { if (isConnected) toggleConnection(app.name); else window.open(app.providerUrl, '_blank', 'noopener,noreferrer') }} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">{isConnected ? 'Disconnect' : 'Connect'} <ArrowUpRight className="size-4" /></button>
                </div>
              </article>
            )
          })}
        </section>
        {visibleApps.length === 0 && <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">No integrations match your search.</p>}
      </main>
    </div>
  )
}


