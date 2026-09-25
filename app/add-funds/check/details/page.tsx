"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, FileText, ShieldCheck } from "lucide-react"
import { DepositChecksDrawer } from "@/components/deposit-checks-drawer"
import { ContextualBackButton } from "@/components/contextual-back-button"
import { Button } from "@/components/ui/button"

export default function CheckDepositDetailsPage() {
  const [open, setOpen] = useState(true)
  const router = useRouter()

  return (
    <main className="min-h-screen bg-muted/20 px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="flex items-start gap-4">
          <ContextualBackButton />
          <div>
            <p className="text-sm font-medium text-primary">Add funds</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Deposit check</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Deposit a check securely. Select an account, enter the amount, capture both sides, and review everything before submitting.
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3" aria-label="Check deposit steps">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">1</div>
            <h2 className="font-semibold">Choose an account</h2>
            <p className="mt-1 text-sm text-muted-foreground">Select the eligible checking or savings account.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">2</div>
            <h2 className="font-semibold">Capture your check</h2>
            <p className="mt-1 text-sm text-muted-foreground">Photograph the front and endorsed back in good light.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">3</div>
            <h2 className="font-semibold">Review and submit</h2>
            <p className="mt-1 text-sm text-muted-foreground">Confirm the details before the deposit is processed.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-primary/20 bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h2 className="font-semibold">Have your check ready</h2>
              <p className="mt-1 text-sm text-muted-foreground">Endorse the back with your signature and “For Mobile Deposit Only to Chase.” Keep the check until the deposit is complete.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={() => setOpen(true)}><Camera data-icon="inline-start" />Open deposit flow</Button>
                <Button variant="outline" onClick={() => router.push("/deposit")}><ArrowLeft data-icon="inline-start" />Back to deposit</Button>
              </div>
            </div>
          </div>
        </section>

        <p className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="h-4 w-4" aria-hidden="true" />Funds are typically available in 1–2 business days.</p>
      </div>

      <DepositChecksDrawer open={open} onOpenChange={setOpen} />
    </main>
  )
}
