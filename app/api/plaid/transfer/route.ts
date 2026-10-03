import { NextRequest, NextResponse } from 'next/server';
import { PlaidService } from '@/lib/plaid-service';
import { createClient } from '@/utils/supabase/server';
import { getPlaidSecret } from '@/lib/plaid-connect';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const params = request.nextUrl.searchParams;
    const transferId = params.get('transferId');
    const secret = await getPlaidSecret(user.id);
    const result = transferId
      ? await PlaidService.getTransfer(transferId, secret)
      : await PlaidService.listTransfers({ count: Number(params.get('count') || 25), offset: Number(params.get('offset') || 0), plaidSecret: secret });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read transfer.';
    return NextResponse.json({ error: message }, { status: message.includes('required') ? 400 : 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const required = ['accessToken', 'accountId', 'authorizationId', 'type', 'network', 'amount', 'description', 'idempotencyKey'];
    if (required.some((key) => typeof body[key] !== 'string' || !body[key])) return NextResponse.json({ error: 'accessToken, accountId, authorizationId, type, network, amount, description, and idempotencyKey are required.' }, { status: 400 });
    const result = await PlaidService.createTransfer({ ...body, plaidSecret: await getPlaidSecret(user.id) });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create transfer.';
    return NextResponse.json({ error: message }, { status: message.includes('required') || message.includes('positive') ? 400 : 502 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const transferId = request.nextUrl.searchParams.get('transferId');
    if (!transferId) return NextResponse.json({ error: 'transferId is required.' }, { status: 400 });
    return NextResponse.json(await PlaidService.cancelTransfer(transferId, await getPlaidSecret(user.id)));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel transfer.';
    return NextResponse.json({ error: message }, { status: message.includes('required') ? 400 : 502 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
