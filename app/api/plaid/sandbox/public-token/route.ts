import { NextRequest, NextResponse } from 'next/server'
import { PlaidService } from '@/lib/plaid-service'
import { createClient } from '@/utils/supabase/server'
import { getPlaidSecret } from '@/lib/plaid-connect'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const configuration = body?.configuration ?? body
    if (!configuration || typeof configuration !== 'object' || Array.isArray(configuration)) {
      return NextResponse.json({ error: 'configuration must be a JSON object.' }, { status: 400 })
    }
    const serialized = JSON.stringify(configuration)
    if (serialized.length > 55_000) {
      return NextResponse.json({ error: 'Sandbox configuration must be smaller than 55 KB.' }, { status: 400 })
    }

    const result = await PlaidService.createSandboxPublicToken(
      configuration,
      await getPlaidSecret(user.id),
    )
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create Sandbox public token.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
