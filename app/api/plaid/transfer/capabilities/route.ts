import { NextRequest, NextResponse } from 'next/server';
import { PlaidService } from '@/lib/plaid-service';
import { createClient } from '@/utils/supabase/server';
import { getPlaidSecret } from '@/lib/plaid-connect';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    if (typeof body.accessToken !== 'string' || typeof body.accountId !== 'string' || !body.accessToken || !body.accountId) {
      return NextResponse.json({ error: 'accessToken and accountId are required.' }, { status: 400 });
    }
    const result = await PlaidService.getTransferCapabilities(body.accessToken, body.accountId, await getPlaidSecret(user.id));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get transfer capabilities.';
    return NextResponse.json({ error: message }, { status: message.includes('required') ? 400 : 502 });
  }
}
