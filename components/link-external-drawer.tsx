"use client"

import { useCallback, useEffect, useState } from "react"
import { QuilttButton, QuilttProvider } from "@quiltt/react"
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useBanking } from "@/lib/banking-context"
import { Building2, CheckCircle, Loader2, ShieldCheck } from "lucide-react"

interface LinkExternalDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const connectorId = process.env.NEXT_PUBLIC_QUILTT_CONNECTOR_ID || "vaia9lgjhd.quiltt.app"

export function LinkExternalDrawer({ open, onOpenChange }: LinkExternalDrawerProps) {
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [quilttUserId, setQuilttUserId] = useState<string | null>(null)
  const [isLoadingToken, setIsLoadingToken] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()
  const { addNotification, userProfile } = useBanking()

  const loadSession = useCallback(async () => {
    setIsLoadingToken(true)
    try {
      const response = await fetch("/api/quiltt/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: quilttUserId ?? userProfile.id }),
      })
      const data = await response.json()
      if (!response.ok || !data.token) throw new Error(data.error || "Unable to start secure bank connection.")
      setSessionToken(data.token)
      if (typeof data.userId === "string" && data.userId.trim()) setQuilttUserId(data.userId)
    } catch (error) {
      toast({
        title: "Quiltt connection unavailable",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingToken(false)
    }
  }, [quilttUserId, toast, userProfile.id])

  useEffect(() => {
    // Opening the drawer intentionally starts the server-side session request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open && !sessionToken && !isLoadingToken) void loadSession()
    if (!open) setSessionToken(null)
  }, [open, sessionToken, isLoadingToken, loadSession])

  const handleConnected = useCallback(async (event?: unknown) => {
    const findAccountId = (value: unknown): string | undefined => {
      if (!value || typeof value !== "object") return undefined
      if (Array.isArray(value)) {
        for (const item of value) {
          const found = findAccountId(item)
          if (found) return found
        }
        return undefined
      }
      const record = value as Record<string, unknown>
      for (const key of ["accountId", "account_id", "id"]) {
        if (typeof record[key] === "string" && /^(acc_|account_)/i.test(record[key])) return record[key]
      }
      for (const child of Object.values(record)) {
        const found = findAccountId(child)
        if (found) return found
      }
      return undefined
    }

    setIsConnecting(true)
    try {
      const accountId = findAccountId(event)
      if (!accountId) throw new Error("Quiltt connected, but no account was returned. Please try again.")

      const tokenResponse = await fetch("/api/quiltt/processor-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      })
      const tokenData = await tokenResponse.json()
      if (!tokenResponse.ok || !tokenData.token) throw new Error(tokenData.error || "Unable to create the payment token.")

      const paykeyResponse = await fetch("/api/straddle/paykey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: userProfile.id, quilttToken: tokenData.token, externalId: accountId }),
      })
      const paykeyData = await paykeyResponse.json()
      if (!paykeyResponse.ok) throw new Error(paykeyData.error || "Unable to activate the bank payment account.")

      addNotification({
        title: "Bank account connected",
        message: "Your account is connected and ready for verified payments.",
        type: "success",
        category: "Accounts",
      })
      toast({ title: "Account connected", description: "Your bank account is ready for verified payments." })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Account activation failed",
        description: error instanceof Error ? error.message : "Please try connecting again.",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }, [addNotification, onOpenChange, toast, userProfile.id])

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
                <p className="font-medium">Secure connection with Akoya</p>
                <p className="text-sm text-muted-foreground">Quiltt routes you to your bank&apos;s secure consent flow. Your bank credentials never touch this app.</p>
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
              <span>Balances and transactions update through Quiltt.</span>
            </div>
          )}
        </div>
        <DrawerFooter>
          {sessionToken ? (
            <QuilttProvider token={sessionToken}>
              <QuilttButton
                connectorId={connectorId}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                onOpen={() => setIsConnecting(true)}
                onExit={() => setIsConnecting(false)}
                onExitSuccess={handleConnected}
                onExitError={() => setIsConnecting(false)}
              >
                Continue with Quiltt
              </QuilttButton>
            </QuilttProvider>
          ) : (
            <Button disabled>
              {isLoadingToken ? <><Loader2 className="animate-spin" data-icon="inline-start" />Preparing secure connection</> : "Continue with Quiltt"}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConnecting}>Cancel</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
