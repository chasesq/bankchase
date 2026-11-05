'use client'

import { useState } from 'react'
import { ExternalLink, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const testCards = [
  { brand: 'Visa', number: '4012888888881881', cvv: 'Any 3 digits' },
  { brand: 'Visa', number: '4005519200000004', cvv: 'Any 3 digits' },
  { brand: 'Mastercard', number: '2223000048400011', cvv: 'Any 3 digits' },
  { brand: 'American Express', number: '371449635398431', cvv: 'Any 4 digits' },
  { brand: 'Discover', number: '6011000000000012', cvv: 'Any 3 digits' },
]

const rejectionTriggers = [
  ['Card refused', 'CCREJECT-REFUSED', '0500'],
  ['Fraudulent card', 'CCREJECT-SF', '9500'],
  ['Insufficient funds', 'CCREJECT-IF', '5120'],
  ['CVC check fails', 'CCREJECT-CVV_F', '00N7'],
] as const

export function PayPalSandboxTesting() {
  const [copied, setCopied] = useState('')

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
      window.setTimeout(() => setCopied(''), 1600)
    } catch {
      setCopied('')
    }
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Sandbox card testing</CardTitle>
            <CardDescription className="mt-1 max-w-2xl">
              Use these PayPal sandbox values only. Card numbers require a future expiration date and the CVV format shown.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="w-fit bg-transparent">
            <a href="https://developer.paypal.com/credit-card-number-generator" target="_blank" rel="noreferrer">
              Generate cards <ExternalLink className="ml-2 size-3.5" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[520px] text-sm">
            <caption className="sr-only">PayPal sandbox test card numbers</caption>
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Brand</th>
                <th className="px-4 py-3 font-medium">Test number</th>
                <th className="px-4 py-3 font-medium">CVV</th>
                <th className="px-4 py-3"><span className="sr-only">Copy</span></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {testCards.map((card) => (
                <tr key={card.number}>
                  <td className="px-4 py-3 font-medium">{card.brand}</td>
                  <td className="px-4 py-3 font-mono text-xs tracking-wide">{card.number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{card.cvv}</td>
                  <td className="px-4 py-3 text-right">
                    <Button type="button" variant="ghost" size="sm" onClick={() => copy(card.number)} aria-label={`Copy ${card.brand} test card number`}>
                      {copied === card.number ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                      <span className="sr-only">{copied === card.number ? 'Copied' : 'Copy number'}</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Decline scenarios</h3>
          <p className="mt-1 text-sm text-muted-foreground">Enter a trigger as the cardholder name when testing Expanded Checkout declines.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {rejectionTriggers.map(([name, trigger, code]) => (
              <button key={trigger} type="button" onClick={() => copy(trigger)} className="flex items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span>
                  <span className="block text-sm font-medium">{name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{trigger} · response {code}</span>
                </span>
                {copied === trigger ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : <Copy className="size-4 text-muted-foreground" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
