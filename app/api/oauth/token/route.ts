import { NextResponse } from 'next/server'
import { mcpOAuthClient } from '@/lib/mcp-oauth-client'

const allowedClientId = process.env.MCP_OAUTH_CLIENT_ID || 'mcp-client'
const allowedRedirectUri = process.env.MCP_OAUTH_REDIRECT_URI

const invalid = (description: string) => NextResponse.json({ error: 'invalid_request', error_description: description }, { status: 400 })

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null)
  if (!form) return invalid('Request must use application/x-www-form-urlencoded')
  const grantType = String(form.get('grant_type') || '')
  const code = String(form.get('code') || '')
  const clientId = String(form.get('client_id') || '')
  const redirectUri = String(form.get('redirect_uri') || '')
  const verifier = String(form.get('code_verifier') || '')
  if (grantType !== 'authorization_code' || clientId !== allowedClientId || redirectUri !== allowedRedirectUri || !code || !verifier) return invalid('Invalid token request')
  const payload = mcpOAuthClient.consumeAuthorizationCode(code, { clientId, redirectUri })
  if (!payload) return invalid('Invalid or expired authorization code')
  const expected = Buffer.from(payload.codeChallenge || '', 'base64url')
  const actual = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  if (Buffer.compare(Buffer.from(actual), expected) !== 0) return invalid('PKCE verification failed')
  const token = mcpOAuthClient.generateToken()
  await mcpOAuthClient.storeUserToken(payload.userId, token.token, token.expiresAt)
  return NextResponse.json({ access_token: token.token, token_type: 'Bearer', expires_in: 86400, scope: 'mcp' })
}
