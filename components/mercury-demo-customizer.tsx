'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, Mail, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

export function MercuryDemoCustomizer({ open, onOpenChange }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [stage, setStage] = useState('growing')
  const [priority, setPriority] = useState('cash-flow')
  const [submitted, setSubmitted] = useState(false)
  const [demoUrl, setDemoUrl] = useState('')
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  const canSubmit = useMemo(() => name.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [name, email])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    setSending(true)
    const params = new URLSearchParams({ name: name.trim(), stage, priority })
    const url = `${window.location.origin}/dashboard?demo=customized&${params.toString()}`
    setDemoUrl(url)
    try {
      const response = await fetch('/api/demo-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, stage, priority, demoUrl: url }) })
      const result = await response.json()
      toast({ title: result.emailSent ? 'Your demo is on its way' : 'Your demo is ready', description: result.emailSent ? `We sent a customized link to ${email}.` : 'Use the link below to open your customized experience.' })
    } catch {
      toast({ title: 'Your demo is ready', description: 'Email delivery is unavailable, so your link is ready below.' })
    } finally {
      setSubmitted(true)
      setSending(false)
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(demoUrl)
    toast({ title: 'Link copied', description: 'Your customized demo link is on the clipboard.' })
  }

  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl"><SheetHeader className="gap-3"><div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles /></div><SheetTitle className="text-2xl">Explore the Mercury Demo</SheetTitle><SheetDescription>Customize your experience and we&apos;ll send you an email with your customized demo link.</SheetDescription></SheetHeader><Separator className="my-6" />{submitted ? <Card className="border-primary/20 bg-primary/5"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Check className="text-primary" />Your demo is customized</CardTitle><CardDescription>Open it now or copy the link for later.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3"><div className="break-all rounded-lg border bg-background p-3 text-sm text-muted-foreground">{demoUrl}</div><div className="flex flex-wrap gap-2"><Button onClick={() => window.open(demoUrl, '_self')}><Sparkles data-icon="inline-start" />Open demo</Button><Button variant="outline" onClick={copyLink}><Copy data-icon="inline-start" />Copy link</Button><Button variant="ghost" onClick={() => setSubmitted(false)}>Edit choices</Button></div></CardContent></Card> : <form onSubmit={handleSubmit} className="flex flex-col gap-6"><div className="grid gap-4 sm:grid-cols-2"><div className="flex flex-col gap-2"><Label htmlFor="demo-name">Your name</Label><Input id="demo-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Lee" required /></div><div className="flex flex-col gap-2"><Label htmlFor="demo-email">Work email</Label><Input id="demo-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jordan@company.com" required /></div></div><div className="flex flex-col gap-2"><Label>Where is your business today?</Label><Select value={stage} onValueChange={setStage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="starting">Just getting started</SelectItem><SelectItem value="growing">Growing quickly</SelectItem><SelectItem value="established">Established business</SelectItem></SelectContent></Select></div><div className="flex flex-col gap-2"><Label>What would you like to explore?</Label><Select value={priority} onValueChange={setPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash-flow">Cash flow and treasury</SelectItem><SelectItem value="payments">Payments and cards</SelectItem><SelectItem value="team">Team spending controls</SelectItem></SelectContent></Select></div><Button type="submit" size="lg" disabled={!canSubmit || sending}><Mail data-icon="inline-start" />{sending ? 'Preparing your demo...' : 'Send me my customized demo'}</Button><p className="text-xs leading-5 text-muted-foreground">No commitment required. Your selections personalize the demo only.</p></form>}</SheetContent></Sheet>
}

export function DemoTrigger({ onClick, className = '' }: { onClick: () => void; className?: string }) { return <Button onClick={onClick} className={className}><Sparkles data-icon="inline-start" />Explore the Mercury Demo</Button> }
