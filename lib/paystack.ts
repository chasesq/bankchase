const PAYSTACK_API_BASE = 'https://api.paystack.co'

export const PAYSTACK_CURRENCIES = {
  NGN: { subunit: 100, minimum: 5000, country: 'Nigeria', symbol: '₦' },
  USD: { subunit: 100, minimum: 200, country: 'Kenya and Nigeria', symbol: '$' },
  GHS: { subunit: 100, minimum: 10, country: 'Ghana', symbol: '₵' },
  ZAR: { subunit: 100, minimum: 100, country: 'South Africa', symbol: 'R' },
  KES: { subunit: 100, minimum: 300, country: 'Kenya', symbol: 'Ksh.' },
  XOF: { subunit: 100, minimum: 100, country: "Côte d'Ivoire", symbol: 'XOF' },
} as const

export type PaystackCurrency = keyof typeof PAYSTACK_CURRENCIES

export function getPaystackSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not configured')
  return key
}

export function toPaystackSubunit(amount: number, currency: PaystackCurrency) {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be positive')
  const config = PAYSTACK_CURRENCIES[currency]
  const subunitAmount = Math.round(amount * config.subunit)
  if (subunitAmount < config.minimum) throw new Error(`Amount is below the ${currency} minimum`)
  return subunitAmount
}

export async function paystackRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${PAYSTACK_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey()}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })
  const payload = (await response.json()) as { status: boolean; message: string; data: T }
  if (!response.ok || !payload.status) throw new Error(payload.message || 'Paystack request failed')
  return payload.data
}

export function paystackErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Paystack request failed'
}
