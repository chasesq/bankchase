import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_BODY_BYTES = 64 * 1024
const TIMEOUT_MS = 15_000
const OAUTH_BASE = process.env.API_Endpoint?.trim() || 'https://oauth2-psd2.skrill.com/psd2-oauth2'
const AUTHORIZE_URL =
  process.env.SKRILL_AUTHORIZE_URL?.trim() ||
  'https://account.skrill.com/psd2-oauth2/auth/realms/dw/v1/authorize'

function endpoint(action: string) {
  if (action === 'authorize') return new URL(AUTHORIZE_URL)

  const base = new URL(OAUTH_BASE.endsWith('/') ? OAUTH_BASE : `${OAUTH_BASE}/`)
  const paths: Record<string, string> = {
    register: 'register',
    token: 'token',
    revoke: 'revoke',
  }
  const path = paths[action]
  if (!path) return null
  base.pathname = `${base.pathname.replace(/\/$/, '')}/${path}`
  return base
}

async function authenticated() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  return !error && !!data.user
}

export async function POST(request: NextRequest) {
  if (!(await authenticated())) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const action = request.nextUrl.searchParams.get('action')?.trim().toLowerCase() || 'token'
  const upstreamUrl = endpoint(action)
  if (!upstreamUrl) return NextResponse.json({ error: 'Unsupported OAuth action' }, { status: 400 })

  const length = Number(request.headers.get('content-length') || 0)
  if (length > MAX_BODY_BYTES) return NextResponse.json({ error: 'Request body is too large' }, { status: 413 })
  const body = await request.text()
  if (body.length > MAX_BODY_BYTES) return NextResponse.json({ error: 'Request body is too large' }, { status: 413 })

  const contentType = request.headers.get('content-type') || 'application/x-www-form-urlencoded'
  if (!contentType.toLowerCase().startsWith('application/x-www-form-urlencoded') && !contentType.toLowerCase().startsWith('application/json')) {
    return NextResponse.json({ error: 'OAuth form or JSON body required' }, { status: 415 })
  }

  const headers = new Headers({ Accept: 'application/json', 'Content-Type': contentType, 'Cache-Control': 'no-store' })
  const clientId = process.env.Client_ID?.trim()
  const clientSecret = process.env.Secret?.trim()
  if (clientId && clientSecret && (action === 'token' || action === 'revoke')) {
    headers.set('Authorization', `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`)
  }

  try {
    const response = await fetch(upstreamUrl, { method: 'POST', headers, body, cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) })
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { 'content-type': response.headers.get('content-type') || 'application/json', 'cache-control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ error: 'Skrill OAuth service unavailable' }, { status: 502 })
  }
}

export async function GET(request: NextRequest) {
  if (!(await authenticated())) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const action = request.nextUrl.searchParams.get('action')?.trim().toLowerCase() || 'authorize'
  if (action !== 'authorize') return NextResponse.json({ error: 'GET is only supported for authorize' }, { status: 405 })

  const upstreamUrl = endpoint('authorize')
  if (!upstreamUrl) return NextResponse.json({ error: 'OAuth endpoint is not configured' }, { status: 503 })
  const clientId = process.env.Client_ID?.trim()
  if (!clientId) return NextResponse.json({ error: 'Skrill OAuth client is not configured' }, { status: 503 })

  const redirectUri = request.nextUrl.searchParams.get('redirect_uri')?.trim()
  const codeChallenge = request.nextUrl.searchParams.get('code_challenge')?.trim()
  const state = request.nextUrl.searchParams.get('state')?.trim()
  const requestedMethod = request.nextUrl.searchParams.get('code_challenge_method')?.trim()

  if (!redirectUri || !codeChallenge || !state) {
    return NextResponse.json(
      { error: 'redirect_uri, state, and PKCE code_challenge are required' },
      { status: 400 },
    )
  }

  try {
    const redirect = new URL(redirectUri)
    if (!['https:', 'http:'].includes(redirect.protocol)) throw new Error('Unsupported redirect scheme')
  } catch {
    return NextResponse.json({ error: 'redirect_uri must be a valid HTTP(S) URL' }, { status: 400 })
  }

  if (requestedMethod && requestedMethod !== 'S256') {
    return NextResponse.json({ error: 'Only the S256 PKCE code challenge method is supported' }, { status: 400 })
  }

  upstreamUrl.searchParams.set('client_id', clientId)
  upstreamUrl.searchParams.set('response_type', 'code')
  upstreamUrl.searchParams.set('redirect_uri', redirectUri)
  upstreamUrl.searchParams.set('code_challenge', codeChallenge)
  upstreamUrl.searchParams.set('code_challenge_method', 'S256')
  upstreamUrl.searchParams.set('state', state)

  const scope = request.nextUrl.searchParams.get('scope')?.trim()
  if (scope) upstreamUrl.searchParams.set('scope', scope)

  return NextResponse.redirect(upstreamUrl)
}

export async function OPTIONS() {
  return NextResponse.json({ actions: ['register', 'token', 'revoke', 'authorize'], pkce: 'S256' })
}
