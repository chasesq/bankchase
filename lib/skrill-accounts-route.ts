import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createProtectedMCPRoute } from '@/lib/mcp-oauth-middleware'

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, PSU-IP-Address',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: corsHeaders })

export const OPTIONS = () => new NextResponse(null, { status: 204, headers: corsHeaders })

export const GET = createProtectedMCPRoute(async (_request: NextRequest, user) => {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return json({ error: 'server_error', error_description: 'Account service is not configured' }, 500)

  const supabase = createClient(url, key)
  const { data, error } = await supabase
    .from('accounts')
    .select('id, balance, currency, account_type, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[v0] Skrill accounts lookup failed:', error)
    return json({ error: 'server_error', error_description: 'Failed to retrieve accounts' }, 500)
  }

  const accounts = (data ?? []).map((account, index) => ({
    available: Number(account.balance ?? 0),
    balance: Number(account.balance ?? 0),
    crypto: false,
    currency: {
      decimalPlaces: 2,
      id: String(account.currency ?? 'USD'),
      increment: 0.01,
      isCrypto: false,
      name: String(account.currency ?? 'USD'),
    },
    currencyCode: String(account.currency ?? 'USD'),
    id: String(account.id),
    primary: index === 0,
    status: String(account.status ?? 'active').toUpperCase(),
    type: String(account.account_type ?? 'checking'),
  }))

  return json(accounts)
})
