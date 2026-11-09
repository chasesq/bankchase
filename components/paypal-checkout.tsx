'use client'

import { Suspense, useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: PayPalButtonOptions) => { render: (container: HTMLElement) => Promise<void> }
      CardFields: (options: PayPalCardFieldsOptions) => PayPalCardFields
    }
  }

  interface PayPalButtonOptions {
    createOrder: () => Promise<string>
    onApprove: (data: { orderID: string }) => Promise<void>
    onCancel: () => void
    onError: (error: Error) => void
  }

  interface PayPalCardFieldsOptions {
    createOrder: () => Promise<string>
    onApprove: (data: { orderID: string }) => Promise<void>
    onError: (error: Error) => void
  }

  interface PayPalCardFields {
    isEligible: () => boolean
    NumberField: (options: { selector: string; placeholder: string; style: Record<string, Record<string, string>> }) => { render: () => Promise<void> }
    ExpiryField: (options: { selector: string; placeholder: string; style: Record<string, Record<string, string>> }) => { render: () => Promise<void> }
    CVVField: (options: { selector: string; placeholder: string; style: Record<string, Record<string, string>> }) => { render: () => Promise<void> }
    submit: () => Promise<{ orderID: string }>
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
  const cardFieldsContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    async function createOrder() {
      const response = await fetch('/api/payments/paypal/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount.trim(), currency: 'USD', description: description.trim() }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to start checkout')
      return data.orderId as string
    }

    async function captureOrder(orderId: string) {
      setCaptureLoading(true)
      setError('')
      try {
        const response = await fetch('/api/payments/paypal/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        })
        const capture = await response.json()
        if (!response.ok) throw new Error(capture.error || 'Unable to capture payment')
        setResult(`Payment ${capture.status}. PayPal order ${capture.orderId} was captured.`)
        const paidAmount = Number(amount)
        if (Number.isFinite(paidAmount) && paidAmount > 0) window.dispatchEvent(new CustomEvent('bankchase:payment-success', { detail: { amount: paidAmount } }))
      } finally {
        setCaptureLoading(false)
      }
    }

    async function renderCheckout() {
      const configResponse = await fetch('/api/payments/paypal/config', { cache: 'no-store' })
      const config = await configResponse.json()
      if (!configResponse.ok || !config.clientId) throw new Error(config.error || 'PayPal is not configured')

      if (!window.paypal) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(config.clientId)}&currency=USD&intent=capture&components=buttons,card-fields`
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Unable to load PayPal checkout'))
          document.head.appendChild(script)
        })
      }

      if (cancelled || !window.paypal || !paypalContainer.current || !cardFieldsContainer.current) return
      paypalContainer.current.innerHTML = ''
      cardFieldsContainer.current.innerHTML = ''

      const buttons = window.paypal.Buttons({
        createOrder,
        onApprove: (data) => captureOrder(data.orderID),
        onCancel: () => setResult('PayPal checkout was cancelled. No payment was captured.'),
        onError: (checkoutError) => setError(checkoutError.message || 'PayPal checkout failed'),
      })
      await buttons.render(paypalContainer.current)

      const cardFields = window.paypal.CardFields({
        createOrder,
        onApprove: (data) => captureOrder(data.orderID),
        onError: (checkoutError) => setError(checkoutError.message || 'Card payment failed'),
      })
      if (!cardFields.isEligible()) return

      const style = {
        input: { 'font-size': '16px', 'font-family': 'inherit', color: '#111827' },
        '.invalid': { color: '#b91c1c' },
      }
      await Promise.all([
        cardFields.NumberField({ selector: '#paypal-card-number', placeholder: 'Card number', style }).render(),
        cardFields.ExpiryField({ selector: '#paypal-card-expiry', placeholder: 'MM/YY', style }).render(),
        cardFields.CVVField({ selector: '#paypal-card-cvv', placeholder: 'Security code', style }).render(),
      ])

      const submitButton = cardFieldsContainer.current.querySelector<HTMLButtonElement>('[data-card-submit]')
      submitButton?.addEventListener('click', async () => {
        setError('')
        try {
          await cardFields.submit()
        } catch (submitError) {
          setError(submitError instanceof Error ? submitError.message : 'Unable to submit card payment')
        }
      })
    }

    renderCheckout().catch((checkoutError) => {
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
        <div ref={cardFieldsContainer} className="space-y-3 rounded-lg border bg-muted/20 p-4" aria-label="Credit and debit card payment">
          <p className="text-sm font-medium">Pay with a credit or debit card</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div id="paypal-card-number" className="min-h-10 rounded-md border bg-background px-3 py-2" />
            <div id="paypal-card-expiry" className="min-h-10 rounded-md border bg-background px-3 py-2" />
            <div id="paypal-card-cvv" className="min-h-10 rounded-md border bg-background px-3 py-2" />
          </div>
          <button type="button" data-card-submit className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50" disabled={captureLoading}>
            {captureLoading ? 'Processing…' : 'Pay with card'}
          </button>
          <p className="text-xs text-muted-foreground">
            By paying with your card, you acknowledge that your data will be processed by PayPal subject to the PayPal Privacy Statement.
          </p>
        </div>
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
