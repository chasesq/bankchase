"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Info, WalletCards } from "lucide-react"
import { Navigation } from "@/components/Navigation"
import { ContextualBackButton } from "@/components/contextual-back-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useBanking } from "@/lib/banking-context"

export default function PrepaysPage() {
  const { accounts } = useBanking()
  const [autoApply, setAutoApply] = useState(true)
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <section className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-8 md:px-10 md:py-12">
        <div className="flex items-start gap-4">
          <ContextualBackButton />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Billing and funds</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Prepay balance</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">Manage the funds applied to invoices across every account and module.</p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <WalletCards aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Prepay ID: 606043</CardTitle>
                <CardDescription>Module coverage: All</CardDescription>
              </div>
            </div>
            <Badge variant="secondary">Active</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="rounded-xl bg-muted/40 p-6">
              <p className="text-sm text-muted-foreground">Current balance</p>
              <p className="mt-1 text-4xl font-bold tracking-tight">$0.00</p>
              <p className="mt-2 text-sm text-muted-foreground">No prepay funds are available to apply right now.</p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 text-primary" aria-hidden="true" />
                <div>
                  <Label htmlFor="auto-apply" className="text-sm font-medium">Automatically use on invoices</Label>
                  <p className="mt-1 text-sm text-muted-foreground">Apply available prepay funds to eligible invoices automatically.</p>
                </div>
              </div>
              <Switch id="auto-apply" checked={autoApply} onCheckedChange={setAutoApply} aria-label="Automatically use prepay on invoices" />
            </div>

            <Separator />

            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <p>All account balances are already available from the dashboard. This prepay balance is separate and is used only for invoice settlement.</p>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Total account balances</p>
                <p className="text-sm text-muted-foreground">Across {accounts.length} connected account{accounts.length === 1 ? "" : "s"}</p>
              </div>
              <p className="text-xl font-semibold">${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline" className="sm:flex-1">
                <Link href="/add-funds">Add funds</Link>
              </Button>
              <Button asChild className="sm:flex-1">
                <Link href="/">Return to dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button asChild variant="ghost" className="w-fit">
          <Link href="/">
            <ArrowLeft data-icon="inline-start" />
            Back to dashboard
          </Link>
        </Button>
      </section>
    </main>
  )
}
