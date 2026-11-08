'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type VenmoPaymentSession = {
  start: (options: { presentationMode: 'auto' }, order: Promise<{ orderId: string }>) => Promise<void>
}

type PayPalSdkInstance = {
  findEligibleMethods: (options: { currencyCode: string }) => Promise<{ isEligible: (method: string) => boolean }>
  createVenmoOneTimePaymentSession: (options: {
    onApprove: (data: { orderId: string }) => Promise<void>
    onCancel: () => void
    onError: (error: unknown) => void
  }) => VenmoPaymentSession
}

function loadPayPalSdk(clientId: string) {
  return new Promise<void>((resolve, reject) => {
    if (window.paypal) {
      resolve()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-paypal-web-sdk]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('PayPal SDK could not load.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.sandbox.paypal.com/web-sdk/v6/core?client-id=${encodeURIComponent(clientId)}`
    script.dataset.paypalWebSdk = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('PayPal SDK could not load.'))
    document.head.appendChild(script)
  })
}

export function PayPalVenmo() {
  const [eligible, setEligible] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const sessionRef = useRef<PayPalSdkInstance['createVenmoOneTimePaymentSession'] extends (...args: never[]) => infer R ? R : never>(null)

  useEffect(() => {
    let active = true

    async function initialize() {
      try {
        const configResponse = await fetch('/api/payments/paypal/config')
        const config = await configResponse.json()
        if (!configResponse.ok) throw new Error(config.error || 'PayPal is not configured.')

        await loadPayPalSdk(config.clientId)
        if (!window.paypal) throw new Error('PayPal SDK is unavailable.')
        const webSdk = window.paypal as unknown as { createInstance: (options: { clientId: string; components: string[]; pageType: string }) => Promise<PayPalSdkInstance> }
        const sdk = await webSdk.createInstance({ clientId: config.clientId, components: ['venmo-payments'], pageType: 'checkout' })
        const methods = await sdk.findEligibleMethods({ currencyCode: 'USD' })
        if (!active) return
        setEligible(methods.isEligible('venmo'))
        if (methods.isEligible('venmo')) {
          sessionRef.current = sdk.createVenmoOneTimePaymentSession({
            onApprove: async ({ orderId }) => {
              const response = await fetch('/api/payments/paypal/capture', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }),
              })
              const data = await response.json()
              if (!response.ok) throw new Error(data.error || 'Unable to capture Venmo payment.')
              setMessage(`Venmo payment ${data.status.toLowerCase()}.`)
            },
            onCancel: () => setMessage('Venmo payment cancelled. No payment was captured.'),
            onError: (error) => setMessage(error instanceof Error ? error.message : 'Venmo payment failed.'),
          })
        }
      } catch (error) {
        if (active) {
          setEligible(false)
          setMessage(error instanceof Error ? error.message : 'Venmo is unavailable.')
        }
      }
    }

    initialize()
    return () => { active = false }
  }, [])

  async function startVenmo() {
    if (!sessionRef.current) return
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/payments/paypal/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: '25.00', currency: 'USD', description: 'BankChase Venmo sandbox payment' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to create Venmo order.')
      await sessionRef.current.start({ presentationMode: 'auto' }, Promise.resolve({ orderId: data.orderId }))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to start Venmo payment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Venmo sandbox</CardTitle>
        <CardDescription>Offer Venmo when PayPal confirms this US/USD session is eligible.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {eligible === null ? <p className="text-sm text-muted-foreground">Checking Venmo eligibility…</p> : null}
        {eligible === false ? <p className="text-sm text-muted-foreground">Venmo is not eligible for this browser, account, or location.</p> : null}
        {eligible ? <Button type="button" onClick={startVenmo} disabled={loading}>{loading ? 'Opening Venmo…' : 'Pay with Venmo'}</Button> : null}
        {message ? <p className="text-sm text-muted-foreground" role="status">{message}</p> : null}
      </CardContent>
    </Card>
  )
}
