'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, ExternalLink, Plug } from 'lucide-react'
import { Navigation } from '@/components/Navigation'

export default function FinchIntegrationPage() {
  const [connected, setConnected] = useState(false)
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
        <Link href="/settings/integrations" className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back to integrations</Link>
        <section className="flex flex-col gap-6 rounded-2xl border bg-card p-8 shadow-sm">
          <div className="flex items-start gap-4"><div className="flex size-12 items-center justify-center rounded-xl bg-muted"><Plug className="size-6" /></div><div><p className="text-sm text-muted-foreground">Payroll integration</p><h1 className="text-3xl font-semibold tracking-tight">Finch</h1></div></div>
          <p className="leading-7 text-muted-foreground">Connect Finch to securely share payroll and HR information with the services you authorize. You will complete the connection on Finch&apos;s secure website; no Finch installation is added to this application.</p>
          <div className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground"><p>What happens next?</p><ul className="flex flex-col gap-2"><li className="flex gap-2"><Check className="size-4 shrink-0 text-primary" />A secure Finch authorization page opens in a new tab.</li><li className="flex gap-2"><Check className="size-4 shrink-0 text-primary" />You choose what data to share and approve access.</li><li className="flex gap-2"><Check className="size-4 shrink-0 text-primary" />Return here to see the connection status.</li></ul></div>
          <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => setConnected(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:opacity-90">{connected ? 'Connected' : 'Connect Finch'} {!connected && <ExternalLink className="size-4" />}</button>{connected && <span className="text-sm text-primary">Finch connection is active for this session.</span>}</div>
        </section>
      </main>
    </div>
  )
}
