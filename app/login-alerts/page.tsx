'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Bell, ChevronDown, ChevronRight, Mail, MessageSquare, Smartphone } from 'lucide-react'

const alertTypes = [
  {
    icon: Bell,
    title: 'Account alerts',
    text: 'Get notified about important changes to your account, including profile updates and sign-in activity.',
  },
  {
    icon: Smartphone,
    title: 'Transaction alerts',
    text: 'Stay on top of your spending with alerts for purchases, deposits, withdrawals and more.',
  },
  {
    icon: MessageSquare,
    title: 'Security alerts',
    text: 'Receive timely notifications when we detect activity that may need your attention.',
  },
]

const faqs = [
  ['How do I sign up for alerts?', 'Sign in to your account, open Profile & settings, then choose Alerts. Select the account and alert types you want to receive.'],
  ['How will I receive alerts?', 'You can choose email, text message or push notifications. Message and data rates may apply for text alerts.'],
  ['Can I change my alert preferences?', 'Yes. You can update your choices at any time from the Alerts section in your account settings.'],
]

export default function LoginAlertsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/accounts" className="text-2xl font-semibold tracking-tight text-primary" aria-label="Chase home">Chase</Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex" aria-label="Help navigation">
            <Link className="hover:text-primary" href="/help">Help center</Link>
            <Link className="hover:text-primary" href="/security">Security</Link>
            <Link className="hover:text-primary" href="/login">Sign in</Link>
          </nav>
          <Link href="/login" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 md:hidden">Sign in</Link>
        </div>
      </header>

      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-5 py-14 text-center md:py-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Stay informed</p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">Account alerts</h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">Enroll and receive alerts about your account, transactions and security so you can help keep your money safe.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {alertTypes.map(({ icon: Icon, title, text }) => (
            <article key={title} className="border border-border bg-card p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary"><Icon size={24} strokeWidth={1.8} /></div>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">{text}</p>
              <Link href="/settings" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Manage alerts <ChevronRight size={16} /></Link>
            </article>
          ))}
        </div>

        <div className="mt-16 grid gap-12 border-t border-border pt-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Choose what matters to you.</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Set up alerts for the activity you care about, then select where you want them delivered.</p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm font-medium">
              <span className="inline-flex items-center gap-2 border border-border px-3 py-2"><Mail size={16} className="text-primary" /> Email</span>
              <span className="inline-flex items-center gap-2 border border-border px-3 py-2"><MessageSquare size={16} className="text-primary" /> Text</span>
              <span className="inline-flex items-center gap-2 border border-border px-3 py-2"><Smartphone size={16} className="text-primary" /> Push</span>
            </div>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {faqs.map(([question, answer], index) => {
              const isOpen = openFaq === index
              return <div key={question}>
                <button type="button" onClick={() => setOpenFaq(isOpen ? null : index)} className="flex w-full items-center justify-between gap-4 py-5 text-left font-semibold" aria-expanded={isOpen}>
                  <span>{question}</span><ChevronDown size={19} className={`shrink-0 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && <p className="-mt-1 pb-5 pr-8 leading-7 text-muted-foreground">{answer}</p>}
              </div>
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between lg:px-8">
          <span>Chase alerts help you keep a closer eye on your accounts.</span>
          <Link href="/settings" className="font-semibold text-primary hover:underline">Go to alert settings</Link>
        </div>
      </footer>
    </main>
  )
}
