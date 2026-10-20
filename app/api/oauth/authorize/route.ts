import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { mcpOAuthClient } from '@/lib/mcp-oauth-client'

const allowedClientId = process.env.MCP_OAUTH_CLIENT_ID || 'mcp-client'
const allowedRedirectUri = process.env.MCP_OAUTH_REDIRECT_URI

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const clientId = params.get('client_id')
  const redirectUri = params.get('redirect_uri')
  const responseType = params.get('response_type')
  const state = params.get('state')
  const codeChallenge = params.get('code_challenge')
  if (clientId !== allowedClientId || !redirectUri || redirectUri !== allowedRedirectUri || responseType !== 'code' || params.get('code_challenge_method') !== 'S256' || !codeChallenge) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'Invalid client, redirect URI, response type, or PKCE parameters' }, { status: 400 })
  }
  const cookieStore = await cookies()
  const rawUser = cookieStore.get('auth_user')?.value
  if (!rawUser) return NextResponse.json({ error: 'login_required' }, { status: 401 })
  let userId: string
  try { userId = JSON.parse(rawUser).id } catch { return NextResponse.json({ error: 'invalid_request' }, { status: 400 }) }
  const code = mcpOAuthClient.createAuthorizationCode({ userId, clientId, redirectUri, codeChallenge, codeChallengeMethod: 'S256' })
  const callback = new URL(redirectUri)
  callback.searchParams.set('code', code)
  if (state) callback.searchParams.set('state', state)
  return NextResponse.redirect(callback)
}
