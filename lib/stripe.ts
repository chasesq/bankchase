import 'server-only'
import Stripe from 'stripe'

let client: Stripe | undefined

export function getStripe(): Stripe {
  if (client) return client

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured. Connect Stripe in the project settings.')
  }

  client = new Stripe(secretKey, {
    apiVersion: '2026-08-26.dahlia',
    typescript: true,
    maxNetworkRetries: 2,
    appInfo: { name: 'BankChase', version: '1.0.0' },
  })

  return client
}

export function getStripePublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? process.env.STRIPE_PUBLISHABLE_KEY
  if (!key) throw new Error('Stripe publishable key is not configured.')
  return key
}

export function stripeAccountOptions(accountId: string): Stripe.RequestOptions {
  if (!/^acct_[A-Za-z0-9]+$/.test(accountId)) throw new Error('Invalid Stripe account ID.')
  return { stripeAccount: accountId }
}

export function stripeErrorMessage(error: unknown): string {
  if (error instanceof Stripe.errors.StripeError) return error.message
  return error instanceof Error ? error.message : 'Stripe request failed.'
}

export function integrationIdentifier(prefix: string): string {
  const suffix = Math.random().toString(36).slice(2, 10).replace(/[^a-z]/g, 'a').slice(0, 8)
  return `${prefix}_${suffix}`
}

export type StripeAccountStatus = 'pending' | 'complete' | 'under_review'

export function accountStatus(account: Stripe.Account): StripeAccountStatus {
  if (account.details_submitted && account.charges_enabled && account.payouts_enabled) return 'complete'
  if (account.requirements?.disabled_reason?.includes('pending')) return 'under_review'
  return 'pending'
}

export function toCents(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be greater than zero.')
  const cents = Math.round(amount * 100)
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error('Invalid amount.')
  return cents
}

export function assertCurrency(currency: string): string {
  const normalized = currency.toLowerCase()
  if (!/^[a-z]{3}$/.test(normalized)) throw new Error('Invalid currency.')
  return normalized
}

export const stripe = { get client() { return getStripe() } }

export default getStripe
