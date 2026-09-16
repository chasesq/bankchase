"use client"

import { Send, FileText, CreditCard, ArrowRightLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QuickActionsProps {
  onSendMoney: () => void
  onDepositChecks: () => void
  onPayBills: () => void
  onTransfer?: () => void
}

export function QuickActions({
  onSendMoney,
  onDepositChecks,
  onPayBills,
  onTransfer,
}: QuickActionsProps) {
  return (
    <section aria-label="Account management actions" className="flex flex-col gap-3"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Account management</p><h2 className="text-lg font-semibold text-foreground">Move money</h2></div><span className="text-xs text-muted-foreground">Secure and simple</span></div><div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
      <Button
        variant="outline"
        className="flex items-center gap-2 whitespace-nowrap bg-card border-0 dashboard-card-shadow hover:bg-muted/50 rounded-full h-12 px-5 font-medium flex-shrink-0"
        onClick={onSendMoney}
      >
        <Send className="h-4 w-4 text-primary" />
        <span>Send | Zelle®</span>
      </Button>
      {onTransfer && (
        <Button
          variant="outline"
          className="flex items-center gap-2 whitespace-nowrap bg-card border-0 dashboard-card-shadow hover:bg-muted/50 rounded-full h-12 px-5 font-medium flex-shrink-0"
          onClick={onTransfer}
        >
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          <span>Transfer</span>
        </Button>
      )}
      <Button
        variant="outline"
        className="flex items-center gap-2 whitespace-nowrap bg-card border-0 dashboard-card-shadow hover:bg-muted/50 rounded-full h-12 px-5 font-medium flex-shrink-0"
        onClick={onDepositChecks}
      >
        <FileText className="h-4 w-4 text-primary" />
        <span>Deposit</span>
      </Button>
      <Button
        variant="outline"
        className="flex items-center gap-2 whitespace-nowrap bg-card border-0 dashboard-card-shadow hover:bg-muted/50 rounded-full h-12 px-5 font-medium flex-shrink-0"
        onClick={onPayBills}
      >
        <CreditCard className="h-4 w-4 text-primary" />
        <span>Pay bills</span>
      </Button>
    </div></section>
  )
}
