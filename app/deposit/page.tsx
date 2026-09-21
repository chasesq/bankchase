"use client"

import Link from "next/link"
import { Navigation } from "@/components/Navigation"
import { ContextualBackButton } from "@/components/contextual-back-button"
import { Button } from "@/components/ui/button"
import { FileText, ShieldCheck } from "lucide-react"

export default function DepositPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <section className="mx-auto flex max-w-4xl flex-col gap-6 p-6 md:p-10">
        <div className="flex items-start gap-4">
          <ContextualBackButton />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Money movement</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Deposit a check</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">Securely add a check to an eligible checking or savings account and review it in your activity.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <FileText className="mb-4 h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="text-xl font-semibold">Mobile check deposit</h2>
            <p className="mt-2 text-sm text-muted-foreground">Have your check, endorsement, and account ready. You&apos;ll photograph both sides and review the deposit before submitting.</p>
            <Link href="/add-funds/check/details" className="mt-6 inline-block">
              <Button><FileText data-icon="inline-start" />Start a deposit</Button>
            </Link>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-6">
            <ShieldCheck className="mb-4 h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="text-xl font-semibold">Before you begin</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Use a well-lit, flat surface.</li>
              <li>Make sure all four corners are visible.</li>
              <li>Endorse the back for mobile deposit only.</li>
              <li>Funds are typically available in 1–2 business days.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}
