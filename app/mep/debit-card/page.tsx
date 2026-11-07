'use client'

import Link from 'next/link'
import { ArrowLeft, Check, CreditCard, Lock, ShieldCheck, Wallet } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useBanking } from '@/lib/banking-context'

function DebitCardContent() {
  const { userProfile } = useBanking()
  const firstName = userProfile?.firstName || 'there'

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-[#1f2937]">
      <header className="border-b border-[#d9dee7] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Link href="/" aria-label="Back to home" className="rounded-full p-2 text-[#52606d] transition hover:bg-[#eef2f7]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-sm font-semibold text-[#253b80]">PayPal</p>
            <h1 className="text-xl font-semibold">PayPal Debit Card</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <div className="mb-8 max-w-xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#0070ba]">Spend your way</p>
            <h2 className="text-4xl font-semibold tracking-tight text-[#111827]">A debit card that works with your PayPal balance.</h2>
            <p className="mt-4 text-lg leading-8 text-[#5b6472]">Hi {firstName}, use your PayPal Debit Card anywhere Mastercard is accepted and get instant access to the money in your PayPal balance.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Wallet, title: 'Use your balance', text: 'Spend directly from your PayPal balance.' },
              { icon: ShieldCheck, title: 'Built-in security', text: 'Your card includes PayPal purchase protection.' },
              { icon: Lock, title: 'Control your card', text: 'Lock or unlock your card whenever you need.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-[#d9dee7] bg-white p-5 shadow-sm">
                <Icon className="h-5 w-5 text-[#0070ba]" />
                <h3 className="mt-4 font-semibold text-[#1f2937]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#667085]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-3xl border border-[#d9dee7] bg-white p-6 shadow-[0_12px_36px_rgba(31,41,55,0.08)] sm:p-8">
          <div className="rounded-2xl bg-gradient-to-br from-[#182a63] via-[#253b80] to-[#0070ba] p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <CreditCard className="h-8 w-8" />
              <span className="text-sm font-medium">PayPal</span>
            </div>
            <div className="mt-16 text-lg tracking-[0.28em]">•••• 4821</div>
            <div className="mt-5 flex items-end justify-between text-xs text-white/80">
              <span>PAYPAL DEBIT</span>
              <span>MASTERCARD</span>
            </div>
          </div>

          <div className="mt-7">
            <h2 className="text-xl font-semibold text-[#111827]">Get your PayPal Debit Card</h2>
            <p className="mt-2 text-sm leading-6 text-[#667085]">There&apos;s no monthly fee. We&apos;ll check your account eligibility before you apply.</p>
            <ul className="mt-5 space-y-3 text-sm text-[#475467]">
              {['No monthly or annual fee', 'Use it online or in stores', 'Manage it from your PayPal account'].map((item) => (
                <li key={item} className="flex items-center gap-3"><Check className="h-4 w-4 shrink-0 text-[#0070ba]" />{item}</li>
              ))}
            </ul>
            <Link href="/cards/issue" className="mt-7 flex w-full items-center justify-center rounded-full bg-[#0070ba] px-5 py-3 font-semibold text-white transition hover:bg-[#005ea6] focus:outline-none focus:ring-2 focus:ring-[#0070ba] focus:ring-offset-2">Apply for a card</Link>
            <p className="mt-4 text-center text-xs leading-5 text-[#667085]">By continuing, you agree to the PayPal Debit Card terms and disclosures.</p>
          </div>
        </aside>
      </div>
    </main>
  )
}

export default function DebitCardPage() {
  return (
    <ProtectedRoute>
      <DebitCardContent />
    </ProtectedRoute>
  )
}
