import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_QUERY_LENGTH = 2_000

function getTransactionsUrl() {
  const configured = process.env.Client_Management_APIs?.trim()
  if (!configured) return null

  const url = new URL(configured)
  const pathname = url.pathname.replace(/\/+$/, '')
  url.pathname = /\/v1\/transactions\/all-transactions-history$/i.test(pathname)
    ? pathname
    : `${pathname.replace(/\/v1\/accounts$/i, '')}/v1/transactions/all-transactions-history`
  return url
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const upstreamUrl = getTransactionsUrl()
  if (!upstreamUrl) {
    return NextResponse.json({ error: 'Skrill client-management API is not configured' }, { status: 503 })
  }

  const query = request.nextUrl.search
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: 'Query string is too long' }, { status: 414 })
  }
  upstreamUrl.search = query

  const headers = new Headers({
    Accept: 'application/json',
    'X-User-Id': data.user.id,
    'Cache-Control': 'no-store',
  })
  const authorization = request.headers.get('authorization')
  if (authorization?.toLowerCase().startsWith('bearer ')) {
    headers.set('Authorization', authorization)
  }
  const clientId = process.env.Client_ID?.trim()
  if (clientId) headers.set('X-Client-ID', clientId)

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    })
    const body = await upstream.text()
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/json',
        'cache-control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Skrill client-management service unavailable' }, { status: 502 })
  }
}

export function OPTIONS() {
  return NextResponse.json({ methods: ['GET'] })
}
