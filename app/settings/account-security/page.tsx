'use client'

import { useState } from 'react'
import { ShieldCheck, KeyRound, Smartphone, Monitor, CheckCircle2, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { useBanking } from '@/lib/banking-context'

function AccountSecurityContent() {
  const { appSettings, updateAppSettings, saveToStorage, recentActivity } = useBanking()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const security = appSettings
  const toggle = (key: 'biometricLogin' | 'twoFactorAuth') => { updateAppSettings({ [key]: !security[key] }); saveToStorage(); toast.success('Security preference updated.') }
  const fields: { label: string; value: string; setValue: (value: string) => void; autocomplete: string }[] = [
    { label: 'Current password', value: currentPassword, setValue: setCurrentPassword, autocomplete: 'current-password' },
    { label: 'New password', value: newPassword, setValue: setNewPassword, autocomplete: 'new-password' },
    { label: 'Confirm new password', value: confirmPassword, setValue: setConfirmPassword, autocomplete: 'new-password' },
  ]
  const updatePassword = () => {
    if (!currentPassword) return toast.error('Enter your current password.')
    if (newPassword.length < 8) return toast.error('New password must be at least 8 characters.')
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match.')
    setSaving(true); window.setTimeout(() => { setSaving(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); toast.success('Password updated successfully.') }, 500)
  }
  const history = (appSettings.loginHistory || []).slice(0, 3)
  return <main className="min-h-screen bg-background pb-24 md:pb-8"><Navigation /><div className="mx-auto max-w-4xl p-4 md:p-8"><p className="text-sm font-semibold uppercase tracking-widest text-primary">Chase protection</p><h1 className="mt-2 text-4xl font-bold text-foreground">Account security</h1><p className="mt-2 text-muted-foreground">Review sign-in controls and keep your Chase account protected.</p>
    <section className="mt-8 rounded-xl border border-border bg-card p-6 md:p-8"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-full bg-primary/10"><ShieldCheck className="text-primary" aria-hidden="true" /></div><div><h2 className="text-xl font-semibold text-foreground">Sign-in controls</h2><p className="text-sm text-muted-foreground">These preferences apply across your account.</p></div></div><div className="mt-6 divide-y divide-border"><SecurityToggle icon={KeyRound} title="Two-step verification" description="Require a verification code on new sign-ins." checked={Boolean(security.twoFactorAuth)} onChange={() => toggle('twoFactorAuth')} /><SecurityToggle icon={Smartphone} title="Biometric sign-in" description="Use Face ID or fingerprint on supported devices." checked={Boolean(security.biometricLogin)} onChange={() => toggle('biometricLogin')} /></div></section>
    <section className="mt-6 rounded-xl border border-border bg-card p-6 md:p-8"><h2 className="text-xl font-semibold text-foreground">Change password</h2><p className="mt-1 text-sm text-muted-foreground">Use at least 8 characters with a mix of letters, numbers, and symbols.</p><div className="mt-6 grid gap-4">{fields.map(({ label, value, setValue, autocomplete }) => <label key={label} className="grid gap-2 text-sm font-medium text-foreground">{label}<input type="password" autoComplete={autocomplete} value={value} onChange={(event) => setValue(event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal" /></label>)}<button onClick={updatePassword} disabled={saving} className="w-fit rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving ? 'Updating...' : 'Update password'}</button></div></section>
    <section className="mt-6 rounded-xl border border-border bg-card p-6 md:p-8"><div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold text-foreground">Recent sign-ins</h2><p className="mt-1 text-sm text-muted-foreground">If you do not recognize a session, sign out and change your password.</p></div><LogOut className="text-muted-foreground" aria-hidden="true" /></div><div className="mt-5 grid gap-4">{history.length ? history.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-4 border-t border-border pt-4"><div className="flex items-center gap-3"><Monitor className="text-muted-foreground" aria-hidden="true" /><div><p className="font-medium text-foreground">{entry.device}</p><p className="text-sm text-muted-foreground">{entry.location} · {new Date(entry.date).toLocaleDateString()}</p></div></div><span className="flex items-center gap-1 text-xs font-semibold text-primary"><CheckCircle2 className="size-4" aria-hidden="true" />{entry.status}</span></div>) : <p className="border-t border-border pt-4 text-sm text-muted-foreground">No recent sign-ins to show.</p>}</div></section>
  </div></main>
}
function SecurityToggle({ icon: Icon, title, description, checked, onChange }: { icon: typeof KeyRound; title: string; description: string; checked: boolean; onChange: () => void }) { return <button onClick={onChange} className="flex w-full items-center justify-between gap-4 py-5 text-left"><span className="flex items-center gap-3"><Icon className="text-primary" aria-hidden="true" /><span><span className="block font-semibold text-foreground">{title}</span><span className="mt-1 block text-sm text-muted-foreground">{description}</span></span></span><span className={`rounded-full px-3 py-1 text-xs font-semibold ${checked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{checked ? 'On' : 'Off'}</span></button> }
export default function AccountSecurityPage() { return <ProtectedRoute><AccountSecurityContent /></ProtectedRoute> }
