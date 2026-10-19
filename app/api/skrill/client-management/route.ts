import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE'])
const MAX_BODY_BYTES = 64 * 1024
const JSON_CONTENT_TYPE = 'application/json'

function getClientManagementUrl(clientId?: string) {
  const configured = process.env.Client_Management_APIs?.trim()
  if (!configured) return null

  const url = new URL(configured)
  if (clientId) {
    url.pathname = `${url.pathname.replace(/\/$/, '')}/${encodeURIComponent(clientId)}`
  }
  return url
}

async function requireUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  return { user: data.user, error }
}

async function proxy(request: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const clientId = request.nextUrl.searchParams.get('clientId')?.trim() || undefined
  const upstreamUrl = getClientManagementUrl(clientId)
  if (!upstreamUrl) {
    return NextResponse.json({ error: 'Skrill client-management API is not configured' }, { status: 503 })
  }

  if ((request.method === 'GET' || request.method === 'PUT' || request.method === 'DELETE') && !clientId) {
    return NextResponse.json({ error: 'clientId is required for this operation' }, { status: 400 })
  }

  const headers = new Headers({
    Accept: JSON_CONTENT_TYPE,
    'X-User-Id': user.id,
    'Cache-Control': 'no-store',
  })
  const configuredClientId = process.env.Client_ID?.trim()
  if (configuredClientId) headers.set('X-Client-ID', configuredClientId)

  let body: string | undefined
  if (request.method === 'POST' || request.method === 'PUT') {
    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request body is too large' }, { status: 413 })
    }

    body = await request.text()
    if (body.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request body is too large' }, { status: 413 })
    }

    if (body) {
      const contentType = request.headers.get('content-type') || JSON_CONTENT_TYPE
      if (!contentType.toLowerCase().startsWith(JSON_CONTENT_TYPE)) {
        return NextResponse.json({ error: 'JSON request body required' }, { status: 415 })
      }
      try {
        JSON.parse(body)
      } catch {
        return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
      }
      headers.set('content-type', JSON_CONTENT_TYPE)
    }
  }

  let upstream: Response
  try {
    upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    return NextResponse.json({ error: 'Skrill client-management service unavailable' }, { status: 502 })
  }

  const responseBody = await upstream.text()
  const responseHeaders = new Headers({
    'content-type': upstream.headers.get('content-type') || JSON_CONTENT_TYPE,
    'cache-control': 'no-store',
  })
  return new NextResponse(responseBody, { status: upstream.status, headers: responseHeaders })
}

export async function GET(request: NextRequest) {
  return proxy(request)
}

export async function POST(request: NextRequest) {
  return proxy(request)
}

export async function PUT(request: NextRequest) {
  return proxy(request)
}

export async function DELETE(request: NextRequest) {
  return proxy(request)
}

export async function OPTIONS() {
  return NextResponse.json({ methods: Array.from(METHODS) })
}
