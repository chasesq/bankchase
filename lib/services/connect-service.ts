import { getStripe, stripeAccountOptions, stripeErrorMessage, accountStatus } from '@/lib/stripe'

export interface CreateConnectAccountInput {
  displayName: string
  email: string
  country?: string
}

export async function createConnectAccount(input: CreateConnectAccountInput) {
  const displayName = input.displayName.trim()
  const email = input.email.trim().toLowerCase()
  if (displayName.length < 2 || displayName.length > 120) throw new Error('Display name must be between 2 and 120 characters.')
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('A valid contact email is required.')

  const stripe = getStripe()
  const account = await (stripe as any).v2.core.accounts.create({
    display_name: displayName,
    contact_email: email,
    identity: { country: (input.country ?? 'us').toLowerCase() },
    dashboard: 'full',
    defaults: { responsibilities: { fees_collector: 'stripe', losses_collector: 'stripe' } },
    configuration: { customer: {}, merchant: { capabilities: { card_payments: { requested: true } } } },
  })

  return { id: account.id, status: accountStatus(account), account }
}

export async function createOnboardingLink(accountId: string, refreshUrl: string, returnUrl: string) {
  if (!/^acct_[A-Za-z0-9]+$/.test(accountId)) throw new Error('Invalid Stripe account ID.')
  const refresh = new URL(refreshUrl)
  const returnTo = new URL(returnUrl)
  if (!['http:', 'https:'].includes(refresh.protocol) || !['http:', 'https:'].includes(returnTo.protocol)) {
    throw new Error('Onboarding URLs must use HTTP or HTTPS.')
  }

  return getStripe().accountLinks.create({
    account: accountId,
    refresh_url: refresh.toString(),
    return_url: returnTo.toString(),
    type: 'account_onboarding',
  })
}

export async function retrieveConnectAccount(accountId: string) {
  if (!/^acct_[A-Za-z0-9]+$/.test(accountId)) throw new Error('Invalid Stripe account ID.')
  const account = await getStripe().accounts.retrieve(accountId)
  return { id: account.id, status: accountStatus(account), detailsSubmitted: account.details_submitted, chargesEnabled: account.charges_enabled, payoutsEnabled: account.payouts_enabled, requirements: account.requirements }
}

export { stripeAccountOptions, stripeErrorMessage }
