'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DonationConfig {
  env: 'sandbox' | 'production'
  hostedButtonId?: string
  business?: string
}

declare global {
  interface Window {
    PayPal?: {
      Donation: {
        Button: (options: {
          env: 'sandbox' | 'production'
          hosted_button_id?: string
          business?: string
          image: { src: string; title: string; alt: string }
          onComplete: (params: Record<string, string>) => void
        }) => { render: (selector: string) => void }
      }
    }
  }
}

function loadDonationSdk() {
  return new Promise<void>((resolve, reject) => {
    if (window.PayPal?.Donation) {
      resolve()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-paypal-donate-sdk]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('PayPal Donate SDK could not load.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://www.paypalobjects.com/donate/sdk/donate-sdk.js'
    script.charset = 'UTF-8'
    script.dataset.paypalDonateSdk = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('PayPal Donate SDK could not load.'))
    document.head.appendChild(script)
  })
}

export function PayPalDonate() {
  const [config, setConfig] = useState<DonationConfig | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    async function initialize() {
      try {
        const response = await fetch('/api/payments/paypal/donate-config')
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'PayPal donations are not configured.')
        await loadDonationSdk()
        if (!active || !window.PayPal?.Donation) return

        setConfig(data)
        window.PayPal.Donation.Button({
          env: data.env,
          ...(data.hostedButtonId ? { hosted_button_id: data.hostedButtonId } : { business: data.business }),
          image: {
            src: 'https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif',
            title: 'PayPal - The safer, easier way to pay online!',
            alt: 'Donate with PayPal button',
          },
          onComplete: (params) => setMessage(`Donation completed${params.tx ? ` (transaction ${params.tx}).` : '.'}`),
        }).render('#paypal-donate-button-container')
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : 'PayPal donations are unavailable.')
      }
    }

    initialize()
    return () => { active = false }
  }, [])

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Support BankChase</CardTitle>
        <CardDescription>Make a secure donation through PayPal without leaving this page.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div id="paypal-donate-button-container" aria-label="PayPal donation button" />
        {!config && !message ? <p className="text-sm text-muted-foreground">Loading PayPal donations…</p> : null}
        {message ? <p className="text-sm text-muted-foreground" role="status">{message}</p> : null}
      </CardContent>
    </Card>
  )
}
