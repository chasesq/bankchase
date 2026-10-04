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
    const accessToken = typeof body.accessToken === 'string' ? body.accessToken.trim() : '';
    if (!accessToken) return NextResponse.json({ error: 'A Plaid access token is required.' }, { status: 400 });

    const identity = await PlaidService.getIdentity(accessToken, await getPlaidSecret(user.id));
    return NextResponse.json(identity);
  } catch (error) {
    console.error('[v0] Error retrieving Plaid identity:', error);
    const message = error instanceof Error ? error.message : 'Failed to retrieve identity data';
    return NextResponse.json({ error: message }, { status: /required|configured|Unauthorized/i.test(message) ? 400 : 502 });
  }
}
