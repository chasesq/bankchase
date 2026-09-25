'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Globe, Lock, Moon, Save } from 'lucide-react'
import { toast } from 'sonner'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useBanking } from '@/lib/banking-context'
import { useTheme } from 'next-themes'

function Toggle({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg p-4 transition hover:bg-muted/50">
      <div className="min-w-0"><p className="font-medium text-foreground">{title}</p><p className="text-sm text-muted-foreground">{description}</p></div>
      <button type="button" onClick={onChange} aria-pressed={checked} aria-label={`${title}: ${checked ? 'On' : 'Off'}`} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted-foreground/40'}`}><span className={`size-4 rounded-full bg-background transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} /></button>
    </div>
  )
}

function SettingsContent() {
  const { isLoaded, appSettings, updateAppSettings, saveToStorage } = useBanking()
  const { setTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(appSettings)

  useEffect(() => { if (isLoaded) setDraft(appSettings) }, [appSettings, isLoaded])

  const update = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const toggle = (key: keyof typeof draft) => update(key, !draft[key] as never)
  const save = () => {
    setSaving(true)
    updateAppSettings(draft)
    saveToStorage()
    setTheme(draft.darkMode ? 'dark' : 'light')
    window.setTimeout(() => { setSaving(false); toast.success('Settings saved successfully.') }, 250)
  }

  if (!isLoaded) return <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Loading settings...</main>

  return <main className="min-h-screen bg-background pb-24 md:pb-8"><div className="mx-auto max-w-4xl p-4 md:p-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-primary">Account preferences</p><h1 className="mt-2 text-4xl font-bold text-foreground">Settings</h1><p className="mt-2 text-muted-foreground">Manage your preferences and notification settings.</p></div><button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"><Save className="size-4" aria-hidden="true" />{saving ? 'Saving...' : 'Save changes'}</button></div>
    <div className="mt-8 flex flex-col gap-6">
      <section className="rounded-xl border border-border bg-card p-6"><h2 className="flex items-center gap-2 text-xl font-semibold text-foreground"><Bell className="size-5 text-primary" />Notifications</h2><div className="mt-4 divide-y divide-border"><Toggle title="Email Notifications" description="Receive updates via email" checked={draft.emailNotifications} onChange={() => toggle('emailNotifications')} /><Toggle title="SMS Notifications" description="Receive text messages for important alerts" checked={draft.smsAlerts} onChange={() => toggle('smsAlerts')} /><Toggle title="Push Notifications" description="Receive browser notifications" checked={draft.pushNotifications} onChange={() => toggle('pushNotifications')} /><Toggle title="Transaction Alerts" description="Get notified when money moves in or out of your accounts" checked={draft.transactionAlerts} onChange={() => toggle('transactionAlerts')} /><Toggle title="Low Balance Alert" description="Be notified when your balance falls below a threshold" checked={draft.balanceAlerts} onChange={() => toggle('balanceAlerts')} />{draft.balanceAlerts && <label className="flex items-center justify-between gap-4 bg-muted/20 p-4 text-sm text-foreground">Alert below <span className="flex items-center gap-2"><span>$</span><input type="number" min="0" value={draft.balanceThreshold} onChange={(e) => update('balanceThreshold', Math.max(0, Number(e.target.value)))} className="w-28 rounded-md border border-border bg-background px-3 py-2" /></span></label>}<Toggle title="Marketing Emails" description="Promotional offers and product updates" checked={draft.marketingEmails} onChange={() => toggle('marketingEmails')} /><Toggle title="Paperless Statements" description="Receive statements digitally instead of by mail" checked={draft.paperlessStatements} onChange={() => toggle('paperlessStatements')} /></div></section>
      <section className="rounded-xl border border-border bg-card p-6"><h2 className="flex items-center gap-2 text-xl font-semibold text-foreground"><Lock className="size-5 text-primary" />Security</h2><div className="mt-4 divide-y divide-border"><Toggle title="Auto-Logout" description="Automatically log out after inactivity" checked={draft.autoLockEnabled ?? true} onChange={() => update('autoLockEnabled', !(draft.autoLockEnabled ?? true))} /><Toggle title="Two-Factor Authentication" description="Add an extra layer of security to your account" checked={draft.twoFactorAuth} onChange={() => toggle('twoFactorAuth')} /><Toggle title="Biometric Login" description="Use fingerprint or face recognition" checked={draft.biometricLogin} onChange={() => toggle('biometricLogin')} /><Toggle title="Hide Balance" description="Don't display balance on the home screen" checked={!draft.quickBalanceEnabled} onChange={() => toggle('quickBalanceEnabled')} /></div></section>
      <section className="rounded-xl border border-border bg-card p-6"><h2 className="flex items-center gap-2 text-xl font-semibold text-foreground"><Moon className="size-5 text-primary" />Display</h2><div className="mt-4"><Toggle title="Dark Mode" description="Use dark theme throughout the app" checked={draft.darkMode} onChange={() => { toggle('darkMode'); setTheme(draft.darkMode ? 'light' : 'dark') }} /><label className="mt-4 block text-sm font-medium text-foreground">Theme<select value={draft.darkMode ? 'dark' : 'light'} onChange={(e) => { const dark = e.target.value === 'dark'; update('darkMode', dark); setTheme(e.target.value) }} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2"><option value="light">Light</option><option value="dark">Dark</option></select></label></div></section>
      <section className="rounded-xl border border-border bg-card p-6"><h2 className="flex items-center gap-2 text-xl font-semibold text-foreground"><Globe className="size-5 text-primary" />Preferences</h2><div className="mt-4 grid gap-4 md:grid-cols-3"><label className="text-sm font-medium text-foreground">Language<select value={draft.language} onChange={(e) => update('language', e.target.value)} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2"><option>English</option><option>Spanish</option><option>French</option><option>German</option><option>Chinese</option><option>Japanese</option></select></label><label className="text-sm font-medium text-foreground">Currency<select value={draft.currency} onChange={(e) => update('currency', e.target.value)} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2"><option value="USD">USD - US Dollar</option><option value="EUR">EUR - Euro</option><option value="GBP">GBP - British Pound</option><option value="CAD">CAD - Canadian Dollar</option><option value="JPY">JPY - Japanese Yen</option></select></label><label className="text-sm font-medium text-foreground">Region<select value={draft.region} onChange={(e) => update('region', e.target.value)} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2"><option>United States</option><option>Canada</option><option>United Kingdom</option><option>Australia</option></select></label></div></section>
    </div><div className="mt-6 flex justify-end gap-3"><Link href="/accounts" className="rounded-lg border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">Cancel</Link><button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"><Save className="size-4" aria-hidden="true" />{saving ? 'Saving...' : 'Save all changes'}</button></div>
  </div></main>
}

export default function SettingsPage() { return <ProtectedRoute><SettingsContent /></ProtectedRoute> }
