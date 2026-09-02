"use client"

import { useState } from "react"
import { DepositChecksDrawer } from "@/components/deposit-checks-drawer"
import { Navigation } from "@/components/Navigation"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

export default function DepositPage() {
  const [open, setOpen] = useState(true)
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <section className="mx-auto flex max-w-3xl flex-col gap-4 p-6 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Money movement</p>
        <h1 className="text-3xl font-semibold tracking-tight">Deposit</h1>
        <p className="max-w-xl text-muted-foreground">Deposit a check into an eligible account and review it in your activity.</p>
        <Button className="w-fit" onClick={() => setOpen(true)}><FileText data-icon="inline-start" />Start a deposit</Button>
      </section>
      <DepositChecksDrawer open={open} onOpenChange={setOpen} />
    </main>
  )
}
