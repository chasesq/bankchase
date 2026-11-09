'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function BraintreeCheckout() {
  const [amount, setAmount] = useState('25.00')
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const instance = useRef<any>(null)

  useEffect(() => {
    let active = true
    async function setup() {
      try {
        const response = await fetch('/api/payments/braintree/token', { cache: 'no-store' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Braintree sandbox is unavailable')
        const dropin = await import('braintree-web-drop-in')
        const created = await dropin.create({ authorization: data.clientToken, container: '#braintree-drop-in' })
        if (active) { instance.current = created; setReady(true) }
      } catch (setupError) {
        if (active) setError(setupError instanceof Error ? setupError.message : 'Unable to load Braintree checkout')
      }
    }
    setup()
    return () => { active = false; instance.current?.teardown?.() }
  }, [])

  async function submit() {
    setError(''); setResult(''); setLoading(true)
    try {
      if (!instance.current) throw new Error('Braintree checkout is still loading')
      const payload = await instance.current.requestPaymentMethod()
      const response = await fetch('/api/payments/braintree/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, nonce: payload.nonce }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Braintree payment failed')
      setResult(`Payment submitted. Braintree transaction ${data.transactionId} is ${data.status}.`)
      const paidAmount = Number(amount)
      if (Number.isFinite(paidAmount) && paidAmount > 0) window.dispatchEvent(new CustomEvent('bankchase:payment-success', { detail: { amount: paidAmount } }))
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Braintree payment failed')
    } finally { setLoading(false) }
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader><CardTitle>Braintree sandbox checkout</CardTitle><CardDescription>Use a Braintree sandbox test card or PayPal account.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2"><Label htmlFor="braintree-amount">Amount (USD)</Label><Input id="braintree-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></div>
        <div id="braintree-drop-in" aria-label="Braintree payment method" />
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
        {result ? <p className="text-sm text-emerald-600" role="status">{result}</p> : null}
        <button type="button" onClick={submit} disabled={!ready || loading} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{loading ? 'Processing…' : 'Pay with Braintree'}</button>
      </CardContent>
    </Card>
  )
}
