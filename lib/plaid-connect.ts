import 'server-only'

import { getToken } from '@vercel/connect'

export const PLAID_CONNECTOR_UID = 'plaid/home-dashboard-banking'

export async function getPlaidSecret(userId: string) {
  return getToken(PLAID_CONNECTOR_UID, {
    subject: { type: 'user', id: userId, issuer: 'supabase' },
  })
}
