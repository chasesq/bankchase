"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowDownToLine, ArrowRight, Building2, Check, ChevronRight, Plus, ShieldCheck, WalletCards } from "lucide-react"
import { Navigation } from "@/components/Navigation"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const banks = [
  { name: "Chase checking •••• 4821", status: "Verified", lastSynced: "Synced today" },
  { name: "Bank of America savings •••• 1098", status: "Verified", lastSynced: "Synced yesterday" },
]

function MoneyContent() {
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")

  const submitAddFunds = () => {
    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setMessage("Enter an amount greater than $0.00.")
      return
    }
    setMessage(`Your $${parsedAmount.toFixed(2)} add funds request is ready for review.`)
  }

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-slate-900">
      <Navigation />
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Money</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Money</h1>
            <p className="mt-2 text-sm text-slate-600">Manage your balance, add funds, and connect your bank accounts.</p>
          </div>
          <Button onClick={() => setShowAddFunds(true)} className="gap-2 bg-[#0070ba] hover:bg-[#005ea6]">
            <Plus className="size-4" aria-hidden="true" />
            Add funds
          </Button>
        </div>

        <section aria-labelledby="balance-heading" className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <Card className="border-0 bg-[#003087] text-white shadow-sm">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p id="balance-heading" className="text-sm text-blue-100">Available balance</p>
                  <p className="mt-3 text-4xl font-semibold tracking-tight">$12,480.50 USD</p>
                  <p className="mt-2 text-sm text-blue-100">Ready to use</p>
                </div>
                <div className="rounded-full bg-white/10 p-3"><WalletCards className="size-6" aria-hidden="true" /></div>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button onClick={() => setShowAddFunds(true)} className="bg-white text-[#003087] hover:bg-blue-50">Add funds</Button>
                <Link href="/transfer"><Button variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">Transfer money</Button></Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">Money movement</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <Link href="#banks-section" className="flex items-center justify-between rounded-lg p-3 transition hover:bg-slate-50">
                <span className="flex items-center gap-3"><Building2 className="size-5 text-[#0070ba]" aria-hidden="true" /><span><span className="block font-medium">Banks</span><span className="text-sm text-slate-500">{banks.length} linked accounts</span></span></span><ChevronRight className="size-4 text-slate-400" aria-hidden="true" />
              </Link>
              <Link href="/transactions" className="flex items-center justify-between rounded-lg p-3 transition hover:bg-slate-50">
                <span className="flex items-center gap-3"><ArrowDownToLine className="size-5 text-[#0070ba]" aria-hidden="true" /><span><span className="block font-medium">Activity</span><span className="text-sm text-slate-500">View recent transactions</span></span></span><ChevronRight className="size-4 text-slate-400" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>
        </section>

        <section id="banks-section" aria-labelledby="banks-heading" className="mt-8 scroll-mt-6">
          <div className="mb-4 flex items-end justify-between gap-4"><div><h2 id="banks-heading" className="text-xl font-semibold">Banks</h2><p className="mt-1 text-sm text-slate-600">Use a linked bank to add or withdraw money.</p></div><Button variant="outline" className="gap-2"><Plus className="size-4" aria-hidden="true" />Link a bank</Button></div>
          <Card className="border-slate-200 shadow-sm"><CardContent className="divide-y divide-slate-200 p-0">{banks.map((bank) => <div key={bank.name} className="flex flex-wrap items-center justify-between gap-4 p-5"><div className="flex items-center gap-3"><div className="rounded-full bg-blue-50 p-2.5 text-[#0070ba]"><Building2 className="size-5" aria-hidden="true" /></div><div><p className="font-medium">{bank.name}</p><p className="mt-1 text-sm text-slate-500">{bank.lastSynced}</p></div></div><span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"><Check className="size-4" aria-hidden="true" />{bank.status}</span></div>)}</CardContent></Card>
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" /><p>Your bank information is encrypted and protected. We never share your login credentials.</p></div>
        </section>
      </div>

      {showAddFunds && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="add-funds-title"><Card className="w-full max-w-md border-slate-200 shadow-xl"><CardHeader><CardTitle id="add-funds-title">Add funds</CardTitle><p className="text-sm text-slate-600">Choose an amount to add from your linked bank.</p></CardHeader><CardContent className="space-y-4"><label htmlFor="funding-amount" className="text-sm font-medium">Amount</label><div className="relative"><span className="absolute left-3 top-2.5 text-slate-500">$</span><Input id="funding-amount" inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setMessage("") }} className="pl-7" placeholder="0.00" /></div>{message && <p className="text-sm text-slate-600" role="status">{message}</p>}<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setShowAddFunds(false); setMessage("") }}>Cancel</Button><Button onClick={submitAddFunds} className="gap-2 bg-[#0070ba] hover:bg-[#005ea6]">Continue <ArrowRight className="size-4" aria-hidden="true" /></Button></div></CardContent></Card></div>}
    </main>
  )
}

export default function MoneyPage() {
  return <ProtectedRoute><MoneyContent /></ProtectedRoute>
}
