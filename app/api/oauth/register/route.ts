import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const redirectUris = body?.redirect_uris
  if (!Array.isArray(redirectUris) || redirectUris.length !== 1 || typeof redirectUris[0] !== 'string') {
    return NextResponse.json({ error: 'invalid_client_metadata', error_description: 'Exactly one redirect URI is required' }, { status: 400 })
  }
  const configured = process.env.MCP_OAUTH_REDIRECT_URI
  if (!configured || redirectUris[0] !== configured) {
    return NextResponse.json({ error: 'invalid_redirect_uri', error_description: 'The redirect URI is not registered' }, { status: 400 })
  }
  return NextResponse.json({ client_id: process.env.MCP_OAUTH_CLIENT_ID || 'mcp-client', client_id_issued_at: Math.floor(Date.now() / 1000), redirect_uris: redirectUris, token_endpoint_auth_method: 'none' }, { status: 201 })
}
