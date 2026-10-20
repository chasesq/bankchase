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

const isDate = (value: string | null) => Boolean(value && /^\\d{4}-\\d{2}-\\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)))

export const GET = createProtectedMCPRoute(async (request: NextRequest, user) => {
  const params = request.nextUrl.searchParams
  const accountId = params.get('accountId')
  const fromDate = params.get('fromDate')
  const toDate = params.get('toDate')
  const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10))
  const countPerPage = Math.min(100, Math.max(1, Number.parseInt(params.get('countPerPage') || '10', 10)))

  if (!accountId || !isDate(fromDate) || !isDate(toDate) || !Number.isInteger(page) || !Number.isInteger(countPerPage)) {
    return json({ error: 'invalid_request', error_description: 'accountId, fromDate, toDate, page, and countPerPage are required' }, 400)
  }
  if (fromDate! > toDate!) return json({ error: 'invalid_request', error_description: 'fromDate must not be after toDate' }, 400)

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return json({ error: 'server_error', error_description: 'Transaction service is not configured' }, 500)

  const supabase = createClient(url, key)
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (accountError) return json({ error: 'server_error', error_description: 'Failed to verify account' }, 500)
  if (!account) return json({ error: 'invalid_request', error_description: 'Account not found' }, 404)

  const from = `${fromDate}T00:00:00.000Z`
  const to = `${toDate}T23:59:59.999Z`
  const start = (page - 1) * countPerPage
  const end = start + countPerPage - 1
  const { data, error } = await supabase
    .from('transaction_ledger')
    .select('*', { count: 'exact' })
    .or(`sender_account_id.eq.${accountId},receiver_account_id.eq.${accountId}`)
    .gte('created_at', from)
    .lte('created_at', to)
    .order('created_at', { ascending: false })
    .range(start, end)

  if (error) {
    console.error('[v0] Skrill transaction history lookup failed:', error)
    return json({ error: 'server_error', error_description: 'Failed to retrieve transaction history' }, 500)
  }

  const transactions = (data ?? []).map((item) => {
    const outgoing = String(item.sender_account_id) === accountId
    const details = item.metadata && typeof item.metadata === 'object' ? item.metadata : {}
    return {
      canResend: false,
      category: String(item.transaction_type ?? 'transfer'),
      customerAmount: Number(item.amount ?? 0),
      customerCurrency: String(item.currency ?? 'USD'),
      details,
      direction: outgoing ? 'OUTGOING' : 'INCOMING',
      feeAmount: 0,
      feeCurrency: String(item.currency ?? 'USD'),
      id: Number(item.id ?? item.transaction_id),
      location: '',
      metadata: details,
      paymentInstrument: '',
      peerEmail: '',
      peerName: '',
      requestTime: String(item.created_at ?? new Date().toISOString()),
      status: String(item.status ?? 'completed').toUpperCase(),
      terminalAmount: Number(item.amount ?? 0),
      terminalCurrency: String(item.currency ?? 'USD'),
      transactionAmount: Number(item.amount ?? 0),
      transactionCurrency: String(item.currency ?? 'USD'),
    }
  })

  return json({ mobileTransactionHistory: transactions })
})
