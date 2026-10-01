"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { AccountsSection } from "@/components/accounts-section"
import { CreditJourneyCard } from "@/components/credit-journey-card"
import { QuickActions } from "@/components/quick-actions"
import { DepositChecksDrawer } from "@/components/deposit-checks-drawer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight, TrendingUp } from "lucide-react"
import { SendMoneyDrawer } from "@/components/send-money-drawer"
import { PayBillsDrawer } from "@/components/pay-bills-drawer"
import { AccountDetailsDrawer } from "@/components/account-details-drawer"
import { LinkExternalDrawer } from "@/components/link-external-drawer"
import { CreditScoreDrawer } from "@/components/credit-score-drawer"
import { PayTransferView } from "@/components/pay-transfer-view"
import { PlanTrackView } from "@/components/plan-track-view"
import { OffersView } from "@/components/offers-view"
import { MoreView } from "@/components/more-view"
import { useToast } from "@/hooks/use-toast"
import { TransferDrawer } from "@/components/transfer-drawer"
import { WireDrawer } from "@/components/wire-drawer"
import { TransactionReceiptModal } from "@/components/transaction-receipt-modal"
import { TransactionsDrawer } from "@/components/transactions-drawer"
import { DisputeTransactionDrawer } from "@/components/dispute-transaction-drawer"
import { useBanking } from "@/lib/banking-context"
import { useAuth } from "@/lib/auth-context"

function ChaseSplashScreen() {
  return (
    <main
      className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#1765a9] text-white"
      aria-label="Loading BankChase"
    >
      <div className="flex items-center gap-2.5" aria-hidden="true">
        <span className="font-sans text-[2.35rem] font-semibold leading-none tracking-[-0.08em] sm:text-[3rem]">
          CHASE
        </span>
        <span className="relative grid size-9 place-items-center sm:size-11">
          <span className="absolute inset-0 rotate-45 rounded-[0.2rem] bg-white" />
          <span className="absolute size-4 rotate-45 rounded-[0.15rem] bg-[#1765a9] sm:size-5" />
          <span className="absolute -right-0.5 top-0 size-3.5 bg-[#1765a9] sm:size-4" />
          <span className="absolute -bottom-0.5 left-0 size-3.5 bg-[#1765a9] sm:size-4" />
        </span>
      </div>
      <div className="absolute bottom-8 left-1/2 h-1 w-32 -translate-x-1/2 overflow-hidden rounded-full bg-white/25" aria-hidden="true">
        <div className="h-full w-1/2 animate-[splash-progress_1.6s_ease-in-out_infinite] rounded-full bg-white" />
      </div>
    </main>
  )
}

export default function BankingDashboard() {
  const [isSplashVisible, setIsSplashVisible] = useState(true)
  const [activeView, setActiveView] = useState("accounts")
  const [sendMoneyOpen, setSendMoneyOpen] = useState(false)
  const [payBillsOpen, setPayBillsOpen] = useState(false)
  const [depositChecksOpen, setDepositChecksOpen] = useState(false)
  const [accountDetailsOpen, setAccountDetailsOpen] = useState(false)
  const [linkExternalOpen, setLinkExternalOpen] = useState(false)
  const [creditScoreOpen, setCreditScoreOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [wireOpen, setWireOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [transactionsOpen, setTransactionsOpen] = useState(false)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [disputeTransactionId, setDisputeTransactionId] = useState<string | null>(null)
  const { toast } = useToast()

  const { userProfile, transactions, addNotification, addActivity, addLoginHistory } = useBanking()

  const monthlyActivity = useMemo(() => {
    const now = new Date()
    return transactions
      .filter((transaction) => {
        const date = new Date(transaction.date)
        return (
          transaction.type === "credit" &&
          transaction.status !== "failed" &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        )
      })
      .reduce((total, transaction) => total + transaction.amount, 0)
  }, [transactions])
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const splashTimer = window.setTimeout(() => setIsSplashVisible(false), 1800)
    return () => window.clearTimeout(splashTimer)
  }, [])

  const getUserFirstName = useCallback(() => {
    return userProfile.name.split(" ")[0] || "User"
  }, [userProfile.name])

  useEffect(() => {
    if (authLoading || !user) return

    const deviceInfo = navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Browser"

    if (addActivity) {
      addActivity({
        action: "Signed in successfully",
        device: deviceInfo,
        location: "Current Session",
      })
    }

    if (addLoginHistory) {
      addLoginHistory({
        device: deviceInfo,
        location: "New York, NY",
        status: "success",
        ip: "192.168.1." + Math.floor(Math.random() * 255),
      })
    }

  }, [addActivity, addLoginHistory, authLoading, toast, user])

  const handleLogout = async () => {
    if (addActivity) {
      addActivity({
        action: "Signed out",
        device: navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Browser",
        location: "Current Session",
      })
    }
    setActiveView("accounts")
    toast({
      title: "Signing out",
      description: "Your banking session is being securely closed.",
    })
    await logout()
  }

  const handleOpenReceipt = (transactionId: string) => {
    setSelectedTransactionId(transactionId)
    setReceiptOpen(true)
  }

  const handleOpenDispute = (transactionId: string) => {
    setDisputeTransactionId(transactionId)
    setDisputeOpen(true)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  useEffect(() => {
    if (!isSplashVisible && !authLoading && !user) {
      router.replace('/login')
    }
  }, [authLoading, isSplashVisible, router, user])

  if (isSplashVisible) {
    return <ChaseSplashScreen />
  }

  if (authLoading || !user) {
    return null
  }

  const renderView = () => {
    switch (activeView) {
      case "accounts":
        return (
          <div className="flex flex-col gap-5 pb-24">
            <QuickActions
              onSendMoney={() => setSendMoneyOpen(true)}
              onDepositChecks={() => setDepositChecksOpen(true)}
              onPayBills={() => setPayBillsOpen(true)}
            />
            <Card className="border-0 dashboard-card-shadow">
              <button
                type="button"
                onClick={() => setTransactionsOpen(true)}
                className="w-full rounded-xl text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="View monthly activity transactions"
              >
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <TrendingUp aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly activity</p>
                      <p className="text-xl font-semibold tabular-nums">
                        {monthlyActivity.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                      </p>
                      <p className="text-xs text-muted-foreground">Money received this month</p>
                    </div>
                  </div>
                  <ArrowUpRight className="text-muted-foreground" aria-hidden="true" />
                </CardContent>
              </button>
            </Card>
            <AccountsSection
              onViewAccount={() => setAccountDetailsOpen(true)}
              onLinkExternal={() => setLinkExternalOpen(true)}
              onSeeAllTransactions={() => setTransactionsOpen(true)}
              onReceiptOpen={handleOpenReceipt}
            />
            <CreditJourneyCard onViewScore={() => setCreditScoreOpen(true)} />
          </div>
        )
      case "pay-transfer":
        return (
          <PayTransferView
            onSendMoney={() => setSendMoneyOpen(true)}
            onPayBills={() => setPayBillsOpen(true)}
            onTransfer={() => router.push("/send-money/transfer")}
            onWire={() => setWireOpen(true)}
            onReceiptOpen={handleOpenReceipt}
          />
        )
      case "plan-track":
        return <PlanTrackView />
      case "offers":
        return <OffersView />
      case "more":
        return <MoreView onLogout={handleLogout} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="px-4 pt-5">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {getUserFirstName()}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {renderView()}
      </main>

      <BottomNavigation activeView={activeView} onViewChange={setActiveView} />

      {/* Drawers */}
      <SendMoneyDrawer open={sendMoneyOpen} onOpenChange={setSendMoneyOpen} onReceiptOpen={handleOpenReceipt} />
      <DepositChecksDrawer open={depositChecksOpen} onOpenChange={setDepositChecksOpen} onReceiptOpen={handleOpenReceipt} />
      <TransferDrawer open={transferOpen} onOpenChange={setTransferOpen} onReceiptOpen={handleOpenReceipt} />
      <WireDrawer open={wireOpen} onOpenChange={setWireOpen} onReceiptOpen={handleOpenReceipt} />
      <PayBillsDrawer open={payBillsOpen} onOpenChange={setPayBillsOpen} onReceiptOpen={handleOpenReceipt} />
      <AccountDetailsDrawer
        open={accountDetailsOpen}
        onOpenChange={setAccountDetailsOpen}
        onReceiptOpen={handleOpenReceipt}
      />
      <LinkExternalDrawer open={linkExternalOpen} onOpenChange={setLinkExternalOpen} />
      <CreditScoreDrawer open={creditScoreOpen} onOpenChange={setCreditScoreOpen} />
      <TransactionsDrawer
        open={transactionsOpen}
        onOpenChange={setTransactionsOpen}
        onReceiptOpen={handleOpenReceipt}
      />

      {/* Receipt Modal */}
      <TransactionReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        transactionId={selectedTransactionId}
        onDisputeOpen={handleOpenDispute}
      />

      {/* Dispute Transaction Drawer */}
      <DisputeTransactionDrawer open={disputeOpen} onOpenChange={setDisputeOpen} transactionId={disputeTransactionId} />

    </div>
  )
}
