'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, CreditCard, LockKeyhole, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useBanking } from '@/lib/banking-context'

const cardOptions = [
  { value: 'physical', label: 'Physical card', description: 'A card shipped to your billing address.' },
  { value: 'virtual', label: 'Virtual card', description: 'Ready to use online as soon as it is issued.' },
] as const

function IssueCardContent() {
  const { isLoaded, userProfile, accounts } = useBanking()
  const [type, setType] = useState<'physical' | 'virtual'>('physical')
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [cardholderName, setCardholderName] = useState(userProfile?.name ?? '')
  const [pin, setPin] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [issuedCard, setIssuedCard] = useState<{ lastFour: string; number: string; cvv: string; expiry: string } | null>(null)
  const selectedAccountId = accounts.some((account) => account.id === accountId) ? accountId : accounts[0]?.id ?? ''
  const displayedCardholderName = cardholderName || userProfile?.name || ''

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const selectedAccount = accounts.find((account) => account.id === selectedAccountId)
    if (!userProfile?.id || !selectedAccount || displayedCardholderName.trim().length < 2) {
      toast.error('Choose a valid funding account and enter the cardholder name.')
      return
    }
    if (pin && !/^\d{4}$/.test(pin)) {
      toast.error('PIN must be exactly 4 digits.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'issue', userId: userProfile.id, accountId: selectedAccountId, type, brand: 'visa', design: 'classic', cardholderName: displayedCardholderName.trim(), pin: pin || undefined }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Unable to issue card')
      if (!data.card?.lastFour || !data.cardDetails?.cardNumber || !data.cardDetails?.cvv || !data.cardDetails?.expiry) {
        throw new Error('The card service returned an incomplete response. Please try again.')
      }
      setIssuedCard({ lastFour: data.card.lastFour, number: data.cardDetails.cardNumber, cvv: data.cardDetails.cvv, expiry: data.cardDetails.expiry })
      toast.success('Your card has been issued')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to issue card')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoaded) return <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Loading card options...</main>

  if (issuedCard) return <main className="min-h-screen bg-background px-4 py-8 pb-24 md:px-8"><div className="mx-auto max-w-2xl"><Link href="/cards" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Card Management</Link><section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-10"><div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Check className="h-6 w-6" /></div><h1 className="mt-6 text-3xl font-bold text-foreground">Your card is ready</h1><p className="mt-2 text-muted-foreground">Save these details now. For your security, the full number will not be shown again.</p><div className="mt-8 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-800 to-primary p-6 text-white shadow-xl"><div className="flex items-start justify-between"><CreditCard className="h-8 w-8 text-white/80" /><span className="text-sm font-semibold uppercase tracking-widest">Visa</span></div><p className="mt-12 font-mono text-xl tracking-[0.18em]">{issuedCard.number}</p><div className="mt-8 flex justify-between text-sm"><span>{cardholderName.toUpperCase()}</span><span>EXP {issuedCard.expiry}</span><span>CVV {issuedCard.cvv}</span></div></div><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/cards" className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90">View Card Management</Link><Link href="/cards" className="inline-flex flex-1 items-center justify-center rounded-xl border border-border px-4 py-3 font-semibold text-foreground hover:bg-muted">Done</Link></div></section></div></main>

  return <main className="min-h-screen bg-background px-4 py-8 pb-24 md:px-8"><div className="mx-auto max-w-5xl"><Link href="/cards" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Card Management</Link><div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.8fr]"><div><p className="text-sm font-semibold uppercase tracking-widest text-primary">Card Management</p><h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">Issue a new card</h1><p className="mt-3 max-w-xl text-muted-foreground">Create a card with the controls and security you need. You can lock it or request a replacement anytime.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{cardOptions.map((option) => <button key={option.value} type="button" onClick={() => setType(option.value)} className={`rounded-2xl border p-5 text-left transition ${type === option.value ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border bg-card hover:bg-muted/50'}`}><div className="flex items-center justify-between"><span className="font-semibold text-foreground">{option.label}</span>{type === option.value && <Check className="h-5 w-5 text-primary" />}</div><p className="mt-2 text-sm text-muted-foreground">{option.description}</p></button>)}</div></div><form onSubmit={submit} className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8"><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><Sparkles className="h-5 w-5" /></div><div><h2 className="font-semibold text-foreground">Card details</h2><p className="text-sm text-muted-foreground">Securely linked to your account</p></div></div><div className="mt-8 flex flex-col gap-5"><label className="flex flex-col gap-2 text-sm font-medium text-foreground">Fund from<select value={selectedAccountId} onChange={(event) => setAccountId(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-3 font-normal outline-none focus:ring-2 focus:ring-primary">{accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.accountNumber}</option>)}</select></label><label className="flex flex-col gap-2 text-sm font-medium text-foreground">Cardholder name<input value={cardholderName} onChange={(event) => setCardholderName(event.target.value)} autoComplete="cc-name" className="rounded-xl border border-border bg-background px-3 py-3 font-normal outline-none focus:ring-2 focus:ring-primary" /></label><label className="flex flex-col gap-2 text-sm font-medium text-foreground">Optional 4-digit PIN<input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" type="password" autoComplete="new-password" placeholder="Set later" className="rounded-xl border border-border bg-background px-3 py-3 font-normal outline-none focus:ring-2 focus:ring-primary" /></label><div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Your card number is generated securely and shown only once after issue.</span></div><button type="submit" disabled={isSubmitting} className="rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? 'Issuing card...' : `Issue ${type} card`}</button></div></form></div></div></main>
}

export default function IssueCardPage() { return <ProtectedRoute><IssueCardContent /></ProtectedRoute> }
