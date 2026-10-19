import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE'])

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
    Accept: 'application/json',
    'X-User-Id': user.id,
  })
  const configuredClientId = process.env.Client_ID?.trim()
  if (configuredClientId) headers.set('X-Client-ID', configuredClientId)

  const authorization = request.headers.get('authorization')
  if (authorization) headers.set('authorization', authorization)

  let body: string | undefined
  if (request.method === 'POST' || request.method === 'PUT') {
    body = await request.text()
    if (body) headers.set('content-type', request.headers.get('content-type') || 'application/json')
  }

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body,
    cache: 'no-store',
  })

  const responseBody = await upstream.text()
  const responseHeaders = new Headers({ 'content-type': upstream.headers.get('content-type') || 'application/json' })
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
