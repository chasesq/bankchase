import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export type OAuthCodePayload = {
  userId: string
  clientId: string
  redirectUri: string
  codeChallenge?: string
  codeChallengeMethod?: string
  expiresAt: number
}

const base64url = (value: string) => Buffer.from(value).toString('base64url')
const fromBase64url = (value: string) => Buffer.from(value, 'base64url').toString('utf8')

export class MCPOAuthClient {
  private supabase: ReturnType<typeof createClient> | undefined

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (url && key) this.supabase = createClient(url, key)
  }

  generateToken(): { token: string; expiresAt: string } {
    return {
      token: crypto.randomBytes(32).toString('base64url'),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  createAuthorizationCode(payload: Omit<OAuthCodePayload, 'expiresAt'>): string {
    const body = base64url(JSON.stringify({ ...payload, expiresAt: Date.now() + 5 * 60 * 1000 }))
    const secret = process.env.SESSION_SECRET || process.env.SUPABASE_JWT_SECRET
    if (!secret) throw new Error('OAuth signing secret is not configured')
    const signature = crypto.createHmac('sha256', secret).update(body).digest('base64url')
    return `${body}.${signature}`
  }

  consumeAuthorizationCode(code: string, expected: Pick<OAuthCodePayload, 'clientId' | 'redirectUri'>): OAuthCodePayload | null {
    const [body, signature] = code.split('.')
    const secret = process.env.SESSION_SECRET || process.env.SUPABASE_JWT_SECRET
    if (!body || !signature || !secret) return null
    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('base64url')
    const actual = Buffer.from(signature)
    const expectedBytes = Buffer.from(expectedSignature)
    if (actual.length !== expectedBytes.length || !crypto.timingSafeEqual(actual, expectedBytes)) return null
    try {
      const payload = JSON.parse(fromBase64url(body)) as OAuthCodePayload
      if (payload.expiresAt < Date.now() || payload.clientId !== expected.clientId || payload.redirectUri !== expected.redirectUri) return null
      return payload
    } catch {
      return null
    }
  }

  async storeUserToken(userId: string, token: string, expiresAt: string): Promise<void> {
    if (!this.supabase) throw new Error('Supabase is not configured')
    const { error } = await (this.supabase as any).from('users').update({ mcp_token: token, mcp_token_expires_at: expiresAt }).eq('id', userId)
    if (error) throw new Error('Failed to store token')
  }

  async verifyToken(userId: string, token: string): Promise<boolean> {
    if (!this.supabase) return false
    const { data } = await (this.supabase as any).from('users').select('mcp_token, mcp_token_expires_at').eq('id', userId).single()
    return Boolean(data && data.mcp_token === token && data.mcp_token_expires_at && new Date(data.mcp_token_expires_at) > new Date())
  }

  async findUserByToken(token: string): Promise<{ id: string; auth0_id: string | null; email: string | null; mcp_token_expires_at: string } | null> {
    if (!this.supabase) return null
    const { data } = await (this.supabase as any).from('users').select('id, auth0_id, email, mcp_token_expires_at').eq('mcp_token', token).single()
    if (!data || !data.mcp_token_expires_at || new Date(data.mcp_token_expires_at) <= new Date()) return null
    return data
  }

  async refreshToken(userId: string) { const result = this.generateToken(); await this.storeUserToken(userId, result.token, result.expiresAt); return result }

  async revokeToken(userId: string): Promise<void> {
    if (!this.supabase) throw new Error('Supabase is not configured')
    const { error } = await (this.supabase as any).from('users').update({ mcp_token: null, mcp_token_expires_at: null }).eq('id', userId)
    if (error) throw new Error('Failed to revoke token')
  }
}

export const mcpOAuthClient = new MCPOAuthClient()
