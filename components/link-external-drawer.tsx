"use client"

import { useCallback, useEffect, useState } from "react"
import { usePlaidLink } from "react-plaid-link"
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useBanking } from "@/lib/banking-context"
import { Building2, CheckCircle, Loader2, ShieldCheck } from "lucide-react"

interface LinkExternalDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PlaidAccount = {
  account_id?: string
  accountId?: string
  name: string
  mask?: string
  account_mask?: string
  type?: string
  subtype?: string
  balances?: { available?: number | null; current?: number | null }
  balance_available?: number | null
  balance_current?: number | null
  institution_name?: string
}

export function LinkExternalDrawer({ open, onOpenChange }: LinkExternalDrawerProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [isLoadingToken, setIsLoadingToken] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()
  const { addAccount, addNotification } = useBanking()

  const loadLinkToken = useCallback(async () => {
    setIsLoadingToken(true)
    try {
      const response = await fetch("/api/plaid/create-link-token", { method: "POST" })
      const data = await response.json()
      if (!response.ok || !data.linkToken) throw new Error(data.error || "Unable to start secure bank connection.")
      setLinkToken(data.linkToken)
    } catch (error) {
      toast({
        title: "Plaid connection unavailable",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingToken(false)
    }
  }, [toast])

  useEffect(() => {
    if (open && !linkToken && !isLoadingToken) void loadLinkToken()
    if (!open) setLinkToken(null)
  }, [open, linkToken, isLoadingToken, loadLinkToken])

  const handleSuccess = useCallback(async (publicToken: string, metadata: { institution?: { name?: string } | null }) => {
    setIsConnecting(true)
    try {
      const exchangeResponse = await fetch("/api/plaid/exchange-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicToken,
          metadata: { institutionName: metadata.institution?.name || "Connected bank" },
        }),
      })
      const exchangeData = await exchangeResponse.json()
      if (!exchangeResponse.ok) throw new Error(exchangeData.error || "Could not finish connecting your bank.")

      const accountsResponse = await fetch("/api/plaid/accounts")
      const accountsData = await accountsResponse.json()
      if (!accountsResponse.ok) throw new Error(accountsData.error || "Could not load your connected accounts.")

      const accounts = (accountsData.accounts || []) as PlaidAccount[]
      accounts.forEach((account) => {
        const accountNumber = account.mask || account.account_mask || "****"
        const balance = account.balances?.available ?? account.balance_available ?? account.balances?.current ?? account.balance_current ?? 0
        addAccount({
          name: account.name,
          type: account.subtype || account.type || "External",
          balance,
          accountNumber: `...${accountNumber}`,
          routingNumber: "",
        })
      })

      addNotification({
        title: "Bank account connected",
        message: `${accounts.length || exchangeData.accountCount || 0} account(s) are now active in your dashboard.`,
        type: "success",
        category: "Accounts",
      })
      toast({ title: "Account connected", description: "Your balances and transactions are syncing securely." })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
      setLinkToken(null)
    }
  }, [addAccount, addNotification, onOpenChange, toast])

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    onSuccess: handleSuccess,
    onExit: () => setIsConnecting(false),
  })

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Building2 className="text-primary" aria-hidden="true" />
            Connect an external bank
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-5 px-4 pb-6">
          <div className="rounded-xl bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 text-primary" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <p className="font-medium">Secure connection with Plaid</p>
                <p className="text-sm text-muted-foreground">Sign in through your bank&apos;s secure window. Your bank credentials never touch this app.</p>
              </div>
            </div>
          </div>
          {isConnecting ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 className="animate-spin text-primary" aria-hidden="true" />
              <p className="font-medium">Activating your account</p>
              <p className="text-sm text-muted-foreground">Syncing balances and recent activity securely.</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle className="text-primary" aria-hidden="true" />
              <span>Balances and transactions update through Plaid.</span>
            </div>
          )}
        </div>
        <DrawerFooter>
          <Button onClick={() => openPlaid()} disabled={!plaidReady || isLoadingToken || isConnecting}>
            {isLoadingToken ? <><Loader2 className="animate-spin" data-icon="inline-start" />Preparing secure connection</> : "Continue with Plaid"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConnecting}>Cancel</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
