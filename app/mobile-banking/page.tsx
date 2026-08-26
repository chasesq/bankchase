'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Bell,
  ChevronRight,
  CreditCard,
  Download,
  Fingerprint,
  LockKeyhole,
  Menu,
  ReceiptText,
  Send,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'security', label: 'Security' },
  { id: 'payments', label: 'Payments' },
  { id: 'alerts', label: 'Alerts' },
]

function MobileBankingContent() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link href="/home" className="flex items-center gap-3" aria-label="BankChase home">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck aria-hidden="true" />
            </span>
            <span className="font-semibold tracking-tight">BankChase</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="Mobile banking sections">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="text-muted-foreground transition-colors hover:text-foreground">
                {section.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/accounts">View accounts</Link>
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation">
              {menuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-border px-5 py-3 md:hidden" aria-label="Mobile banking sections">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                {section.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <section id="overview" className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:pt-24">
        <div className="flex flex-col gap-7">
          <div className="flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary">
            <Smartphone className="size-4" aria-hidden="true" />
            Banking that moves with you
          </div>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">Your money, secure and ready wherever life takes you.</h1>
          <p className="max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">Use BankChase on the web or in your mobile browser to check balances, send money, manage cards, and receive timely account alerts.</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/sign-in">Sign in securely</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/sign-up">Sign up</Link></Button>
            <Button asChild size="lg"><Link href="/send-money"><Send data-icon="inline-start" />Send money</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/login-alerts"><Bell data-icon="inline-start" />Manage alerts</Link></Button>
          </div>
          <p className="text-sm text-muted-foreground">Looking for the Chase Mobile app? Visit <a className="font-medium text-primary underline-offset-4 hover:underline" href="https://www.chase.com/mobile" target="_blank" rel="noreferrer">chase.com/mobile</a> for the official app-store links.</p>
        </div>
        <Card className="overflow-hidden border-primary/15 bg-card shadow-xl shadow-primary/5">
          <CardHeader className="border-b border-border bg-muted/40">
            <CardTitle className="flex items-center justify-between text-base"><span>BankChase mobile snapshot</span><span className="size-2 rounded-full bg-primary" aria-label="Secure connection" /></CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between rounded-xl bg-background p-4">
              <div><p className="text-sm text-muted-foreground">Total available</p><p className="mt-1 text-3xl font-semibold tracking-tight">$12,480.36</p></div>
              <CreditCard className="size-8 text-primary" aria-hidden="true" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/accounts" className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted"><span className="text-sm font-medium">Accounts</span><ChevronRight className="size-4" /></Link>
              <Link href="/statements" className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted"><span className="text-sm font-medium">Statements</span><ChevronRight className="size-4" /></Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="security" className="border-y border-border bg-muted/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-16 lg:px-8">
          <div className="max-w-2xl"><p className="text-sm font-medium text-primary">Security built in</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Protection at every sign-in.</h2><p className="mt-3 leading-7 text-muted-foreground">Use your account session, device biometrics, and real-time monitoring to keep control of your financial information.</p></div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardContent className="flex flex-col gap-4 p-6"><Fingerprint className="size-7 text-primary" /><h3 className="font-semibold">Biometric sign-in</h3><p className="text-sm leading-6 text-muted-foreground">Your device can confirm it is you before sensitive account actions.</p></CardContent></Card>
            <Card><CardContent className="flex flex-col gap-4 p-6"><LockKeyhole className="size-7 text-primary" /><h3 className="font-semibold">Protected sessions</h3><p className="text-sm leading-6 text-muted-foreground">Account pages require your authenticated BankChase session.</p></CardContent></Card>
            <Card><CardContent className="flex flex-col gap-4 p-6"><ShieldCheck className="size-7 text-primary" /><h3 className="font-semibold">Activity monitoring</h3><p className="text-sm leading-6 text-muted-foreground">Review account activity and security alerts as they happen.</p></CardContent></Card>
          </div>
        </div>
      </section>

      <section id="payments" className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-16 lg:px-8">
        <div className="max-w-2xl"><p className="text-sm font-medium text-primary">Payments and transfers</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Move money with clear status at every step.</h2><p className="mt-3 leading-7 text-muted-foreground">Send to a U.S. mobile number or email address when your configured transfer provider supports it. BankChase shows exactly what was submitted and what delivery channels are available.</p></div>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/send-money" className="group rounded-2xl border border-border p-6 transition-colors hover:border-primary/40 hover:bg-muted"><Send className="size-7 text-primary" /><h3 className="mt-5 font-semibold">Send money</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Start an authenticated transfer with recipient contact details.</p><ChevronRight className="mt-5 size-4 transition-transform group-hover:translate-x-1" /></Link>
          <Link href="/transfers" className="group rounded-2xl border border-border p-6 transition-colors hover:border-primary/40 hover:bg-muted"><ReceiptText className="size-7 text-primary" /><h3 className="mt-5 font-semibold">Track transfers</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Review processing, completed, and failed transfer activity.</p><ChevronRight className="mt-5 size-4 transition-transform group-hover:translate-x-1" /></Link>
          <Link href="/statements" className="group rounded-2xl border border-border p-6 transition-colors hover:border-primary/40 hover:bg-muted"><Download className="size-7 text-primary" /><h3 className="mt-5 font-semibold">Save receipts</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Download, print, or share digital transaction records.</p><ChevronRight className="mt-5 size-4 transition-transform group-hover:translate-x-1" /></Link>
        </div>
      </section>

      <section id="alerts" className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-8"><div><p className="text-sm font-medium text-primary-foreground/75">Stay informed</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Get alerts for the activity that matters.</h2><p className="mt-3 max-w-2xl leading-7 text-primary-foreground/75">Turn on deposit, transaction, and security notifications for your account. In-app alerts are available now; email and SMS delivery depends on your configured provider.</p></div><div className="flex flex-wrap gap-3"><Button asChild variant="secondary"><Link href="/login-alerts">Configure alerts</Link></Button><Button asChild variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link href="/notifications">View notifications</Link></Button></div></div>
      </section>
    </main>
  )
}

export default function MobileBankingPage() {
  return <ProtectedRoute><MobileBankingContent /></ProtectedRoute>
}
