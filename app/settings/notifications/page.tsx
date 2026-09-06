'use client'

import { useState } from 'react'
import { Bell, Mail, MessageSquare, Smartphone, Save } from 'lucide-react'
import { toast } from 'sonner'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { useBanking } from '@/lib/banking-context'

type NotificationKey = 'emailNotifications' | 'smsNotifications' | 'pushNotifications' | 'transactionAlerts' | 'marketingEmails' | 'paperStatements'
const options: { key: NotificationKey; title: string; description: string; icon: typeof Mail }[] = [
  { key: 'emailNotifications', title: 'Email notifications', description: 'Account activity, transfers, and important updates.', icon: Mail },
  { key: 'smsNotifications', title: 'Text notifications', description: 'Security codes and time-sensitive account alerts.', icon: MessageSquare },
  { key: 'pushNotifications', title: 'Push notifications', description: 'Receive alerts on your trusted devices.', icon: Smartphone },
  { key: 'transactionAlerts', title: 'Transaction alerts', description: 'Get notified when money moves in or out of your accounts.', icon: Bell },
  { key: 'marketingEmails', title: 'Product updates', description: 'Occasional news about Chase products and services.', icon: Mail },
  { key: 'paperStatements', title: 'Paper statements', description: 'Receive printed statements by mail.', icon: Mail },
]

function NotificationsContent() {
  const { appSettings, updateAppSettings, saveToStorage } = useBanking()
  const [saving, setSaving] = useState(false)
  const notificationState = {
    emailNotifications: appSettings.emailNotifications,
    smsAlerts: appSettings.smsAlerts,
    pushNotifications: appSettings.pushNotifications,
    transactionAlerts: appSettings.transactionAlerts,
    marketingEmails: appSettings.marketingEmails,
    paperlessStatements: appSettings.paperlessStatements,
  }
  const [draft, setDraft] = useState(notificationState)
  const toggle = (key: NotificationKey) => {
    const stateKey = key === 'smsNotifications' ? 'smsAlerts' : key === 'paperStatements' ? 'paperlessStatements' : key
    setDraft((current) => ({ ...current, [stateKey]: !current[stateKey as keyof typeof current] }))
  }
  const isChecked = (key: NotificationKey) => Boolean(draft[key === 'smsNotifications' ? 'smsAlerts' : key === 'paperStatements' ? 'paperlessStatements' : key])
  const save = () => { setSaving(true); updateAppSettings({ ...draft }); saveToStorage(); window.setTimeout(() => { setSaving(false); toast.success('Notification preferences saved.') }, 350) }
  return <main className="min-h-screen bg-background pb-24 md:pb-8"><Navigation /><div className="mx-auto max-w-4xl p-4 md:p-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-primary">Chase preferences</p><h1 className="mt-2 text-4xl font-bold text-foreground">Notifications</h1><p className="mt-2 text-muted-foreground">Choose how Chase keeps you informed about your money.</p></div><button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"><Save className="size-4" aria-hidden="true" />{saving ? 'Saving...' : 'Save changes'}</button></div><section className="mt-8 rounded-xl border border-border bg-card p-6 md:p-8"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-full bg-primary/10"><Bell className="text-primary" aria-hidden="true" /></div><div><h2 className="text-xl font-semibold text-foreground">Alert delivery</h2><p className="text-sm text-muted-foreground">You can update these choices at any time.</p></div></div><div className="mt-6 divide-y divide-border">{options.map(({ key, title, description, icon: Icon }) => <label key={key} className="flex cursor-pointer items-center justify-between gap-4 py-5"><span className="flex items-center gap-3"><Icon className="text-primary" aria-hidden="true" /><span><span className="block font-semibold text-foreground">{title}</span><span className="mt-1 block text-sm text-muted-foreground">{description}</span></span></span><input type="checkbox" checked={isChecked(key)} onChange={() => toggle(key)} className="size-5 accent-primary" aria-label={title} /></label>)}</div></section></div></main>
}
export default function NotificationsSettingsPage() { return <ProtectedRoute><NotificationsContent /></ProtectedRoute> }
