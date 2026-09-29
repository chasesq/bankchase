import { NextRequest, NextResponse } from 'next/server';
import { PlaidService } from '@/lib/plaid-service';
import { verifyToken } from '@/lib/token-verification';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    const payload = token ? verifyToken(token) : null;
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const accessToken = typeof body.accessToken === 'string' ? body.accessToken : '';
    const accountIds = body.accountIds === undefined ? undefined : body.accountIds;
    const balances = await PlaidService.getAccountBalances(accessToken, accountIds);
    return NextResponse.json(balances);
  } catch (error: any) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to get account balances' }, { status: 400 });
  }
}
