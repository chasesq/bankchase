import 'server-only'

/**
 * Reads the server-only Plaid secret without importing an optional Vercel
 * Connect runtime package. This keeps Plaid routes deployable in environments
 * where the connector is not attached; PlaidService still owns the API calls.
 */
export async function getPlaidSecret(_userId: string) {
  const secret = process.env.PLAID_SECRET

  if (!secret) {
    throw new Error('Plaid is not configured on this deployment')
  }

  return secret
}
