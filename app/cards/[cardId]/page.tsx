'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, CreditCard, Eye, EyeOff, Lock, MoreHorizontal, RefreshCw, Send, ShieldCheck, Unlock } from 'lucide-react'
import { toast } from 'sonner'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useBanking } from '@/lib/banking-context'

type Card = {
  id: string
  userId: string
  accountId: string
  type: 'virtual' | 'physical'
  brand: string
  lastFour: string
  cardholderName: string
  expiryMonth: string
  expiryYear: string
  status: 'active' | 'frozen' | 'cancelled' | 'expired' | 'pending_activation'
  balance: number
  currency: string
  spendingControls: { dailyLimit: number; monthlyLimit: number; singleTransactionLimit: number }
}

type CardTransaction = { id: string; timestamp: string; amount: number; merchantName: string; currency: string; status: string }

function CardDetailContent() {
  const params = useParams<{ cardId: string }>()
  const router = useRouter()
  const { isLoaded, userProfile } = useBanking()
  const [card, setCard] = useState<Card | null>(null)
  const [transactions, setTransactions] = useState<CardTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showNumber, setShowNumber] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCard = useCallback(async () => {
    if (!isLoaded || !userProfile?.id || !params.cardId) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/cards?userId=${encodeURIComponent(userProfile.id)}`)
      if (!response.ok) throw new Error('Unable to load cards')
      const data = await response.json()
      const match = (data.cards as Card[]).find((item) => item.id === params.cardId)
      if (!match) throw new Error('This card could not be found in your account')
      setCard(match)

      const transactionResponse = await fetch(`/api/cards?cardId=${encodeURIComponent(match.id)}&transactions=true`)
      if (transactionResponse.ok) {
        const transactionData = await transactionResponse.json()
        setTransactions(transactionData.transactions ?? [])
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load this card')
    } finally {
      setIsLoading(false)
    }
  }, [isLoaded, params.cardId, userProfile?.id])

  useEffect(() => { void loadCard() }, [loadCard])

  const updateCard = async (action: 'freeze' | 'replace', body: Record<string, unknown> = {}) => {
    if (!card) return
    setIsUpdating(true)
    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, cardId: card.id, ...body }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Card update failed')
      toast.success(action === 'freeze' ? (card.status === 'frozen' ? 'Card unlocked' : 'Card locked') : 'Replacement card requested')
      await loadCard()
    } catch (updateError) {
      toast.error(updateError instanceof Error ? updateError.message : 'Card update failed')
    } finally {
      setIsUpdating(false)
    }
  }

  if (!isLoaded || isLoading) return <main className="min-h-screen bg-background flex items-center justify-center"><div className="text-muted-foreground">Loading card details...</div></main>

  if (error || !card) return <main className="min-h-screen bg-background p-6"><div className="max-w-xl mx-auto mt-16 rounded-2xl border border-border bg-card p-8 text-center"><CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><h1 className="text-2xl font-bold text-foreground">Card unavailable</h1><p className="mt-2 text-muted-foreground">{error ?? 'We could not find this card.'}</p><Link href="/cards" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground"><ArrowLeft className="h-4 w-4" />Back to cards</Link></div></main>

  const isLocked = card.status === 'frozen'
  const isInactive = ['cancelled', 'expired'].includes(card.status)

  return <main className="min-h-screen bg-background pb-24 md:pb-8"><div className="mx-auto max-w-6xl p-4 md:p-8">
    <button onClick={() => router.push('/cards')} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Card Management</button>
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">{card.type} card</p><h1 className="text-4xl font-bold text-foreground">{card.brand} ending in {card.lastFour}</h1><p className="mt-2 text-muted-foreground">Manage your credit and debit card securely.</p></div><span className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${isLocked ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'}`}>{isLocked ? 'Locked' : card.status.replace('_', ' ')}</span></div>
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <section className="rounded-2xl bg-gradient-to-br from-primary to-primary/75 p-7 text-primary-foreground shadow-lg"><div className="flex items-start justify-between"><div><p className="text-sm uppercase tracking-wider text-primary-foreground/70">{card.type} card</p><CreditCard className="mt-3 h-9 w-9 text-primary-foreground/80" /></div><ShieldCheck className="h-6 w-6 text-primary-foreground/70" /></div><div className="mt-14 flex items-center gap-3"><p className="font-mono text-2xl tracking-[0.2em]">{showNumber ? `•••• •••• •••• ${card.lastFour}` : '•••• •••• •••• ••••'}</p><button aria-label={showNumber ? 'Hide card number' : 'Show card number'} onClick={() => setShowNumber((value) => !value)} className="rounded p-1 hover:bg-primary-foreground/10">{showNumber ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div><div className="mt-8 flex justify-between"><div><p className="text-xs uppercase text-primary-foreground/60">Cardholder</p><p className="font-semibold">{card.cardholderName}</p></div><div className="text-right"><p className="text-xs uppercase text-primary-foreground/60">Expires</p><p className="font-semibold">{card.expiryMonth}/{card.expiryYear}</p></div></div></section>
      <section className="rounded-2xl border border-border bg-card p-6"><h2 className="text-lg font-semibold text-foreground">Card controls</h2><p className="mt-1 text-sm text-muted-foreground">Pause your card instantly if you do not recognize a transaction.</p><div className="mt-6 grid gap-3"><button disabled={isUpdating || isInactive} onClick={() => void updateCard('freeze', { frozen: !isLocked })} className="flex items-center justify-between rounded-xl border border-border p-4 text-left hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"><span className="flex items-center gap-3"><span className="rounded-lg bg-muted p-2">{isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}</span><span><strong className="block text-sm text-foreground">{isLocked ? 'Unlock card' : 'Lock card'}</strong><span className="text-xs text-muted-foreground">{isLocked ? 'Resume card spending' : 'Stop new purchases'}</span></span></span><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>      <button disabled={isUpdating || isInactive} onClick={() => { const reason = window.prompt('Why do you need a replacement? Enter lost, stolen, or damaged.')?.trim().toLowerCase(); if (reason === 'lost' || reason === 'stolen' || reason === 'damaged') void updateCard('replace', { reason }); else if (reason) toast.error('Choose lost, stolen, or damaged.') }} className="flex items-center gap-3 rounded-xl border border-destructive/30 p-4 text-left text-destructive hover:bg-destructive/5 disabled:opacity-50"><RefreshCw className="h-4 w-4" /><span><strong className="block text-sm">Replace card</strong><span className="text-xs text-muted-foreground">Report it lost, stolen, or damaged</span></span></button><Link href={`/transfer?cardId=${encodeURIComponent(card.id)}`} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"><Send className="h-4 w-4" />Transfer money</Link></div></section>
    </div>
    <div className="mt-6 grid gap-6 md:grid-cols-2"><section className="rounded-2xl border border-border bg-card p-6"><h2 className="text-lg font-semibold text-foreground">Spending limits</h2><div className="mt-4 space-y-4">{[['Daily limit', card.spendingControls.dailyLimit], ['Monthly limit', card.spendingControls.monthlyLimit], ['Single transaction', card.spendingControls.singleTransactionLimit]].map(([label, value]) => <div key={String(label)} className="flex justify-between border-b border-border pb-3 text-sm"><span className="text-muted-foreground">{label}</span><strong className="text-foreground">${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></div>)}</div></section><section className="rounded-2xl border border-border bg-card p-6"><h2 className="text-lg font-semibold text-foreground">Available balance</h2><p className="mt-3 text-3xl font-bold text-foreground">${card.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p><p className="mt-1 text-sm text-muted-foreground">{card.currency}</p><div className="mt-5 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400"><Check className="h-4 w-4" />Protected by card security</div></section></div>
    <section className="mt-6 rounded-2xl border border-border bg-card p-6"><h2 className="text-lg font-semibold text-foreground">Recent card activity</h2>{transactions.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No card transactions yet.</p> : <div className="mt-4 divide-y divide-border">{transactions.slice(0, 8).map((transaction) => <div key={transaction.id} className="flex items-center justify-between py-3"><div><p className="font-medium text-foreground">{transaction.merchantName}</p><p className="text-xs text-muted-foreground">{new Date(transaction.timestamp).toLocaleDateString()}</p></div><p className="font-semibold text-foreground">-${transaction.amount.toFixed(2)}</p></div>)}</div>}</section>
  </div></main>
}

export default function CardDetailPage() { return <ProtectedRoute><CardDetailContent /></ProtectedRoute> }
