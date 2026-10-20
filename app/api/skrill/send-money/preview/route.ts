import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_QUERY_LENGTH = 2_000
const DEFAULT_BASE_URL = 'https://mobile-api.skrill.com'

function getPreviewUrl(search: string) {
  const configured = process.env.API_Endpoint?.trim() || DEFAULT_BASE_URL
  const base = new URL(configured)
  const pathname = base.pathname.replace(/\/+$/, '')
  base.pathname = `${pathname}/mobile/me/send-money/preview`.replace(/\/mobile\/mobile\//, '/mobile/')
  base.search = search
  return base
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  if (request.nextUrl.search.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: 'Query string is too long' }, { status: 414 })
  }

  const authorization = request.headers.get('authorization')
  if (!authorization?.toLowerCase().startsWith('bearer ')) {
    return NextResponse.json(
      { error: 'Skrill authorization is required. Connect your Skrill account first.' },
      { status: 401 },
    )
  }

  const headers = new Headers({
    Accept: 'application/json',
    Authorization: authorization,
    'X-User-Id': data.user.id,
    'Cache-Control': 'no-store',
  })
  const clientId = process.env.Client_ID?.trim()
  if (clientId) headers.set('X-Client-ID', clientId)

  try {
    const upstream = await fetch(getPreviewUrl(request.nextUrl.search), {
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
    return NextResponse.json({ error: 'Skrill mobile service unavailable' }, { status: 502 })
  }
}

export function OPTIONS() {
  return NextResponse.json({ methods: ['GET'] })
}
