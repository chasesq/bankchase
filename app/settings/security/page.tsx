'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { useBanking } from '@/lib/banking-context'
import { ShieldCheck, Smartphone, KeyRound, Monitor, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

function SecurityContent() {
  const { appSettings, updateAppSettings, saveToStorage } = useBanking()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const security = appSettings
  const toggle = (key: 'biometricLogin' | 'twoFactorEnabled') => {
    const settingKey = key === 'twoFactorEnabled' ? 'twoFactorAuth' : key
    updateAppSettings({ [settingKey]: !security[settingKey] })
    saveToStorage()
    toast.success('Security preference updated.')
  }
  const updatePassword = () => {
    if (newPassword.length < 8) return toast.error('New password must be at least 8 characters.')
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match.')
    if (!currentPassword) return toast.error('Enter your current password.')
    setSaving(true)
    window.setTimeout(() => { setSaving(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); toast.success('Password updated successfully.') }, 500)
  }
  return <main className="min-h-screen bg-background pb-24 md:pb-8"><Navigation /><div className="max-w-4xl mx-auto p-4 md:p-8">
    <p className="text-sm font-semibold uppercase tracking-widest text-primary">Chase security</p><h1 className="text-4xl font-bold text-foreground mt-2">Security</h1><p className="text-muted-foreground mt-2">Protect your account with strong sign-in controls.</p>
    <section className="mt-8 bg-card border border-border rounded-xl p-6 md:p-8"><div className="flex items-center gap-3"><div className="size-10 rounded-full bg-primary/10 flex items-center justify-center"><ShieldCheck className="text-primary" aria-hidden="true" /></div><div><h2 className="text-xl font-semibold text-foreground">Sign-in security</h2><p className="text-sm text-muted-foreground">Changes apply across your Chase account.</p></div></div><div className="mt-7 divide-y divide-border">
      <button onClick={() => toggle('twoFactorEnabled')} className="w-full flex items-center justify-between gap-4 py-5 text-left"><span className="flex items-center gap-3"><KeyRound className="text-primary" aria-hidden="true" /><span><span className="block font-semibold text-foreground">Two-step verification</span><span className="block text-sm text-muted-foreground mt-1">Require a verification code on new sign-ins.</span></span></span><span className={`rounded-full px-3 py-1 text-xs font-semibold ${security.twoFactorEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{security.twoFactorEnabled ? 'On' : 'Off'}</span></button>
      <button onClick={() => toggle('biometricLogin')} className="w-full flex items-center justify-between gap-4 py-5 text-left"><span className="flex items-center gap-3"><Smartphone className="text-primary" aria-hidden="true" /><span><span className="block font-semibold text-foreground">Biometric sign-in</span><span className="block text-sm text-muted-foreground mt-1">Use Face ID or fingerprint on supported devices.</span></span></span><span className={`rounded-full px-3 py-1 text-xs font-semibold ${security.biometricLogin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{security.biometricLogin ? 'On' : 'Off'}</span></button>
    </div></section>
    <section className="mt-6 bg-card border border-border rounded-xl p-6 md:p-8"><h2 className="text-xl font-semibold text-foreground">Change password</h2><p className="text-sm text-muted-foreground mt-1">Use at least 8 characters with a mix of letters, numbers, and symbols.</p><div className="mt-6 grid gap-4"><label className="grid gap-2 text-sm font-medium text-foreground">Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal" /></label><label className="grid gap-2 text-sm font-medium text-foreground">New password<input type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal" /></label><label className="grid gap-2 text-sm font-medium text-foreground">Confirm new password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal" /></label><button onClick={updatePassword} disabled={saving} className="w-fit rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving ? 'Updating...' : 'Update password'}</button></div></section>
    <section className="mt-6 bg-card border border-border rounded-xl p-6 md:p-8"><h2 className="text-xl font-semibold text-foreground">Recent sign-ins</h2><div className="mt-5 grid gap-4">{(appSettings.loginHistory || []).slice(0, 3).map(entry => <div key={entry.id} className="flex items-center justify-between gap-4 border-t border-border pt-4"><div className="flex items-center gap-3"><Monitor className="text-muted-foreground" aria-hidden="true" /><div><p className="font-medium text-foreground">{entry.device}</p><p className="text-sm text-muted-foreground">{entry.location} · {new Date(entry.date).toLocaleDateString()}</p></div></div><span className="flex items-center gap-1 text-xs font-semibold text-primary"><CheckCircle2 className="size-4" aria-hidden="true" />{entry.status}</span></div>)}</div></section>
  </div></main>
}
export default function SecurityPage() { return <ProtectedRoute><SecurityContent /></ProtectedRoute> }
