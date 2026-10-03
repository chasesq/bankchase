import { NextRequest, NextResponse } from 'next/server';
import { PlaidService } from '@/lib/plaid-service';
import { createClient } from '@/utils/supabase/server';
import { getPlaidSecret } from '@/lib/plaid-connect';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    if (typeof body.accessToken !== 'string' || !body.accessToken) {
      return NextResponse.json({ error: 'accessToken is required.' }, { status: 400 });
    }
    if (body.accountIds !== undefined && (!Array.isArray(body.accountIds) || body.accountIds.some((id: unknown) => typeof id !== 'string' || !id))) {
      return NextResponse.json({ error: 'accountIds must be an array of non-empty strings.' }, { status: 400 });
    }

    const result = await PlaidService.getAccountDetails(
      body.accessToken,
      body.accountIds,
      await getPlaidSecret(user.id),
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get account details.';
    const status = message.includes('required') || message.includes('must be') ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
