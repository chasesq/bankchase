"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, CreditCard, WalletCards } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useBanking } from "@/lib/banking-context"

const PREPAY_ID = "606043"

export function PrepayBalanceCard() {
  const { accounts } = useBanking()
  const totalAccountBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  return (
    <Card className="dashboard-card-shadow border-0">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <WalletCards aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base">Prepay balance</CardTitle>
            <p className="text-xs text-muted-foreground">Prepay ID: {PREPAY_ID}</p>
          </div>
        </div>
        <Badge variant="secondary">All modules</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end justify-between rounded-xl bg-muted/40 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Available prepay funds</p>
            <p className="mt-1 text-2xl font-bold text-foreground">$0.00</p>
          </div>
          <CreditCard className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            Automatically applied to invoices. Your account balances are tracked below: ${totalAccountBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total.
          </span>
        </div>
        <Button asChild variant="outline" className="w-full justify-between">
          <Link href="/prepays">
            Manage prepay funds
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
