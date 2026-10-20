import { NextRequest, NextResponse } from 'next/server'
import { mcpOAuthClient } from '@/lib/mcp-oauth-client'

export async function verifyMCPOAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return { valid: false, error: 'Missing or invalid Authorization header', status: 401 as const }
  const token = authHeader.slice(7).trim()
  if (!token) return { valid: false, error: 'Missing bearer token', status: 401 as const }
  const user = await mcpOAuthClient.findUserByToken(token)
  if (!user) return { valid: false, error: 'Invalid or expired token', status: 401 as const }
  return { valid: true, user, token }
}

export function createProtectedMCPRoute(handler: (request: NextRequest, user: NonNullable<Awaited<ReturnType<typeof mcpOAuthClient.findUserByToken>>>, token: string) => Promise<Response>) {
  return async (request: NextRequest) => {
    const verification = await verifyMCPOAuth(request)
    if (!verification.valid || !verification.user) return NextResponse.json({ error: verification.error }, { status: verification.status })
    return handler(request, verification.user, verification.token)
  }
}
