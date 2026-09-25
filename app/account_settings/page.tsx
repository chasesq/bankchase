'use client'

import { useState } from 'react'
import { Bell, Check, Eye, EyeOff, Globe, KeyRound, LockKeyhole, LogOut, Mail, Monitor, ShieldCheck, Smartphone, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Navigation } from '@/components/Navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useBanking } from '@/lib/banking-context'

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}>
      <span className={`absolute top-1 size-4 rounded-full bg-background shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function AccountSettingsContent() {
  const { appSettings, updateAppSettings, saveToStorage, userProfile, recentActivity } = useBanking()
  const [saving, setSaving] = useState(false)
  const [ipSecurity, setIpSecurity] = useState(true)
  const [location, setLocation] = useState(appSettings.region || 'United States')
  const [callInPin, setCallInPin] = useState(appSettings.pin === '****' ? '7306486' : appSettings.pin)
  const [showCallInPin, setShowCallInPin] = useState(false)

  const update = (settings: Record<string, unknown>) => {
    updateAppSettings(settings)
    saveToStorage()
    setSaving(true)
    window.setTimeout(() => { setSaving(false); toast.success('Preference updated.') }, 250)
  }

  const signOutOtherSessions = () => {
    update({ trustedDevices: appSettings.trustedDevices?.slice(0, 1) || [] })
    toast.success('Other sessions were signed out.')
  }

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground md:pb-8">
      <Navigation />
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Account settings</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Security and preferences</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Manage how you sign in, where you receive account messages, and how your account appears across Chase.</p>
        </div>

        <nav aria-label="Account settings sections" className="mb-8 flex flex-wrap gap-2 rounded-xl border border-border bg-card p-2">
          {[['session-security', 'Session security'], ['enhanced-security', 'Enhanced security'], ['system-preferences', 'System preferences'], ['email-preferences', 'Email preferences']].map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">{label}</a>)}
        </nav>

        <section id="call-in-pin" className="mb-6 scroll-mt-6 rounded-xl border border-border bg-card p-6 md:p-8">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10"><LockKeyhole className="text-primary" aria-hidden="true" /></div>
            <div><h2 className="text-xl font-semibold">Call-in PIN</h2><p className="mt-1 text-sm text-muted-foreground">Use this PIN when verifying your identity with phone support. Keep it private.</p></div>
          </div>
          <form className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-end" onSubmit={(event) => { event.preventDefault(); if (!/^\\d{7}$/.test(callInPin)) { toast.error('Enter a 7-digit call-in PIN.'); return } update({ pin: callInPin, lastPinChange: new Date().toISOString().slice(0, 10) }); toast.success('Call-in PIN saved securely.') }}>
            <label htmlFor="call-in-pin-input" className="grid flex-1 gap-2 text-sm font-medium">7-digit PIN
              <div className="relative">
                <input id="call-in-pin-input" name="callInPin" type={showCallInPin ? 'text' : 'password'} inputMode="numeric" autoComplete="off" maxLength={7} pattern="[0-9]{7}" value={callInPin} onChange={(event) => setCallInPin(event.target.value.replace(/\\D/g, '').slice(0, 7))} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-11 font-normal tracking-[0.25em]" aria-describedby="call-in-pin-help" />
                <button type="button" className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground" onClick={() => setShowCallInPin(!showCallInPin)} aria-label={showCallInPin ? 'Hide call-in PIN' : 'Show call-in PIN'}>{showCallInPin ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button>
              </div>
              <span id="call-in-pin-help" className="font-normal text-muted-foreground">Only numbers are accepted.</span>
            </label>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Save PIN</button>
          </form>
        </section>

        <section id="session-security" className="scroll-mt-6 rounded-xl border border-border bg-card p-6 md:p-8">
          <div className="flex items-start justify-between gap-4"><div className="flex gap-3"><div className="flex size-10 items-center justify-center rounded-full bg-primary/10"><ShieldCheck className="text-primary" aria-hidden="true" /></div><div><h2 className="text-xl font-semibold">Session IP Security</h2><p className="mt-1 text-sm text-muted-foreground">Protect active sessions by checking the network address when you sign in.</p></div></div><Toggle checked={ipSecurity} onChange={() => { setIpSecurity(!ipSecurity); toast.success(`Session IP security ${!ipSecurity ? 'enabled' : 'disabled'}.`) }} label="Session IP security" /></div>
          <div className="mt-6 grid gap-3 border-t border-border pt-5"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><Monitor className="text-muted-foreground" aria-hidden="true" /><div><p className="font-medium">Current session</p><p className="text-sm text-muted-foreground">This browser · New York, NY</p></div></div><span className="flex items-center gap-1 text-xs font-semibold text-primary"><Check className="size-4" />Active</span></div><button type="button" onClick={signOutOtherSessions} className="mt-2 inline-flex w-fit items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"><LogOut className="size-4" />Sign out other sessions</button></div>
        </section>

        <section id="enhanced-security" className="mt-6 scroll-mt-6 rounded-xl border border-border bg-card p-6 md:p-8">
          <div className="flex items-start justify-between gap-4"><div className="flex gap-3"><div className="flex size-10 items-center justify-center rounded-full bg-primary/10"><KeyRound className="text-primary" aria-hidden="true" /></div><div><h2 className="text-xl font-semibold">Enhanced Security (2FA)</h2><p className="mt-1 text-sm text-muted-foreground">Require a verification code on unfamiliar sign-ins.</p></div></div><Toggle checked={Boolean(appSettings.twoFactorAuth)} onChange={() => update({ twoFactorAuth: !appSettings.twoFactorAuth, twoFactorEnabled: !appSettings.twoFactorAuth })} label="Two-factor authentication" /></div>
          <div className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-2"><div className="rounded-lg bg-muted/50 p-4"><Smartphone className="mb-2 text-primary" aria-hidden="true" /><p className="font-medium">Text message</p><p className="mt-1 text-sm text-muted-foreground">{appSettings.twoFactorPhone || 'No phone number added'}</p></div><div className="rounded-lg bg-muted/50 p-4"><Mail className="mb-2 text-primary" aria-hidden="true" /><p className="font-medium">Recovery email</p><p className="mt-1 text-sm text-muted-foreground">{appSettings.twoFactorEmail || userProfile.email}</p></div></div>
        </section>

        <section id="system-preferences" className="mt-6 scroll-mt-6 rounded-xl border border-border bg-card p-6 md:p-8">
          <div className="flex gap-3"><div className="flex size-10 items-center justify-center rounded-full bg-primary/10"><Globe className="text-primary" aria-hidden="true" /></div><div><h2 className="text-xl font-semibold">System Preferences</h2><p className="mt-1 text-sm text-muted-foreground">Choose your interface theme, language, region, and currency.</p></div></div>
          <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Interface theme<select value={appSettings.darkMode ? 'dark' : 'light'} onChange={(e) => update({ darkMode: e.target.value === 'dark' })} className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal"><option value="light">Light</option><option value="dark">Dark</option></select></label><label className="grid gap-2 text-sm font-medium">Language<select value={appSettings.language} onChange={(e) => update({ language: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal"><option>English</option><option>Spanish</option><option>French</option></select></label><label className="grid gap-2 text-sm font-medium">Region<select value={location} onChange={(e) => { setLocation(e.target.value); update({ region: e.target.value }) }} className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal"><option>New York</option><option>California</option><option>Texas</option><option>Florida</option></select></label><label className="grid gap-2 text-sm font-medium">Currency<select value={appSettings.currency} onChange={(e) => update({ currency: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal"><option>USD</option><option>EUR</option><option>GBP</option><option>CAD</option></select></label></div>
        </section>

        <section id="email-preferences" className="mt-6 scroll-mt-6 rounded-xl border border-border bg-card p-6 md:p-8">
          <div className="flex gap-3"><div className="flex size-10 items-center justify-center rounded-full bg-primary/10"><Bell className="text-primary" aria-hidden="true" /></div><div><h2 className="text-xl font-semibold">Email Preferences</h2><p className="mt-1 text-sm text-muted-foreground">Control the messages sent to your inbox.</p></div></div>
          <div className="mt-6 divide-y divide-border border-t border-border">{[['emailNotifications', 'Account and security updates', 'Important activity, sign-in, and service messages.'], ['transactionAlerts', 'Transaction alerts', 'Updates when money moves in or out of your account.'], ['marketingEmails', 'Product updates', 'Occasional news, offers, and product information.']].map(([key, title, description]) => <div key={key} className="flex items-center justify-between gap-4 py-5"><div><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p></div><Toggle checked={Boolean(appSettings[key as keyof typeof appSettings])} onChange={() => update({ [key]: !appSettings[key as keyof typeof appSettings] })} label={title} /></div>)}</div>
        </section>

        <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground"><span className="flex items-center gap-2"><UserRound className="size-4" />Changes apply across your account.</span>{saving && <span className="text-primary">Saving…</span>}</div>
      </div>
    </main>
  )
}

export default function AccountSettingsPage() { return <ProtectedRoute><AccountSettingsContent /></ProtectedRoute> }
