'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useBanking } from '@/lib/banking-context'
import { toast } from 'sonner'
import { Check, ChevronLeft, Mail, MapPin, Phone, Save, UserRound } from 'lucide-react'
import Link from 'next/link'

type Section = 'identity' | 'location' | 'communication'

const sections: { id: Section; label: string; description: string; icon: typeof UserRound }[] = [
  { id: 'identity', label: 'Personal identity', description: 'Your name and contact details', icon: UserRound },
  { id: 'location', label: 'Location details', description: 'Where we can reach you', icon: MapPin },
  { id: 'communication', label: 'Communication & preferences', description: 'How we contact you', icon: Mail },
]

function ContactInformationContent() {
  const { userProfile, isLoaded, updateUserProfile, saveToStorage } = useBanking()
  const [activeSection, setActiveSection] = useState<Section>('identity')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    preferredLanguage: '',
    timezone: '',
    communicationEmail: true,
    communicationSms: true,
    paperless: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    setForm({
      name: userProfile.name,
      email: userProfile.email,
      phone: userProfile.phone,
      address: userProfile.address,
      preferredLanguage: userProfile.preferredLanguage || 'English',
      timezone: userProfile.timezone || 'America/New_York',
      communicationEmail: true,
      communicationSms: true,
      paperless: true,
    })
  }, [isLoaded, userProfile])

  const beginEditing = () => {
    setForm({
      name: userProfile.name,
      email: userProfile.email,
      phone: userProfile.phone,
      address: userProfile.address,
      preferredLanguage: userProfile.preferredLanguage || 'English',
      timezone: userProfile.timezone || 'America/New_York',
      communicationEmail: true,
      communicationSms: true,
      paperless: true,
    })
  }

  const update = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }))

  const saveChanges = () => {
    if (!form.name.trim() || !form.email.includes('@')) {
      toast.error('Enter a name and valid email address.')
      setActiveSection('identity')
      return
    }
    setSaving(true)
    updateUserProfile({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      preferredLanguage: form.preferredLanguage,
      timezone: form.timezone,
    })
    saveToStorage()
    window.setTimeout(() => {
      setSaving(false)
      toast.success('Contact information updated successfully.')
    }, 350)
  }

  if (!isLoaded) return <main className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading contact information...</p></main>

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-10">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
        <Link href="/settings" className="mb-8 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"><ChevronLeft aria-hidden="true" /> Back to settings</Link>
        <div className="flex flex-col justify-between gap-5 border-b border-border pb-8 md:flex-row md:items-end">
          <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Profile & contact</p><h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">Personal information</h1><p className="mt-2 max-w-2xl text-muted-foreground">Review and manage the information we use to identify you, send important notices, and keep your account up to date.</p></div>
          <button onClick={saveChanges} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"><Save aria-hidden="true" />{saving ? 'Saving...' : 'Save changes'}</button>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          <nav aria-label="Contact information sections" className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
            {sections.map(({ id, label, description, icon: Icon }) => <button key={id} onClick={() => setActiveSection(id)} className={`flex min-w-max items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors lg:w-full ${activeSection === id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon aria-hidden="true" /><span><span className="block text-sm font-semibold">{label}</span><span className="hidden text-xs lg:block">{description}</span></span>{activeSection === id && <Check className="ml-auto hidden lg:block" aria-hidden="true" />}</button>)}
          </nav>
          <section className="rounded-xl border border-border bg-card p-6 md:p-8" aria-live="polite">
            {activeSection === 'identity' && <div><SectionHeading icon={UserRound} title="Personal identity" description="Use your legal name and a reliable way to reach you." /><div className="mt-8 grid gap-5 md:grid-cols-2"><Field label="Full legal name" value={form.name} onChange={(value) => update('name', value)} placeholder="Your full name" /><Field label="Email address" type="email" value={form.email} onChange={(value) => update('email', value)} placeholder="name@example.com" /><Field label="Mobile phone" type="tel" value={form.phone} onChange={(value) => update('phone', value)} placeholder="(555) 555-5555" /><ReadOnlyField label="Customer ID" value={userProfile.id} /></div><p className="mt-6 text-xs text-muted-foreground">Your customer ID cannot be changed and may be requested when you contact support.</p></div>}
            {activeSection === 'location' && <div><SectionHeading icon={MapPin} title="Location details" description="Keep your mailing address current for statements and account notices." /><div className="mt-8 grid gap-5"><label className="grid gap-2 text-sm font-medium text-foreground">Mailing address<textarea rows={4} value={form.address} onChange={(event) => update('address', event.target.value)} placeholder="Street, city, state, ZIP code" className="resize-y rounded-lg border border-border bg-background px-3 py-2.5 font-normal outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2" /></label><div className="grid gap-5 md:grid-cols-2"><SelectField label="Time zone" value={form.timezone} onChange={(value) => update('timezone', value)} options={['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles']} /><SelectField label="Preferred language" value={form.preferredLanguage} onChange={(value) => update('preferredLanguage', value)} options={['English', 'Spanish', 'French']} /></div></div></div>}
            {activeSection === 'communication' && <div><SectionHeading icon={Mail} title="Communication & preferences" description="Choose how you want to receive account updates and service messages." /><div className="mt-8 flex flex-col gap-3"><Preference label="Email notifications" description={`Account alerts will be sent to ${form.email || userProfile.email}.`} checked={form.communicationEmail} onChange={(value) => update('communicationEmail', value)} /><Preference label="Text message notifications" description={`Security codes and urgent alerts will be sent to ${form.phone || userProfile.phone}.`} checked={form.communicationSms} onChange={(value) => update('communicationSms', value)} /><Preference label="Paperless statements" description="View statements securely online instead of receiving paper mail." checked={form.paperless} onChange={(value) => update('paperless', value)} /></div><div className="mt-8 rounded-lg border border-border bg-muted/40 p-4"><div className="flex items-start gap-3"><Phone className="mt-0.5 text-primary" aria-hidden="true" /><p className="text-sm text-muted-foreground">You can update communication choices at any time. We may still contact you about security, legal, or service-critical account activity.</p></div></div></div>}
          </section>
        </div>
      </div>
    </main>
  )
}

function SectionHeading({ icon: Icon, title, description }: { icon: typeof UserRound; title: string; description: string }) { return <div className="flex items-start gap-3"><div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon aria-hidden="true" /></div><div><h2 className="text-2xl font-semibold text-foreground">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></div> }
function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) { return <label className="grid gap-2 text-sm font-medium text-foreground">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2" /></label> }
function ReadOnlyField({ label, value }: { label: string; value: string }) { return <label className="grid gap-2 text-sm font-medium text-foreground">{label}<input value={value} readOnly className="cursor-not-allowed rounded-lg border border-border bg-muted px-3 py-2.5 font-normal text-muted-foreground" /></label> }
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) { return <label className="grid gap-2 text-sm font-medium text-foreground">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal outline-none ring-primary/30 focus:ring-2">{options.map((option) => <option key={option}>{option}</option>)}</select></label> }
function Preference({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-border p-4 hover:bg-muted/50"><span><span className="block text-sm font-semibold text-foreground">{label}</span><span className="mt-1 block text-sm text-muted-foreground">{description}</span></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 size-5 accent-primary" /></label> }

export default function ContactInformationPage() { return <ProtectedRoute><ContactInformationContent /></ProtectedRoute> }

