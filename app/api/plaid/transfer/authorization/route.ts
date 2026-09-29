import { NextRequest, NextResponse } from 'next/server';
import { PlaidService } from '@/lib/plaid-service';
import { createClient } from '@/utils/supabase/server';
import { getPlaidSecret } from '@/lib/plaid-connect';

const NETWORKS = new Set(['ach', 'same-day-ach', 'rtp', 'wire', 'rfp']);
const TYPES = new Set(['debit', 'credit']);
const ACH_CLASSES = new Set(['ccd', 'ppd', 'tel', 'web']);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const required = ['accessToken', 'accountId', 'amount', 'legalName', 'idempotencyKey'];
    if (required.some((key) => typeof body[key] !== 'string' || !body[key])) {
      return NextResponse.json({ error: 'accessToken, accountId, amount, legalName, and idempotencyKey are required.' }, { status: 400 });
    }
    if (!TYPES.has(body.type) || !NETWORKS.has(body.network)) return NextResponse.json({ error: 'Invalid transfer type or network.' }, { status: 400 });
    if (body.achClass !== undefined && !ACH_CLASSES.has(body.achClass)) return NextResponse.json({ error: 'Invalid achClass.' }, { status: 400 });

    const result = await PlaidService.createTransferAuthorization({
      accessToken: body.accessToken,
      accountId: body.accountId,
      type: body.type,
      network: body.network,
      amount: body.amount,
      achClass: body.achClass,
      legalName: body.legalName,
      email: body.email,
      phone: body.phone,
      idempotencyKey: body.idempotencyKey,
      userIp: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
      userAgent: request.headers.get('user-agent') || undefined,
    }, await getPlaidSecret(user.id));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to authorize transfer.';
    return NextResponse.json({ error: message }, { status: message.includes('required') || message.includes('positive') ? 400 : 502 });
  }
}
