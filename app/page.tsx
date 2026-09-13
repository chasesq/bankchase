"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { AccountsSection } from "@/components/accounts-section"
import { QuickActions } from "@/components/quick-actions"
import { CreditJourneyCard } from "@/components/credit-journey-card"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SendMoneyDrawer } from "@/components/send-money-drawer"
import { DepositChecksDrawer } from "@/components/deposit-checks-drawer"
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
import { AccountOpeningModal } from "@/components/account-opening-modal"
import { KycVerificationCard } from "@/components/kyc-verification-card"
import { useAuth } from "@/lib/auth-context"

export default function BankingDashboard() {
  const [activeView, setActiveView] = useState("accounts")
  const [sendMoneyOpen, setSendMoneyOpen] = useState(false)
  const [depositChecksOpen, setDepositChecksOpen] = useState(false)
  const [payBillsOpen, setPayBillsOpen] = useState(false)
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
  const [accountOpeningOpen, setAccountOpeningOpen] = useState(false)
  const { toast } = useToast()

  const { userProfile, addNotification, addActivity, addLoginHistory } = useBanking()
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()

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
    if (!authLoading && !user) {
      router.replace('/sign-in')
    }
  }, [authLoading, router, user])

  if (authLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-sm text-muted-foreground" role="status">Opening your secure dashboard…</p>
      </main>
    )
  }

  const renderView = () => {
    switch (activeView) {
      case "accounts":
        return (
          <div className="flex flex-col gap-5 pb-24">
            <KycVerificationCard />
            <QuickActions
              onSendMoney={() => setSendMoneyOpen(true)}
              onDepositChecks={() => setDepositChecksOpen(true)}
              onPayBills={() => setPayBillsOpen(true)}
              onAddAccount={() => setAccountOpeningOpen(true)}
              onTransfer={() => setTransferOpen(true)}
            />
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
            onTransfer={() => setTransferOpen(true)}
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

  const mercuryNav = [
    { id: "accounts", label: "Home", icon: "⌂" },
    { id: "pay-transfer", label: "Payments", icon: "↔" },
    { id: "plan-track", label: "Insights", icon: "⌁" },
    { id: "offers", label: "Cards & spend", icon: "▣" },
    { id: "more", label: "Settings", icon: "⚙" },
  ]

  return (
    <div className="min-h-screen bg-[#f7f7fa] text-[#20212a]">
      <div className="hidden lg:flex h-12 items-center justify-between bg-[#373742] px-6 text-sm text-white">
        <div className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-full border border-white/50 text-xs">B</span><span>Banking Demo</span><a className="text-white/70 underline" href="#">Customize your experience</a></div>
        <div className="flex items-center gap-3"><span className="rounded-full bg-white/10 px-4 py-2 text-white/80">Viewing as Admin⌄</span><button className="rounded-full bg-[#6375ee] px-5 py-2 font-medium">Open account</button></div>
      </div>
      <div className="flex min-h-[calc(100vh-3rem)]">
        <aside className="hidden w-[220px] shrink-0 border-r border-[#e4e4e9] bg-white lg:block">
          <div className="flex h-16 items-center gap-2 border-b border-[#e4e4e9] px-5 font-semibold"><span className="grid size-7 place-items-center rounded-md bg-[#282936] text-xs text-white">B</span> Banking <span className="rounded bg-[#282936] px-1.5 py-0.5 text-[10px] text-white">Pro</span></div>
          <nav className="flex flex-col gap-1 p-3">
            {mercuryNav.map((item) => <button key={item.id} onClick={() => setActiveView(item.id)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${activeView === item.id ? "bg-[#ececf1] font-medium" : "text-[#60616b] hover:bg-[#f4f4f7]"}`}><span className="w-4 text-center">{item.icon}</span>{item.label}</button>)}
          </nav>
          <div className="mt-5 border-t border-[#e4e4e9] p-4 text-xs text-[#777883]">BOOKMARKS<div className="mt-4 flex flex-col gap-4 text-sm text-[#44454e]"><span>⌑ Operating account</span><span>▣ Corporate card</span><span>↗ Bill Pay</span><span>⌁ Insights</span></div></div>
        </aside>
        <div className="min-w-0 flex-1">
          <DashboardHeader />
          <main className="mx-auto max-w-[1120px] px-4 py-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between"><div><h1 className="text-3xl font-medium tracking-tight">Welcome, {getUserFirstName()}</h1><p className="mt-1 text-sm text-[#777883]">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p></div><button onClick={() => setSendMoneyOpen(true)} className="hidden rounded-lg bg-[#6475ef] px-5 py-2.5 text-sm font-medium text-white shadow-sm sm:block">Send money</button></div>
            {renderView()}
          </main>
          <BottomNavigation activeView={activeView} onViewChange={setActiveView} />
        </div>
        <aside className="hidden w-[300px] shrink-0 border-l border-[#e4e4e9] bg-white p-5 xl:block"><div className="flex items-center justify-between"><h2 className="font-medium">Try out Banking</h2><span>⌄</span></div><div className="mt-4 flex gap-2"><span className="rounded-lg bg-[#eef0ff] px-3 py-1.5 text-xs font-medium text-[#5264d8]">Startup</span><span className="rounded-lg border px-3 py-1.5 text-xs">Ecommerce</span><span className="rounded-lg border px-3 py-1.5 text-xs">More</span></div><div className="mt-4 overflow-hidden rounded-xl border">{["Send money to contractors","Invite your team members","Create cards for your team","Request vendor payment details","Understand your data"].map((item) => <button key={item} onClick={() => toast({ title: item, description: "This Banking workflow is ready to explore." })} className="flex w-full items-center justify-between border-b px-4 py-4 text-left text-sm last:border-0 hover:bg-[#fafafd]"><span>{item}</span><span className="text-lg text-[#8b8c96]">›</span></button>)}</div></aside>
      </div>
      <SendMoneyDrawer open={sendMoneyOpen} onOpenChange={setSendMoneyOpen} onReceiptOpen={handleOpenReceipt} />
      <TransferDrawer open={transferOpen} onOpenChange={setTransferOpen} onReceiptOpen={handleOpenReceipt} />
      <WireDrawer open={wireOpen} onOpenChange={setWireOpen} onReceiptOpen={handleOpenReceipt} />
      <DepositChecksDrawer open={depositChecksOpen} onOpenChange={setDepositChecksOpen} />
      <PayBillsDrawer open={payBillsOpen} onOpenChange={setPayBillsOpen} onReceiptOpen={handleOpenReceipt} />
      <AccountDetailsDrawer open={accountDetailsOpen} onOpenChange={setAccountDetailsOpen} onReceiptOpen={handleOpenReceipt} />
      <LinkExternalDrawer open={linkExternalOpen} onOpenChange={setLinkExternalOpen} />
      <CreditScoreDrawer open={creditScoreOpen} onOpenChange={setCreditScoreOpen} />
      <TransactionsDrawer open={transactionsOpen} onOpenChange={setTransactionsOpen} onReceiptOpen={handleOpenReceipt} />
      <TransactionReceiptModal open={receiptOpen} onOpenChange={setReceiptOpen} transactionId={selectedTransactionId} onDisputeOpen={handleOpenDispute} />
      <DisputeTransactionDrawer open={disputeOpen} onOpenChange={setDisputeOpen} transactionId={disputeTransactionId} />
      <AccountOpeningModal isOpen={accountOpeningOpen} onClose={() => setAccountOpeningOpen(false)} />
    </div>
  )
}
