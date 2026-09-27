import { NextRequest, NextResponse } from 'next/server';
import { PlaidService } from '@/lib/plaid-service';
import { createClient } from '@/utils/supabase/server';
import { getPlaidSecret } from '@/lib/plaid-connect';

const PAYMENT_METHODS = new Set([
  'SAME_DAY_ACH',
  'STANDARD_ACH',
  'MULTIPLE_PAYMENT_METHODS',
]);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { accessToken, accountId, clientTransactionId, amount, recurring, defaultPaymentMethod, rulesetKey } = body;

    if (typeof accessToken !== 'string' || typeof accountId !== 'string' || typeof clientTransactionId !== 'string') {
      return NextResponse.json({ error: 'accessToken, accountId, and clientTransactionId are required.' }, { status: 400 });
    }
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number.' }, { status: 400 });
    }
    if (defaultPaymentMethod !== undefined && !PAYMENT_METHODS.has(defaultPaymentMethod)) {
      return NextResponse.json({ error: 'Invalid defaultPaymentMethod.' }, { status: 400 });
    }

    const result = await PlaidService.evaluateSignal(
      {
        accessToken,
        accountId,
        clientTransactionId,
        amount,
        clientUserId: user.id,
        recurring: recurring === undefined ? undefined : Boolean(recurring),
        defaultPaymentMethod,
        rulesetKey: typeof rulesetKey === 'string' ? rulesetKey : undefined,
      },
      await getPlaidSecret(user.id),
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to evaluate transaction.';
    const status = message.includes('not configured') || message.includes('required') ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
