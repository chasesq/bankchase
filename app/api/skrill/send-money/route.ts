import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_BASE_URL = 'https://mobile-api.skrill.com'
const MAX_BODY_BYTES = 16_384

function getSendMoneyUrl() {
  const configured = process.env.API_Endpoint?.trim() || DEFAULT_BASE_URL
  const base = new URL(configured)
  const pathname = base.pathname.replace(/\/+$/, '')
  base.pathname = `${pathname}/mobile/me/send-money`.replace(/\/mobile\/mobile\//, '/mobile/')
  base.search = ''
  return base
}

function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const authorization = request.headers.get('authorization')
  if (!authorization?.toLowerCase().startsWith('bearer ')) {
    return NextResponse.json(
      { error: 'Skrill authorization is required. Connect your Skrill account first.' },
      { status: 401 },
    )
  }

  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request body is too large' }, { status: 413 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 })
  }

  const body = payload as Record<string, unknown>
  const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount)
  const currency = typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : ''
  const recipientEmail = typeof body.recipientEmail === 'string' ? body.recipientEmail.trim() : ''
  const senderAccountId = typeof body.senderAccountId === 'string' ? body.senderAccountId.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : undefined

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
  }
  if (!currency || currency.length > 3) {
    return NextResponse.json({ error: 'A valid currency is required' }, { status: 400 })
  }
  if (!isValidEmail(recipientEmail)) {
    return NextResponse.json({ error: 'A valid recipient email is required' }, { status: 400 })
  }
  if (!senderAccountId || senderAccountId.length > 100) {
    return NextResponse.json({ error: 'A valid sender account is required' }, { status: 400 })
  }
  if (message && message.length > 500) {
    return NextResponse.json({ error: 'Message is too long' }, { status: 400 })
  }

  const headers = new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: authorization,
    'X-User-Id': data.user.id,
    'Cache-Control': 'no-store',
  })
  const clientId = process.env.Client_ID?.trim()
  if (clientId) headers.set('X-Client-ID', clientId)

  try {
    const upstream = await fetch(getSendMoneyUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount, currency, recipientEmail, senderAccountId, ...(message ? { message } : {}) }),
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    })
    const responseBody = await upstream.text()

    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/json',
        'cache-control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Skrill mobile service unavailable' }, { status: 502 })
  }
}

export function OPTIONS() {
  return NextResponse.json({ methods: ['POST'] })
}
