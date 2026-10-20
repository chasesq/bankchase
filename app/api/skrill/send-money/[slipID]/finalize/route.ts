import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_BASE_URL = 'https://mobile-api.skrill.com'
const MAX_BODY_BYTES = 8_192

function getFinalizeUrl(slipId: string) {
  const configured = process.env.API_Endpoint?.trim() || DEFAULT_BASE_URL
  const base = new URL(configured)
  const pathname = base.pathname.replace(/\/+$/, '')
  base.pathname = `${pathname}/mobile/me/send-money/${encodeURIComponent(slipId)}/finalize`.replace(
    /\/mobile\/mobile\//,
    '/mobile/',
  )
  base.search = ''
  return base
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slipID: string }> },
) {
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

  const { slipID } = await params
  if (!/^\d+$/.test(slipID) || slipID.length > 30) {
    return NextResponse.json({ error: 'A valid slip ID is required' }, { status: 400 })
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
  const scaDetails = body.scaDetails
  if (!scaDetails || typeof scaDetails !== 'object' || Array.isArray(scaDetails)) {
    return NextResponse.json({ error: 'scaDetails is required' }, { status: 400 })
  }

  const details = scaDetails as Record<string, unknown>
  const clientEventId = typeof details.clientEventId === 'string' ? details.clientEventId.trim() : ''
  const eventId = typeof details.eventId === 'string' ? details.eventId.trim() : ''
  const link = typeof details.link === 'string' ? details.link.trim() : undefined

  if (!clientEventId || !eventId || clientEventId.length > 200 || eventId.length > 500) {
    return NextResponse.json(
      { error: 'scaDetails.clientEventId and scaDetails.eventId are required' },
      { status: 400 },
    )
  }
  if (link && link.length > 2_000) {
    return NextResponse.json({ error: 'scaDetails.link is too long' }, { status: 400 })
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
    const upstream = await fetch(getFinalizeUrl(slipID), {
      method: 'POST',
      headers,
      body: JSON.stringify({ scaDetails: { clientEventId, eventId, ...(link ? { link } : {}) } }),
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
