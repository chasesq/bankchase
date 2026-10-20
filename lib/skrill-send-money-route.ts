import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { createProtectedMCPRoute } from '@/lib/mcp-oauth-middleware'

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, PSU-IP-Address, Idempotency-Key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: corsHeaders })
export const OPTIONS = () => new NextResponse(null, { status: 204, headers: corsHeaders })

const getSupabase = () => {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  return url && key ? createClient(url, key) : null
}

const error = (description: string, status = 400) => json({ error: 'invalid_request', error_description: description }, status)
const asNumber = (value: unknown) => typeof value === 'number' ? value : Number(value)

async function loadAccount(supabase: ReturnType<typeof getSupabase>, accountId: string, userId: string) {
  if (!supabase) return { account: null, error: 'Send-money service is not configured' }
  const { data, error: queryError } = await supabase.from('accounts').select('*').eq('id', accountId).eq('user_id', userId).maybeSingle()
  if (queryError) return { account: null, error: 'Failed to verify sender account' }
  return { account: data, error: data ? null : 'Sender account not found' }
}

const preview = (amount: number, currency: string, senderAccountId: string) => {
  const feeAmount = Number((Math.max(0.5, amount * 0.01)).toFixed(2))
  const fxRate = 1
  return {
    accountId: Number(senderAccountId) || senderAccountId,
    feeAmount,
    feeCurrency: currency,
    totalFeeAmount: feeAmount,
    customerAmount: amount,
    displayCustomerAmount: Number(amount.toFixed(2)),
    customerCurrency: currency,
    paymentAmount: amount,
    displayPaymentAmount: Number(amount.toFixed(2)),
    paymentCurrency: currency,
    processingAmount: amount + feeAmount,
    processingCurrency: currency,
    maxAmountInTransactionCurrency: 0,
    displayMaxAmountInTransactionCurrency: 0,
    maxAmountInCustomerCurrency: 0,
    displayMaxAmountInCustomerCurrency: 0,
    fxRate,
    displayFxRate: Number(fxRate.toFixed(2)),
    stamp: new Date().toISOString(),
  }
}

export const POSTPreview = createProtectedMCPRoute(async (request: NextRequest, user) => {
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return error('Request body must be valid JSON') }
  const amount = asNumber(body.amount)
  const currency = typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : ''
  const senderAccountId = String(body.senderAccountId ?? '').trim()
  if (!Number.isFinite(amount) || amount <= 0) return error('amount must be a positive number')
  if (!currency || !/^[A-Z]{3}$/.test(currency)) return error('currency must be a three-letter ISO currency code')
  if (!senderAccountId) return error('senderAccountId is required')
  const result = await loadAccount(getSupabase(), senderAccountId, user.id)
  if (result.error) return error(result.error, result.error.includes('not found') ? 404 : 500)
  return json(preview(amount, currency, senderAccountId))
})

export const POSTSendMoney = createProtectedMCPRoute(async (request: NextRequest, user) => {
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return error('Request body must be valid JSON') }
  const amount = asNumber(body.amount)
  const currency = typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : ''
  const senderAccountId = String(body.senderAccountId ?? '').trim()
  const recipientEmail = typeof body.recipientEmail === 'string' ? body.recipientEmail.trim().toLowerCase() : ''
  if (!Number.isFinite(amount) || amount <= 0 || !currency || !senderAccountId || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipientEmail)) return error('amount, currency, senderAccountId, and a valid recipientEmail are required')
  const supabase = getSupabase()
  const sender = await loadAccount(supabase, senderAccountId, user.id)
  if (sender.error) return error(sender.error, sender.error.includes('not found') ? 404 : 500)
  const transactionId = randomUUID()
  const details = { ...preview(amount, currency, senderAccountId), userId: user.id, recipientEmail, message: typeof body.message === 'string' ? body.message : '' }
  const { error: insertError } = await supabase!.from('transaction_ledger').insert({ transaction_id: transactionId, sender_account_id: senderAccountId, receiver_account_id: recipientEmail, amount, currency, transaction_type: 'transfer', status: 'completed', metadata: details })
  if (insertError) return json({ error: 'server_error', error_description: 'Failed to create send-money transaction' }, 500)
  return json({ id: transactionId, status: 'PROCESSED', link: { href: `/v1/transactions/${transactionId}`, rel: 'self' }, ...details }, 200)
})

export const POSTFinalize = createProtectedMCPRoute(async (request: NextRequest, user) => {
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return error('Request body must be valid JSON') }
  const slipID = String(body.slipID ?? '').trim()
  const supabase = getSupabase()
  if (!slipID) return error('slipID is required')
  if (!supabase) return json({ error: 'server_error', error_description: 'Send-money service is not configured' }, 500)
  const { data: transaction, error: queryError } = await supabase.from('transaction_ledger').select('*').eq('transaction_id', slipID).maybeSingle()
  if (queryError) return json({ error: 'server_error', error_description: 'Failed to retrieve transaction' }, 500)
  if (!transaction || String(transaction.sender_account_id) !== String(user.id) && !transaction.metadata?.userId) return error('Transaction not found', 404)
  const { error: updateError } = await supabase.from('transaction_ledger').update({ status: 'completed', metadata: { ...(transaction.metadata || {}), finalizedAt: new Date().toISOString() } }).eq('transaction_id', slipID)
  if (updateError) return json({ error: 'server_error', error_description: 'Failed to finalize transaction' }, 500)
  return json({ id: slipID, status: 'PROCESSED', scaDetails: transaction.metadata?.scaDetails })
})
