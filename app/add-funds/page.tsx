"use client"

import Link from "next/link"
import { ArrowRight, Building2, FileText, Landmark, ShieldCheck } from "lucide-react"
import { Navigation } from "@/components/Navigation"
import { ContextualBackButton } from "@/components/contextual-back-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const fundingOptions = [
  {
    title: "Mobile check deposit",
    description: "Deposit a check securely from your phone by photographing both sides.",
    icon: FileText,
    href: "/add-funds/check/details",
    action: "Start a deposit",
  },
  {
    title: "Bank transfer",
    description: "Move money from an external bank account into your Mercury account.",
    icon: Building2,
    href: "/transfer",
    action: "Set up a transfer",
  },
  {
    title: "Direct deposit",
    description: "Use your account and routing details to have paychecks sent here.",
    icon: Landmark,
    href: "/accounts",
    action: "View account details",
  },
]

export default function AddFundsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <section className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-8 md:px-10 md:py-12">
        <div className="flex items-start gap-4">
          <ContextualBackButton />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Money movement</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Deposit funds</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">Choose how you&apos;d like to add money to your account. Every option is secured and reviewed before funds are posted.</p>
          </div>
        </div>

        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="border-b border-border bg-muted/30 px-6 py-5">
            <CardTitle className="text-lg">Add money to your account</CardTitle>
            <CardDescription>Select an option to continue.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 md:grid-cols-3 md:p-6">
            {fundingOptions.map(({ title, description, icon: Icon, href, action }) => (
              <div key={title} className="flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/40">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon aria-hidden="true" />
                </div>
                <h2 className="mt-4 font-semibold text-foreground">{title}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
                <Link href={href} className="mt-5">
                  <Button variant="outline" className="w-full">
                    {action}
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <p>We&apos;ll show you the account, timing, and review steps before any deposit is submitted. Never share your online banking password to fund your account.</p>
        </div>
      </section>
    </main>
  )
}
