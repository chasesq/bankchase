import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createClient } from '@/lib/supabase/server'
import { isWorkOSAdminRole, listWorkOSEventTypes, listWorkOSEvents } from '@/lib/workos-audit'

export const runtime = 'nodejs'

async function hasAuditAccess(request: NextRequest) {
  const header = request.headers.get('authorization')
  if (header?.startsWith('Bearer ')) {
    const tokenValue = header.slice(7)
    if (tokenValue === 'demo-session' && process.env.NODE_ENV !== 'production') return true
    try {
      const token = jwt.verify(tokenValue, process.env.JWT_SECRET || 'your-secret-key-change-in-production') as { role?: string }
      if (isWorkOSAdminRole(token.role)) return true
    } catch {}
  }
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return true
  } catch {}

  // The preview has no durable login session; keep this development-only fallback
  // so the audit dashboard can be exercised without weakening production access.
  return process.env.NODE_ENV !== 'production'
}

export async function GET(request: NextRequest) {
  if (!(await hasAuditAccess(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 25) || 25))
  try {
    const [result, types] = await Promise.all([
      listWorkOSEvents({ page, limit, type: url.searchParams.get('type') || undefined, search: url.searchParams.get('search') || undefined }),
      listWorkOSEventTypes(),
    ])
    return NextResponse.json({ ...result, types, pagination: { page, limit, totalPages: Math.ceil(result.total / limit) } })
  } catch (error) {
    console.error('[v0] WorkOS audit event query failed', error)
    return NextResponse.json({ error: 'Unable to load WorkOS events' }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET' } })
}
