'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function PayPalCheckoutContent() {
  const [amount, setAmount] = useState('25.00')
  const [description, setDescription] = useState('BankChase sandbox payment')
  const [loading, setLoading] = useState(false)
  const [captureLoading, setCaptureLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const captureStarted = useRef(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const orderId = searchParams.get('token')
    const outcome = searchParams.get('paypal')

    if (outcome === 'cancelled') {
      queueMicrotask(() => setResult('PayPal checkout was cancelled. No payment was captured.'))
      router.replace('/payments')
      return
    }

    if (outcome !== 'success' || !orderId || captureStarted.current) return

    captureStarted.current = true
    setCaptureLoading(true)
    let cancelled = false

    fetch('/api/payments/paypal/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to capture payment')
        if (!cancelled) {
          setResult(`Payment ${data.status}. PayPal order ${data.orderId} was captured.`)
          router.replace('/payments')
        }
      })
      .catch((captureError) => {
        if (!cancelled) setError(captureError instanceof Error ? captureError.message : 'Unable to capture payment')
      })
      .finally(() => {
        if (!cancelled) setCaptureLoading(false)
      })

    return () => { cancelled = true }
  }, [router, searchParams])

  async function startCheckout() {
    const normalizedAmount = amount.trim()
    if (!/^\d+(\.\d{1,2})?$/.test(normalizedAmount) || Number(normalizedAmount) <= 0) {
      setError('Enter an amount greater than 0 with up to two decimal places.')
      return
    }
    if (!description.trim()) {
      setError('Add a payment description.')
      return
    }

    setLoading(true)
    setError('')
    setResult('')

    try {
      const response = await fetch('/api/payments/paypal/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: normalizedAmount, currency: 'USD', description: description.trim() }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to start checkout')
      window.location.assign(data.approvalUrl)
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Unable to start checkout')
      setLoading(false)
    }
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>PayPal sandbox checkout</CardTitle>
        <CardDescription>Test a secure PayPal order with your sandbox buyer account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="paypal-amount">Amount (USD)</Label>
            <Input id="paypal-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paypal-description">Description</Label>
            <Input id="paypal-description" value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
        </div>
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
        {result ? <p className="text-sm text-emerald-600" role="status">{result}</p> : null}
        {captureLoading ? <p className="text-sm text-muted-foreground" role="status">Confirming your PayPal payment…</p> : null}
        <Button type="button" onClick={startCheckout} disabled={loading || captureLoading} className="bg-[#0070ba] text-white hover:bg-[#005ea6]">
          {loading ? 'Opening PayPal…' : 'Continue with PayPal'}
        </Button>
      </CardContent>
    </Card>
  )
}

export function PayPalCheckout() {
  return (
    <Suspense fallback={<Card><CardContent className="p-6 text-sm text-muted-foreground">Loading PayPal checkout…</CardContent></Card>}>
      <PayPalCheckoutContent />
    </Suspense>
  )
}
