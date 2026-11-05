'use client'

import { Suspense, useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        createOrder: () => Promise<string>
        onApprove: (data: { orderID: string }) => Promise<void>
        onCancel: () => void
        onError: (error: Error) => void
      }) => { render: (container: HTMLElement) => Promise<void> }
    }
  }
}

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function PayPalCheckoutContent() {
  const [amount, setAmount] = useState('25.00')
  const [description, setDescription] = useState('BankChase sandbox payment')
  const [captureLoading, setCaptureLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const paypalContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    async function renderPayPalButtons() {
      const configResponse = await fetch('/api/payments/paypal/config', { cache: 'no-store' })
      const config = await configResponse.json()
      if (!configResponse.ok || !config.clientId) throw new Error(config.error || 'PayPal is not configured')

      if (!window.paypal) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(config.clientId)}&currency=USD&intent=capture`
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Unable to load PayPal checkout'))
          document.head.appendChild(script)
        })
      }

      if (cancelled || !paypalContainer.current || !window.paypal) return
      paypalContainer.current.innerHTML = ''
      window.paypal.Buttons({
        createOrder: async () => {
          const response = await fetch('/api/payments/paypal/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amount.trim(), currency: 'USD', description: description.trim() }),
          })
          const data = await response.json()
          if (!response.ok) throw new Error(data.error || 'Unable to start checkout')
          return data.orderId
        },
        onApprove: async (data: { orderID: string }) => {
          setCaptureLoading(true)
          const response = await fetch('/api/payments/paypal/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderID }),
          })
          const capture = await response.json()
          if (!response.ok) throw new Error(capture.error || 'Unable to capture payment')
          setResult(`Payment ${capture.status}. PayPal order ${capture.orderId} was captured.`)
          setCaptureLoading(false)
        },
        onCancel: () => setResult('PayPal checkout was cancelled. No payment was captured.'),
        onError: (checkoutError: Error) => setError(checkoutError.message || 'PayPal checkout failed'),
      }).render(paypalContainer.current)
    }

    renderPayPalButtons().catch((checkoutError) => {
      if (!cancelled) setError(checkoutError instanceof Error ? checkoutError.message : 'Unable to load PayPal checkout')
    })
    return () => { cancelled = true }
  }, [amount, description])

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
        <div ref={paypalContainer} aria-label="PayPal checkout button" />
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
