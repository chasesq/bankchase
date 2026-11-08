'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { ArrowUpRight, CheckCircle2, FileText, Repeat2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function CapabilityForm({ kind, title, description, endpoint, children, submitLabel }: { kind: string; title: string; description: string; endpoint: string; children: (form: Record<string, string>, setForm: (next: Record<string, string>) => void) => ReactNode; submitLabel: string }) {
  const [form, setFormState] = useState<Record<string, string>>({ amount: '25.00', currency: 'USD', recipientEmail: '', note: 'BankChase payout', description: 'BankChase invoice', planId: '' })
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setForm = (next: Record<string, string>) => setFormState((current) => ({ ...current, ...next }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true); setStatus(''); setError('')
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || `Unable to ${kind}`)
      if (data.approvalUrl) window.location.assign(data.approvalUrl)
      else setStatus(`${title} created${data.id ? `: ${data.id}` : data.payoutBatchId ? `: ${data.payoutBatchId}` : ''}.`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : `Unable to ${kind}`)
    } finally { setLoading(false) }
  }

  return <Card className="border-border/70 shadow-sm"><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-4">{children(form, setForm)}{error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}{status ? <p className="flex items-center gap-2 text-sm text-emerald-600" role="status"><CheckCircle2 className="size-4" />{status}</p> : null}<Button type="submit" disabled={loading}>{loading ? 'Working…' : submitLabel}<ArrowUpRight className="ml-2 size-4" /></Button></form></CardContent></Card>
}

function MoneyFields({ form, setForm, includeNote = false }: { form: Record<string, string>; setForm: (next: Record<string, string>) => void; includeNote?: boolean }) {
  return <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="paypal-recipient">Recipient email</Label><Input id="paypal-recipient" type="email" value={form.recipientEmail} onChange={(event) => setForm({ recipientEmail: event.target.value })} required placeholder="recipient@example.com" /></div><div className="space-y-2"><Label htmlFor="paypal-amount-capability">Amount</Label><Input id="paypal-amount-capability" inputMode="decimal" value={form.amount} onChange={(event) => setForm({ amount: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="paypal-currency-capability">Currency</Label><Input id="paypal-currency-capability" value={form.currency} onChange={(event) => setForm({ currency: event.target.value.toUpperCase() })} maxLength={3} required /></div>{includeNote ? <div className="space-y-2"><Label htmlFor="paypal-note">Note</Label><Input id="paypal-note" value={form.note} onChange={(event) => setForm({ note: event.target.value })} /></div> : null}</div>
}

export function PayPalCapabilities() {
  return <Tabs defaultValue="subscription" className="space-y-4"><TabsList className="grid h-auto w-full grid-cols-3 sm:w-fit"><TabsTrigger value="subscription"><Repeat2 className="mr-2 size-4" />Subscriptions</TabsTrigger><TabsTrigger value="payout"><Send className="mr-2 size-4" />Payouts</TabsTrigger><TabsTrigger value="invoice"><FileText className="mr-2 size-4" />Invoicing</TabsTrigger></TabsList><TabsContent value="subscription"><CapabilityForm kind="start a subscription" title="Subscriptions" description="Send buyers to PayPal to approve a recurring billing plan." endpoint="/api/payments/paypal/subscription" submitLabel="Start subscription">{(form, setForm) => <div className="space-y-2"><Label htmlFor="paypal-plan-id">Plan ID</Label><Input id="paypal-plan-id" name="planId" value={form.planId} placeholder="P-..." onChange={(event) => setForm({ planId: event.target.value })} /><p className="text-xs text-muted-foreground">Set PAYPAL_PLAN_ID in the project environment, or enter a plan ID here for testing.</p></div>}</CapabilityForm></TabsContent><TabsContent value="payout"><CapabilityForm kind="send a payout" title="Payouts" description="Send a single sandbox payout to a recipient email address." endpoint="/api/payments/paypal/payout" submitLabel="Send payout">{(form, setForm) => <MoneyFields form={form} setForm={setForm} includeNote />}</CapabilityForm></TabsContent><TabsContent value="invoice"><CapabilityForm kind="create an invoice" title="Invoicing" description="Create a PayPal invoice with a recipient, currency, and line item." endpoint="/api/payments/paypal/invoice" submitLabel="Create invoice">{(form, setForm) => <><MoneyFields form={form} setForm={setForm} /><div className="space-y-2"><Label htmlFor="paypal-description-capability">Description</Label><Input id="paypal-description-capability" value={form.description} onChange={(event) => setForm({ description: event.target.value })} required /></div></>}</CapabilityForm></TabsContent></Tabs>
}
