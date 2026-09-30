import { NextRequest, NextResponse } from 'next/server';
import { PlaidService } from '@/lib/plaid-service';
import { createClient } from '@/utils/supabase/server';
import { getPlaidSecret } from '@/lib/plaid-connect';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const requestedPhone = typeof body.phoneNumber === 'string' ? body.phoneNumber.trim() : '';
    const phoneNumber = requestedPhone || user.phone?.trim() || undefined;
    if (phoneNumber && !/^\+1\s?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/.test(phoneNumber)) {
      return NextResponse.json({ error: 'Enter a valid US phone number.' }, { status: 400 });
    }

    const plaidSecret = await getPlaidSecret(userId);
    const linkToken = await PlaidService.createLinkToken(userId, 'MyBank', plaidSecret, phoneNumber);

    return NextResponse.json(linkToken);
  } catch (error: any) {
    console.error('[v0] Error creating link token:', error);
    const message = error instanceof Error ? error.message : 'Failed to create link token';
    const status = /not configured|valid US phone|Unauthorized|required/i.test(message) ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
