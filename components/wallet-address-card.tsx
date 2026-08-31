"use client"

import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export const PUBLIC_WALLET_ADDRESS = "7gWmsFxv1sRUQDSe6MYyty41zzCxn3fpKVgT1URMKhkU"

export function WalletAddressCard({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false)

  const copyAddress = async () => {
    await navigator.clipboard.writeText(PUBLIC_WALLET_ADDRESS)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className={compact ? "rounded-lg border border-border bg-card px-3 py-2" : "rounded-xl border border-border bg-card px-4 py-3"}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Wallet address</p>
          <p className="truncate font-mono text-xs text-foreground" title={PUBLIC_WALLET_ADDRESS}>
            {PUBLIC_WALLET_ADDRESS}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={copyAddress} aria-label="Copy wallet address">
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          <span className="sr-only">{copied ? "Wallet address copied" : "Copy wallet address"}</span>
        </Button>
      </div>
    </div>
  )
}

export function WalletAddressSummary() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-medium text-muted-foreground">Wallet address</p>
      <p className="mt-1 break-all font-mono text-sm text-foreground">{PUBLIC_WALLET_ADDRESS}</p>
      <p className="mt-2 text-xs text-muted-foreground">Read-only address display. Balances remain sourced from existing account data.</p>
    </div>
  )
}
